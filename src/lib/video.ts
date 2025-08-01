export function getVideoEmbedUrl(url: string): string | null {
  if (!url) return null;

  let videoId: string | null = null;
  let embedUrl: string | null = null;

  // YouTube
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    if (url.includes("embed")) {
      return url; // Already an embed link
    }
    
    if (url.includes("youtu.be")) {
      videoId = url.split("/").pop()?.split("?")[0] || null;
    } else {
      try {
        const urlObject = new URL(url);
        const urlParams = new URLSearchParams(urlObject.search);
        videoId = urlParams.get("v");
      } catch (error) {
        console.error("Invalid URL for YouTube video:", url);
        return null;
      }
    }
    
    if (videoId) {
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    }
  }
  
  // Note: Facebook video embedding is more complex and will be added later.

  return embedUrl;
}