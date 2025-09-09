export function isTweetUrl(input) {
  try {
    const u = new URL(input);
    const host = u.hostname.toLowerCase();
    if (!/(^|\.)twitter\.com$/.test(host) && !/(^|\.)x\.com$/.test(host))
      return false;
    // Expect path like /<user>/status/<id>
    return /\/status\/(\d+)/.test(u.pathname);
  } catch (_err) {
    return false;
  }
}

export function extractTweetId(input) {
  try {
    const u = new URL(input);
    const m = u.pathname.match(/\/status\/(\d+)/);
    return m ? m[1] : null;
  } catch (_err) {
    return null;
  }
}

// For MVP we don't call Twitter API; we just return the text itself if it's not a URL.
// If it is a URL, we fall back to prompting the LLM with the URL embedded.
export async function getTweetText(input) {
  if (!isTweetUrl(input)) return String(input || "");
  const url = `https://publish.twitter.com/oembed?url=${encodeURIComponent(
    input
  )}`;
  try {
    const resp = await fetch(url, { cache: "no-store" });
    const data = await resp.json();
    const html = String(data?.html || "");
    if (!html) return String(input || "");
    const pMatch = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
    const inner = pMatch ? pMatch[1] : html;
    const withBreaks = inner.replace(/<br\s*\/?>/gi, "\n");
    const text = decodeHTMLEntities(stripTags(withBreaks)).trim();
    return text || String(input || "");
  } catch (_err) {
    return String(input || "");
  }
}

function stripTags(html) {
  return String(html || "").replace(/<[^>]+>/g, "");
}

function decodeHTMLEntities(text) {
  return String(text || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/#x2F;/g, "/")
    .replace(/&#(\d+);/g, (_, n) => {
      try {
        return String.fromCharCode(parseInt(n, 10));
      } catch {
        return _;
      }
    });
}
