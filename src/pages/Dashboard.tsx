import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardGuestsTab from "./dashboard/DashboardGuestsTab";
import DashboardTasksTab from "./dashboard/DashboardTasksTab";
import DashboardBenefitsTab from "./dashboard/DashboardBenefitsTab";
import { useQrScanner } from "@/contexts/QrScannerContext";
import { PageHeader } from "@/components/PageHeader";

const DashboardPage = () => {
  const { openScanner } = useQrScanner();
  const isMobile = useIsMobile();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['checklist_settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('checklist_settings').select('qr_scan_sound_url, default_dashboard_tab').limit(1).single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  });

  if (isLoading) {
    return <div className="p-4 md:p-6"><Skeleton className="h-screen w-full" /></div>;
  }

  const defaultTab = settings?.default_dashboard_tab || 'khach-moi';

  return (
    <div className="p-4 md:p-6 bg-transparent min-h-full">
      <PageHeader title="Thống kê">
        {!isMobile && (
          <div className="flex items-center gap-2">
            <Button onClick={openScanner}>
              <Camera className="mr-2 h-4 w-4" />
              Quét mã QR
            </Button>
          </div>
        )}
      </PageHeader>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-flex bg-primary/10 p-1 h-12 rounded-xl">
          <TabsTrigger value="khach-moi" className="text-base rounded-lg text-slate-900 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md">Khách mời</TabsTrigger>
          <TabsTrigger value="tac-vu" className="text-base rounded-lg text-slate-900 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md">Tác vụ</TabsTrigger>
          <TabsTrigger value="quyen-loi" className="text-base rounded-lg text-slate-900 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md">Quyền lợi</TabsTrigger>
        </TabsList>
        <TabsContent value="khach-moi" className="mt-4">
          <DashboardGuestsTab />
        </TabsContent>
        <TabsContent value="tac-vu" className="mt-4">
          <DashboardTasksTab />
        </TabsContent>
        <TabsContent value="quyen-loi" className="mt-4">
          <DashboardBenefitsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardPage;