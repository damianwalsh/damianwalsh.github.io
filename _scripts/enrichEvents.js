import "dotenv/config";
import EleventyFetch from "@11ty/eleventy-fetch";
import { promises as fs } from "fs";

const SETLISTFM_TOKEN = process.env.SETLISTFM_TOKEN;
const DELAY_MS = 1000;

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function fetchSetlistFromId(setlistId) {
  if (!setlistId) return null;
  await delay(DELAY_MS);
  const url = `https://api.setlist.fm/rest/1.0/setlist/${setlistId}`;
  try {
    const data = await EleventyFetch(url, {
      duration: "1y",
      type: "json",
      fetchOptions: {
        headers: {
          'x-api-key': SETLISTFM_TOKEN,
          'Accept': 'application/json',
        },
      },
    });
    return data;
  } catch (error) {
    console.error(`Error fetching setlist ${setlistId}:`, error.message);
    return null;
  }
}

async function enrichEvent(event) {
  if (!event.setlistfm_id) return event;
  const setlistData = await fetchSetlistFromId(event.setlistfm_id);
  let setlist = null;
  if (setlistData && setlistData.sets?.set) {
    setlist = setlistData.sets.set.map(set => ({
      songNames: (set.song || []).map(song => song.name)
    }));
  }
  return {
    ...event,
    setlist,
    setlistUrl: setlistData?.url || null,
  };
}

const basePath = "_data/events.json";
const outputPath = "_data/enriched/events.json";

export async function enrichEventsCollection() {
  try {
    const base = await fs.readFile(basePath, "utf8");
    const rawEvents = JSON.parse(base);
    const entries = await Promise.all(
      Object.entries(rawEvents).map(async ([eventId, event]) => [
        eventId,
        await enrichEvent(event)
      ])
    );
    const enrichedEvents = Object.fromEntries(entries);

    await fs.writeFile(outputPath, JSON.stringify(enrichedEvents, null, 2));
    console.log(
      `Successfully enriched and wrote ${entries.length} events to events.json`
    );
  } catch (e) {
    console.error("Error enriching events:", e);
  }
}

if (process.argv[1].endsWith("enrichEvents.js")) {
  enrichEventsCollection();
}
