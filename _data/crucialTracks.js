import EleventyFetch from "@11ty/eleventy-fetch";

const FEED_URL = "https://www.crucialtracks.org/profile/damianwalsh/feed.json";
const PER_PAGE = 100;

function getFirstImageSrc(html = "") {
  return html.match(/<img[^>]+src="([^"]+)"/i)?.[1] || null;
}

function extractPromptAndStrip(markdown = "") {
  const src = String(markdown || "").trimStart();
  const m = src.match(/^([_*])(.+?)\1/);

  if (!m) {
    return { prompt: null, content: src };
  }

  const prompt = m[2].trim() || null;

  const content = src
    .slice(m[0].length)
    .replace(/^\s*(?:\r?\n\s*)*/, "")
    .trimStart();

  return { prompt, content };
}

async function fetchAllFeedItems() {
  const allItems = [];
  let nextUrl = `${FEED_URL}?page=1&per_page=${PER_PAGE}`;

  while (nextUrl) {
    const feed = await EleventyFetch(nextUrl, {
      duration: "1d",
      type: "json",
    });

    allItems.push(...(feed.items || []));
    nextUrl = feed.next_url || null;
  }

  return allItems;
}

export default async function () {
  const items = await fetchAllFeedItems();

  const notes = (items || [])
    .map((item) => {
      const song = item._song_details || {};
      const entryImageUrl = getFirstImageSrc(item.content_html);
      const published = item.date_published;
      const year = published?.slice(0, 4) || null;
      const { prompt, content } = extractPromptAndStrip(song.content);

      return {
        entryUrl: item.url,
        id: item.id,
        published,
        date: published ? new Date(published) : null,
        year,
        artist: song.artist,
        song: song.song,
        prompt,
        content,
        artworkUrl: song.artwork_url,
        entryImageUrl,
        appleMusicUrl: song.apple_music_url,
        songlinkUrl: song.songlink_url,
        previewUrl: song.preview_url,
      };
    })
    .sort((a, b) => (b.published || "").localeCompare(a.published || ""));

  const byId = {};
  const grouped = notes.reduce((acc, note) => {
    byId[note.id] = note;

    if (!note.year) return acc;
    (acc[note.year] ||= []).push(note);
    return acc;
  }, {});

  const groups = Object.entries(grouped)
    .sort(([yearA], [yearB]) => yearB.localeCompare(yearA))
    .map(([year, notes]) => ({ year, notes }));

  return { groups, byId, notes };
}
