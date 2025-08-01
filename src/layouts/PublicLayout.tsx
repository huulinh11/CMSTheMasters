import React from "react";

interface PublicLayoutProps {
  children: React.ReactNode;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-100">
      <main>{children}</main>
    </div>
  );
};

export default PublicLayout;