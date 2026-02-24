import { defineResource } from "@/lib/resource";

export const linksResource = defineResource({
  name: "Link",
  slug: "links",
  endpoint: "/api/links",
  icon: "Link",
  label: { singular: "Link", plural: "Links" },

  table: {
    columns: [
      { key: "id", label: "ID", sortable: true, width: "80px" },
      { key: "title", label: "Title", sortable: true, searchable: true },
      { key: "url", label: "URL" },
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
    searchPlaceholder: "Search links...",
    actions: ["create", "view", "edit", "delete"],
    defaultSort: { key: "created_at", direction: "desc" },
    pageSize: 20,
  },

  form: {
    layout: "single",
    fields: [
      {
        key: "url",
        label: "URL",
        type: "text",
        required: true,
        placeholder: "https://example.com",
      },
      {
        key: "title",
        label: "Title",
        type: "text",
        placeholder: "Link title",
      },
      {
        key: "description",
        label: "Description",
        type: "textarea",
        rows: 4,
        placeholder: "Link description...",
      },
      {
        key: "thumbnail_url",
        label: "Thumbnail URL",
        type: "text",
        placeholder: "https://example.com/image.jpg",
      },
      {
        key: "favicon_url",
        label: "Favicon URL",
        type: "text",
        placeholder: "https://example.com/favicon.ico",
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
        label: "Total Links",
        icon: "Link",
        color: "accent",
        endpoint: "/api/links?page_size=1",
        format: "number",
        colSpan: 1,
      },
    ],
  },
});
