import "dotenv/config";
import EleventyFetch from "@11ty/eleventy-fetch";
import { promises as fs } from 'fs';

const DISCOGS_TOKEN = process.env.DISCOGS_TOKEN;
const DISCOGS_USER_AGENT = process.env.USER_AGENT;

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

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

async function fetchReleaseDetails(release) {
  if (!release.release_id) {
    console.error('No Discogs ID provided for release:', release.title);
    return release;
  }
  const releaseUrl = `https://api.discogs.com/releases/${release.release_id}`;
  try {
    const releaseDetails = await fetchWithRateLimit(releaseUrl);
    const mainArtist = releaseDetails.artists?.[0];

    return {
      ...release,
      artist_id: mainArtist?.id || null,
      label: releaseDetails.labels?.[0]?.name.replace(/\\s*\\(\\d+\\)\\s*$/, '') || '',
      year: releaseDetails.year,
      notes: releaseDetails.notes,
      released: releaseDetails.released,
      genres: releaseDetails.genres || [],
      uri: releaseDetails.uri,
      videos: releaseDetails.videos?.map(video => ({
        url: video.uri,
        title: video.title,
        duration: video.duration
      })) || [],
      formats: (releaseDetails.formats || []).map(format => ({
        name: format.name,
        descriptions: format.descriptions
      })),
      tracklist: (releaseDetails.tracklist || []).map(track => ({
        position: track.position,
        title: track.title,
        duration: track.duration
      }))
    };
  } catch (error) {
    console.error(`Error fetching details for ${release.title}:`, error);
    return release;
  }
}

export async function enrichMusicCollection() {
  try {
    const localData = await fs.readFile('_data/music.json', 'utf8');
    const myCollection = JSON.parse(localData);
    const enriched = await Promise.all(myCollection.map(fetchReleaseDetails));
    await fs.writeFile('_data/enriched/music.json', JSON.stringify({ releases: enriched }, null, 2));
    console.log(`Successfully enriched ${enriched.length} releases.`);
  } catch (error) {
    console.error('Error processing music collection:', error);
  }
}

if (process.argv[1].endsWith("enrichMusic.js")) {
  enrichMusicCollection();
}
