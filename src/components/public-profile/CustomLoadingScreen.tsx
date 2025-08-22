import { Loader2 } from "lucide-react";
import { TextItem } from "@/types/profile-content";

type LoaderConfig = {
  size?: number;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
};

interface CustomLoadingScreenProps {
  loaderConfig?: Partial<LoaderConfig> | null;
  textConfig?: Partial<TextItem>[] | null;
}

const CustomLoadingScreen = ({ loaderConfig, textConfig }: CustomLoadingScreenProps) => {
  const loaderStyle = {
    width: `${loaderConfig?.size || 48}px`,
    height: `${loaderConfig?.size || 48}px`,
    marginTop: `${loaderConfig?.marginTop || 0}px`,
    marginRight: `${loaderConfig?.marginRight || 0}px`,
    marginBottom: `${loaderConfig?.marginBottom || 0}px`,
    marginLeft: `${loaderConfig?.marginLeft || 0}px`,
  };

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#fff5ea] to-[#e5b899] p-4">
      <Loader2 className="animate-spin text-primary" style={loaderStyle} />
      {textConfig?.map(item => (
        <p
          key={item.id}
          className="text-center"
          style={{
            fontSize: `${item.fontSize || 16}px`,
            color: item.color || '#000000',
            fontWeight: item.fontWeight || 'normal',
            fontStyle: item.fontStyle || 'normal',
            fontFamily: item.fontFamily || 'sans-serif',
            marginTop: `${item.marginTop || 0}px`,
            marginRight: `${item.marginRight || 0}px`,
            marginBottom: `${item.marginBottom || 0}px`,
            marginLeft: `${item.marginLeft || 0}px`,
          }}
        >
          {item.text}
        </p>
      ))}
    </div>
  );
};

export default CustomLoadingScreen;