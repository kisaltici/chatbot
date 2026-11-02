// NVIDIA'da kullanabileceğiniz sohbet modellerini listeler ve isterseniz birini Türkçe dener.
// Kullanım:  node --env-file=.env.local scripts/nvidia-models.mjs [model-id]
const key = process.env.NVIDIA_API_KEY;
if (!key) {
  console.error("NVIDIA_API_KEY bulunamadı. .env.local dosyasına ekleyip --env-file=.env.local ile çalıştırın.");
  process.exit(1);
}
const base = process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1";
const model = process.argv[2];

if (!model) {
  const res = await fetch(`${base}/models`, { headers: { authorization: `Bearer ${key}` } });
  if (!res.ok) throw new Error(`Model listesi alınamadı: ${res.status} ${await res.text()}`);
  const { data } = await res.json();
  const ids = data.map((m) => m.id).filter((id) => /instruct|chat|llama|qwen|deepseek|kimi|gpt-oss|mistral|gemma|nemotron/i.test(id)).sort();
  console.log(ids.join("\n"));
  console.log(`\n${ids.length} model. Denemek için: node --env-file=.env.local scripts/nvidia-models.mjs <model-id>`);
} else {
  const started = Date.now();
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: "Bir 3D baskı tasarım markasının WhatsApp asistanısın. Kısa ve samimi Türkçe cevap ver." },
        { role: "user", content: "Merhaba, lamba hediye paketiyle gönderilebilir mi?" },
      ],
      max_tokens: 200,
      temperature: 0.3,
    }),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  const j = await res.json();
  console.log(`${model} — ${Date.now() - started} ms\n`);
  console.log(j.choices?.[0]?.message?.content);
}
