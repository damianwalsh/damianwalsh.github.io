export default {
  title: "Damian Walsh",
  url: "https://damianwalsh.co.uk",
  language: "en",
  description: "Designer (Interaction/UX/UI) based in Manchester, UK",
  author: {
    name: "Damian Walsh",
    email: "damianwalsh@me.com",
    url: "https://damianwalsh.co.uk",
    fedi: "@damianwalsh@mastodon.social"
  },
  schemaorg: {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://damianwalsh.co.uk#website",
        "name": "Damian Walsh",
        "description": "Designer (Interaction/UX/UI) based in Manchester, UK",
        "url": "https://damianwalsh.co.uk",
        "publisher": {
          "@type": "Person",
          "@id": "https://damianwalsh.co.uk/#person"
        }
      },
      {
        "@type": "Person",
        "@id": "https://damianwalsh.co.uk/#person",
        "name": "Damian Walsh",
        "url": "https://damianwalsh.co.uk",
        "givenName": "Damian",
        "familyName": "Walsh",
        "jobTitle": "Designer",
        "sameAs": [
          "https://github.com/damianwalsh",
          "https://www.linkedin.com/in/damianw/",
          "https://mastodon.social/@damianwalsh"
        ]
      }
    ]
  }
}
