---
title: A year in a digital garden
description: Breaking free from walled gardens and rediscovering purpose on the open web
date: 2025-09-12
tags:
  - Digital Gardening
  - Journalling
---
{% css %}
.growth,
.lessons {
  border-radius: var(--border-radius);
  padding: var(--flow-space);
  display: flex;
  flex-direction: column;
  gap: var(--flow-space);
}

.lessons {
  ol {
    margin: 0;
    padding: 0;
    display: grid;
    gap: var(--flow-space);
    grid-template-columns: repeat(auto-fit, minmax(216px, 1fr));
    a {
      position: relative;
      display: grid;
      grid-template-areas:
        "title title"
        "description description"
        "badge action";
      grid-template-rows: auto 1fr auto;
      gap: var(--space-3xs);
      padding: var(--space-2xs) var(--space-2xs) var(--space-2xs) calc(var(--space-2xs) + var(--space-3xs));
      text-decoration: none;
      height: 100%;
      border-radius: var(--border-radius-s);
      background: var(--secondary-7);
      text-wrap: balance;
      overflow: hidden;
      &::before {
          content:"";
          display: block;
          position: absolute;
          width: var(--space-3xs);
          left: 0;
          top: 0;
          height: 100%;
          background: var(--secondary-5);
      }
    }
  }
  .title {
    grid-area: title;
    color: var(--secondary-3);
    font-size: var(--text-size-1);
    font-variation-settings: "wght" 400, "wdth" 75;
  }
  .description {
    grid-area: description;
    margin-block-start: 0;
    color: var(--secondary-1);
    font-size: var(--text-size--1);
    font-variation-settings: "wght" 400, "wdth" 90;
  }
  .badge {
    grid-area: badge;
    background: var(--secondary-3);
    color: var(--secondary-7);
  }
  .action {
    grid-area: action;
    justify-self: end;
  }
  .nav-pills {
    width: max-content;
    gap: calc(var(--space-2xs) - 4px);
    > li {
      padding: 4px;
    }
  }
  .skills__wrapper {
    position: relative;
    margin-inline-end: calc(var(--flow-space) * -2);
    &::after {
      content: "";
      pointer-events: none;
      position: absolute;
      top: 0;
      right: 0;
      height: 100%;
      width: var(--space-2xs, 1rem);
      background: linear-gradient(to left, var(--surface-fore), transparent);
      z-index: 1;
      opacity: 1;
    }

    &.at-end::after {
      opacity: 0;
      pointer-events: none;
      transition: opacity .15s;
    }
  }
  .skills {
    margin-block-start: 0;
    display: flex;
    gap: var(--space-2xs);
    overflow-x: auto;
    overscroll-behavior: contain;
    @supports (scrollbar-color:auto) {
      scrollbar-color:var(--surface-mid) transparent;
      scrollbar-width: thin;
    }

    @supports selector(::-webkit-scrollbar) {
      &::-webkit-scrollbar {
        background: transparent;
        width: 6px;
        height: 6px;
      }

      &::-webkit-scrollbar-thumb {
        background: var(--surface-mid);
        border-radius: 3px;
      }
    }
  }
  dt {
    align-self: center;
    white-space: nowrap;
    [data-theme="light"] & {
      color: var(--secondary-5);
    }

    [data-theme="dark"] & {
      color: var(--secondary-3);
    }
  }
  dd {
    margin-block-end: 0 !important;
    &:last-of-type {
      padding-inline-end: var(--space-2xs);
    }
  }
}

.stats__table {
  display: flex;
  flex-direction: column-reverse;

  tr {
    display: flex;
    gap: var(--flow-space);
  }
}

.stats__header {
  font-size: var(--text-size--1);
  font-variation-settings: "wght" 700;
  letter-spacing: .025em;
  text-transform: uppercase;
  line-height: 1.1;
  [data-theme="light"] & {
    color: var(--tertiary-5);
  }

  [data-theme="dark"] & {
    color: var(--tertiary-3);
  }
}

.stats__data {
  font-variation-settings: "wght" 600, "wdth" 80;
  font-size: clamp(1.9438rem, 1.0223rem + 4.0955vw, 4.1963rem);
  line-height: 1;
  color: var(--quaternary-5);
}

.stats__header,
.stats__data {
  flex: 1 1 0;
  min-width: 0;
  border: none;
  position: relative;
  padding: 0 0 0 var(--space-2xs-xs) !important;
  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background-color: var(--quaternary-5);
  }
}

.messages {
  display: flex;
  flex-direction: column;
  position: relative;
  gap: var(--flow-space);
  height: 200px;
  overflow: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  @supports (scrollbar-color:auto) {
    scrollbar-color:var(--surface-mid) transparent;
    scrollbar-width: thin;
  }

  @supports selector(::-webkit-scrollbar) {
    &::-webkit-scrollbar {
      background: transparent;
      height: 6px
    }

    &::-webkit-scrollbar-thumb {
      background: var(--surface-mid);
      border-radius: 3px
    }
  }
}

.messages__card {
  position: sticky;
  top: 0;
  min-height: 100%;
  font-size: clamp(1.35rem, 1.0991rem + 1.2312vw, 2.1488rem);
  font-variation-settings: "wght" 400, "wdth" 75;
  background: linear-gradient(var(--surface-fore), var(--surface-fore)) padding-box, linear-gradient(90deg, var(--primary-5), var(--secondary-5),
var(--tertiary-5), var(--quaternary-5), var(--primary-5)) border-box;
  background-size: 300% 100%;
  border-radius: var(--border-radius);
  border: var(--space-3xs) solid transparent;
  padding: var(--flow-space);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  text-wrap: balance;
  transform-origin: center top;
  will-change: transform;
  &:last-of-type {
    animation: gradient-shift 2s linear infinite alternate;
  }
  &:not(:first-of-type) {
    top: 20px;
  }
  p {
    margin-block-start: 0;
  }
  [data-theme="light"] & {
    color: var(--tertiary-5);
  }

  [data-theme="dark"] & {
    color: var(--tertiary-3);
  }
}

@keyframes gradient-shift {
  0% {
    background-position: 0% 0%;
  }
  100% {
    background-position: 100% 0%;
  }
}
{% endcss %}
{% js %}
document.addEventListener("DOMContentLoaded", () => {
  gsap.registerPlugin(ScrollTrigger);
  const numberCells = document.querySelectorAll(".stats__data");

  numberCells.forEach(cell => {
    const content = cell.textContent;
    cell.innerHTML = `<div class="stats__counter">${content}</div>`;
  });

  const counters = document.querySelectorAll(".stats__counter");

  const counterTl = gsap.timeline({
    scrollTrigger: {
      trigger: ".stats__table",
      start: "top 90%",
      once: true
    }
  });

  counters.forEach((counter, index) => {
    const finalValue = parseInt(counter.textContent);

    gsap.set(counter, {
      opacity: 0,
      y: 20
    });

    counterTl
      .to(counter, {
        opacity: 1,
        y: 0,
        duration: 0.25,
      }, index * 0.15)
      .fromTo(counter,
        { innerText: 0 },
        {
          innerText: finalValue,
          duration: 1.75,
          snap: { innerText: 1 }
        },
        "<"
      );
  });

  const messages = document.querySelector(".messages");
  const cards = gsap.utils.toArray(".messages__card");

  function createScaleAnimation(card, scaleValue, index) {
    gsap.to(card, {
      scrollTrigger: {
        trigger: card,
        scroller: messages,
        start: "top center",
        end: "top top",
        scrub: true,
        invalidateOnRefresh: true
      },
      scale: scaleValue
    });

    if (index > 0) {
      const textElement = card.querySelector("p");
      if (textElement) {
        gsap.set(textElement, {
          opacity: 0
        });

        gsap.to(textElement, {
          scrollTrigger: {
            trigger: card,
            scroller: messages,
            start: "top bottom",
            end: "top top",
            scrub: true,
            invalidateOnRefresh: true
          },
          opacity: 1
        });
      }
    }
  }

  function setContainerHeight() {
    let maxHeight = 0;
    cards.forEach((card) => {
      const cardHeight = card.getBoundingClientRect().height;
      maxHeight = Math.max(maxHeight, cardHeight);
    });
    messages.style.height = `${maxHeight}px`;
  }

  cards.forEach((card, index) => {
    const scaleValue = index === 0 ? 0.9 : 0.95;
    createScaleAnimation(card, scaleValue, index);
  });

  setContainerHeight();

  window.addEventListener("resize", setContainerHeight);

  const skillsList = document.querySelector("dl.skills");
  const wrapper = document.querySelector(".skills__wrapper");

  ScrollTrigger.create({
    scroller: skillsList,
    horizontal: true,
    start: 0,
    end: () => skillsList.scrollWidth - skillsList.clientWidth,
    onUpdate: self => {
      const atEnd = self.progress >= 0.999;
      wrapper.classList.toggle("at-end", atEnd);
    }
  });
});
{% endjs %}
At the end of 2024, a period of reflection on my professional life and relationship with technology—from both sides of the glass: as a user and sometime worker in the industry—led me to start this <a href="https://damianwalsh.co.uk/posts/cultivating-a-digital-garden/">digital garden project</a> as a way to reconnect with work I find meaningful and engaging, helping me reset my professional identity based on my own interests. As summer gives way to autumn, a natural time for planning ahead in any garden, I want to reflect on what I've accomplished in my garden so far.

## Things I have learnt
My original motivation was simple, but the project has led me in some unexpected directions—as creative endeavours inevitably will. Pursuing ideas all the way through to completion, then documenting and sharing my discoveries, created a ladder I could use to climb out of despondency and taught me new things about technology and, to some extent, myself that I hadn't anticipated in the process.

<div class="lessons surface">
  <h3 class="meta">Articles published</h3>
  <ol role="list">
    <li>
      <a href="https://damianwalsh.co.uk/posts/cultivating-a-digital-garden/">
        <h4 class="title">Cultivating a digital garden</h4>
        <p class="description">Design, burnout, and the journey back</p>
        <svg width="36" height="36" viewBox="-6 -6 36 36" class="action action--small icon-stroke" aria-hidden="true"><use xlink:href="#icon-chevron-right"></use></svg>
      </a>
    </li>
    <li>
      <a href="https://damianwalsh.co.uk/posts/dynamic-colour-palettes-with-oklch-and-css-custom-properties/">
        <h4 class="title">Dynamic colour palettes with OKLCH and CSS custom properties</h4>
        <p class="description">Using colour theory and modern CSS to generate colour systems</p>
        <svg width="36" height="36" viewBox="-6 -6 36 36" class="action action--small icon-stroke" aria-hidden="true"><use xlink:href="#icon-chevron-right"></use></svg>
      </a>
    </li>
    <li>
      <a href="https://damianwalsh.co.uk/posts/creating-connections-with-music-and-technology/">
        <h4 class="title">Creating connections with music and technology</h4>
        <p class="description">Building a personal digital music library with Eleventy and APIs</p>
        <div class="badge"><svg width="14" height="14" viewBox="0 0 24 24" class="icon-stroke" aria-hidden="true"><use xlink:href="#icon-heart"></use></svg> Favourite</div>
        <svg width="36" height="36" viewBox="-6 -6 36 36" class="action action--small icon-stroke" aria-hidden="true"><use xlink:href="#icon-chevron-right"></use></svg>
      </a>
    </li>
    <li>
      <a href="https://damianwalsh.co.uk/posts/building-a-digital-bookshelf-with-eleventy/">
        <h4 class="title">Building a digital bookshelf with Eleventy</h4>
        <p class="description">Managing a personal reading list with Eleventy and the OpenLibrary API</p>
        <svg width="36" height="36" viewBox="-6 -6 36 36" class="action action--small icon-stroke" aria-hidden="true"><use xlink:href="#icon-chevron-right"></use></svg>
      </a>
    </li>
    <li>
      <a href="https://damianwalsh.co.uk/posts/scheduled-deployments-for-eleventy-websites/">
        <h4 class="title">Scheduled deployments for Eleventy websites</h4>
        <p class="description">Automating builds with Netlify Build hooks and GitHub Actions</p>
        <svg width="36" height="36" viewBox="-6 -6 36 36" class="action action--small icon-stroke" aria-hidden="true"><use xlink:href="#icon-chevron-right"></use></svg>
      </a>
    </li>
  </ol>
  <hr>
  <h3 class="meta">Skills acquired</h3>
  <div class="skills__wrapper">
    <dl class="skills">
      <dt class="meta">APIs</dt>
      <dd>
        <ul class="nav-pills" role="list">
          <li><a href="https://cloudinary.com/documentation/cloudinary_image">Cloudinary Image API</a></li>
          <li><a href="https://www.discogs.com/developers">Discogs API</a></li>
          <li><a href="https://github.com/features/actions">GitHub Actions</a></li>
          <li><a href="https://docs.mapbox.com/">Mapbox API</a></li>
          <li><a href="https://docs.netlify.com/build/configure-builds/build-hooks/">Netlify Build hooks</a></li>
          <li><a href="https://openlibrary.org/developers/api">OpenLibrary API</a></li>
        </ul>
      </dd>
      <dt class="meta">CSS</dt>
      <dd>
        <ul class="nav-pills" role="list">
          <li><a href="https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_anchor_positioning">Anchor positioning</a></li>
          <li><a href="https://developer.mozilla.org/en-US/docs/Web/CSS/clamp">Clamp()</a></li>
          <li><a href="https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries">Container
              queries</a></li>
          <li><a href="https://developer.mozilla.org/en-US/docs/Web/CSS/--*">Custom properties</a></li>
          <li><a href="https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout">Grid layout</a></li>
          <li><a href="https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch">Oklch()</a></li>
        </ul>
      </dd>
      <dt class="meta">JavaScript</dt>
      <dd>
        <ul class="nav-pills" role="list">
          <li><a href="https://www.npmjs.com/package/commander">Commander</a></li>
          <li><a href="https://www.11ty.dev/">Eleventy</a></li>
          <li><a href="https://gsap.com/">GSAP</a></li>
          <li><a href="https://www.npmjs.com/package/inquirer">Inquirer</a></li>
          <li><a href="https://imagemagick.org/">ImageMagick</a></li>
          <li><a href="https://mozilla.github.io/nunjucks/">Nunjucks</a></li>
          <li><a href="https://pptr.dev/">Puppeteer</a></li>
        </ul>
      </dd>
      <dt class="meta">Performance</dt>
      <dd>
        <ul class="nav-pills" role="list">
          <li><a href="https://developer.chrome.com/docs/lighthouse/overview">Lighthouse</a></li>
        </ul>
      </dd>
      <dt class="meta">Web standards</dt>
      <dd>
        <ul class="nav-pills" role="list">
          <li><a href="https://www.w3.org/TR/WCAG22/">WCAG 2.2</a></li>
          <li><a href="https://indieweb.org/Webmention">Webmention</a></li>
        </ul>
      </dd>
    </dl>
  </div>
</div>

## Growth and impact
At the outset, I set myself a number of [guiding principles](https://damianwalsh.co.uk/colophon/). As a result, I don't track the conventional statistics used to measure growth—visits, clicks, impressions, and so on. Even if I had these metrics to hand, they still would not serve as my yardstick.

Instead, I prefer to gauge progress through meaningful indicators of personal development. Similarly, in terms of impact, this cannot be measured in revenue. I would rather focus on the kindness and supportive feedback from people around the world since I began this project. If anyone who shared any of these messages is reading this, I want to thank you and tell you they have greater value to me. It meant a lot.

<div class="growth surface">
  <h3 class="meta">Personal growth metrics</h3>
  <table class="stats__table">
    <thead>
      <tr>
        <th scope="col" class="stats__header">Words written</th>
        <th scope="col" class="stats__header">Pages built</th>
        <th scope="col" class="stats__header">GitHub commits</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="stats__data">11049</td>
        <td class="stats__data">1420</td>
        <td class="stats__data">250</td>
      </tr>
    </tbody>
  </table>
  <hr>
  <h3 class="meta">Encouragement and recognition</h3>
  <div class="messages">
    <blockquote class="messages__card">
      <p>Your music page is so cool! Everyone should see it. It's so wonderfully organised. I learned a lot from you and want to thank you so much for writing about it all.</p>
    </blockquote>
    <blockquote class="messages__card">
      <p>Special thanks to Damian Walsh, whose post about building a personal music library, inspired me to create my own page for my music collection.</p>
    </blockquote>
    <blockquote class="messages__card">
      <p>Your management methods have given me some ideas, especially around using APIs to fetch external data.</p>
    </blockquote>
    <blockquote class="messages__card">
      <p>Nice! If you're interested in doing a talk for the 11ty meetup on it, let me know!</p>
    </blockquote>
    <blockquote class="messages__card">
      <p>This is excellent. Thanks again for sharing this! Super cool.</p>
    </blockquote>
    <blockquote class="messages__card">
      <p>I'm late to the party but this looks awesome!</p>
    </blockquote>
    <blockquote class="messages__card">
      <p>Cool write up, I enjoyed the music one too!</p>
    </blockquote>
    <blockquote class="messages__card">
      <p>Awesome! You've taken this to a new level.</p>
    </blockquote>
    <blockquote class="messages__card">
      <p>Excellent write-up!</p>
    </blockquote>
    <blockquote class="messages__card">
      <p>Amazing work Damian!</p>
    </blockquote>
  </div>
</div>

## Reflections
Some argue the open web is slowly being suffocated by the creep of walled gardens driven by engagement algorithms and rising tide of AI. I disagree. My experience with this project tells a different story—one of creative possibilities, personal growth and human connection that stands as an alternative, hopeful vision. And I share these reflections not just to strengthen my own determination, but hopefully to inspire others considering similar journeys.</p>

Instead of scrolling meaningless content, as if endlessly descending a ladder to nowhere or having your thoughts, feelings, hopes, and dreams confined within a grey plastic box, self-publishing on the open web is a doorway to a playground where you choose your own adventure. You could be:

- A writer using words to clarify thoughts and shape your worldview
- An artist painting on the web like a canvas with HTML, CSS, and JS
- A librarian curating knowledge based on your own unique perspective
- A detective solving code puzzles and technical mysteries
- An astronaut at the controls of your own rocket ship

Above all, you can be authentic and real—you can simply be yourself. By doing this, you add to the web’s tapestry, using the warp and weft to weave enigmatic personal details waiting to be discovered, or creating a reminder for yourself of who you once were or are yet to be. That's something worth fighting for, isn't it?

<script src="/js/gsap.min.js"></script>
<script src="/js/ScrollTrigger.min.js"></script>
