import React, { useState, useEffect, useRef, useCallback } from "react";
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
  const isProcessingScanRef = useRef(false);
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

  // Effect này sẽ đặt lại khóa xử lý một cách đáng tin cậy mỗi khi máy quét được đóng.
  useEffect(() => {
    if (!isScannerOpen) {
      isProcessingScanRef.current = false;
    }
  }, [isScannerOpen]);

  const handleScan = useCallback((scannedUrl: string | null) => {
    if (isProcessingScanRef.current || !scannedUrl) return;

    try {
      const url = new URL(scannedUrl);
      const guestId = url.searchParams.get('guestId');
      if (guestId) {
        isProcessingScanRef.current = true;
        audioPlayer.play();
        setIsScannerOpen(false);
        navigate(`/event-tasks?guestId=${guestId}`);
      } else {
        showError("Mã QR không hợp lệ (thiếu guestId).");
      }
    } catch (error) {
      showError("Mã QR không phải là một URL hợp lệ.");
    }
  }, [navigate]);

  const openScanner = () => {
    // Đặt lại khóa ngay lập tức khi mở, để đảm bảo an toàn.
    isProcessingScanRef.current = false;
    setIsScannerOpen(true);
  };

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
        <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
          <DialogContent className="p-0 bg-transparent border-none max-w-md">
            {/* Chỉ render máy quét khi nó được mở */}
            {isScannerOpen && <QrScannerComponent onScan={handleScan} onClose={() => setIsScannerOpen(false)} />}
          </DialogContent>
        </Dialog>
      </div>
    </QrScannerProvider>
  );
};

export default Layout;