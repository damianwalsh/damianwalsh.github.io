import EleventyFetch from "@11ty/eleventy-fetch";
import metadata from '../_data/metadata.js';

export default async function () {
  const WEBMENTION_TOKEN = process.env.WEBMENTION_IO_TOKEN;
  const DOMAIN = metadata.url.replace('https://', '');
  const PER_PAGE = 1000;
  let page = 0;
  const allMentions = [];

  while (true) {
    const url = `https://webmention.io/api/mentions.jf2?domain=${DOMAIN}&token=${WEBMENTION_TOKEN}&per-page=${PER_PAGE}&page=${page}`;
    try {
      const response = await EleventyFetch(url, {
        duration: "1h",
        type: "json"
      });
      const mentions = response.children || [];
      if (mentions.length === 0) break;
      allMentions.push(...mentions);
      page++;
    } catch (err) {
      return {};
    }
  }

  const webmentions = {};
  allMentions.forEach(mention => {
    const target = mention.wm?.target || mention['wm-target'];
    if (!webmentions[target]) {
      webmentions[target] = [];
    }
    webmentions[target].push(mention);
  });

  return webmentions;

}
