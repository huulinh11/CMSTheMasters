import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOutletContext } from "react-router-dom";
import { ChecklistDataContext } from "../PublicChecklist";

const InfoRow = ({ label, value }: { label: string, value?: string | null }) => {
  if (!value) return null;
  return (
    <div className="flex justify-between border-b py-2 last:border-b-0">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
};

const PublicInfoTab = () => {
  const { guest } = useOutletContext<ChecklistDataContext>();

  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>Thông tin của bạn</CardTitle>
        </CardHeader>
        <CardContent>
          <InfoRow label="ID" value={guest.id} />
          <InfoRow label="Tên" value={guest.name} />
          <InfoRow label="SĐT" value={guest.phone} />
          <InfoRow label="Vai trò" value={guest.role} />
          {guest.secondaryInfo && <InfoRow label="Thông tin phụ" value={guest.secondaryInfo} />}
          {guest.materials && (
            <div className="py-2">
              <span className="text-slate-500">Tư liệu</span>
              <div className="mt-1 p-2 border rounded-md max-h-40 overflow-y-auto bg-slate-50 text-sm whitespace-pre-wrap">
                {guest.materials}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PublicInfoTab;