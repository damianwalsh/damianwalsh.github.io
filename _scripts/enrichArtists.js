import "dotenv/config";
import EleventyFetch from "@11ty/eleventy-fetch";
import { promises as fs } from "fs";

const DISCOGS_TOKEN = process.env.DISCOGS_TOKEN;
const DISCOGS_USER_AGENT = process.env.USER_AGENT;

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRateLimit(url) {
  await delay(1000);
  return EleventyFetch(url, {
    duration: "1y",
    type: "json",
    fetchOptions: {
      headers: {
        'Authorization': `Discogs token=${DISCOGS_TOKEN}`,
        'User-Agent': DISCOGS_USER_AGENT,
      },
    }
  });
}

export async function enrichArtists() {
  const musicData = JSON.parse(await fs.readFile('_data/music.json', 'utf8'));
  const releases = musicData.releases || musicData;
  const artistIds = [...new Set(
    releases
      .map(r => r.artist_id)
      .filter(id => id && id !== null && id !== "")
  )];

  const artists = {};
  for (const id of artistIds) {
    const url = `https://api.discogs.com/artists/${id}`;
    try {
      const profile = await fetchWithRateLimit(url);
      artists[id] = profile;
      console.log(`Fetched profile for artist_id ${id}: ${profile.name}`);
    } catch (err) {
      console.error(`Failed to fetch artist_id ${id}:`, err.message);
    }
  }

  await fs.writeFile(
    '_data/enriched/artists.json',
    JSON.stringify(artists, null, 2)
  );
  console.log(`Wrote ${Object.keys(artists).length} artists to _data/enriched/artists.json`);
}

if (process.argv[1].endsWith("enrichArtists.js")) {
  enrichArtists();
}
