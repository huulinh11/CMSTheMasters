import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const SiteSettingsManager = () => {
  const { data: settings } = useQuery({
    queryKey: ['checklist_settings_for_head'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checklist_settings')
        .select('website_title, favicon_url, og_image_url')
        .limit(1)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  useEffect(() => {
    if (settings) {
      // Update title
      if (settings.website_title) {
        document.title = settings.website_title;
      }

      // Update favicon
      if (settings.favicon_url) {
        let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.getElementsByTagName('head')[0].appendChild(link);
        }
        link.href = settings.favicon_url;
      }

      // Update OG image
      if (settings.og_image_url) {
        let meta: HTMLMetaElement | null = document.querySelector("meta[property='og:image']");
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('property', 'og:image');
          document.getElementsByTagName('head')[0].appendChild(meta);
        }
        meta.content = settings.og_image_url;
      }
    }
  }, [settings]);

  return null; // This component does not render anything
};

export default SiteSettingsManager;