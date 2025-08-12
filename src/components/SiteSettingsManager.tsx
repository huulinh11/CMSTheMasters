import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const SiteSettingsManager = () => {
  const { data: settings } = useQuery({
    queryKey: ['checklist_settings_for_head'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checklist_settings')
        .select('website_title, favicon_url, og_image_url, sidebar_title')
        .limit(1)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  useEffect(() => {
    if (settings) {
      const updateMetaTag = (key: 'name' | 'property', value: string, content: string) => {
        let element = document.querySelector(`meta[${key}='${value}']`) as HTMLMetaElement;
        if (!element) {
          element = document.createElement('meta');
          element.setAttribute(key, value);
          document.head.appendChild(element);
        }
        element.content = content;
      };

      const updateLinkTag = (rel: string, href: string) => {
        let element = document.querySelector(`link[rel='${rel}']`) as HTMLLinkElement;
        if (!element) {
          element = document.createElement('link');
          element.rel = rel;
          document.head.appendChild(element);
        }
        element.href = href;
      };

      const websiteTitle = settings.website_title || 'EventApp';
      const description = settings.sidebar_title || 'Event Information';
      const imageUrl = settings.og_image_url || `${window.location.origin}/placeholder.svg`;
      const pageUrl = window.location.href;

      // Update Title
      document.title = websiteTitle;
      updateMetaTag('name', 'title', websiteTitle);
      updateMetaTag('property', 'og:title', websiteTitle);
      updateMetaTag('property', 'twitter:title', websiteTitle);

      // Update Description
      updateMetaTag('name', 'description', description);
      updateMetaTag('property', 'og:description', description);
      updateMetaTag('property', 'twitter:description', description);

      // Update Favicon
      if (settings.favicon_url) {
        updateLinkTag('icon', settings.favicon_url);
      }

      // Update Image
      updateMetaTag('property', 'og:image', imageUrl);
      updateMetaTag('property', 'twitter:image', imageUrl);
      
      // Update URL
      updateMetaTag('property', 'og:url', pageUrl);
      updateMetaTag('property', 'twitter:url', pageUrl);
    }
  }, [settings]);

  return null;
};

export default SiteSettingsManager;