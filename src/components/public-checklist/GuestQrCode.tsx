import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QRCodeCanvas } from "qrcode.react";
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
          Chụp lại màn hình để ekip Check-in và cập nhật từng tác vụ cho bạn
        </p>
      </CardContent>
    </Card>
  );
};