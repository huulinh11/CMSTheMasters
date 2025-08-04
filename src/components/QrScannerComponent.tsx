import { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Button } from "./ui/button";
import { X } from "lucide-react";

interface QrScannerComponentProps {
  onScan: (data: string | null) => void;
  onClose: () => void;
}

const QrScannerComponent = ({ onScan, onClose }: QrScannerComponentProps) => {
  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;

    const onScanSuccess = (decodedText: string) => {
      if (scanner) {
        scanner.clear().catch(error => {
          console.error("Failed to clear html5-qrcode-scanner.", error);
        });
        onScan(decodedText);
      }
    };

    const onScanFailure = (error: any) => {
      // This function is called frequently, so we don't log errors to avoid spamming the console.
    };

    // Only initialize the scanner if the element exists
    const scannerElement = document.getElementById('qr-reader-container');
    if (scannerElement) {
      scanner = new Html5QrcodeScanner(
        'qr-reader-container', 
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );
      scanner.render(onScanSuccess, onScanFailure);
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(error => {
          console.error("Failed to clear html5-qrcode-scanner.", error);
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