import { NextResponse } from "next/server";

// Bible books lookup dictionary mapping book names to bolls.life book IDs (1..66)
const BIBLE_BOOKS: Record<string, number> = {
  genesis: 1, gen: 1, exodus: 2, ex: 2, exod: 2, leviticus: 3, lev: 3,
  numbers: 4, num: 4, deuteronomy: 5, deut: 5, dt: 5, joshua: 6, josh: 6,
  judges: 7, judg: 7, ruth: 8, "1 samuel": 9, "1samuel": 9, "1 sam": 9, "1sam": 9,
  "2 samuel": 10, "2samuel": 10, "2 sam": 10, "2sam": 10, "1 kings": 11, "1kings": 11,
  "2 kings": 12, "2kings": 12, "1 chronicles": 13, "1chronicles": 13, "1 chron": 13,
  "2 chronicles": 14, "2chronicles": 14, "2 chron": 14, ezra: 15, nehemiah: 16, neh: 16,
  esther: 17, esth: 17, job: 18, psalms: 19, psalm: 19, ps: 19, psa: 19,
  proverbs: 20, prov: 20, pr: 20, ecclesiastes: 21, ecc: 21, "song of solomon": 22, song: 22,
  isaiah: 23, isa: 23, jeremiah: 24, jer: 24, lamentations: 25, lam: 25, ezekiel: 26, ezek: 26,
  daniel: 27, dan: 27, hosea: 28, hos: 28, joel: 29, amos: 30, obadiah: 31, obad: 31,
  jonah: 32, micah: 33, mic: 33, nahum: 34, nah: 34, habakkuk: 35, hab: 35,
  zephaniah: 36, zeph: 36, haggai: 37, hag: 37, zechariah: 38, zech: 38, malachi: 39, mal: 39,
  matthew: 40, matt: 40, mt: 40, mark: 41, mk: 41, luke: 42, lk: 42, john: 43, jn: 43,
  acts: 44, romans: 45, rom: 45, "1 corinthians": 46, "1corinthians": 46, "1 cor": 46,
  "2 corinthians": 47, "2corinthians": 47, "2 cor": 47, galatians: 48, gal: 48,
  ephesians: 49, eph: 49, philippians: 50, phil: 50, colossians: 51, col: 51,
  "1 thessalonians": 52, "1thessalonians": 52, "1 thess": 52, "2 thessalonians": 53, "2thessalonians": 53, "2 thess": 53,
  "1 timothy": 54, "1timothy": 54, "1 tim": 54, "2 timothy": 55, "2timothy": 55, "2 tim": 55,
  titus: 56, tit: 56, philemon: 57, philm: 57, hebrews: 58, heb: 58, james: 59, jas: 59,
  "1 peter": 60, "1peter": 60, "1 pet": 60, "2 peter": 61, "2peter": 61, "2 pet": 61,
  "1 john": 62, "1john": 62, "1 jn": 62, "2 john": 63, "2john": 63, "2 jn": 63,
  "3 john": 64, "3john": 64, "3 jn": 64, jude: 65, revelation: 66, rev: 66,
};

function parseReference(refStr: string) {
  // Matches e.g. "John 3", "John 3:16", "John 3:1-10", "John 3:1 - 10", "1 John 4:8-12"
  const clean = refStr.trim();
  const match = clean.match(/^((?:\d\s+)?[A-Za-z\s]+)\s+(\d+)(?::(\d+)(?:\s*-\s*(\d+))?)?$/);

  if (!match) return null;

  const rawBook = match[1].trim().toLowerCase();
  const chapter = parseInt(match[2], 10);
  const startVerse = match[3] ? parseInt(match[3], 10) : undefined;
  const endVerse = match[4] ? parseInt(match[4], 10) : startVerse;

  const bookId = BIBLE_BOOKS[rawBook];
  if (!bookId) return null;

  return { bookId, rawBook, chapter, startVerse, endVerse };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get("reference") || "John 3";
    const requestedTranslation = (searchParams.get("translation") || "NIV").toUpperCase();

    // Provider 1: bolls.life (Supports NIV, AMP, AMPC, NLT, KJV, WEB, BBE)
    const parsed = parseReference(reference);
    if (parsed) {
      const { bookId, chapter, startVerse, endVerse } = parsed;
      const bollsRes = await fetch(
        `https://bolls.life/get-chapter/${requestedTranslation}/${bookId}/${chapter}/`,
        { next: { revalidate: 86400 } }
      );

      if (bollsRes.ok) {
        const rawVerses: any[] = await bollsRes.json();
        if (Array.isArray(rawVerses) && rawVerses.length > 0) {
          let filtered = rawVerses;
          if (startVerse !== undefined) {
            filtered = rawVerses.filter(
              (v) => v.verse >= startVerse && v.verse <= (endVerse || startVerse)
            );
          }

          const verses = filtered.map((v) => {
            // Clean Strong's numbers (e.g. WAS2258 -> WAS, standalone 846 -> removed)
            const cleanedText = v.text
              .replace(/<[^>]*>/g, "") // Strip HTML tags
              .replace(/([a-zA-Z,.;:\-'"]+)\d+/g, "$1") // Strip numbers attached to words
              .replace(/\b\d{3,5}\b/g, "") // Strip standalone Strong's numbers
              .replace(/\s+/g, " ") // Normalize spaces
              .trim();

            return {
              verse: v.verse,
              text: cleanedText,
            };
          });

          const fullText = verses.map((v) => `${v.verse}. ${v.text}`).join(" ");

          return NextResponse.json({
            reference,
            text: fullText,
            translation_name: requestedTranslation,
            verses,
          });
        }
      }
    }

    // Provider 2 Fallback: bible-api.com
    const fallbackRes = await fetch(
      `https://bible-api.com/${encodeURIComponent(reference)}?translation=${requestedTranslation.toLowerCase()}`,
      { next: { revalidate: 86400 } }
    );

    if (fallbackRes.ok) {
      const data = await fallbackRes.json();
      // Clean Strong's numbers from fallback if any
      if (data.verses) {
        data.verses = data.verses.map((v: any) => ({
          ...v,
          text: v.text
            .replace(/([a-zA-Z,.;:\-'"]+)\d+/g, "$1")
            .replace(/\b\d{3,5}\b/g, "")
            .replace(/\s+/g, " ")
            .trim(),
        }));
      }
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: "Bible passage not found" }, { status: 404 });
  } catch (err: any) {
    console.error("Bible API error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch Bible passage" }, { status: 500 });
  }
}
