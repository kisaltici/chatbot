import "server-only";
import { Chat, type Thread } from "chat";
import { createWhatsAppAdapter, type WhatsAppAdapter } from "@chat-adapter/whatsapp";
import { createMemoryState } from "@chat-adapter/state-memory";
import { createRedisState } from "@chat-adapter/state-redis";
import type { ChatTurn } from "@/lib/ai";
import { respond, replyToText, type Awaiting, type BotReply, type Incoming } from "@/lib/engine";
import { normalizePhone } from "@/lib/phone";
import { bridgeConfigured, sendInboundToSite, type InboundAction } from "@/lib/bridge";
import { detectOrderIntent } from "@/lib/order-intents";
import { REPLIES, codPayload, parseCodPayload, templateByEvent, type TemplateEvent } from "@/data/templates";

type ThreadState = { history?: ChatTurn[]; awaiting?: Awaiting };

const HISTORY_LIMIT = 12;

/** İzinli numaralar. Boşsa herkes yazabilir. */
function allowedNumbers(): Set<string> {
  return new Set(
    (process.env.ALLOWED_NUMBERS ?? "")
      .split(",")
      .map((n) => normalizePhone(n))
      .filter(Boolean),
  );
}

/** threadId: whatsapp:{phoneNumberId}:{userWaId} */
const userIdFromThread = (threadId: string) => threadId.split(":").at(-1) ?? "";

function isAllowed(userId: string): boolean {
  const allow = allowedNumbers();
  if (allow.size === 0) return true;
  return allow.has(normalizePhone(userId));
}

let _bot: Chat | null = null;

/** Env değişkenleri yoksa build sırasında hata vermemesi için tembel oluşturulur */
export function getBot(): Chat {
  if (_bot) return _bot;

  const bot = new Chat({
    userName: process.env.WHATSAPP_BOT_USERNAME || "firma-asistan",
    adapters: { whatsapp: createWhatsAppAdapter() },
    state: process.env.REDIS_URL ? createRedisState() : createMemoryState(),
    // Peş peşe gelen mesajlar kaybolmasın, sırayla işlensin
    concurrency: "queue",
    logger: process.env.NODE_ENV === "production" ? "warn" : "info",
  });

  bot.onDirectMessage(async (thread, message) => {
    if (message.author.isMe) return;
    const userId = userIdFromThread(thread.id);
    // Sipariş onayı / iptal / DURDUR her müşteriden kabul edilir (izin listesi yalnızca genel sohbet için)
    const intent = detectOrderIntent(message.text ?? "");
    if (intent && (await handleOrderIntent(thread as Thread<ThreadState>, userId, intent, undefined, message.text ?? ""))) return;
    if (!isAllowed(userId)) {
      console.warn(`[bot] izinsiz numara yok sayıldı: ${maskPhone(userId)}`);
      return;
    }
    await handle(thread as Thread<ThreadState>, { kind: "text", text: message.text ?? "" }, userId);
  });

  bot.onAction(async (event) => {
    if (!event.thread) return;
    const userId = userIdFromThread(event.threadId);
    // Şablondaki "Onaylıyorum" / "İptal etmek istiyorum" butonları
    const cod = parseCodPayload(event.actionId);
    if (cod) {
      await handleOrderIntent(event.thread as Thread<ThreadState>, userId, cod.action, cod.orderNumber, event.value ?? cod.action);
      return;
    }
    if (!isAllowed(userId)) return;
    await handle(event.thread as Thread<ThreadState>, { kind: "action", id: event.actionId, title: event.value }, userId);
  });

  _bot = bot;
  return bot;
}

async function handle(thread: Thread<ThreadState>, input: Incoming, userId: string) {
  const adapter = getBot().getAdapter("whatsapp") as WhatsAppAdapter;

  await thread.markAsRead().catch(() => {});
  await thread.startTyping().catch(() => {});

  const state = (await thread.state) ?? {};
  const history = state.history ?? [];

  const reply = await respond(input, { history, awaiting: state.awaiting ?? null, phone: normalizePhone(userId) });

  await send(adapter, thread, reply);

  const userText = input.kind === "text" ? input.text : (input.title ?? input.id);
  const nextHistory: ChatTurn[] = reply.resetHistory
    ? []
    : [...history, { role: "user" as const, content: userText }, { role: "assistant" as const, content: replyToText(reply) }].slice(-HISTORY_LIMIT);
  await thread.setState({ history: nextHistory, awaiting: reply.awaiting ?? null });

  if (reply.handoff) await notifyOwner(userId, userText, history).catch((e) => console.error("[bot] yetkili bildirimi gönderilemedi", e));

  console.info(`[bot] ${reply.trace.route} ${reply.trace.matchedId ?? ""} ${reply.trace.ms}ms`);
}

type Interactive = Record<string, unknown>;
/** Adaptörün liste/buton gönderen metodu "protected"; düzgün tipli bir köprü */
type InteractiveSender = { sendInteractiveMessage(threadId: string, userWaId: string, interactive: Interactive): Promise<unknown> };

async function send(adapter: WhatsAppAdapter, thread: Thread<ThreadState>, reply: BotReply) {
  const userWaId = userIdFromThread(thread.id);
  const sender = adapter as unknown as InteractiveSender;

  for (const msg of reply.messages) {
    if ("list" in msg) {
      await sender.sendInteractiveMessage(thread.id, userWaId, {
        type: "list",
        body: { text: msg.list.body.slice(0, 1024) },
        action: { button: msg.list.button.slice(0, 20), sections: msg.list.sections },
      });
      continue;
    }

    const buttons = msg.buttons ?? [];
    // Butonlu mesajın gövdesi en fazla 1024 karakter; uzun cevaplarda önce metin, sonra butonlar
    if (buttons.length && msg.text.length <= 1024) {
      await sender.sendInteractiveMessage(thread.id, userWaId, {
        type: "button",
        body: { text: msg.text },
        action: { buttons: buttons.slice(0, 3).map((b) => ({ type: "reply", reply: { id: b.id, title: b.title.slice(0, 20) } })) },
      });
    } else {
      await thread.post({ raw: msg.text });
      if (buttons.length) {
        await sender.sendInteractiveMessage(thread.id, userWaId, {
          type: "button",
          body: { text: "Başka nasıl yardımcı olabilirim?" },
          action: { buttons: buttons.slice(0, 3).map((b) => ({ type: "reply", reply: { id: b.id, title: b.title.slice(0, 20) } })) },
        });
      }
    }
  }
}

/** Müşteri yetkili istediğinde firma sahibine WhatsApp'tan haber verir */
async function notifyOwner(userId: string, lastMessage: string, history: ChatTurn[]) {
  const owner = normalizePhone(process.env.OWNER_NUMBER ?? "");
  if (!owner || owner === normalizePhone(userId)) return;
  const bot = getBot();
  const adapter = bot.getAdapter("whatsapp") as WhatsAppAdapter;
  const dm = bot.thread(await adapter.openDM(owner));
  const recent = history
    .filter((h) => h.role === "user")
    .slice(-3)
    .map((h) => `• ${h.content}`)
    .join("\n");
  await dm.post({
    raw: `🔔 *Yetkili talebi*\nNumara: +${userId}\nSon mesaj: ${lastMessage}${recent ? `\n\nÖnceki mesajları:\n${recent}` : ""}\n\nWhatsApp'tan yazmak için: https://wa.me/${userId}`,
  });
}

/**
 * Müşterinin sipariş cevabını siteye iletir ve sonucu yazar.
 * true: mesaj burada işlendi; false: genel sohbete devam edilsin (ör. bekleyen sipariş yokken "iptal").
 */
async function handleOrderIntent(
  thread: Thread<ThreadState>,
  userId: string,
  action: InboundAction,
  orderNumber: string | undefined,
  userText: string,
): Promise<boolean> {
  if (!bridgeConfigured()) return false;
  await thread.markAsRead().catch(() => {});
  await thread.startTyping().catch(() => {});

  const result = await sendInboundToSite({ action, phone: normalizePhone(userId), orderNumber });
  let text: string | null;
  if (!result) text = REPLIES.siteUnavailable;
  else {
    switch (result.result) {
      case "confirmed":
        text = REPLIES.confirmed;
        break;
      case "already_confirmed":
        text = REPLIES.alreadyConfirmed;
        break;
      case "cancelled":
        text = REPLIES.cancelled;
        break;
      case "cancel_requested":
        text = REPLIES.cancelRequested;
        break;
      case "opted_out":
        text = REPLIES.optedOut;
        break;
      case "not_found":
        // Butondan geldiyse ya da açıkça "onaylıyorum" dediyse bilgi ver; yazılı "iptal" ise genel sohbete bırak
        text = orderNumber || action === "confirm" ? REPLIES.notFound : null;
        break;
    }
  }
  if (text === null) return false;

  await thread.post({ raw: text });
  const state = (await thread.state) ?? {};
  const history = [...(state.history ?? []), { role: "user" as const, content: userText }, { role: "assistant" as const, content: text }].slice(-HISTORY_LIMIT);
  await thread.setState({ history });
  console.info(`[bot] sipariş cevabı: ${action} → ${result?.result ?? "site_yok"}`);
  return true;
}

/** zuulab.com'un istediği şablon mesajını gönderir; WhatsApp mesaj kimliğini döner */
export async function sendTemplateMessage(input: { event: TemplateEvent; to: string; orderNumber: string }): Promise<string> {
  const def = templateByEvent.get(input.event);
  if (!def) throw new Error(`Bilinmeyen şablon: ${input.event}`);
  const bot = getBot();
  const adapter = bot.getAdapter("whatsapp") as WhatsAppAdapter;
  const threadId = await adapter.openDM(input.to);
  const sent = await adapter.sendTemplate(threadId, {
    name: def.name,
    language: def.language,
    components: [
      { type: "body", parameters: [{ type: "text", text: input.orderNumber }] },
      ...def.buttons.map((b, index) => ({
        type: "button" as const,
        sub_type: "quick_reply" as const,
        index,
        parameters: [{ type: "payload" as const, payload: codPayload(b.action, input.orderNumber) }],
      })),
    ],
  });
  return sent.id;
}

function maskPhone(p: string) {
  return p.length > 4 ? `${p.slice(0, 3)}•••${p.slice(-2)}` : "•••";
}
