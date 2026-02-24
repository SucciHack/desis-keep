import { defineResource } from "@/lib/resource";

export const notesResource = defineResource({
  name: "Note",
  slug: "notes",
  endpoint: "/api/notes",
  icon: "FileText",
  label: { singular: "Note", plural: "Notes" },

  table: {
    columns: [
      { key: "id", label: "ID", sortable: true, width: "80px" },
      { key: "title", label: "Title", sortable: true, searchable: true },
      { key: "body", label: "Body" },
      { key: "is_pinned", label: "Pinned", format: "boolean" },
      { key: "is_archived", label: "Archived", format: "boolean" },
      { key: "is_trashed", label: "Trashed", format: "boolean" },
      {
        key: "created_at",
        label: "Created",
        format: "relative",
        sortable: true,
      },
    ],
    filters: [
      { key: "is_pinned", label: "Pinned", type: "boolean" },
      { key: "is_archived", label: "Archived", type: "boolean" },
      { key: "is_trashed", label: "Trashed", type: "boolean" },
    ],
    searchable: true,
    searchPlaceholder: "Search notes...",
    actions: ["create", "view", "edit", "delete"],
    defaultSort: { key: "created_at", direction: "desc" },
    pageSize: 20,
  },

  form: {
    layout: "single",
    fields: [
      {
        key: "title",
        label: "Title",
        type: "text",
        placeholder: "Note title",
      },
      {
        key: "body",
        label: "Body",
        type: "textarea",
        rows: 10,
        placeholder: "Note content...",
      },
      {
        key: "color",
        label: "Color",
        type: "text",
        placeholder: "#ffffff",
        defaultValue: "#ffffff",
      },
      {
        key: "is_pinned",
        label: "Pinned",
        type: "toggle",
        defaultValue: false,
      },
      {
        key: "is_archived",
        label: "Archived",
        type: "toggle",
        defaultValue: false,
      },
    ],
  },

  dashboard: {
    widgets: [
      {
        type: "stat",
        label: "Total Notes",
        icon: "FileText",
        color: "accent",
        endpoint: "/api/notes?page_size=1",
        format: "number",
        colSpan: 1,
      },
      {
        type: "stat",
        label: "Pinned Notes",
        icon: "Pin",
        color: "info",
        endpoint: "/api/notes?is_pinned=true&page_size=1",
        format: "number",
        colSpan: 1,
      },
    ],
  },
});
