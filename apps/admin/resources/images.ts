import { defineResource } from "@/lib/resource";

export const imagesResource = defineResource({
  name: "Image",
  slug: "images",
  endpoint: "/api/images",
  icon: "Image",
  label: { singular: "Image", plural: "Images" },

  table: {
    columns: [
      { key: "id", label: "ID", sortable: true, width: "80px" },
      { key: "title", label: "Title", sortable: true, searchable: true },
      { key: "url", label: "Preview", format: "image" },
      { key: "mime_type", label: "Type" },
      { key: "size_bytes", label: "Size" },
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
    searchPlaceholder: "Search images...",
    actions: ["view", "edit", "delete"],
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
        placeholder: "Image title",
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
        label: "Total Images",
        icon: "Image",
        color: "accent",
        endpoint: "/api/images?page_size=1",
        format: "number",
        colSpan: 1,
      },
    ],
  },
});
