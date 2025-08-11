import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";

interface PageHeaderProps {
  title: string;
  children?: React.ReactNode;
}

export const PageHeader = ({ title, children }: PageHeaderProps) => {
  const { profile, user, menuConfig } = useAuth();
  const isMobile = useIsMobile();
  const location = useLocation();
  const displayName = profile?.full_name || user?.email?.split('@')[0];

  const isDefaultPage = menuConfig.length > 0 && location.pathname === menuConfig[0].to;

  return (
    <header className="flex flex-wrap justify-between items-center gap-4 mb-4 md:mb-6">
      <div className="flex items-baseline gap-2">
        <h1 className="text-xl font-bold text-slate-800">{title}</h1>
        {isMobile && isDefaultPage && (
          <div className="text-sm text-slate-600 font-medium whitespace-nowrap">
            {displayName}
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        {children}
      </div>
    </header>
  );
};