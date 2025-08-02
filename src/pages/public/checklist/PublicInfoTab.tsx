import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOutletContext } from "react-router-dom";
import { ChecklistDataContext } from "../PublicChecklist";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Save } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";

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
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [materials, setMaterials] = useState(guest.materials || "");

  useEffect(() => {
    setMaterials(guest.materials || "");
  }, [guest.materials]);

  const mutation = useMutation({
    mutationFn: async (newMaterials: string) => {
      const tableName = guest.type === 'Chức vụ' ? 'vip_guests' : 'guests';
      const { error } = await supabase
        .from(tableName)
        .update({ materials: newMaterials })
        .eq('id', guest.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public_checklist', guest.phone] });
      showSuccess("Cập nhật tư liệu thành công!");
      setIsEditing(false);
    },
    onError: (error: Error) => {
      showError(`Lỗi: ${error.message}`);
    }
  });

  const handleSave = () => {
    mutation.mutate(materials);
  };

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
          
          <div className="py-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-slate-500">Tư liệu</span>
              {!isEditing ? (
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" /> Sửa
                </Button>
              ) : (
                <Button variant="ghost" size="sm" onClick={handleSave} disabled={mutation.isPending}>
                  <Save className="h-4 w-4 mr-2" /> {mutation.isPending ? 'Đang lưu...' : 'Lưu'}
                </Button>
              )}
            </div>
            {isEditing ? (
              <Textarea
                value={materials}
                onChange={(e) => setMaterials(e.target.value)}
                className="min-h-[150px] bg-slate-50 text-sm"
                placeholder="Nhập tư liệu..."
                autoFocus
              />
            ) : (
              <div className="p-2 border rounded-md bg-slate-50 text-sm whitespace-pre-wrap min-h-[40px]">
                {materials || <span className="text-slate-400">Chưa có tư liệu.</span>}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PublicInfoTab;