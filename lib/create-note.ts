import { toast } from "@/components/ui/use-toast";

export async function createNote(
  _sessionId: string | null,
  _router: any,
  _addNewPinnedNote: (slug: string) => void,
  _refreshSessionNotes: () => Promise<void>,
  _setSelectedNoteSlug: (slug: string | null) => void,
  _isMobile: boolean
) {
  toast({
    description:
      "Read-only site — add a markdown file in content/notes/ to create a note.",
  });
}
