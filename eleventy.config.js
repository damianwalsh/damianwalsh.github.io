import { InputPathToUrlTransformPlugin, HtmlBasePlugin } from "@11ty/eleventy";
import pluginNavigation from "@11ty/eleventy-navigation";
import { eleventyImageTransformPlugin } from "@11ty/eleventy-img";
import pluginSyntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import he from 'he';
import postcss from "postcss";
import cssnanoPlugin from "cssnano";
import { minify } from "terser";
import htmlmin from 'html-minifier';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import pluginFilters from "./_config/filters.js";
import { generateStaticMap } from './_data/maps.js';
import { createRequire } from 'module';
import { createHash } from 'node:crypto';
const require = createRequire(import.meta.url);

export default async function (eleventyConfig) {

  // Copy the contents of the `public` folder to the output folder
  eleventyConfig.addPassthroughCopy({
    "./public/": "/"
  });

  // Watch content images for the image pipeline.
  eleventyConfig.addWatchTarget("content/**/*.{svg,webp,png,jpeg}");

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

  // Music collection
  eleventyConfig.addCollection("releases", function (collectionApi) {
    const musicData = collectionApi.getAll()[0]?.data?.music;
    if (!musicData || !musicData.releases) {
      console.warn("Music data not found or invalid");
      return [];
    }
    return musicData.releases;
  });

  eleventyConfig.addCollection("artists", function (collectionApi) {
    const musicData = collectionApi.getAll()[0]?.data?.music;
    if (!musicData || !musicData.releases) {
      console.warn("Music data not found or invalid for artists collection");
      return [];
    }
    const releases = musicData.releases;
    const artists = [...new Set(releases.map(release => release.artist))];
    const result = artists.map(artist => ({
      artist,
      releases: releases.filter(r => r.artist === artist)
    }));
    return result;
  });

  eleventyConfig.addCollection("genres", function (collectionApi) {
    const musicData = collectionApi.getAll()[0]?.data?.music;
    if (!musicData || !musicData.releases) {
      console.warn("Music data not found or invalid for genres collection");
      return [];
    }
    const releases = musicData.releases;
    const genres = [...new Set(releases.flatMap(release => release.genres || []))];
    return genres.map(genre => ({
      genre,
      releases: releases.filter(r => r.genres && r.genres.includes(genre))
    }));
  });

  eleventyConfig.addCollection("formats", function (collectionApi) {
    const musicData = collectionApi.getAll()[0]?.data?.music;
    if (!musicData || !musicData.releases) {
      console.warn("Music data not found or invalid for formats collection");
      return [];
    }
    const releases = musicData.releases;
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
    const musicData = collectionApi.getAll()[0]?.data?.music;
    if (!musicData || !musicData.releases) {
      console.warn("Music data not found or invalid");
      return [];
    }

    return musicData.releases.map(release => ({
      ...release,
      relatedReleases: musicData.releases.filter(r =>
        r.artist === release.artist &&
        r.title !== release.title
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
    const musicData = collectionApi.getAll()[0]?.data?.music;
    if (!musicData || !musicData.releases) {
      console.warn("Music data not found or invalid");
      return [];
    }

    const years = [...new Set(musicData.releases
      .map(release => {
        // Prefer first_released if available, otherwise use released
        const date = parseDate(release.first_released) || parseDate(release.released);
        return date ? date.getFullYear() : null;
      })
      .filter(year => year !== null)
    )].sort((a, b) => a - b);

    return years.map(year => ({
      year,
      releases: musicData.releases.filter(r => {
        // Prefer first_released if available, otherwise use released
        const date = parseDate(r.first_released) || parseDate(r.released);
        return date && date.getFullYear() === year;
      })
    }));
  });

  // Reading list
  eleventyConfig.addCollection("books", function (collectionApi) {
    return collectionApi.getAll()[0].data.reading.current;
  });

  eleventyConfig.addCollection("authors", function (collectionApi) {
    const books = collectionApi.getAll()[0].data.reading.current;
    const authors = [...new Set(books.map(book => book.author))];
    return authors.map(author => ({ author, books: books.filter(b => b.author === author) }));
  });

  eleventyConfig.addCollection("years", function (collectionApi) {
    const books = collectionApi.getAll()[0].data.reading.current;
    const parseDate = (dateStr) => {
      const [year, month, day] = dateStr.split('-');
      return new Date(year, month - 1, day);
    };
    const years = [...new Set(books.map(book => parseDate(book.date_read).getFullYear()))];
    return years.map(year => ({
      year,
      books: books.filter(b => parseDate(b.date_read).getFullYear() === year)
    }));
  });

  eleventyConfig.addCollection("booksByMonth", function(collectionApi) {
    const books = collectionApi.getAll()[0].data.reading.current;

    return {
      getMonthlyBooks: function(date) {
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

  // People data
  const peopleData = require('./_data/people.json');
  eleventyConfig.addGlobalData("people", () => peopleData);

  // Places data
  const placesData = require('./_data/places.json');
  eleventyConfig.addGlobalData("places", () => placesData);

  // Memory map
  eleventyConfig.addShortcode("memoryMap", async function(places) {
    const mapboxToken = process.env.MAPBOX_TOKEN;
    if (!mapboxToken) {
      console.warn("No Mapbox token found");
      return "";
    }

    const mapData = await generateStaticMap(places, mapboxToken);
    if (!mapData) {
      return "";
    }

    // Return map HTML with base64 encoded image
    const base64Image = mapData.imageBuffer.toString('base64');
    return `<img src="data:image/png;base64,${base64Image}"
           alt="Map showing memory locations"
           width="660" height="330" class="places__map">`;
  });

  // Social images - auth
  // eleventyConfig.addShortcode("socialImage", function(pageData) {
  //   if (!pageData) return '';

  //   const title = pageData.title || pageData.metadata?.title || '';
  //   const description = pageData.description || pageData.metadata?.description || '';
  //   const url = (pageData.metadata?.url || '').replace('https://', '');

  //   const safeTitle = encodeURIComponent(encodeURIComponent(title));
  //   const safeDescription = encodeURIComponent(encodeURIComponent(description));
  //   const safeUrl = encodeURIComponent(encodeURIComponent(url.toUpperCase()));

  //   // Create transformation string
  //   const transformation = `w_1200,h_630,c_fill/l_text:BricolageGrotesqueExtraBold.ttf_72_line_spacing_1:${safeTitle},co_rgb:ffffff,g_south_west,x_72,y_327,c_fit,w_960/l_text:BricolageGrotesqueLight.ttf_36_line_spacing_1.5:${safeDescription},co_rgb:afafaf,g_north_west,x_72,y_327,c_fit,w_720/l_text:BricolageGrotesqueBold.ttf_32_letter_spacing_0.4:${safeUrl},co_rgb:afafaf,g_south_west,x_72,y_96/og-background.jpg`;

  //   // Generate URL-safe base64 signature and take first 8 characters
  //   const toSign = transformation + process.env.CLOUDINARY_API_SECRET;
  //   const hash = createHash('sha1')
  //     .update(toSign)
  //     .digest('base64')
  //     .replace(/\+/g, '-')
  //     .replace(/\//g, '_');
  //   const signature = hash.substring(0, 8);

  //   return `https://res.cloudinary.com/damianwalsh/image/upload/s--${signature}--/${transformation}`;
  // });

  // Social images - no auth
  eleventyConfig.addShortcode("socialImage", function(pageData) {
    if (!pageData) return '';

    const title = pageData.title || pageData.metadata?.title || '';
    const description = pageData.description || pageData.metadata?.description || '';
    const url = (pageData.metadata?.url || '').replace('https://', '');

    const safeTitle = encodeURIComponent(encodeURIComponent(title));
    const safeDescription = encodeURIComponent(encodeURIComponent(description));
    const safeUrl = encodeURIComponent(encodeURIComponent(url.toUpperCase()));

    return `https://res.cloudinary.com/damianwalsh/image/upload/w_1200,h_630,c_fill/l_text:open%20sans_72_bold_line_spacing_-5:${safeTitle},co_rgb:ffffff,g_south_west,x_72,y_327,c_fit,w_960/l_text:open%20sans_36_regular_line_spacing_1.5:${safeDescription},co_rgb:afafaf,g_north_west,x_72,y_327,c_fit,w_720/l_text:open%20sans_32_bold:${safeUrl},co_rgb:afafaf,g_south_west,x_72,y_96/og-background.jpg`;
  });

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

  // Handle HTML entities in page titles
  eleventyConfig.addTransform('decodeHtmlEntities', (content, outputPath) => {
    if (outputPath && outputPath.endsWith('.html')) {
      return content.replace(/<title>(.*?)<\/title>/g, (match, p1) => {
        return `<title>${he.decode(p1)}</title>`;
      });
    }
    return content;
  });

  // Generate PDF
  eleventyConfig.addTransform("pdf", async (content, outputPath) => {
    if(outputPath?.endsWith("resume.html")) {
      const fontPath = path.resolve('./public/fonts/BricolageGrotesque.ttfVariable.woff2');
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

      for (const cssFile of [
        "variables.css",
        "reset.css",
        "utilities.css",
        "site-main.css",
        "global.css",
        "resume.css"
      ]) {
        await page.addStyleTag({
          path: `./public/css/${cssFile}`
        });
      }

      await page.pdf({
        path: outputPath.replace(".html", ".pdf"),
        format: "A4"
      });

      await browser.close();
    }
    return content;
  });

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
    formats: ["avif", "webp", "auto"],

    widths: [160, 320, 480, 640, 960, 1280],

    defaultAttributes: {
      // e.g. <img loading decoding> assigned on the HTML tag will override these values.
      loading: "lazy",
      decoding: "async",
      sizes: "100vw",
    },
    urlPath: "/img/cache/",
    outputDir: "./_site/img/cache/",
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
