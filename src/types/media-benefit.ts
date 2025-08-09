import { Guest } from './guest';
import { VipGuest } from './vip-guest';

export type NewsItem = {
  id: string;
  article_link: string;
  post_link: string;
};

export type NewsVideo = {
  script_link: string;
  video_link: string;
};

export const INVITATION_STATUSES = ['Trống', 'Đã có', 'Đã gửi'] as const;
export type InvitationStatus = typeof INVITATION_STATUSES[number];

export type MediaBenefit = {
  guest_id: string;
  invitation_status: InvitationStatus;
  page_post_link?: string | null;
  btc_post_link?: string | null;
  pre_event_news?: NewsItem[] | null;
  post_event_news?: NewsItem[] | null;
  red_carpet_video_link?: string | null;
  news_video?: NewsVideo | null;
  beauty_ai_photos_link?: string | null;
  custom_data?: { [key: string]: any };
};

// Combined guest type for the page
export type MediaVipGuest = VipGuest & {
  media_benefit?: MediaBenefit;
};

export type MediaRegularGuest = Guest & {
  media_benefit?: MediaBenefit;
  materials?: string;
};

export type AnyMediaGuest = MediaVipGuest | MediaRegularGuest;