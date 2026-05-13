"use client";

import { SessionNotesContext } from "@/app/session-notes";
import { groupNotesByCategory, sortGroupedNotes } from "@/lib/note-utils";
import { Note } from "@/lib/types";
import { createClient } from "@/utils/supabase/client";
import { Pin } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CommandMenu } from "./command-menu";
import SearchBar from "./search";
import SessionId from "./session-id";
import { SidebarContent } from "./sidebar-content";
import { toast } from "./ui/use-toast";

const labels = {
  pinned: (
    <>
      <Pin className="inline-block w-4 h-4 mr-1" /> Pinned
    </>
  ),
  today: "Today",
  yesterday: "Yesterday",
  "7": "Previous 7 Days",
  "30": "Previous 30 Days",
  older: "Older",
};

const baseCategoryOrder = ["pinned", "today", "yesterday", "7", "30", "older"];

export default function Sidebar({
  notes: publicNotes,
  onNoteSelect,
  isMobile,
}: {
  notes: any[];
  onNoteSelect: (note: any) => void;
  isMobile: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [selectedNoteSlug, setSelectedNoteSlug] = useState<string | null>(null);
  const [pinnedNotes, setPinnedNotes] = useState<Set<string>>(new Set());
  const pathname = usePathname();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [localSearchResults, setLocalSearchResults] = useState<any[] | null>(
    null
  );
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [groupedNotes, setGroupedNotes] = useState<any>({});
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [openSwipeItemSlug, setOpenSwipeItemSlug] = useState<string | null>(
    null
  );
  const [highlightedNote, setHighlightedNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const commandMenuRef = useRef<{ setOpen: (open: boolean) => void } | null>(
    null
  );

  const {
    notes: sessionNotes,
    sessionId,
    setSessionId,
    refreshSessionNotes,
  } = useContext(SessionNotesContext);

  const notes = useMemo(
    () => [...publicNotes, ...sessionNotes],
    [publicNotes, sessionNotes]
  );

  const categoryOrder = useMemo(() => {
    const extras = Array.from(
      new Set(
        notes
          .filter((n) => n.public && n.category)
          .map((n) => n.category as string)
      )
    )
      .filter((c) => !baseCategoryOrder.includes(c))
      .sort();
    return [...baseCategoryOrder, ...extras];
  }, [notes]);

  useEffect(() => {
    if (pathname) {
      const slug = pathname.split("/").pop();
      setSelectedNoteSlug(slug || null);
    }
  }, [pathname]);

  useEffect(() => {
    if (selectedNoteSlug) {
      const note = notes.find((note) => note.slug === selectedNoteSlug);
      setSelectedNote(note || null);
    } else {
      setSelectedNote(null);
    }
  }, [selectedNoteSlug, notes]);

  useEffect(() => {
    const storedPinnedRaw = localStorage.getItem("pinnedNotes");
    const storedUnpinnedRaw = localStorage.getItem("unpinnedNotes");
    const pinned = new Set<string>(
      storedPinnedRaw ? JSON.parse(storedPinnedRaw) : []
    );
    const unpinned = new Set<string>(
      storedUnpinnedRaw ? JSON.parse(storedUnpinnedRaw) : []
    );

    notes.forEach((note) => {
      const eligible = note.public || note.session_id === sessionId;
      if (eligible && !unpinned.has(note.slug)) {
        pinned.add(note.slug);
      }
    });

    setPinnedNotes(pinned);
    localStorage.setItem("pinnedNotes", JSON.stringify(Array.from(pinned)));
  }, [notes, sessionId]);

  useEffect(() => {
    const userSpecificNotes = notes.filter(
      (note) => note.public || note.session_id === sessionId
    );
    const grouped = groupNotesByCategory(userSpecificNotes, pinnedNotes);
    sortGroupedNotes(grouped);
    setGroupedNotes(grouped);
  }, [notes, sessionId, pinnedNotes]);

  useEffect(() => {
    if (localSearchResults && localSearchResults.length > 0) {
      setHighlightedNote(localSearchResults[highlightedIndex]);
    } else {
      setHighlightedNote(selectedNote);
    }
  }, [localSearchResults, highlightedIndex, selectedNote]);

  const clearSearch = useCallback(() => {
    setLocalSearchResults(null);
    setSearchQuery("");
    setHighlightedIndex(0);
    if (searchInputRef.current) {
      searchInputRef.current.value = "";
    }
  }, [setLocalSearchResults, setHighlightedIndex]);

  const flattenedNotes = useCallback(() => {
    return categoryOrder.flatMap((category) =>
      groupedNotes[category] ? groupedNotes[category] : []
    );
  }, [groupedNotes]);

  const navigateNotes = useCallback(
    (direction: "up" | "down") => {
      if (!localSearchResults) {
        const flattened = flattenedNotes();
        const currentIndex = flattened.findIndex(
          (note) => note.slug === selectedNoteSlug
        );
        let nextIndex;

        if (direction === "up") {
          nextIndex =
            currentIndex > 0 ? currentIndex - 1 : flattened.length - 1;
        } else {
          nextIndex =
            currentIndex < flattened.length - 1 ? currentIndex + 1 : 0;
        }

        const nextNote = flattened[nextIndex];
        if (nextNote) {
          router.push(`/${nextNote.slug}`);
        }
      }
    },
    [flattenedNotes, selectedNoteSlug, router, localSearchResults]
  );

  const handlePinToggle = useCallback(
    (slug: string) => {
      let isPinning = false;
      setPinnedNotes((prev) => {
        const newPinned = new Set(prev);
        isPinning = !newPinned.has(slug);
        if (isPinning) {
          newPinned.add(slug);
        } else {
          newPinned.delete(slug);
        }
        localStorage.setItem(
          "pinnedNotes",
          JSON.stringify(Array.from(newPinned))
        );

        const unpinnedRaw = localStorage.getItem("unpinnedNotes");
        const unpinned = new Set<string>(
          unpinnedRaw ? JSON.parse(unpinnedRaw) : []
        );
        if (isPinning) unpinned.delete(slug);
        else unpinned.add(slug);
        localStorage.setItem(
          "unpinnedNotes",
          JSON.stringify(Array.from(unpinned))
        );

        return newPinned;
      });

      clearSearch();

      if (!isMobile) {
        router.push(`/${slug}`);
      }

      toast({
        description: isPinning ? "Note pinned" : "Note unpinned",
      });
    },
    [router, isMobile, clearSearch]
  );

  const handleNoteDelete = useCallback(
    async (noteToDelete: Note) => {
      if (noteToDelete.public) {
        toast({
          description: "Oops! You can't delete public notes",
        });
        return;
      }

      try {
        if (noteToDelete.id && sessionId) {
          await supabase.rpc('delete_note', {
            uuid_arg: noteToDelete.id,
            session_arg: sessionId
          });
        }

        setGroupedNotes((prevGroupedNotes: Record<string, Note[]>) => {
          const newGroupedNotes = { ...prevGroupedNotes };
          for (const category in newGroupedNotes) {
            newGroupedNotes[category] = newGroupedNotes[category].filter(
              (note: Note) => note.slug !== noteToDelete.slug
            );
          }
          return newGroupedNotes;
        });

        const allNotes = flattenedNotes();
        const deletedNoteIndex = allNotes.findIndex(
          (note) => note.slug === noteToDelete.slug
        );

        let nextNote;
        if (deletedNoteIndex === 0) {
          nextNote = allNotes[1];
        } else {
          nextNote = allNotes[deletedNoteIndex - 1];
        }

        if (!isMobile) {
          router.push(nextNote ? `/${nextNote.slug}` : "/whoami");
        }

        clearSearch();
        refreshSessionNotes();
        router.refresh();

        toast({
          description: "Note deleted",
        });
      } catch (error) {
        console.error("Error deleting note:", error);
      }
    },
    [
      supabase,
      sessionId,
      flattenedNotes,
      isMobile,
      clearSearch,
      refreshSessionNotes,
      router,
    ]
  );

  const goToHighlightedNote = useCallback(() => {
    if (localSearchResults && localSearchResults[highlightedIndex]) {
      const selectedNote = localSearchResults[highlightedIndex];
      router.push(`/${selectedNote.slug}`);
      clearSearch();
    }
  }, [localSearchResults, highlightedIndex, router, clearSearch]);

  useEffect(() => {
    const shortcuts = {
      j: () => navigateNotes("down"),
      ArrowDown: () => navigateNotes("down"),
      k: () => navigateNotes("up"),
      ArrowUp: () => navigateNotes("up"),
      p: () => highlightedNote && handlePinToggle(highlightedNote.slug),
      d: () => highlightedNote && handleNoteDelete(highlightedNote),
      "/": () => searchInputRef.current?.focus(),
      Escape: () => (document.activeElement as HTMLElement)?.blur(),
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isTyping =
        ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
        target.isContentEditable;

      if (isTyping) {
        if (event.key === "Escape") {
          shortcuts["Escape"]();
        } else if (
          event.key === "Enter" &&
          localSearchResults &&
          localSearchResults.length > 0
        ) {
          event.preventDefault();
          goToHighlightedNote();
        }
        return;
      }

      const key = event.key as keyof typeof shortcuts;
      if (shortcuts[key] && !(event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        (document.activeElement as HTMLElement)?.blur();

        if (
          localSearchResults &&
          ["j", "ArrowDown", "k", "ArrowUp"].includes(key)
        ) {
          const direction = ["j", "ArrowDown"].includes(key) ? 1 : -1;
          setHighlightedIndex(
            (prevIndex) =>
              (prevIndex + direction + localSearchResults.length) %
              localSearchResults.length
          );
        } else {
          shortcuts[key]();
        }
      } else if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        commandMenuRef.current?.setOpen(true);
      } else if (
        event.key === "Enter" &&
        localSearchResults &&
        localSearchResults.length > 0
      ) {
        event.preventDefault();
        goToHighlightedNote();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    navigateNotes,
    highlightedNote,
    handlePinToggle,
    localSearchResults,
    setHighlightedIndex,
    handleNoteDelete,
    commandMenuRef,
    goToHighlightedNote,
  ]);

  const handleNoteSelect = useCallback(
    (note: any) => {
      onNoteSelect(note);
      if (!isMobile) {
        router.push(`/${note.slug}`);
      }
      clearSearch();
    },
    [clearSearch, onNoteSelect, isMobile, router]
  );

  return (
    <div className="h-full flex flex-col">
      <SessionId setSessionId={setSessionId} />
      <CommandMenu
        notes={notes}
        sessionId={sessionId}
        addNewPinnedNote={handlePinToggle}
        navigateNotes={navigateNotes}
        togglePinned={handlePinToggle}
        deleteNote={handleNoteDelete}
        highlightedNote={highlightedNote}
        setSelectedNoteSlug={setSelectedNoteSlug}
        isMobile={isMobile}
      />
      <div className="flex-1 overflow-y-auto">
        <SearchBar
          notes={notes}
          onSearchResults={setLocalSearchResults}
          sessionId={sessionId}
          inputRef={searchInputRef}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setHighlightedIndex={setHighlightedIndex}
          clearSearch={clearSearch}
        />
        <SidebarContent
          groupedNotes={groupedNotes}
          selectedNoteSlug={selectedNoteSlug}
          onNoteSelect={handleNoteSelect}
          sessionId={sessionId}
          handlePinToggle={handlePinToggle}
          pinnedNotes={pinnedNotes}
          addNewPinnedNote={handlePinToggle}
          localSearchResults={localSearchResults}
          highlightedIndex={highlightedIndex}
          categoryOrder={categoryOrder}
          labels={labels}
          handleNoteDelete={handleNoteDelete}
          openSwipeItemSlug={openSwipeItemSlug}
          setOpenSwipeItemSlug={setOpenSwipeItemSlug}
          clearSearch={clearSearch}
          setSelectedNoteSlug={setSelectedNoteSlug}
          isMobile={isMobile}
        />
      </div>
    </div>
  );
}
