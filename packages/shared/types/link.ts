import { Label } from "./label";

export interface Link {
  id: number;
  url: string;
  title: string;
  description: string;
  thumbnail_url: string;
  favicon_url: string;
  is_pinned: boolean;
  is_archived: boolean;
  is_trashed: boolean;
  user_id: number;
  labels?: Label[];
  created_at: string;
  updated_at: string;
}
