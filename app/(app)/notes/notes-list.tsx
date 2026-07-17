"use client";

import { Card, EmptyState } from "@/components/ui";
import ListFilterBar from "@/components/list-filter-bar";
import { DeleteNoteButton, PinNoteButton } from "./note-buttons";
import { formatDate } from "@/lib/utils";
import { FileIcon, Pin } from "lucide-react";

type Note = {
  id: string;
  title: string;
  body: string | null;
  pinned: boolean;
  createdAt: Date;
  authorId: string;
  attachments: { id: string; name: string; url: string }[];
};

export default function NotesList({
  notes,
  authorMap,
  canPost,
}: {
  notes: Note[];
  authorMap: Record<string, string>;
  canPost: boolean;
}) {
  const sortOptions = [
    { value: "pinned-first", label: "Pinned first" },
    { value: "newest",       label: "Newest first" },
    { value: "oldest",       label: "Oldest first" },
    { value: "title",        label: "Title A → Z" },
  ];

  return (
    <ListFilterBar
      searchPlaceholder="Search notes…"
      sortOptions={sortOptions}
      defaultSort="pinned-first"
      totalCount={notes.length}
      filteredCount={undefined}
    >
      {({ search, sort }) => {
        let filtered = notes.filter((n) => {
          const q = search.toLowerCase();
          return (
            !q ||
            n.title.toLowerCase().includes(q) ||
            (n.body ?? "").toLowerCase().includes(q) ||
            (authorMap[n.authorId] ?? "").toLowerCase().includes(q)
          );
        });

        filtered = [...filtered].sort((a, b) => {
          switch (sort) {
            case "newest":  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            case "oldest":  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            case "title":   return a.title.localeCompare(b.title);
            default: // pinned-first
              if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }
        });

        if (filtered.length === 0) {
          return (
            <EmptyState
              title="No notes match"
              description={search ? "Try a different search term." : canPost ? "Post the first note above." : "Your teacher hasn't posted any notes yet."}
            />
          );
        }

        return (
          <div className="space-y-4">
            <p className="text-xs text-ink-soft">
              {filtered.length} note{filtered.length !== 1 ? "s" : ""}{search ? " matched" : ""}
            </p>
            {filtered.map((note) => (
              <Card
                key={note.id}
                className={`overflow-hidden transition-all card-hover ${note.pinned ? "border-indigo-200 bg-indigo-50/30" : ""}`}
              >
                <div className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {note.pinned && (
                        <Pin className="w-3.5 h-3.5 text-primary shrink-0" aria-label="Pinned" />
                      )}
                      <h3 className="font-display font-semibold text-ink truncate">{note.title}</h3>
                    </div>
                    {canPost && (
                      <div className="flex items-center gap-1 shrink-0">
                        <PinNoteButton id={note.id} pinned={note.pinned} />
                        <DeleteNoteButton id={note.id} title={note.title} />
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-ink-soft mb-3">
                    {authorMap[note.authorId] ?? "Teacher"} · {formatDate(note.createdAt)}
                  </p>

                  {note.body && (
                    <div className="text-sm text-ink whitespace-pre-wrap leading-relaxed mb-4">
                      {note.body}
                    </div>
                  )}

                  {note.attachments.length > 0 && (
                    <div className="border-t border-border pt-3">
                      <p className="text-xs font-medium text-ink-soft uppercase tracking-wide mb-2">
                        Attachments ({note.attachments.length})
                      </p>
                      <ul className="flex flex-wrap gap-2">
                        {note.attachments.map((att) => (
                          <li key={att.id}>
                            <a
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs hover:bg-white transition-colors font-medium"
                            >
                              <FileIcon className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden="true" />
                              <span className="truncate max-w-[180px]">{att.name}</span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        );
      }}
    </ListFilterBar>
  );
}
