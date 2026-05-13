## Getting Started

This is a static, file-based notes site. Every note is a markdown file in `content/notes/` — no database, no env vars, no backend.

### Install dependencies

```
npm install
```

### Run the application

```
npm run dev
```

Open http://localhost:3000.

### Add or edit notes

Notes live in [content/notes/](content/notes/). Each `.md` file becomes a page — the filename is the URL slug.

Frontmatter (the block at the top between `---`) sets the metadata:

```md
---
title: my new note
emoji: ✨
category: thoughts
created_at: 2026-05-12T00:00:00.000Z
public: true
---

write the body of your note in markdown here.
```

See [content/notes/how-to-add-notes.md](content/notes/how-to-add-notes.md) for a full reference.

### Customize the site

Edit [config/site.ts](config/site.ts) — name, title, description, and URL show up in metadata and OG cards.

### Deploy

Push to GitHub and import the repo on [Vercel](https://vercel.com). No environment variables needed.

## License

Originally based on [radioactive11/radioactive11](https://github.com/radioactive11/radioactive11) — MIT licensed. See [LICENSE.md](LICENSE.md).
