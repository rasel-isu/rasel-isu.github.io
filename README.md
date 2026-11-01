# rasel-isu.github.io

Personal research portfolio of **Md Rasel Khondokar**: Ph.D. student in Computer Science at Iowa State University (NLP, LLMs, RAG, knowledge graphs, scientific entity linking).

Plain HTML/CSS/JS with no build step and no dependencies, so GitHub Pages serves it as-is.

## Structure

```
index.html                 Home: bio, news, research, publications, experience, projects, background, contact
research/sci-zsel.html     Project page for the EMNLP 2026 paper (abstract, method, benchmark, results chart, talk, BibTeX)
404.html                   Not-found page
assets/css/style.css       All styles (light + dark theme tokens at the top)
assets/js/main.js          Theme toggle, nav, project filters, BibTeX copy, results chart data
assets/files/              CV, paper, slides, poster (PDF)
assets/img/                Figures and thumbnails
assets/video/              EMNLP talk (640x480, about 74 MB)
```

## Publish on GitHub Pages

1. Create a **public** repository named exactly `rasel-isu.github.io` (your username + `.github.io`).
2. From this folder:
   ```bash
   git init
   git add .
   git commit -m "Initial portfolio site"
   git branch -M main
   git remote add origin https://github.com/rasel-isu/rasel-isu.github.io.git
   git push -u origin main
   ```
3. On GitHub, open **Settings → Pages**, set *Source* to **Deploy from a branch**, and choose `main` and `/ (root)`.
4. After a minute or two the site is live at **https://rasel-isu.github.io**. Put that URL on your resume.

## Common edits

| What | Where |
|---|---|
| Change the headshot | Replace `assets/img/profile.jpg` (portrait, about 4:5). |
| Add a research repo | `index.html` → copy an `<a class="card repo">` block under "Research code". |
| Add a news item | `index.html` → the `<ul class="news">` list. Newest first. |
| Add a publication | `index.html` → copy an `<li class="pub">` block. |
| Update the CV | Replace `assets/files/Md_Rasel_Khondokar_CV.pdf` (keep the file name so links don't break). |
| Change colors/fonts | Tokens at the top of `assets/css/style.css`. |
| After editing CSS or JS | Bump the `?v=...` value on the `style.css` / `main.js` links in `index.html`, `research/sci-zsel.html` and `404.html` so browsers fetch the new file instead of a cached copy. |

## Preview locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Note on the video

GitHub rejects files over 100 MB, so the talk was re-encoded to 640x480 (about 74 MB). For sharper playback, upload the original to YouTube and swap the `<video>` element in `research/sci-zsel.html` for the YouTube embed.
