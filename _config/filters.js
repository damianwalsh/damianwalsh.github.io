
import { IdAttributePlugin } from "@11ty/eleventy";
import { DateTime } from "luxon";
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

export default function (eleventyConfig) {

  // Filters
	eleventyConfig.addPlugin(IdAttributePlugin, {
		// by default we use Eleventy’s built-in `slugify` filter:
		// slugify: eleventyConfig.getFilter("slugify"),
		// selector: "h1,h2,h3,h4,h5,h6", // default
	});

  eleventyConfig.addFilter("findVideoByTrack", function(videos, trackTitle) {
    return videos?.find(video => video.title.includes(trackTitle));
  });

  eleventyConfig.addFilter("getKeys", target => {
		return Object.keys(target);
	});

  eleventyConfig.addFilter("filterTagList", function filterTagList(tags) {
    return (tags || []).filter(tag => ["posts"].indexOf(tag) === -1);
  });

  eleventyConfig.addFilter("slice", function(array, start, end) {
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

  eleventyConfig.addFilter('setAttribute', function(obj, key, value) {
    obj[key] = value;
    return obj;
  });

  eleventyConfig.addFilter("otherItemsByCreator", function(items, currentItem, creatorKey, titleKey, formatKey) {
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

  eleventyConfig.addFilter('postsByYear', function(posts) {
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

  eleventyConfig.addFilter('stringify', function(value) {
    return JSON.stringify(value);
  });

  eleventyConfig.addFilter('map', function(array, key) {
    return array.map(item => item[key]);
  });

  eleventyConfig.addFilter('groupItems', function(items, keyAttribute) {
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

  eleventyConfig.addFilter("releasesWithMemoryConnections", function(allReleases, currentRelease) {
    if (!currentRelease.memories) return [];

    // Get the current release's memory identifiers
    const currentPeople = new Set(currentRelease.memories.people || []);
    const currentPlaces = new Set(currentRelease.memories.places || []);

    // Filter releases that share people or places, excluding the current release
    const relatedReleases = allReleases.filter(release => {
      if (release.release_id === currentRelease.release_id) return false;
      if (!release.memories) return false;

      // Check for shared people
      const sharedPeople = release.memories.people?.some(person =>
        currentPeople.has(person)
      );

      // Check for shared places
      const sharedPlaces = release.memories.places?.some(place =>
        currentPlaces.has(place)
      );

      return sharedPeople || sharedPlaces;
    });

    // Sort by artist, then title
    return relatedReleases.sort((a, b) => {
      const artistCompare = a.artist.localeCompare(b.artist);
      if (artistCompare !== 0) return artistCompare;
      return a.title.localeCompare(b.title);
    });
  });

  eleventyConfig.addFilter("sortByName", function(items, lookupObject) {
    return items.sort((a, b) => {
      const nameA = lookupObject[a].name || lookupObject[a].location;
      const nameB = lookupObject[b].name || lookupObject[b].location;
      return nameA.localeCompare(nameB);
    });
  });

}
