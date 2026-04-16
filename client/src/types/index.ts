export interface Visitor {
  id: string;
  name: string | null;
  company: string | null;
  position: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  business_card_path: string | null;
  avatar_path: string | null;
  avatar_prompt: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: number;
  name: string;
  filename: string;
  file_path: string;
  category: string | null;
  active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Contact {
  id: number;
  name: string;
  company: string | null;
  role: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  linkedin: string | null;
  notes: string | null;
  photo_path: string | null;
  active: boolean;
  sort_order: number;
}

export interface AvatarOption {
  id: number;
  category: string;
  label: string;
  prompt_value: string;
  active: boolean;
  sort_order: number;
}

export interface OcrResult {
  name: string | null;
  company: string | null;
  position: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
}

export interface VisitorFull extends Visitor {
  documents: Document[];
  contacts: Contact[];
}
