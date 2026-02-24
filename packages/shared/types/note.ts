import { Label } from "./label";

export interface Note {
  id: number;
  title: string;
  body: string;
  color: string;
  is_pinned: boolean;
  is_archived: boolean;
  is_trashed: boolean;
  user_id: number;
  labels?: Label[];
  created_at: string;
  updated_at: string;
}
