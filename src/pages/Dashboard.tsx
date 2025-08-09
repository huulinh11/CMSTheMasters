import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Camera, Settings } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import QrScannerComponent from "@/components/QrScannerComponent";
import { useNavigate } from "react-router-dom";
import { showError } from "@/utils/toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardGuestsTab from "./dashboard/DashboardGuestsTab";
import DashboardTasksTab from "./dashboard/DashboardTasksTab";
import DashboardBenefitsTab from "./dashboard/DashboardBenefitsTab";

const audioPlayer = {
  audio: null as HTMLAudioElement | null,
  init(url: string) {
    if (this.audio?.src !== url) {
      this.audio = new Audio(url);
    }
  },
  play() {
    this.audio?.play().catch(err => console.error("Audio play failed:", err));
  }
};

const DashboardPage = () => {
  const { profile, user } = useAuth();
  const displayName = profile?.full_name || user?.email?.split('@')[0];
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isProcessingScan, setIsProcessingScan] = useState(false);
  const navigate = useNavigate();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['checklist_settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('checklist_settings').select('qr_scan_sound_url, default_dashboard_tab').limit(1).single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  });

  useEffect(() => {
    if (settings?.qr_scan_sound_url) {
      audioPlayer.init(settings.qr_scan_sound_url);
    }
  }, [settings]);

  const handleScan = (scannedUrl: string | null) => {
    if (isProcessingScan || !scannedUrl) return;

    try {
      const url = new URL(scannedUrl);
      const guestId = url.searchParams.get('guestId');
      if (guestId) {
        setIsProcessingScan(true);
        audioPlayer.play();
        setIsScannerOpen(false);
        navigate(`/event-tasks?guestId=${guestId}`);
      } else {
        showError("Mã QR không hợp lệ (thiếu guestId).");
      }
    } catch (error) {
      showError("Mã QR không phải là một URL hợp lệ.");
    }
  };

  const handleScannerOpenChange = (isOpen: boolean) => {
    setIsScannerOpen(isOpen);
    if (!isOpen) {
      setIsProcessingScan(false);
    }
  };

  if (isLoading) {
    return <div className="p-4 md:p-6"><Skeleton className="h-screen w-full" /></div>;
  }

  const defaultTab = settings?.default_dashboard_tab || 'khach-moi';

  return (
    <div className="p-4 md:p-6 bg-transparent min-h-full">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl text-slate-800">
          <span className="font-normal">Hello </span>
          <span className="font-bold">{displayName}</span>
        </h1>
        <div className="flex items-center gap-2">
          <Button onClick={() => setIsScannerOpen(true)}>
            <Camera className="mr-2 h-4 w-4" />
            Quét mã QR
          </Button>
          <Button variant="outline" onClick={() => navigate('/settings')}>
            <Settings className="mr-2 h-4 w-4" />
            Cấu hình
          </Button>
        </div>
      </header>

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

      <Dialog open={isScannerOpen} onOpenChange={handleScannerOpenChange}>
        <DialogContent className="p-0 bg-transparent border-none max-w-md">
          <QrScannerComponent onScan={handleScan} onClose={() => setIsScannerOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardPage;