# tacq.github.io

Personal website — plain HTML/CSS/JS, hosted on GitHub Pages (no build step).

## Structure

```
index.html          Home
projects.html       Project index (filter by category)
projects/*.html     One dedicated page per project
resume.html         Resume (HTML) + PDF download
contact.html        Contact links
assets/resume.pdf   ← replace with your real resume (keep the filename)
assets/img/         Images (replace the placeholder SVGs)
style.css           Sci-fi HUD theme
script.js           Footer year, project filter, print button
```

## Add a new project

1. Copy an existing page, e.g. `projects/ferris-wheel.html` → `projects/my-project.html`.
2. Edit the title, summary, spec sheet, sections and images.
   Put images in `assets/img/my-project/`.
3. Add a card to `projects.html` (and optionally `index.html`).
   Set `data-category` to one or more of: `robotics`, `three-d`, `software`.
4. Update the prev/next links at the bottom of neighbouring project pages.

To add a new category, add a filter button in `projects.html` with a matching `data-filter` value.

## Notes

- A Content-Security-Policy `<meta>` tag allows only same-origin resources and blocks inline
  `style=""`/`<script>`. Use CSS classes instead of inline styles.
- To embed YouTube videos, add `frame-src https://www.youtube-nocookie.com` to the CSP on that page.
- Preview locally: `python3 -m http.server 8000 --bind 127.0.0.1` → http://127.0.0.1:8000

## Interactions (script.js)

Mobile hamburger menu, scroll progress bar, reveal-on-scroll, typing roles in the hero
(`data-roles="a|b|c"`), count-up stats (`data-count`, `data-prefix`, `data-suffix`), card tilt +
cursor spotlight, hero particle canvas, animated project filter, back-to-top button, and on project
pages an auto-generated "On this page" TOC and an image lightbox.

- Every page is fully readable with JS disabled (animations are progressive enhancement).
- All motion is disabled when the OS setting "Reduce motion" is on.
- Any element with class `reveal` fades in on scroll; panels, cards and entries get it automatically.
