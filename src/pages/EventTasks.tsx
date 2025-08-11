import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VipTasksTab } from "./event-tasks/VipTasksTab";
import { RegularTasksTab } from "./event-tasks/RegularTasksTab";
import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";

const EventTasksPage = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("vip");
  const guestId = searchParams.get('guestId');

  const { data: guestType } = useQuery({
    queryKey: ['guest_type_check', guestId],
    queryFn: async () => {
      if (!guestId) return null;

      // Check if it's a VIP guest
      const { data: vipGuest, error: vipError } = await supabase
        .from('vip_guests')
        .select('id')
        .eq('id', guestId)
        .single();
      
      if (vipError && vipError.code !== 'PGRST116') throw vipError;
      if (vipGuest) return 'vip';

      // Check if it's a regular guest
      const { data: regularGuest, error: regularError } = await supabase
        .from('guests')
        .select('id')
        .eq('id', guestId)
        .single();
      
      if (regularError && regularError.code !== 'PGRST116') throw regularError;
      if (regularGuest) return 'regular';

      return null; // Guest not found in either table
    },
    enabled: !!guestId,
  });

  useEffect(() => {
    if (guestType) {
      setActiveTab(guestType);
    }
  }, [guestType]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className="p-4 md:p-6">
      <PageHeader title="Tác vụ sự kiện" />
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px] bg-primary/10 p-1 h-12 rounded-xl">
          <TabsTrigger value="vip" className="text-base rounded-lg text-slate-900 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md">Chức vụ</TabsTrigger>
          <TabsTrigger value="regular" className="text-base rounded-lg text-slate-900 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md">Khách mời</TabsTrigger>
        </TabsList>
        <TabsContent value="vip" className="mt-4">
          <VipTasksTab />
        </TabsContent>
        <TabsContent value="regular" className="mt-4">
          <RegularTasksTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EventTasksPage;