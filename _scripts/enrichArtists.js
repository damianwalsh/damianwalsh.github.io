import "dotenv/config";
import EleventyFetch from "@11ty/eleventy-fetch";
import { promises as fs } from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import slugify from '@sindresorhus/slugify';

const execAsync = promisify(exec);
const DISCOGS_TOKEN = process.env.DISCOGS_TOKEN;
const DISCOGS_USER_AGENT = process.env.USER_AGENT;
const IMAGE_PATH = path.join(process.cwd(), 'content/music/img/artists');

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
        'Referer': 'https://www.discogs.com/'
      },
    }
  });
}

async function downloadImage(imageUrl, artistName) {
  const slugArtist = slugify(artistName.trim(), { decamelize: false });
  const outputFilename = `${slugArtist}.jpg`;
  const outputPath = path.join(IMAGE_PATH, outputFilename);

  try {
    // Create directory if it doesn't exist
    await fs.mkdir(IMAGE_PATH, { recursive: true });

    // Download the image with proper headers
    const imageBuffer = await EleventyFetch(imageUrl, {
      duration: "1y",
      type: "buffer",
      fetchOptions: {
        headers: {
          'User-Agent': DISCOGS_USER_AGENT,
          'Referer': 'https://www.discogs.com/',
          'Authorization': `Discogs token=${DISCOGS_TOKEN}`
        }
      }
    });

    // Save the original image to a temporary file
    const tempPath = outputPath + '.original';
    await fs.writeFile(tempPath, imageBuffer);

    // Process with ImageMagick - square crop from center, preserving top
    const command = `magick "${tempPath}" -gravity North -resize 670x670^ -extent 670x670 "${outputPath}"`;
    await execAsync(command);

    // Remove the temporary file
    await fs.unlink(tempPath);

    console.log(`✓ Artist image processed and saved as ${outputFilename}`);
    return outputFilename;
  } catch (error) {
    console.error(`Error processing image for ${artistName}:`, error);
    return null;
  }
}

export async function enrichArtists() {
  try {
    // Load the enriched music data instead of raw data
    const musicData = JSON.parse(await fs.readFile('_data/enriched/music.json', 'utf8'));
    const releases = musicData.releases || musicData;

    // Extract unique artist IDs
    const artistMap = new Map();
    for (const release of releases) {
      if (release.artist_id) {
        artistMap.set(release.artist_id, release.artist);
      }
    }

    console.log(`Found ${artistMap.size} unique artists with IDs`);

    const artists = {};

    // Process each unique artist
    for (const [artistId, artistName] of artistMap.entries()) {
      const url = `https://api.discogs.com/artists/${artistId}`;
      try {
        const profile = await fetchWithRateLimit(url);

        // Download primary image if available
        if (profile.images && profile.images.length > 0) {
          // Choose primary image (usually the first one)
          const primaryImage = profile.images[0];
          // Use your collection's artist name
          await downloadImage(primaryImage.uri, artistName);
        }

        // Store profile data without image path
        artists[artistId] = profile;

        console.log(`Fetched profile for artist_id ${artistId}: ${profile.name}`);
      } catch (err) {
        console.error(`Failed to fetch artist_id ${artistId}:`, err.message);
      }
    }

    // Make sure the directory exists
    await fs.mkdir('_data/enriched', { recursive: true });

    // Write the enriched artists data
    await fs.writeFile(
      '_data/enriched/artists.json',
      JSON.stringify(artists, null, 2)
    );

    console.log(`Wrote ${Object.keys(artists).length} artists to _data/enriched/artists.json`);
  } catch (error) {
    console.error('Error enriching artists:', error);
  }
}

if (process.argv[1].endsWith("enrichArtists.js")) {
  enrichArtists()
    .then(() => console.log('Artist enrichment complete'))
    .catch(err => console.error('Error during artist enrichment:', err));
}
