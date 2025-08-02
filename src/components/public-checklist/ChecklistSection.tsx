import React from "react";

interface ChecklistSectionProps {
  title: string;
  children: React.ReactNode;
}

export const ChecklistSection = ({ title, children }: ChecklistSectionProps) => {
  return (
    <div className="p-4 md:p-6 border-b border-slate-200 last:border-b-0">
      <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-4">{title}</h2>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
};