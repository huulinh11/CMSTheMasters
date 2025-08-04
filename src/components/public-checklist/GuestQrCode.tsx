import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QRCodeCanvas } from "qrcode.react";
import { Download } from "lucide-react";
import { useRef, useEffect, useState } from "react";

interface GuestQrCodeProps {
  guestId: string;
  guestName: string;
}

export const GuestQrCode = ({ guestId, guestName }: GuestQrCodeProps) => {
  const qrRef = useRef<HTMLDivElement>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  useEffect(() => {
    // Ensure this runs only on the client side where window is available
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/event-tasks?guestId=${guestId}`;
      setQrCodeUrl(url);
    }
  }, [guestId]);

  const handleDownload = () => {
    if (qrRef.current) {
      const canvas = qrRef.current.querySelector("canvas");
      if (canvas) {
        const link = document.createElement("a");
        link.download = `QR-Code-${guestName.replace(/\s+/g, '-')}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">Mã QR Check-in</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center gap-4">
        <div ref={qrRef} className="p-2 bg-white rounded-lg">
          {qrCodeUrl ? (
            <QRCodeCanvas value={qrCodeUrl} size={200} />
          ) : (
            <div className="w-[200px] h-[200px] bg-gray-200 animate-pulse rounded-lg" />
          )}
        </div>
        <p className="text-sm text-center text-slate-600">
          Sử dụng mã này tại sự kiện để nhân viên check-in và cập nhật tác vụ cho bạn nhanh chóng.
        </p>
        <Button onClick={handleDownload} variant="outline" className="w-full">
          <Download className="mr-2 h-4 w-4" />
          Tải mã QR
        </Button>
      </CardContent>
    </Card>
  );
};