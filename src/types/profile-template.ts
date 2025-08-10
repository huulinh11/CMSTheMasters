import { ContentBlock } from './profile-content';

export type ProfileTemplate = {
  id: string;
  name: string;
  content: ContentBlock[] | null;
  assigned_roles: string[] | null;
  created_at: string;
};