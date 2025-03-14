import EleventyFetch from "@11ty/eleventy-fetch";
import metadata from '../_data/metadata.js';
import { writeFile } from 'fs/promises';

export default async function() {
  const debugLog = [];
  const WEBMENTION_TOKEN = process.env.WEBMENTION_IO_TOKEN;
  const DOMAIN = metadata.url.replace('https://', '');
  const PER_PAGE = 1000;
  let page = 0;
  const allMentions = [];

  while (true) {
    const url = `https://webmention.io/api/mentions.jf2?domain=${DOMAIN}&token=${WEBMENTION_TOKEN}&per-page=${PER_PAGE}&page=${page}`;
    debugLog.push(`Fetching page ${page} from: ${url}`);

    try {
      const response = await EleventyFetch(url, {
        duration: "1h",
        type: "json"
      });

      const mentions = response.children || [];
      debugLog.push(`Found ${mentions.length} mentions on page ${page}`);

      if (mentions.length === 0) break;

      allMentions.push(...mentions);
      page++;

    } catch (err) {
      debugLog.push(`Error fetching webmentions: ${err.message}`);
      return {};
    }
  }

  debugLog.push(`Total mentions found: ${allMentions.length}`);

  // Filter and sort mentions by target URL
  const webmentions = {};
  allMentions.forEach(mention => {
    const target = mention.wm?.target || mention['wm-target'];
    if (!webmentions[target]) {
      webmentions[target] = [];
    }
    webmentions[target].push(mention);
  });

  debugLog.push(`Grouped webmentions: ${JSON.stringify(webmentions, null, 2)}`);
  await writeFile('_site/webmentions-debug.log', debugLog.join('\n\n'));

  return webmentions;
}
