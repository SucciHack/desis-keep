import { Label } from "./label";

export interface File {
  id: number;
  title: string;
  original_name: string;
  storage_key: string;
  url: string;
  mime_type: string;
  size_bytes: number;
  extension: string;
  is_pinned: boolean;
  is_archived: boolean;
  is_trashed: boolean;
  user_id: number;
  labels?: Label[];
  created_at: string;
  updated_at: string;
}
