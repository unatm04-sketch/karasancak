import Link from "next/link";
import type { ReactNode } from "react";

const TOKEN = /(https?:\/\/[^\s<>"']+)|((?:^|(?<=\s))@[a-z0-9_]{3,24})/g;

function renderLine(line: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let cursor = 0;
  for (const match of line.matchAll(TOKEN)) {
    const index = match.index;
    if (index > cursor) nodes.push(line.slice(cursor, index));
    const [token, url, mention] = match;
    if (url) {
      // Cümle sonundaki noktalama linke dahil değildir.
      const clean = url.replace(/[.,;:!?)]+$/, "");
      nodes.push(
        <a key={`${keyPrefix}-${index}`} href={clean} target="_blank" rel="nofollow ugc noopener noreferrer">
          {clean}
        </a>,
      );
      if (clean.length < url.length) nodes.push(url.slice(clean.length));
    } else if (mention) {
      nodes.push(
        <Link key={`${keyPrefix}-${index}`} href={`/uye/${mention.slice(1)}`} className="font-semibold">
          {mention}
        </Link>,
      );
    }
    cursor = index + token.length;
  }
  if (cursor < line.length) nodes.push(line.slice(cursor));
  return nodes;
}

/**
 * Kullanıcı metni. HTML yorumlanmaz: React her şeyi kaçışlar, yalnızca linkler ve
 * @bahsetmeler bileşene çevrilir. Bu sayede forumda XSS mümkün olmaz.
 */
export function RichText({ text, className = "" }: { text: string; className?: string }) {
  const paragraphs = text.split(/\n{2,}/);
  return (
    <div className={`prose-ks break-words leading-relaxed ${className}`}>
      {paragraphs.map((paragraph, p) => (
        <p key={p}>
          {paragraph.split("\n").map((line, l) => (
            <span key={l}>
              {l > 0 && <br />}
              {renderLine(line, `${p}-${l}`)}
            </span>
          ))}
        </p>
      ))}
    </div>
  );
}
