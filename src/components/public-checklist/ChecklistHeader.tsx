import { Guest } from "@/types/guest";
import { VipGuest } from "@/types/vip-guest";

type CombinedGuest = (Guest | VipGuest) & { type: 'Chức vụ' | 'Khách mời', secondaryInfo?: string };

interface ChecklistHeaderProps {
  guest: CombinedGuest;
}

export const ChecklistHeader = ({ guest }: ChecklistHeaderProps) => {
  return (
    <div className="p-4 md:p-6 bg-slate-50 border-b border-slate-200">
      <h1 className="text-2xl md:text-3xl font-bold text-primary">{guest.name}</h1>
      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm md:text-base text-slate-600">
        <InfoItem label="ID" value={guest.id} />
        <InfoItem label="Vai trò" value={guest.role} />
        {guest.phone && (
          <div>
            <span className="font-semibold text-slate-800">SĐT:</span>{' '}
            <a href={`tel:${guest.phone}`} className="hover:underline">{guest.phone}</a>
          </div>
        )}
        {guest.secondaryInfo && <InfoItem label="Thông tin phụ" value={guest.secondaryInfo} />}
      </div>
    </div>
  );
};

const InfoItem = ({ label, value }: { label: string, value: string }) => (
  <div>
    <span className="font-semibold text-slate-800">{label}:</span> {value}
  </div>
);