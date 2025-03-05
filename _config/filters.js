import { DateTime } from "luxon";
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

export default function (eleventyConfig) {

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
    return items.filter(item => {
      return item[creatorKey] === currentItem[creatorKey] &&
        (item[titleKey] !== currentItem[titleKey] || item[formatKey] !== currentItem[formatKey]);
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
    const peopleData = require('../_data/people.json');
    const placesData = require('../_data/places.json');

    // Skip if no memories
    if (!currentRelease.memories) return [];

    const relatedIds = new Set();

    // Process people connections
    if (currentRelease.memories.people) {
      currentRelease.memories.people.forEach(personId => {
        if (peopleData[personId] && peopleData[personId].releases) {
          peopleData[personId].releases.forEach(releaseInfo => {
            if (releaseInfo.releaseId !== currentRelease.release_id.toString()) {
              relatedIds.add(releaseInfo.releaseId);
            }
          });
        }
      });
    }

    // Process place connections
    if (currentRelease.memories.places) {
      currentRelease.memories.places.forEach(placeId => {
        if (placesData[placeId] && placesData[placeId].releases) {
          placesData[placeId].releases.forEach(releaseInfo => {
            if (releaseInfo.releaseId !== currentRelease.release_id.toString()) {
              relatedIds.add(releaseInfo.releaseId);
            }
          });
        }
      });
    }

    // Return related releases, but exclude the current release
    return allReleases.filter(release => {
      // Convert the numeric release_id to a string for comparison
      const releaseIdStr = release.release_id.toString();

      // Only return releases that:
      // 1. Are in our set of related IDs
      // 2. Are NOT the current release we're viewing
      return relatedIds.has(releaseIdStr) &&
             release.release_id !== currentRelease.release_id;
    });
  });

}
