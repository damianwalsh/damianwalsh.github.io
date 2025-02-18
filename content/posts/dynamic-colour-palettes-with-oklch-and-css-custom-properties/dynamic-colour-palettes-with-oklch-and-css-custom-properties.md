---
title: Dynamic colour palettes with OKLCH and CSS custom properties
description: Using colour theory and modern CSS to generate colour systems
date: 2025-02-17
tags:
  - CSS
  - Colour theory
  - Design systems
---
{% css %}
.screenshots {
  display: flex;
  flex-direction: column;
  gap: var(--flow-space);
  padding-inline: calc((100% - 75%) / 2);
  @media screen and (width >= 769px) {
    flex-direction: row;
    padding-inline: 0;
  }
}

.scheme-definitions {
  container-type: inline-size;
  margin-block-start: 0 !important;
  @container (min-width: 50ch) {
   dl {
      display: grid;
      grid-template-columns: auto 1fr;
      column-gap: var(--gutter);
    }
  }
}

{% endcss %}
Designers often seem to face extremes when selecting and using colours. At one end of the spectrum, brand guidelines limit you to a few colours chosen for specific applications, with additional colours added later—sometimes purely for aesthetics or where the reasons are unclear. Some of the colours might have tints and shades while others don't, and where variations exist, there could be inconsistent saturation and lightness levels across the palette. This makes it challenging to create colour-dependent components like buttons and form elements and their various states. At the other end lies complete creative freedom, which sounds ideal until you're paralysed by the range of possibilities. Consider standard colour picker interfaces: they offer a world of colour to explore but provide no map for navigation.

When I set out to design the latest version of this website, I knew selecting colours would be a challenge and that I could easily spend a lot of time fussing over choices. Rather than using Figma (or similar tools) for upfront design or relying on CSS frameworks with predefined colours, I wanted to take a different path. I'm quite fond of Figma and recognise the usefulness of CSS frameworks in certain situations, but these approaches don't align with my [aims for this project](https://damianwalsh.co.uk/posts/cultivating-a-digital-garden/)—which involve moving away from production-line thinking and towards embracing the web's native languages as creative mediums and learning through experimentation. I also had a vague notion, inspired by Max Böck's theme picker, of offering users control of display colour within some sensible parameters—e.g., foreground and background combinations that meet [WCAG 2.0 AA minimum contrast ratio requirements](https://www.w3.org/TR/UNDERSTANDING-WCAG20/visual-audio-contrast-contrast.html).

<figure>
  <div class="screenshots">
    <img src="./mxb.dev-classic.png" alt="Screenshot of Max Bock's homepage highlighting Classic theme" sizes="(min-width: 1700px) 443px, (min-width: 1380px) calc(43vw - 279px), (min-width: 780px) calc(41.03vw - 117px), 70.87vw">
    <img src="./mxb.dev-bowsers-castle.png" alt="Screenshot of Max Bock's homepage highlighting Bowser's Castle theme" sizes="(min-width: 1700px) 443px, (min-width: 1380px) calc(43vw - 279px), (min-width: 780px) calc(41.03vw - 117px), 70.87vw">
  </div>
  <figcaption class="meta">Theme picker on <a href="https://mxb.dev/">Max Böck's website</a></figcaption>
</figure>

While I was thinking about my colour dilemma, I was reading Brian Eno's 1995 diary [A Year with Swollen Appendices](https://damianwalsh.co.uk/reading-list/works/a-year-with-swollen-appendices-brian-eno.html), where he quotes cybernetician Stafford Beer while discussing his approach to producing generative music.

<figure>
  <blockquote>
  <p>"Instead of trying to specify it in full detail, specify it only somewhat. You can then ride on the dynamics of the system in the direction you want to go."</p>
  </blockquote>
  <figcaption class="meta">Stafford Beer</figcaption>
</figure>

This freewheeling line of thought was appealing—who wouldn't want to set a few parameters and let the system flow? It influenced my approach to every aspect of presentation—layout, typography, sizing, spacing, and colour. For now though, I want to focus on colour and how systems thinking can be applied to generating colours using modern CSS features.

## Colour theory
The foundations of [colour theory](https://en.wikipedia.org/wiki/Color_theory) establish a framework for creating colours that complement each other in [harmony](https://en.wikipedia.org/wiki/Color_scheme), serving as reliable parameters for systematically generating colours.

<div class="scheme-definitions">
<dl>
  <dt>Complementary</dt>
  <dd>A complementary colour scheme consists of two colours positioned opposite each other on the <a href="https://en.wikipedia.org/wiki/Color_wheel">colour wheel</a>. A <em>split-complementary</em> scheme uses three colours: a base colour plus two colours that sit 150 and 210 degrees away from it.</dd>

  <dt>Analogous</dt>
  <dd>Analogous colour schemes use colours that are adjacent to each other on the colour wheel—typically a dominant primary or secondary colour with two complementary tertiary colours, positioned 30 degrees and 330 degrees from the base colour.</dd>

  <dt>Triadic</dt>
  <dd>The triadic colour scheme combines three colours: a base colour and two additional colours positioned 120 degrees and 240 degrees away from it on the colour wheel.</dd>

  <dt>Tetradic</dt>
  <dd>Tetradic schemes use four colours in two complementary pairs, with rectangle schemes using colours at 60, 180, and 240 degrees from the base colour, while square schemes space colours 90 degreed apart.</dd>

  <dt>Hexadic</dt>
  <dd>The hexadic colour scheme is a six-colour combination consisting of a base colour and five colours positioned at 60, 120, 180, 240, and 300 degrees from it on the colour wheel.</dd>
</dl>
</div>

## OKLCH colour notation
I really like OKLCH notation for thinking about and declaring colours. For me, at least, it's far more intuitive than previous formats, and there are additional benefits outlined in [OKLCH in CSS: why we moved from RGB and HSL](https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl) by Andrey Sitnik at Evil Martians, which is an excellent primer on the topic.

<figure>
  <div class="screenshots">
    <img src="./oklch-axes.png" alt="Diagram showing the axes of OKLCH colour space" sizes="(min-width: 1700px) 907px, (min-width: 1380px) calc(85.67vw - 532px), (min-width: 780px) calc(82.59vw - 220px), 70.87vw">
  </div>
  <figcaption class="meta">OKLCH axes</figcaption>
</figure>

In oklch(L C H) or oklch(L C H / a), each item corresponds as follows:

- __L__ is perceived __lightness__ (0-100%). “Perceived” means that it has consistent lightness for our eyes. It ranges from __0__ (black) to __1__ (white).
- __C__ is __chroma__, the saturation of colour. It goes from __0__ (gray) to the most saturated colour. For both P3 and sRGB the value will be always below __0.37__.
- __H__ is the __hue__ angle (0-360).
- __a__ is __opacity__ (0-1 or 0-100%).

## CSS custom properties
Custom properties (CSS variables) let you define reusable values. You can set them using either `@property` or the more common `--property-name: value;`  syntax, and access them using `var()`. A key feature of custom properties defined with two dashes (`--`) is that they cascade and inherit values from parent elements. For a detailed explanation, see the [MDN documentation on CSS custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascading_variables/Using_CSS_custom_properties).

## Putting theory into practice
Having established the foundations of using colour theory as basic parameters, then letting the system's dynamics flow, all that remains is to create a practical implementation using modern CSS that:

- Produces four complementary colours (a tetradic scheme) offering room for interesting variations and combinations.
- Generates [colour ramps](https://uxdesign.cc/how-to-create-a-color-ramp-used-in-design-systems-2edd5b93854c) for each hue, along with grayscale using corresponding lightness values.
- Allows users to adjust the base hue while other colours automatically change according to their angular relationships, leveraging the cascade and inheritance of custom properties.

<p class="codepen" data-height="400" data-default-tab="result" data-slug-hash="pvojXYq" data-pen-title="Dynamic colour palettes with OKLCH and CSS custom properties" data-user="damianwalsh" data-token="d56b2d955641ada1f87a0de51c12e687" style="height: 300px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/damianwalsh/pen/pvojXYq/d56b2d955641ada1f87a0de51c12e687">
  Dynamic colour palettes with OKLCH and CSS custom properties</a> by Damian Walsh (<a href="https://codepen.io/damianwalsh">@damianwalsh</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://public.codepenassets.com/embed/index.js"></script>

While vanilla CSS could achieve the same results, I built this system with SASS, which offers several advantages:

- SASS loops, variables, and lists reduce repetition and enable dynamic value generation, making the code easier to update and maintain.
- Since most calculations happen during compilation, browsers have less work to do at runtime.

During research, I found inspiration in Adam Argyle's [related explorations on CodePen](https://codepen.io/argyleink), which helped inform my approach.
