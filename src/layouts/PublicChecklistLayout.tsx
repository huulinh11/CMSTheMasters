import React from "react";
import PublicBottomNav from "@/components/public-checklist/PublicBottomNav";

interface PublicChecklistLayoutProps {
  children: React.ReactNode;
}

const PublicChecklistLayout: React.FC<PublicChecklistLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff5ea] to-[#e5b899] md:flex md:justify-center md:items-center md:p-4">
      <div className="w-full md:max-w-[420px] md:h-[90vh] md:max-h-[800px] bg-transparent md:shadow-lg relative md:rounded-2xl overflow-hidden flex flex-col min-h-screen md:min-h-0">
        <main className="flex-1 overflow-y-auto pb-16">{children}</main>
        <PublicBottomNav />
      </div>
    </div>
  );
};

export default PublicChecklistLayout;