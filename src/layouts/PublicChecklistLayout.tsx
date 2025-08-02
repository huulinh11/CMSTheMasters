import React from "react";
import PublicBottomNav from "@/components/public-checklist/PublicBottomNav";

interface PublicChecklistLayoutProps {
  children: React.ReactNode;
}

const PublicChecklistLayout: React.FC<PublicChecklistLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff5ea] to-[#e5b899]">
      <main className="pb-20">{children}</main>
      <PublicBottomNav />
    </div>
  );
};

export default PublicChecklistLayout;