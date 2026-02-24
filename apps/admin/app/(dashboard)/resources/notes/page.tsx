"use client";

import { useMe } from "@/hooks/use-auth";
import { ResourcePage } from "@/components/resource/resource-page";
import { NotesBoard } from "@/components/notes/notes-board";
import { notesResource } from "@/resources/notes";

export default function NotesPage() {
  const { data: user, isLoading } = useMe();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-accent border-r-transparent"></div>
          <p className="mt-4 text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  // Show creative UI for regular users, admin panel for admins
  if (user?.role === "USER") {
    return <NotesBoard />;
  }

  return <ResourcePage resource={notesResource} />;
}
