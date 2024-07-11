import * as S from "@effect/schema/Schema";
import { cn } from "@/lib/utils";
import { memo, useCallback } from "react";
import { Editor } from "@tiptap/react";
import { TableOfContents } from "../TableOfContents";
import { NotebookDialog } from "../dialogs/notebook";
import { useEvolu, useQueries, useQuery, String } from "@evolu/react";
import { notebooksQuery, notesQuery } from "@/db/queries";
import { NoteDialog } from "../dialogs/note";
import { Button } from "../ui/Button";
import { Trash2 } from "lucide-react";
import { evolu, type Database } from "@/db/db";
import useNoteStore from "@/store/note";
import { Brand } from "effect/Brand";
import { NonEmptyString50, NoteId } from "@/db/schema";
import React from "react";
import Link from "next/link";
import TreeMenu from "../Recursive/TreeMenu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { SectionDialog } from "../dialogs/section";

export const Sidebar = memo(
  ({
    editor,
    isOpen,
    onClose,
  }: {
    editor: Editor;
    isOpen?: boolean;
    onClose: () => void;
  }) => {
    const { update } = useEvolu<Database>();

    // Zustand stores
    const { name, data, setNote } = useNoteStore((state) => ({
      name: state.name,
      data: state.data,
      setNote: state.setNote,
    }));

    const [notebooks, notes] = useQueries([notebooksQuery, notesQuery]);

    // Move the exportedDataQuery outside of selectNote
    const exportedDataQuery = evolu.createQuery((db) =>
      db
        .selectFrom("exportedData")
        .select("id")
        .select("jsonData")
        .select("noteId"),
    );

    // Use the query result here
    const { rows: exportedDataRows } = useQuery(exportedDataQuery);

    const handlePotentialClose = useCallback(() => {
      if (window.innerWidth < 1024) {
        onClose();
      }
    }, [onClose]);

    const windowClassName = cn(
      "bg-white lg:bg-white/30 lg:backdrop-blur-xl h-full w-0 duration-300 transition-all",
      "dark:bg-black lg:dark:bg-black/30",
      "min-h-svh",
      !isOpen && "border-r-transparent",
      isOpen && "w-full",
    );

    const deleteNote = (noteId: string & Brand<"Id"> & Brand<"Note">) => {
      update("notes", { id: noteId, isDeleted: true });
    };

    // Update selectNote to use the query results
    const selectNote = (noteId: string & Brand<"Id"> & Brand<"Note">) => {
      const exportedData = exportedDataRows.find(
        (row) => row.noteId === noteId,
      );
      console.log("JSON Data, ", exportedData?.jsonData);
      if (exportedData) {
        setNote(
          exportedData.jsonData!,
          S.decodeSync(NonEmptyString50)(exportedData.noteId ?? ""),
          noteId,
          exportedData.id,
        );
        editor.commands.setContent(exportedData.jsonData!);
      }
    };

    return (
      <div className={windowClassName}>
        <div className="w-full min-h-svh overflow-hidden">
          <div className="w-full h-full p-5 overflow-auto min-h-svh">
            <div className="flex h-14 items-center border-b px-4 mb-8 lg:px-6">
              <Link
                href="/"
                className="flex items-center gap-2 font-semibold pb-3"
                onClick={(e) => e.preventDefault()}
              >
                {/* <Package2 className="h-6 w-6" /> */}
                <span>Aether notes</span>
              </Link>
              {/* <Button variant="outline" size="icon" className="ml-auto h-8 w-8">
                <Bell className="h-4 w-4" />
                <span className="sr-only">Toggle notifications</span>
              </Button> */}
            </div>

            <div className="flex-1">
              <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                {notebooks.rows.map((notebook) => (
                  <div key={notebook.id}>
                    <ContextMenu>
                      <ContextMenuTrigger
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        asChild
                      >
                        <div
                          // href="#"
                          className="items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                        >
                          {/* <Home className="h-4 w-4" /> */}
                          {notebook.title}
                        </div>
                      </ContextMenuTrigger>
                      <ContextMenuContent>
                        <ContextMenuItem
                          onSelect={(e) => {
                            e.preventDefault();
                          }}
                        >
                          <SectionDialog notebookId={notebook.id}>
                            <p className="w-full">New Section (folder)</p>
                          </SectionDialog>
                        </ContextMenuItem>
                        <ContextMenuItem
                          onSelect={(e) => {
                            e.preventDefault();
                          }}
                        >
                          <NoteDialog
                            notebookId={notebook.id}
                            notebookTitle={notebook.title!}
                          >
                            <p className="w-full">New Note</p>
                          </NoteDialog>
                          {/* New Note */}
                        </ContextMenuItem>
                        {/* <ContextMenuItem>Team</ContextMenuItem>
                            <ContextMenuItem>Subscription</ContextMenuItem> */}
                      </ContextMenuContent>
                    </ContextMenu>
                    <TreeMenu data={notes} id={notebook.id} />
                  </div>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

Sidebar.displayName = "TableOfContentSidepanel";
