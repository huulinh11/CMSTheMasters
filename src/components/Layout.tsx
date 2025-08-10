import React, { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import { QrScannerProvider } from "@/contexts/QrScannerContext";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import QrScannerComponent from "@/components/QrScannerComponent";
import { useNavigate } from "react-router-dom";
import { showError } from "@/utils/toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isMobile = useIsMobile();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isProcessingScan, setIsProcessingScan] = useState(false);
  const navigate = useNavigate();

  const { data: settings } = useQuery({
    queryKey: ['checklist_settings_for_scanner'],
    queryFn: async () => {
      const { data, error } = await supabase.from('checklist_settings').select('qr_scan_sound_url').limit(1).single();
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

  const openScanner = () => setIsScannerOpen(true);

  return (
    <QrScannerProvider openScanner={openScanner}>
      <div className="flex h-[100dvh] bg-transparent">
        {!isMobile && <Sidebar />}
        <div className="flex flex-1 flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
          {isMobile && <BottomNav />}
        </div>
        <Dialog open={isScannerOpen} onOpenChange={handleScannerOpenChange}>
          <DialogContent className="p-0 bg-transparent border-none max-w-md">
            <QrScannerComponent onScan={handleScan} onClose={() => setIsScannerOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
    </QrScannerProvider>
  );
};

export default Layout;