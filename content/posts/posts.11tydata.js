export default {
  tags: [
    "posts"
  ],
  "layout": "layouts/post.njk",
  eleventyComputed: {
    // Override the entire metadata.schemaorg object for posts
    "metadata": {
      schemaorg: (data) => {
        // Make sure we have the original schema data
        if (!data.metadata || !data.metadata.schemaorg) {
          console.warn("Missing metadata.schemaorg in data cascade");
          return {}; // Return empty object to prevent errors
        }

        // Get a copy of the original schema
        const baseSchema = JSON.parse(JSON.stringify(data.metadata.schemaorg));

        // Make sure @graph exists
        if (!baseSchema["@graph"]) {
          baseSchema["@graph"] = [];
        }

        // Create article schema
        const articleSchema = {
          "@type": "Article",
          "@id": `${data.metadata.url}${data.page.url}#article`,
          "name": data.title,
          "headline": data.title,
          "abstract": data.description || "",
          "url": `${data.metadata.url}${data.page.url}`,
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": `${data.metadata.url}${data.page.url}#webpage`
          },
          "author": {
            "@type": "Person",
            "@id": `${data.metadata.url}/#person`
          },
          "datePublished": data.date,
          "dateModified": data.updated || data.date
        };

        // Add the article schema to the graph array
        baseSchema["@graph"].push(articleSchema);

        return baseSchema;
      }
    }
  }
};
