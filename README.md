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

1. Copy an existing page, e.g. `projects/robotic-arm.html` → `projects/my-project.html`.
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
