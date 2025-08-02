import { MediaBenefit, NewsItem, NewsVideo } from "@/types/media-benefit";
import React from "react";

const LinkDisplay = ({ link }: { link: string }) => (
  <a href={link} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Link</a>
);

const NewsDisplay = ({ items }: { items: NewsItem[] | null | undefined }) => {
  if (!items || items.length === 0) return <span className="text-slate-500">Trống</span>;
  return (
    <div className="flex flex-col space-y-1 items-end">
      {items.map(item => (
        <div key={item.id} className="flex items-center space-x-2">
          {item.article_link && <span>Bài: <LinkDisplay link={item.article_link} /></span>}
          {item.post_link && <span>Post: <LinkDisplay link={item.post_link} /></span>}
        </div>
      ))}
    </div>
  );
};

const VideoNewsDisplay = ({ video }: { video: NewsVideo | null | undefined }) => {
  if (!video || (!video.script_link && !video.video_link)) return <span className="text-slate-500">Trống</span>;
  return (
    <div className="flex items-center space-x-2">
      {video.script_link && <span>Script: <LinkDisplay link={video.script_link} /></span>}
      {video.video_link && <span>Video: <LinkDisplay link={video.video_link} /></span>}
    </div>
  );
};

const getBenefitStatus = (benefitName: string, mediaBenefit: MediaBenefit | null): React.ReactNode => {
  if (!mediaBenefit) return <span className="text-slate-500">Trống</span>;

  switch (benefitName) {
    case "Thư mời":
      return <span className="font-semibold">{mediaBenefit.invitation_status || 'Trống'}</span>;
    case "Post bài page":
      return mediaBenefit.page_post_link ? <LinkDisplay link={mediaBenefit.page_post_link} /> : <span className="text-slate-500">Trống</span>;
    case "Post bài BTC":
      return mediaBenefit.btc_post_link ? <LinkDisplay link={mediaBenefit.btc_post_link} /> : <span className="text-slate-500">Trống</span>;
    case "Báo trước sự kiện":
      return <NewsDisplay items={mediaBenefit.pre_event_news} />;
    case "Báo sau sự kiện":
      return <NewsDisplay items={mediaBenefit.post_event_news} />;
    case "Video thảm đỏ":
      return mediaBenefit.red_carpet_video_link ? <LinkDisplay link={mediaBenefit.red_carpet_video_link} /> : <span className="text-slate-500">Trống</span>;
    case "Video đưa tin":
      return <VideoNewsDisplay video={mediaBenefit.news_video} />;
    case "Bộ ảnh Beauty AI":
      return mediaBenefit.beauty_ai_photos_link ? <LinkDisplay link={mediaBenefit.beauty_ai_photos_link} /> : <span className="text-slate-500">Trống</span>;
    default:
      return <span className="text-slate-500">N/A</span>;
  }
};

interface MediaBenefitDisplayProps {
  benefits: string[];
  mediaBenefitData: MediaBenefit | null;
}

export const MediaBenefitDisplay = ({ benefits, mediaBenefitData }: MediaBenefitDisplayProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
      {benefits.map(benefitName => (
        <div key={benefitName} className="flex justify-between items-start">
          <span className="font-medium text-slate-700 pr-4">{benefitName}:</span>
          <div className="text-right">{getBenefitStatus(benefitName, mediaBenefitData)}</div>
        </div>
      ))}
    </div>
  );
};