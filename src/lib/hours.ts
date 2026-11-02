import { company } from "@/data/company";

const DAY_NAMES = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

function localParts(now: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: company.hours.timezone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  const minutes = Number(get("hour")) * 60 + Number(get("minute"));
  return { day, minutes };
}

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

export function isOpen(now = new Date()): boolean {
  const { day, minutes } = localParts(now);
  const today = company.hours.days[day];
  return !!today && minutes >= toMin(today.open) && minutes < toMin(today.close);
}

/** "Yarın 09:00" gibi bir sonraki açılış zamanı */
export function nextOpening(now = new Date()): string {
  const { day, minutes } = localParts(now);
  for (let i = 0; i < 8; i++) {
    const d = (day + i) % 7;
    const h = company.hours.days[d];
    if (!h) continue;
    if (i === 0 && minutes >= toMin(h.open)) continue;
    const label = i === 0 ? "Bugün" : i === 1 ? "Yarın" : DAY_NAMES[d];
    return `${label} ${h.open}`;
  }
  return "";
}

export function hoursSummary(): string {
  return [1, 2, 3, 4, 5, 6, 0]
    .map((d) => {
      const h = company.hours.days[d];
      return `${DAY_NAMES[d]}: ${h ? `${h.open}–${h.close}` : "kapalı"}`;
    })
    .join(", ");
}

export function nowLabel(now = new Date()): string {
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: company.hours.timezone,
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(now);
}
