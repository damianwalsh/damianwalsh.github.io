import { DateTime } from "luxon";
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const sbd = require('sbd');

function cleanProfile(profile) {
    // Strip numbered parenthesis like (2)
    profile = profile.replace(/\s*\(\d+\)/g, '');

    // Remove (b. 12 Feb ...) or similar textual patterns
    profile = profile.replace(/\(b\.\s*[\d\w ,\-]+?\)/gi, '');

    // Normalize whitespace
    profile = profile.replace(/\s+/g, ' ').trim();

    // Use sbd to split into sentences
    const sentences = sbd.sentences(profile, {newline_boundaries: false});

    let firstSentence = sentences[0] ? sentences[0].trim() : '';

    // Reject if unwanted patterns (now applied on the *first sentence*)
    if (
        /\[a|\[l|\[m|\[b|NOTE:|https?:\/\//i.test(firstSentence)
    ) return '';

    if (firstSentence.length < 24) return '';
    return firstSentence;
}

export default function (eleventyConfig) {

  eleventyConfig.addFilter('cleanProfile', cleanProfile);

  eleventyConfig.addFilter("findVideoByTrack", function (videos, trackTitle) {
    return videos?.find(video => video.title.includes(trackTitle));
  });

  eleventyConfig.addFilter("getKeys", target => {
    return Object.keys(target);
  });

  eleventyConfig.addFilter("filterTagList", function filterTagList(tags) {
    return (tags || []).filter(tag => ["posts"].indexOf(tag) === -1);
  });

  eleventyConfig.addFilter("slice", function (array, start, end) {
    return array.slice(start, end);
  });

  eleventyConfig.addFilter("htmlDateString", (dateObj) => {
    return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat('yyyy-LL-dd');
  });

  eleventyConfig.addFilter("isoDateString", (dateInput) => {
    if (!dateInput) return "";

    try {
      // If dateInput is already a Date object (like blog post dates)
      if (dateInput instanceof Date) {
        return dateInput.toISOString().split('T')[0];
      }

      // Otherwise proceed with string parsing
      const dateStr = dateInput.toString();

      // Handle plain year format (YYYY)
      if (/^\d{4}$/.test(dateStr)) {
        return `${dateStr}-01-01`;
      }

      // Handle YYYY-MM format
      if (/^\d{4}-\d{2}$/.test(dateStr)) {
        return `${dateStr}-01`;
      }

      // Handle YYYY-00-00 format (year only)
      if (/^\d{4}-00-00$/.test(dateStr)) {
        return `${dateStr.slice(0, 4)}-01-01`;
      }

      // Handle YYYY-MM-00 format (year and month)
      if (/^\d{4}-\d{2}-00$/.test(dateStr)) {
        return `${dateStr.slice(0, 7)}-01`;
      }

      // Handle complete dates (YYYY-MM-DD)
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr;
      }

      return "";
    } catch (e) {
      return "";
    }
  });

  eleventyConfig.addFilter("readableDate", (dateInput, format, zone) => {
    const defaultFormat = "dd LLL yyyy";
    if (!dateInput) return "";

    try {
      // If dateInput is already a Date object (like blog post dates)
      if (dateInput instanceof Date) {
        return DateTime.fromJSDate(dateInput, { zone: zone || "utc" })
          .toFormat(format || defaultFormat);
      }

      // Otherwise proceed with string parsing
      const dateStr = dateInput.toString();

      // Handle plain year format (YYYY)
      if (/^\d{4}$/.test(dateStr)) {
        return dateStr;
      }

      // Handle YYYY-MM format
      if (/^\d{4}-\d{2}$/.test(dateStr)) {
        return DateTime.fromFormat(dateStr, "yyyy-MM", { zone: zone || "utc" })
          .toFormat("LLL yyyy");
      }

      // Handle YYYY-00-00 format (year only)
      if (/^\d{4}-00-00$/.test(dateStr)) {
        return dateStr.slice(0, 4);
      }

      // Handle YYYY-MM-00 format (year and month)
      if (/^\d{4}-\d{2}-00$/.test(dateStr)) {
        return DateTime.fromFormat(dateStr.slice(0, 7), "yyyy-MM", { zone: zone || "utc" })
          .toFormat("LLL yyyy");
      }

      // Handle complete dates (YYYY-MM-DD)
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return DateTime.fromFormat(dateStr, "yyyy-MM-dd", { zone: zone || "utc" })
          .toFormat(format || defaultFormat);
      }

      // Try parsing as "Month DD, YYYY"
      const fullDate = DateTime.fromFormat(dateStr, "LLLL d, yyyy", { zone: zone || "utc" });
      if (fullDate.isValid) {
        return fullDate.toFormat(format || defaultFormat);
      }

      // Try parsing as "Month YYYY"
      const monthYearDate = DateTime.fromFormat(dateStr, "LLLL yyyy", { zone: zone || "utc" });
      if (monthYearDate.isValid) {
        return monthYearDate.toFormat(format || "LLL yyyy");
      }

      return dateStr; // Return original string if no parsing succeeds
    } catch (e) {
      return dateStr; // Return original string on error
    }
  });

  eleventyConfig.addFilter("filterTagList", function filterTagList(tags) {
    return (tags || []).filter(tag => ["all", "posts"].indexOf(tag) === -1);
  });

  eleventyConfig.addFilter("extractYear", (dateString) => {
    if (!dateString) return "";
    const parts = dateString.split('-');
    return parts[0];
  });

  eleventyConfig.addFilter('setAttribute', function (obj, key, value) {
    obj[key] = value;
    return obj;
  });

  eleventyConfig.addFilter("otherItemsByCreator", function (items, currentItem, creatorKey, titleKey, formatKey) {
    return items
      .filter(item => {
        return item[creatorKey] === currentItem[creatorKey] &&
          (item[titleKey] !== currentItem[titleKey] || item[formatKey] !== currentItem[formatKey]);
      })
      .sort((a, b) => {
        const titleA = String(a[titleKey] || '');
        const titleB = String(b[titleKey] || '');
        return titleA.localeCompare(titleB);
      });
  });

  eleventyConfig.addFilter('postsByYear', function (posts) {
    if (!Array.isArray(posts)) return [];

    const groups = {};

    posts.forEach(post => {
      if (!post || !post.date) return;

      const year = post.date.getFullYear();
      if (!groups[year]) {
        groups[year] = [];
      }
      groups[year].push(post);
    });

    return Object.entries(groups)
      .sort(([a], [b]) => b - a);
  });

  eleventyConfig.addFilter('stringify', function (value) {
    return JSON.stringify(value);
  });

  eleventyConfig.addFilter('map', function (array, key) {
    return array.map(item => item[key]);
  });

  eleventyConfig.addFilter('groupItems', function (items, keyAttribute) {
    if (!Array.isArray(items)) return [];

    const groups = {};

    items.forEach(item => {
      if (!item || typeof item !== 'object' || !item[keyAttribute]) return;

      const firstChar = String(item[keyAttribute]).charAt(0).toUpperCase();
      const groupChar = /[A-Z]/.test(firstChar) ? firstChar : '#';

      if (!groups[groupChar]) {
        groups[groupChar] = [];
      }
      groups[groupChar].push(item);
    });

    return Object.entries(groups)
      .sort(([a], [b]) => {
        if (a === '#') return 1;
        if (b === '#') return -1;
        return a.localeCompare(b);
      });
  });

  eleventyConfig.addFilter("releasesWithMemoryConnections", function (allReleases, currentRelease) {
    if (!currentRelease.chapters) return [];

    return allReleases.filter(release => {
      if (release.release_id === currentRelease.release_id) return false;
      if (!release.chapters) return false;

      return Object.entries(currentRelease.chapters).some(([chapterId, chapterMemories]) => {
        const currentPeople = new Set(chapterMemories.people || []);
        const currentPlaces = new Set(chapterMemories.places || []);

        return Object.values(release.chapters).some(releaseMemories => {
          const sharedPeople = releaseMemories.people?.some(person =>
            currentPeople.has(person)
          );
          const sharedPlaces = releaseMemories.places?.some(place =>
            currentPlaces.has(place)
          );
          return sharedPeople || sharedPlaces;
        });
      });
    }).sort((a, b) => {
      const artistCompare = a.artist.localeCompare(b.artist);
      if (artistCompare !== 0) return artistCompare;
      return a.title.localeCompare(b.title);
    });
  });

  eleventyConfig.addFilter("sortReleasesByArtist", function (releases) {
    return [...releases].sort((a, b) => a.artist.localeCompare(b.artist));
  });

  eleventyConfig.addFilter("sortByName", function (items, lookupObject) {
    return [...items].sort((a, b) => {
      const nameA = lookupObject[a].name || lookupObject[a].location;
      const nameB = lookupObject[b].name || lookupObject[b].location;
      return nameA.localeCompare(nameB);
    });
  });

  eleventyConfig.addFilter("filterByProperty", function (array, property, value) {
    return array.filter(item => item["wm-property"] === value);
  });

  eleventyConfig.addFilter("haiku", function (text) {
    if (!text) return "";
    return text.replace(/\n/g, '<br>');
  });

  eleventyConfig.addFilter("filterByChapter", function (items, chapterId) {
    if (!items || !chapterId) return [];
    return items.filter(item => {
      return item.releases && item.releases.some(release =>
        release.chapters && release.chapters[chapterId]
      );
    });
  });

  eleventyConfig.addFilter("getById", function (collection, id) {
    return collection.find(item => item.id === id);
  });

  eleventyConfig.addFilter("filterByIds", function (collection, ids) {
    if (!ids) return [];
    return collection.filter(item => ids.includes(item.id));
  });

  eleventyConfig.addFilter("dedupeByCoords", function (arr) {
    const seen = new Set();
    return arr.filter(loc => {
      const key = `${loc.coordinates.lat},${loc.coordinates.lng}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  });

  eleventyConfig.addFilter("flattenSetlistSongs", function (setlist) {
    if (!Array.isArray(setlist)) return [];
    return setlist.flatMap(set => set.songNames ?? []);
  });

  eleventyConfig.addFilter("sortBySurname", function (authors) {
    return [...authors].sort((a, b) => {
      const aSurname = a.author.trim().split(" ").slice(-1)[0].toLowerCase();
      const bSurname = b.author.trim().split(" ").slice(-1)[0].toLowerCase();
      if (aSurname === bSurname) {
        return a.author.localeCompare(b.author);
      }
      return aSurname.localeCompare(bSurname);
    });
  });

  eleventyConfig.addFilter("eventsForArtist", (events, artistName) => {
    return events.filter(event => event.name === artistName);
  });

}
