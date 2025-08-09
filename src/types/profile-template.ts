import { ContentBlock } from './profile-content';

export type ProfileTemplate = {
  id: string;
  name: string;
  content: ContentBlock[] | null;
  assigned_role: string | null;
  created_at: string;
};