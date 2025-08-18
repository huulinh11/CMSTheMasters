import { useRef } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TimelineDisplay } from "@/components/public-checklist/TimelineDisplay";
import { useOutletContext } from "react-router-dom";
import { ChecklistDataContext } from "../PublicChecklist";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DresscodeDisplay } from "@/components/public-checklist/DresscodeDisplay";

const PublicEventInfoTab = () => {
  const { guest, timelineEvents } = useOutletContext<ChecklistDataContext>();
  const timelineRef = useRef<HTMLDivElement>(null);
  const dresscodeRef = useRef<HTMLDivElement>(null);

  const { data: settings } = useQuery<any>({
    queryKey: ['checklist_settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('checklist_settings').select('*').limit(1).single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  });

  const handleTabChange = (value: string) => {
    const ref = value === 'timeline' ? timelineRef : dresscodeRef;
    ref.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  return (
    <div className="p-4">
      <div className="text-center mb-4">
        <p className="text-lg">Xin chào: <span className="font-bold">{guest.name}</span></p>
        <p className="text-slate-600">{guest.role}</p>
      </div>
      <div className="sticky top-0 z-10 bg-gradient-to-br from-[#fff5ea] to-[#e5b899] py-2 -mx-4 px-4">
        <Tabs defaultValue="timeline" onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:w-[400px] bg-primary/10 p-1 h-12 rounded-xl mx-auto">
            <TabsTrigger value="timeline" className="text-base rounded-lg text-slate-900 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md">Timeline</TabsTrigger>
            <TabsTrigger value="dresscode" className="text-base rounded-lg text-slate-900 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md">Dresscode</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div ref={timelineRef} className="pt-4">
        <TimelineDisplay events={timelineEvents} guest={guest} />
      </div>
      <div ref={dresscodeRef} className="pt-4">
        <DresscodeDisplay 
          title={settings?.dresscode_title} 
          images={settings?.dresscode_image_config?.images} 
        />
      </div>
    </div>
  );
};

export default PublicEventInfoTab;