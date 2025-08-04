import { InputPathToUrlTransformPlugin, HtmlBasePlugin } from "@11ty/eleventy";
import pluginNavigation from "@11ty/eleventy-navigation";
import { eleventyImageTransformPlugin } from "@11ty/eleventy-img";
import pluginSyntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import { feedPlugin } from "@11ty/eleventy-plugin-rss";
import pluginTOC from 'eleventy-plugin-toc';
import markdownIt from "markdown-it";
import he from 'he';
import postcss from "postcss";
import cssnanoPlugin from "cssnano";
import { minify } from "terser";
import htmlmin from 'html-minifier';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import pluginFilters from "./_config/filters.js";
import { generateStaticMap } from './_scripts/maps.js';
import { createRequire } from 'module';
import { createHash } from 'node:crypto';
import "dotenv/config";
import metadata from "./_data/metadata.js";

const require = createRequire(import.meta.url);

export default async function (eleventyConfig) {

  // Copy the contents of the `public` folder to the output folder
  eleventyConfig.addPassthroughCopy({
    "./public/": "/"
  });

  // Watch content images for the image pipeline.
  eleventyConfig.addWatchTarget("content/**/*.{svg,webp,png,jpeg}");

  // Configure Markdown library
  const mdOptions = {
    html: true,
    breaks: true,
    linkify: true,
    anchor: {
      permalink: true,
      permalinkClass: 'anchor-link',
      permalinkSymbol: '#'
    }
  };

  // RSS plugin
  eleventyConfig.addPlugin(feedPlugin, {
    type: "atom",
    outputPath: "/feed.xml",
    collection: {
      name: "posts",
      limit: 10,
    },
    metadata: {
      language: metadata.language,
      title: metadata.title,
      subtitle: metadata.description,
      base: metadata.url,
      author: {
        name: metadata.author.name,
        email: metadata.author.email
      }
    }
  });

  // Add markdown-it-anchor plugin
  const markdownLib = markdownIt(mdOptions).use(require('markdown-it-anchor'));
  eleventyConfig.setLibrary("md", markdownLib);

  eleventyConfig.addPlugin(pluginTOC, {
    tags: ['h1','h2'],
    wrapper: 'nav',
    wrapperLabel: 'toc',
    ul: true,
    flat: true
  });

  // Tags collection (for blog posts)
  const excludedTags = ["posts", "releases", "artists", "genres", "formats", "releasesWithRelated", "books", "authors", "years"];

  eleventyConfig.addCollection("blogTags", function(collectionApi) {
    let tags = new Set();
    collectionApi.getAll().forEach(item => {
      if (item.data.tags) {
        item.data.tags
          .filter(tag => !excludedTags.includes(tag))
          .forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags);
  });

  eleventyConfig.addCollection("releases", function (collectionApi) {
    const musicData = require("./_data/enriched/music.json");
    const releases = musicData?.releases || [];
    if (!releases.length) {
      console.warn("Music data not found or invalid");
      return [];
    }
    return [...releases];
  });

  eleventyConfig.addCollection("artists", function (collectionApi) {
    const musicData = require("./_data/enriched/music.json");
    const releases = musicData?.releases || [];
    if (!releases.length) {
      console.warn("Music data not found or invalid for artists collection");
      return [];
    }
    const artistsMap = new Map();
    for (const release of releases) {
      if (!artistsMap.has(release.artist)) {
        artistsMap.set(release.artist, {
          artist: release.artist,
          artist_id: release.artist_id || null,
          releases: []
        });
      }
      artistsMap.get(release.artist).releases.push(release);
    }
    return Array.from(artistsMap.values()).sort((a, b) =>
      a.artist.localeCompare(b.artist, "en", { sensitivity: "base" })
    );
  });

  // Load the enriched artists data
  const artistsData = require('./_data/enriched/artists.json');
  eleventyConfig.addGlobalData("artists", () => artistsData);

  eleventyConfig.addCollection("genres", function (collectionApi) {
    const musicData = require("./_data/enriched/music.json");
    const releases = musicData?.releases || [];
    if (!releases.length) {
      console.warn("Music data not found or invalid for genres collection");
      return [];
    }
    const genres = [...new Set(releases.flatMap(release => release.genres || []))];
    return genres.map(genre => ({
      genre,
      releases: releases.filter(r => r.genres && r.genres.includes(genre))
    }));
  });

  eleventyConfig.addCollection("formats", function (collectionApi) {
    const musicData = require("./_data/enriched/music.json");
    const releases = musicData?.releases || [];
    if (!releases.length) {
      console.warn("Music data not found or invalid for formats collection");
      return [];
    }
    const formats = [...new Set(releases.flatMap(release =>
      release.formats?.map(f => f.name) || []
    ))];
    return formats.map(format => ({
      format,
      releases: releases.filter(r =>
        r.formats && r.formats.some(f => f.name.toLowerCase() === format.toLowerCase())
      )
    }));
  });

  eleventyConfig.addCollection("releasesWithRelated", function (collectionApi) {
    const musicData = require("./_data/enriched/music.json");
    const releases = musicData?.releases || [];
    if (!releases.length) {
      console.warn("Music data not found or invalid");
      return [];
    }
    return releases.map(release => ({
      ...release,
      relatedReleases: releases.filter(r =>
        r.artist === release.artist && r.title !== release.title
      )
    }));
  });

  const parseDate = (dateStr) => {
    if (!dateStr) return null;

    const parts = dateStr.split('-');
    // If only year is provided
    if (parts.length === 1) {
      return new Date(parts[0], 0, 1);
    }
    // If year and month are provided
    if (parts.length === 2) {
      return new Date(parts[0], parts[1] - 1, 1);
    }
    // If complete date is provided
    return new Date(parts[0], parts[1] - 1, parts[2]);
  };

  eleventyConfig.addCollection("releaseYears", function (collectionApi) {
    const musicData = require("./_data/enriched/music.json");
    const releases = musicData?.releases || [];
    if (!releases.length) {
      console.warn("Music data not found or invalid");
      return [];
    }
    const parseDate = dateStr => {
      if (!dateStr) return null;
      const parts = dateStr.split('-');
      if (parts.length === 1) return new Date(parts[0], 0, 1);
      if (parts.length === 2) return new Date(parts[0], parts[1] - 1, 1);
      return new Date(parts[0], parts[1] - 1, parts[2]);
    };
    const years = [...new Set(releases
      .map(release => {
        const date = parseDate(release.first_released) || parseDate(release.released);
        return date ? date.getFullYear() : null;
      })
      .filter(year => year !== null)
    )].sort((a, b) => a - b);
    return years.map(year => ({
      year,
      releases: releases.filter(r => {
        const date = parseDate(r.first_released) || parseDate(r.released);
        return date && date.getFullYear() === year;
      })
    }));
  });

  eleventyConfig.addCollection("peopleCollection", function (collectionApi) {
    const musicData = require("./_data/enriched/music.json");
    const releases = musicData?.releases || [];
    const people = require("./_data/people.json");
    const peopleArray = Object.entries(people).map(([personId, person]) => {
      const relatedReleases = releases.filter(release =>
        Object.values(release.chapters || {}).some(chapterMemories =>
          chapterMemories.people?.includes(personId)
        )
      );
      return {
        id: personId,
        ...person,
        releases: relatedReleases
      };
    });

    peopleArray.sort((a, b) => a.name.localeCompare(b.name));
    return peopleArray;
  });

  eleventyConfig.addCollection("placesCollection", function (collectionApi) {
    const musicData = require("./_data/enriched/music.json");
    const releases = musicData?.releases || [];
    const places = require("./_data/places.json");
    return Object.entries(places).map(([placeId, place]) => {
      const relatedReleases = releases.filter(release =>
        Object.values(release.chapters || {}).some(chapterMemories =>
          chapterMemories.places?.includes(placeId)
        )
      );
      return {
        id: placeId,
        ...place,
        releases: relatedReleases
      };
    });
  });

  eleventyConfig.addCollection("eventsCollection", function (collectionApi) {
    const musicData = require("./_data/enriched/music.json");
    const releases = musicData?.releases || [];
    const events = require("./_data/enriched/events.json");
    return Object.entries(events).map(([eventId, event]) => {
      const relatedReleases = releases.filter(release =>
        Object.values(release.chapters || {}).some(chapterMemories =>
          chapterMemories.events?.includes(eventId)
        )
      );
      return {
        id: eventId,
        ...event,
        releases: relatedReleases
      };
    });
  });

  eleventyConfig.addCollection("eventsByYear", function () {
    const events = Object.entries(require('./_data/enriched/events.json')).map(([id, event]) => ({ id, ...event }));

    const years = {};
    events.forEach(event => {
      if (!event.date) return;
      const year = event.date.split('-')[0];
      if (!years[year]) years[year] = [];
      years[year].push(event);
    });

    return Object.entries(years)
      .sort(([a], [b]) => b - a)
      .map(([year, events]) => ({ year, events }));
  });

  eleventyConfig.addCollection("chapterCollection", function (collectionApi) {
    const musicData = require("./_data/enriched/music.json");
    const releases = musicData?.releases || [];
    const chapters = require("./_data/chapters.json");
    return Object.entries(chapters).map(([chapterId, chapter]) => {
      const relatedReleases = releases.filter(release =>
        release.chapters && release.chapters[chapterId]
      );
      return {
        id: chapterId,
        ...chapter,
        releases: relatedReleases
      };
    });
  });

  // Reading list
  eleventyConfig.addCollection("books", function (collectionApi) {
    const readingData = require("./_data/enriched/reading.json");
    return readingData.current;
  });

  eleventyConfig.addCollection("authors", function (collectionApi) {
    const readingData = require("./_data/enriched/reading.json");
  const books = readingData.current;
    const authors = [...new Set(books.map(book => book.author))];
    return authors.map(author => {
      const parts = author.trim().split(" ");
      const surname = parts[parts.length - 1];
      return {
        author,
        surname,
        books: books.filter(b => b.author === author)
      };
    }).sort((a, b) => {
      if (a.surname.toLowerCase() === b.surname.toLowerCase()) {
        return a.author.localeCompare(b.author);
      }
      return a.surname.toLowerCase().localeCompare(b.surname.toLowerCase());
    });
  });

  eleventyConfig.addCollection("years", function (collectionApi) {
    const readingData = require("./_data/enriched/reading.json");
    const books = readingData.current;
    const parseDate = (dateStr) => {
      const [year, month, day] = dateStr.split('-');
      return new Date(year, month - 1, day);
    };
    const years = [...new Set(books.map(book => parseDate(book.date_read).getFullYear()))].sort((a, b) => a - b);
    return years.map(year => ({
      year,
      books: books.filter(b => parseDate(b.date_read).getFullYear() === year)
    }));
  });

  eleventyConfig.addCollection("booksByMonth", function (collectionApi) {
    const readingData = require("./_data/enriched/reading.json");
    const books = readingData.current;

    return {
      getMonthlyBooks: function (date) {
        if (!date) return [];

        const postDate = new Date(date);
        const postYear = postDate.getFullYear();
        const postMonth = postDate.getMonth() + 1;

        return books.filter(book => {
          const [bookYear, bookMonth] = book.date_read.split('-');
          return parseInt(bookYear) === postYear && parseInt(bookMonth) === postMonth;
        });
      }
    };
  });

  eleventyConfig.addCollection("booksByGenre", function (collectionApi) {
    const enrichedReading = require("./_data/enriched/reading.json");
    const books = enrichedReading.current;
    const genres = [];
    const booksByGenre = {};

    books.forEach(book => {
      if (book.genres && book.genres.length > 0) {
        book.genres.forEach(genre => {
          if (!booksByGenre[genre]) {
            booksByGenre[genre] = [];
          }
          booksByGenre[genre].push(book);
        });
      } else {
        if (!booksByGenre["Uncategorised"]) {
          booksByGenre["Uncategorised"] = [];
        }
        booksByGenre["Uncategorised"].push(book);
      }
    });

    Object.keys(booksByGenre)
      .sort()
      .forEach(genre => {
        genres.push({
          genre: genre,
          books: booksByGenre[genre]
        });
      });

    return genres;
  });

  eleventyConfig.addShortcode("memoryMap", async function (places, loadingStrategy = 'lazy') {
    const mapboxToken = process.env.MAPBOX_TOKEN;
    if (!mapboxToken) {
      console.warn("No Mapbox token found");
      return "";
    }
    const mapData = await generateStaticMap(places, mapboxToken);
    if (!mapData) {
      return "";
    }
    const base64Image = mapData.imageBuffer.toString('base64');
    return `<img src="data:image/png;base64,${base64Image}"
           loading="${loadingStrategy}"
           decoding="async"
           alt="Location map"
           width="600" height="600"
           class="map__image">`;
  });

  // Social images - auth
  eleventyConfig.addShortcode("socialImage", function(pageData) {
    if (!pageData) return '';

    const title = pageData.title || pageData.metadata?.title || '';
    const description = pageData.description || pageData.metadata?.description || '';
    const url = (pageData.metadata?.url || '').replace('https://', '');

    const safeTitle = encodeURIComponent(encodeURIComponent(title));
    const safeDescription = encodeURIComponent(encodeURIComponent(description));
    const safeUrl = encodeURIComponent(encodeURIComponent(url.toUpperCase()));

    // Create transformation string
    const transformation = `w_1200,h_630,c_fill/l_text:BricolageGrotesqueExtraBold.ttf_72_line_spacing_1:${safeTitle},co_rgb:ffffff,g_south_west,x_72,y_327,c_fit,w_960/l_text:BricolageGrotesqueLight.ttf_36_line_spacing_1.5:${safeDescription},co_rgb:afafaf,g_north_west,x_72,y_327,c_fit,w_720/l_text:BricolageGrotesqueBold.ttf_32_letter_spacing_0.4:${safeUrl},co_rgb:afafaf,g_south_west,x_72,y_96/og-background.jpg`;

    // Generate URL-safe base64 signature and take first 8 characters
    const toSign = transformation + process.env.CLOUDINARY_API_SECRET;
    const hash = createHash('sha1')
      .update(toSign)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
    const signature = hash.substring(0, 8);

    return `https://res.cloudinary.com/damianwalsh/image/upload/s--${signature}--/${transformation}`;
  });

  // Social images - no auth
  // eleventyConfig.addShortcode("socialImage", function(pageData) {
  //   if (!pageData) return '';

  //   const title = pageData.title || pageData.metadata?.title || '';
  //   const description = pageData.description || pageData.metadata?.description || '';
  //   const url = (pageData.metadata?.url || '').replace('https://', '');

  //   const safeTitle = encodeURIComponent(encodeURIComponent(title));
  //   const safeDescription = encodeURIComponent(encodeURIComponent(description));
  //   const safeUrl = encodeURIComponent(encodeURIComponent(url.toUpperCase()));

  //   return `https://res.cloudinary.com/damianwalsh/image/upload/w_1200,h_630,c_fill/l_text:open%20sans_72_bold_line_spacing_-10:${safeTitle},co_rgb:ffffff,g_south_west,x_72,y_327,c_fit,w_960/l_text:open%20sans_36_regular_line_spacing_1.5:${safeDescription},co_rgb:afafaf,g_north_west,x_72,y_327,c_fit,w_720/l_text:open%20sans_32_bold:${safeUrl},co_rgb:afafaf,g_south_west,x_72,y_96/og-background.jpg`;
  // });

  // Plugins
  eleventyConfig.addPlugin(pluginNavigation);

  eleventyConfig.addPlugin(pluginSyntaxHighlight, {
    preAttributes: { tabindex: 0 }
  });

  eleventyConfig.addPlugin(HtmlBasePlugin);
  eleventyConfig.addPlugin(InputPathToUrlTransformPlugin);

  // Filters
  eleventyConfig.addPlugin(pluginFilters);

  // Per-page bundles, see https://github.com/11ty/eleventy-plugin-bundle
  // Adds the {% css %} paired shortcode
  eleventyConfig.addBundle("css", {
    transforms: [
      async function (content) {
        let { type, page } = this;
        let result = await postcss([cssnanoPlugin]).process(content, { from: page.inputPath, to: null });
        return result.css;
      }
    ],
    toFileDirectory: "dist"
  });

  // Adds the {% js %} paired shortcode
  eleventyConfig.addBundle("js", {
    transforms: [
      async function (content) {
        let { type, page } = this;
        let result = await minify(content);
        return result.code;
      }
    ],
    toFileDirectory: "dist"
  });

  // Adds the {% svg %} paired shortcode
  eleventyConfig.addBundle("svg", {
    toFileDirectory: "dist",
  });

  // Generate PDF
  eleventyConfig.addTransform("pdf", async (content, outputPath) => {
    // Only run this transform in local development, not on Netlify
    if (!process.env.NETLIFY && outputPath?.endsWith("resume/index.html")) {
      const fontPath = path.resolve('./public/fonts/BricolageGrotesqueVariable.woff2');
      const fontExists = fs.existsSync(fontPath);

      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.setContent(content, {
        waitUntil: ["networkidle0", "domcontentloaded", "load"],
        timeout: 30000
      });

      if (fontExists) {
        const fontData = fs.readFileSync(fontPath);
        const base64Font = fontData.toString('base64');
        await page.addStyleTag({
          content: `
          @font-face {
            font-family: 'Bricolage Grotesque Variable';
            src: url(data:font/woff2;base64,${base64Font}) format('woff2-variations');
            font-style: normal;
            font-stretch: 75% 100%;
            font-weight: 200 800;
            font-display: block;
          }
        `
        });
      }

      // Simplified CSS path - only need the local version now
      for (const cssFile of [
        "variables.css",
        "reset.css",
        "utilities.css",
        "site-main.css",
        "global.css",
        "resume.css"
      ]) {
        const cssPath = `./public/css/${cssFile}`;
        try {
          await page.addStyleTag({ path: cssPath });
        } catch (error) { }
      }

      // Generate the PDF directly in public/docs
      const pdfPath = "./public/docs/resume.pdf";
      fs.mkdirSync(path.dirname(pdfPath), { recursive: true });
      await page.pdf({
        path: pdfPath,
        format: "A4"
      });

      await browser.close();
    }

    return content;
  });

  // Prevent generated PDF triggering rebuild
  eleventyConfig.watchIgnores.add("./public/docs/resume.pdf");

  // Minify HTML
  eleventyConfig.addTransform("htmlmin", (content, outputPath) => {
    if (outputPath?.endsWith(".html")) {
      return htmlmin.minify(content, {
        useShortDoctype: true,
        removeComments: false,
        collapseWhitespace: true,
        minifyCSS: true,
        minifyJS: true
      });
    }
    return content;
  });

  // Image optimization: https://www.11ty.dev/docs/plugins/image/#eleventy-transform
  eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
    // File extensions to process in _site folder
    extensions: "html",
    // Output formats for each image.
    formats: ["webp", "auto"],
    widths: [160, 320, 480, 640, 960, 1280],
    defaultAttributes: {
      loading: "lazy",
      decoding: "async",
      sizes: "100vw",
    },
    urlPath: "/img/cache/",
    outputDir: ".cache/@11ty/img/", // Change to temporary cache location
  });

  // Copy the cached images to the output directory after build
  eleventyConfig.on("eleventy.after", function () {
    if (process.env.ELEVENTY_RUN_MODE === "build") {
      fs.cpSync(".cache/@11ty/img/", path.join(eleventyConfig.directories.output, "img/cache/"), {
        recursive: true
      });
    }
  });

  eleventyConfig.addShortcode("currentBuildDate", () => {
    return (new Date()).toISOString();
  });

};

export const config = {
  // Control which files Eleventy will process
  templateFormats: [
    "md",
    "njk",
    "html",
    "liquid",
    "11ty.js",
    "xml"
  ],

  // Pre-process *.md files with: (default: `liquid`)
  markdownTemplateEngine: "njk",

  // Pre-process *.html files with: (default: `liquid`)
  htmlTemplateEngine: "njk",

  // These are all optional:
  dir: {
    input: "content",          // default: "."
    includes: "../_includes",  // default: "_includes" (`input` relative)
    data: "../_data",          // default: "_data" (`input` relative)
    output: "_site"
  },
};
