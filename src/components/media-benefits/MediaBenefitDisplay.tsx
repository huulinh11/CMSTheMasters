import { Button } from "@/components/ui/button";
import { CheckCircle2, PlusCircle, Link as LinkIcon } from "lucide-react";

interface MediaBenefitDisplayProps {
  data: any;
  onClick: () => void;
  label: string;
}

export const MediaBenefitDisplay = ({ data, onClick, label }: MediaBenefitDisplayProps) => {
  const hasData = (data: any) => {
    if (!data) return false;
    if (Array.isArray(data)) return data.length > 0;
    if (typeof data === 'object') return Object.values(data).some(v => !!v);
    return !!data;
  };

  const isAvailable = hasData(data);

  return (
    <Button variant="ghost" onClick={onClick} className="h-auto p-1 text-left justify-start w-full">
      {isAvailable ? (
        <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
      ) : (
        <PlusCircle className="h-4 w-4 text-slate-400 mr-2 flex-shrink-0" />
      )}
      <span className="truncate">{label}</span>
    </Button>
  );
};

export const LinkDisplay = ({ link, onClick }: { link?: string | null, onClick: () => void }) => {
  return (
    <Button variant="ghost" onClick={onClick} className="h-auto p-1 text-left justify-start w-full">
      {link ? (
        <LinkIcon className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" />
      ) : (
        <PlusCircle className="h-4 w-4 text-slate-400 mr-2 flex-shrink-0" />
      )}
      <span className="truncate">{link || "Thêm link"}</span>
    </Button>
  );
};