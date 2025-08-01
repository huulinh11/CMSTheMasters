export function getVideoEmbedUrl(url: string): string | null {
  if (!url) return null;

  // YouTube
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    let videoId: string | null = null;
    if (url.includes("embed")) {
      return url; // Already an embed link
    }
    
    if (url.includes("youtu.be")) {
      videoId = url.split("/").pop()?.split("?")[0] || null;
    } else if (url.includes("/shorts/")) {
      videoId = url.split("/shorts/").pop()?.split("?")[0] || null;
    }
    else {
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
      return `https://www.youtube.com/embed/${videoId}`;
    }
  }
  
  // Facebook
  if (url.includes("facebook.com")) {
    // Use Facebook's oEmbed plugin endpoint
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false`;
  }

  return null;
}