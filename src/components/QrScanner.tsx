import { QrReader } from "react-qr-reader";
import { Button } from "./ui/button";
import { X } from "lucide-react";

interface QrScannerProps {
  onScan: (data: string | null) => void;
  onClose: () => void;
}

const QrScanner = ({ onScan, onClose }: QrScannerProps) => {
  return (
    <div className="relative w-full max-w-md mx-auto">
      <QrReader
        onResult={(result, error) => {
          if (!!result) {
            onScan(result?.getText());
          }

          if (!!error) {
            // You can log the error if needed, but we don't want to show an error for every frame that doesn't have a QR code.
            // console.info(error);
          }
        }}
        constraints={{ facingMode: "environment" }}
        containerStyle={{ width: "100%", paddingTop: "100%", position: "relative" }}
        videoContainerStyle={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
        videoStyle={{ objectFit: "cover" }}
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