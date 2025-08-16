import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { HonorCategory } from "@/types/honor-roll";
import { Guest } from "@/types/guest";
import { VipGuest } from "@/types/vip-guest";
import { RoleConfiguration } from "@/types/role-configuration";
import { HonorRollTab } from "@/components/honor-roll/HonorRollTab";
import { PresentersTab } from "@/components/honor-roll/PresentersTab";

const HonorRollSettings = () => {
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery<HonorCategory[]>({
    queryKey: ['honor_categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('honor_categories').select('*').order('order');
      if (error) throw error;
      return data || [];
    }
  });

  const { data: guests = [], isLoading: isLoadingGuests } = useQuery<(Guest | VipGuest)[]>({
    queryKey: ['all_guests_for_honor_roll'],
    queryFn: async () => {
      const { data: vips } = await supabase.from('vip_guests').select('*');
      const { data: regulars } = await supabase.from('guests').select('*');
      return [...(vips || []), ...(regulars || [])];
    }
  });

  const { data: vipGuests = [], isLoading: isLoadingVipGuests } = useQuery<VipGuest[]>({
    queryKey: ['vip_guests_for_honor_roll'],
    queryFn: async () => {
      const { data, error } = await supabase.from('vip_guests').select('*');
      if (error) throw error;
      return data || [];
    }
  });

  const { data: roleConfigs = [], isLoading: isLoadingRoles } = useQuery<RoleConfiguration[]>({
    queryKey: ['role_configurations'],
    queryFn: async () => {
      const { data, error } = await supabase.from('role_configurations').select('*');
      if (error) throw error;
      return data || [];
    }
  });

  const isLoading = isLoadingCategories || isLoadingGuests || isLoadingVipGuests || isLoadingRoles;

  return (
    <div className="space-y-4">
      <Tabs defaultValue="honor-roll" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px] bg-primary/10 p-1 h-12 rounded-xl">
          <TabsTrigger value="honor-roll" className="text-base rounded-lg text-slate-900 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md">Vinh danh</TabsTrigger>
          <TabsTrigger value="presenters" className="text-base rounded-lg text-slate-900 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md">Lên trao</TabsTrigger>
        </TabsList>
        <TabsContent value="honor-roll" className="mt-4">
          {isLoading ? <Skeleton className="h-96 w-full" /> : (
            <HonorRollTab
              categories={categories}
              allGuests={guests}
              vipGuests={vipGuests}
              roleConfigs={roleConfigs}
            />
          )}
        </TabsContent>
        <TabsContent value="presenters" className="mt-4">
          {isLoading ? <Skeleton className="h-96 w-full" /> : (
            <PresentersTab
              categories={categories}
              vipGuests={vipGuests}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HonorRollSettings;