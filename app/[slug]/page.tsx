import Note from "@/components/note";
import { siteConfig } from "@/config/site";
import { getAllNotes, getNoteBySlug } from "@/lib/notes-data";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const dynamic = "error";
export const revalidate = 60 * 60 * 24;

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const note = getNoteBySlug(params.slug);

  const title = note?.title || "new note";
  const emoji = note?.emoji || "👋🏼";

  return {
    title: `${siteConfig.name} | ${title}`,
    openGraph: {
      images: [
        `/api/og/?title=${encodeURIComponent(title)}&emoji=${encodeURIComponent(
          emoji
        )}`,
      ],
    },
  };
}

export async function generateStaticParams() {
  return getAllNotes()
    .filter((n) => n.public)
    .map(({ slug }) => ({ slug }));
}

export default async function NotePage({
  params,
}: {
  params: { slug: string };
}) {
  const note = getNoteBySlug(params.slug);

  if (!note) {
    redirect("/error");
  }

  return (
    <div className="w-full min-h-dvh p-3">
      <Note note={note} />
    </div>
  );
}
