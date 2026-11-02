import { Fragment } from "react";

/**
 * WhatsApp biçimlendirmesini güvenli şekilde React öğelerine çevirir:
 * *kalın*  _italik_  ~üstü çizili~  ```kod```  ve bağlantılar.
 * HTML enjekte edilmez; her şey metin düğümü olarak işlenir.
 */
const TOKEN = /(\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~|```[^`]+```|https?:\/\/[^\s]+)/g;

function renderLine(line: string, key: number) {
  const parts = line.split(TOKEN);
  return (
    <Fragment key={key}>
      {parts.map((p, i) => {
        if (!p) return null;
        if (p.startsWith("```") && p.endsWith("```") && p.length > 6)
          return (
            <code key={i} className="rounded bg-black/5 px-1 font-mono text-[0.92em] dark:bg-white/10">
              {p.slice(3, -3)}
            </code>
          );
        if (p.length > 2 && p.startsWith("*") && p.endsWith("*")) return <strong key={i} className="font-semibold">{p.slice(1, -1)}</strong>;
        if (p.length > 2 && p.startsWith("_") && p.endsWith("_")) return <em key={i}>{p.slice(1, -1)}</em>;
        if (p.length > 2 && p.startsWith("~") && p.endsWith("~")) return <s key={i}>{p.slice(1, -1)}</s>;
        if (/^https?:\/\//.test(p))
          return (
            <a key={i} href={p} target="_blank" rel="noopener noreferrer" className="break-all text-link underline-offset-2 hover:underline">
              {p}
            </a>
          );
        return <Fragment key={i}>{p}</Fragment>;
      })}
    </Fragment>
  );
}

export function WaText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((l, i) => (
        <Fragment key={i}>
          {renderLine(l, i)}
          {i < lines.length - 1 && <br />}
        </Fragment>
      ))}
    </>
  );
}
