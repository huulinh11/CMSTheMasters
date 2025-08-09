import { Loader2 } from "lucide-react";

const LoadingScreen = () => {
  return (
    <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-[#fff5ea] to-[#e5b899]">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
};

export default LoadingScreen;