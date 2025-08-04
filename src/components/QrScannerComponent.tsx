import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from "./ui/button";
import { X } from "lucide-react";

interface QrScannerComponentProps {
  onScan: (data: string | null) => void;
  onClose: () => void;
}

const QrScannerComponent = ({ onScan, onClose }: QrScannerComponentProps) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      rememberLastUsedCamera: true,
    };

    const html5QrCode = new Html5Qrcode('qr-reader-container');
    scannerRef.current = html5QrCode;

    const startCamera = async () => {
      try {
        await html5QrCode.start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            onScan(decodedText);
          },
          (errorMessage) => {
            // ignore scan errors
          }
        );
      } catch (err) {
        console.error("Unable to start QR scanner.", err);
      }
    };

    startCamera();

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(err => {
          console.error("Failed to stop the scanner.", err);
        });
      }
    };
  }, [onScan]);

  return (
    <div className="relative w-full max-w-md mx-auto aspect-square overflow-hidden rounded-lg bg-black">
      <div id="qr-reader-container" className="w-full h-full"></div>
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
        <p className="text-white bg-black/50 px-3 py-1 rounded-md">Hướng camera về phía mã QR</p>
        <Button variant="destructive" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default QrScannerComponent;