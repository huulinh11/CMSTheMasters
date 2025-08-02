import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { TextItem } from "@/types/profile-content";
import { useEffect, useState } from "react";
import { showSuccess, showError } from "@/utils/toast";
import { ImageUploader } from "@/components/public-user/ImageUploader";

type ChecklistSettings = {
  id: string;
  logo_url: string;
  title_config: TextItem;
};

const ChecklistSettings = () => {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<Partial<ChecklistSettings>>({});

  const { data, isLoading } = useQuery<ChecklistSettings | null>({
    queryKey: ['checklist_settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('checklist_settings').select('*').limit(1).single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  });

  useEffect(() => {
    if (data) {
      setSettings(data);
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: async (updatedSettings: Partial<ChecklistSettings>) => {
      const { error } = await supabase.from('checklist_settings').upsert({
        ...updatedSettings,
        id: settings.id || undefined, // Use existing id or let db generate one
      }, { onConflict: 'id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist_settings'] });
      showSuccess("Đã lưu cấu hình!");
    },
    onError: (error: Error) => showError(error.message),
  });

  const handleSave = () => {
    mutation.mutate(settings);
  };

  const handleTitleChange = (field: keyof TextItem, value: any) => {
    setSettings(prev => ({
      ...prev,
      title_config: {
        ...prev.title_config,
        id: prev.title_config?.id || '',
        type: 'text',
        text: prev.title_config?.text || '',
        [field]: value,
      } as TextItem,
    }));
  };

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Logo & Tiêu đề</CardTitle>
          <CardDescription>Cấu hình logo và tiêu đề chính hiển thị trên trang checklist.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Logo sự kiện</Label>
            <div className="flex items-center gap-4">
              <Input
                placeholder="URL logo"
                value={settings.logo_url || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, logo_url: e.target.value }))}
              />
              <ImageUploader guestId="checklist-settings" onUploadSuccess={url => setSettings(prev => ({ ...prev, logo_url: url }))} />
            </div>
            {settings.logo_url && <img src={settings.logo_url} alt="Logo preview" className="h-20 mt-2 border rounded-md p-2" />}
          </div>
          <div className="space-y-2">
            <Label>Tiêu đề</Label>
            <Input
              placeholder="The Masters Beauty Of Vietnam 2025"
              value={settings.title_config?.text || ''}
              onChange={(e) => handleTitleChange('text', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Cỡ chữ (px)</Label>
              <Input type="number" value={settings.title_config?.fontSize || 24} onChange={e => handleTitleChange('fontSize', Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Màu chữ</Label>
              <Input type="color" value={settings.title_config?.color || '#000000'} onChange={e => handleTitleChange('color', e.target.value)} className="p-1 h-10" />
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={mutation.isPending}>
          {mutation.isPending ? 'Đang lưu...' : 'Lưu cấu hình'}
        </Button>
      </div>
    </div>
  );
};

export default ChecklistSettings;