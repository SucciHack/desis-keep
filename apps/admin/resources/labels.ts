import { defineResource } from "@/lib/resource";

export const labelsResource = defineResource({
  name: "Label",
  slug: "labels",
  endpoint: "/api/labels",
  icon: "Tag",
  label: { singular: "Label", plural: "Labels" },

  table: {
    columns: [
      { key: "id", label: "ID", sortable: true, width: "80px" },
      { key: "name", label: "Name", sortable: true, searchable: true },
      { key: "slug", label: "Slug", sortable: true },
      { key: "color", label: "Color", format: "color" },
      {
        key: "created_at",
        label: "Created",
        format: "relative",
        sortable: true,
      },
    ],
    searchable: true,
    searchPlaceholder: "Search labels...",
    actions: ["create", "edit", "delete"],
    defaultSort: { key: "name", direction: "asc" },
    pageSize: 20,
  },

  form: {
    layout: "single",
    fields: [
      {
        key: "name",
        label: "Name",
        type: "text",
        required: true,
        placeholder: "Enter label name",
      },
      {
        key: "color",
        label: "Color",
        type: "text",
        placeholder: "#6c5ce7",
        defaultValue: "#6c5ce7",
        description: "Hex color code (e.g., #6c5ce7)",
      },
    ],
  },

  dashboard: {
    widgets: [
      {
        type: "stat",
        label: "Total Labels",
        icon: "Tag",
        color: "accent",
        endpoint: "/api/labels?page_size=1",
        format: "number",
        colSpan: 1,
      },
    ],
  },
});
