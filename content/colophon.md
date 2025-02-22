---
eleventyNavigation:
  key: Colophon
  order: 6
eleventyComputed:
  title: "{{ eleventyNavigation.key }}"
layout: layouts/prose.njk
permalink: colophon.html
eleventyExcludeFromCollections: posts
---
{% css %}
.prose {
  max-width: 65ch;
}
{% endcss %}

<header class="main-header">
  <h1>{{ eleventyNavigation.key }}</h1>
</header>

This website serves as a [digital garden](https://maggieappleton.com/garden-history/); a space to explore interests, develop ideas and build knowledge outside the scope of my paid work.

As a general set of guiding principles, this website __will__:

- be built using native web technologies and offer an accessible, performant experience.
- only integrate with third-party services that strike a fair balance between doing public good and commercial interests.

It __will not__:

- collect personal information or track user behaviour.
- rely on plugins, frameworks or libraries that compromise any of the other principles.

The website was designed in-browser using fluid type/space scales and tokens generated at [Utopia.fyi](https://utopia.fyi). Type throughout is set in [Bricolage Grotesque](https://ateliertriay.github.io/bricolage), an open-source variable font created by [Mathieu Triay](https://www.mathieutriay.com). The [idea for a theme picker](https://damianwalsh.co.uk/posts/dynamic-colour-palettes-with-oklch-and-css-custom-properties/) was inspired by [Max Böck's website](https://mxb.dev/), while the implementation was informed by Adam Argyle's [related explorations on CodePen](https://codepen.io/argyleink).  Built with [{{ eleventy.generator }}](https://www.11ty.dev/) referencing the [Eleventy Base Blog](https://github.com/11ty/eleventy-base-blog) as a starting point, this site's code lives on [GitHub](https://github.com/damianwalsh/damianwalsh.github.io) and is deployed via [Netlify](https://www.netlify.com). You can read more about why I built it [here](/posts/cultivating-a-digital-garden).
