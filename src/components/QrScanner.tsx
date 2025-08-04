import { QrScanner as ReactQrScanner } from '@yudiel/react-qr-scanner';
import { Button } from "./ui/button";
import { X } from "lucide-react";

interface QrScannerProps {
  onScan: (data: string | null) => void;
  onClose: () => void;
}

const QrScanner = ({ onScan, onClose }: QrScannerProps) => {
  return (
    <div className="relative w-full max-w-md mx-auto aspect-square overflow-hidden rounded-lg">
      <ReactQrScanner
        onDecode={(result) => onScan(result)}
        onError={(error) => {
          if (error) {
            console.info("QR Scanner Error:", error.message);
          }
        }}
        constraints={{
            facingMode: 'environment'
        }}
        styles={{
            container: {
                width: '100%',
                height: '100%',
            }
        }}
      />
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
        <p className="text-white bg-black/50 px-3 py-1 rounded-md">Hướng camera về phía mã QR</p>
        <Button variant="destructive" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default QrScanner;