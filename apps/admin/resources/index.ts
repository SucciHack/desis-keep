import { usersResource } from "./users";
import { blogsResource } from "./blogs";
import { labelsResource } from "./labels";
import { notesResource } from "./notes";
import { linksResource } from "./links";
import { imagesResource } from "./images";
import { filesResource } from "./files";
// grit:resources

import type { ResourceDefinition } from "@/lib/resource";

export const resources: ResourceDefinition[] = [
  usersResource,
  blogsResource,
  labelsResource,
  notesResource,
  linksResource,
  imagesResource,
  filesResource,
  // grit:resource-list
];

export function getResource(slug: string): ResourceDefinition | undefined {
  return resources.find((r) => r.slug === slug);
}

export function getResourceByEndpoint(
  endpoint: string,
): ResourceDefinition | undefined {
  return resources.find((r) => r.endpoint === endpoint);
}
