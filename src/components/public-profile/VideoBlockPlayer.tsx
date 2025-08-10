import { useState } from 'react';
import { getVideoEmbedUrl } from "@/lib/video";
import { Skeleton } from "@/components/ui/skeleton";
import { VideoBlock } from '@/types/profile-content';

interface VideoBlockPlayerProps {
  block: VideoBlock;
}

export const VideoBlockPlayer = ({ block }: VideoBlockPlayerProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const embedUrl = getVideoEmbedUrl(block.videoUrl);

  if (!embedUrl) return null;

  const aspectRatio = block.aspectWidth && block.aspectHeight 
    ? `${block.aspectWidth} / ${block.aspectHeight}` 
    : '16 / 9';

  return (
    <div className="w-full bg-black" style={{ aspectRatio }}>
      {!isLoaded && (
        <Skeleton className="w-full h-full" />
      )}
      <iframe
        src={embedUrl}
        title="Video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full"
        style={{ display: isLoaded ? 'block' : 'none' }}
        onLoad={() => setIsLoaded(true)}
      ></iframe>
    </div>
  );
};