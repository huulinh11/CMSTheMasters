import { MediaBenefit } from "@/types/media-benefit";

export const benefitNameToFieldMap: Record<string, keyof Omit<MediaBenefit, 'guest_id' | 'custom_data'>> = {
  "Thư mời": "invitation_status",
  "Post bài page": "page_post_link",
  "Post bài BTC": "btc_post_link",
  "Báo trước sự kiện": "pre_event_news",
  "Báo sau sự kiện": "post_event_news",
  "Video thảm đỏ": "red_carpet_video_link",
  "Video đưa tin": "news_video",
  "Bộ ảnh Beauty AI": "beauty_ai_photos_link",
};

export const standardFields = Object.values(benefitNameToFieldMap);