import fs from "fs";
import path from "path";
import { Note } from "./types";

const NOTES_DIR = path.join(process.cwd(), "content", "notes");

type Frontmatter = Record<string, string>;

function parseFrontmatter(raw: string): { data: Frontmatter; content: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { data: {}, content: raw };

  const [, frontmatter, content] = match;
  const data: Frontmatter = {};

  for (const line of frontmatter.split(/\r?\n/)) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    data[key] = value;
  }

  return { data, content: content.trim() };
}

function loadNote(filename: string): Note {
  const slug = filename.replace(/\.md$/, "");
  const filepath = path.join(NOTES_DIR, filename);
  const raw = fs.readFileSync(filepath, "utf-8");
  const { data, content } = parseFrontmatter(raw);

  return {
    id: slug,
    slug,
    title: data.title || slug,
    content,
    emoji: data.emoji || "📝",
    category: data.category || "notes",
    created_at: data.created_at || new Date().toISOString(),
    public: data.public !== "false",
    session_id: "",
  };
}

export function getAllNotes(): Note[] {
  if (!fs.existsSync(NOTES_DIR)) return [];
  const files = fs.readdirSync(NOTES_DIR).filter((f) => f.endsWith(".md"));
  return files
    .map(loadNote)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function getNoteBySlug(slug: string): Note | null {
  const filename = `${slug}.md`;
  const filepath = path.join(NOTES_DIR, filename);
  if (!fs.existsSync(filepath)) return null;
  return loadNote(filename);
}
