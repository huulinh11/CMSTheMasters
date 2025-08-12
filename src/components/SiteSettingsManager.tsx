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

      if (settings.website_title) {
        document.title = settings.website_title;
        updateMetaTag('property', 'og:title', settings.website_title);
        updateMetaTag('name', 'twitter:title', settings.website_title);
      }

      if (settings.sidebar_title) {
        updateMetaTag('name', 'description', settings.sidebar_title);
        updateMetaTag('property', 'og:description', settings.sidebar_title);
        updateMetaTag('name', 'twitter:description', settings.sidebar_title);
      }

      if (settings.favicon_url) {
        updateLinkTag('icon', settings.favicon_url);
      }

      if (settings.og_image_url) {
        updateMetaTag('property', 'og:image', settings.og_image_url);
        updateMetaTag('name', 'twitter:image', settings.og_image_url);
      }
      
      updateMetaTag('property', 'og:url', window.location.href);
    }
  }, [settings]);

  return null;
};

export default SiteSettingsManager;