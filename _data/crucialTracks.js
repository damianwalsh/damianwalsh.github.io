import EleventyFetch from "@11ty/eleventy-fetch";

const FEED_URL = "https://www.crucialtracks.org/profile/damianwalsh/feed.json";

function getFirstImageSrc(html = "") {
  return html.match(/<img[^>]+src="([^"]+)"/i)?.[1] || null;
}

export default async function () {
  const feed = await EleventyFetch(FEED_URL, {
    duration: "1d",
    type: "json",
  });

  const notes = (feed.items || [])
    .map((item) => {
      const song = item._song_details || {};
      const entryImageUrl = getFirstImageSrc(item.content_html);
      const published = item.date_published;
      const year = published.slice(0, 4);

      return {
        entryUrl: item.url,
        id: item.id,
        published,
        date: new Date(published),
        year,
        artist: song.artist,
        song: song.song,
        content: song.content,
        artworkUrl: song.artwork_url,
        entryImageUrl,
        appleMusicUrl: song.apple_music_url,
        songlinkUrl: song.songlink_url,
        previewUrl: song.preview_url,
      };
    })
    .sort((a, b) => b.published.localeCompare(a.published));

  const grouped = notes.reduce((acc, note) => {
    (acc[note.year] ||= []).push(note);
    return acc;
  }, {});

  return Object.entries(grouped)
    .sort(([yearA], [yearB]) => yearB.localeCompare(yearA))
    .map(([year, notes]) => ({ year, notes }));
};
