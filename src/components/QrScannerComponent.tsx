import { Scanner } from '@yudiel/react-qr-scanner';
import { Button } from "./ui/button";
import { X } from "lucide-react";
import { Result } from '@zxing/library';

interface QrScannerComponentProps {
  onScan: (data: string | null) => void;
  onClose: () => void;
}

const QrScannerComponent = ({ onScan, onClose }: QrScannerComponentProps) => {
  return (
    <div className="relative w-full max-w-md mx-auto aspect-square overflow-hidden rounded-lg">
      <Scanner
        onResult={(result: Result) => onScan(result.getText())}
        onError={(error) => {
          if (error instanceof Error) {
            console.info("QR Scanner Error:", error.message);
          }
        }}
        constraints={{
            facingMode: 'environment'
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

export default QrScannerComponent;