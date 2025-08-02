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
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

type LogoConfig = {
  imageUrl: string;
  imageSourceType: 'url' | 'upload';
  width: number;
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
};

type ChecklistSettings = {
  id: string;
  logo_config: Partial<LogoConfig>;
  title_config: Partial<TextItem>;
};

const fontFamilies = [
  { value: 'sans-serif', label: 'Mặc định (Sans-serif)' },
  { value: 'serif', label: 'Serif' },
  { value: 'monospace', label: 'Monospace' },
  { value: 'cursive', label: 'Cursive' },
  { value: 'fantasy', label: 'Fantasy' },
];

const MarginEditor = ({ values, onChange }: { values: { marginTop?: number, marginRight?: number, marginBottom?: number, marginLeft?: number }, onChange: (field: string, value: number) => void }) => (
  <div className="grid grid-cols-4 gap-2">
    <div><Label className="text-xs">M.Top</Label><Input type="number" value={values.marginTop || 0} onChange={e => onChange('marginTop', Number(e.target.value))} /></div>
    <div><Label className="text-xs">M.Right</Label><Input type="number" value={values.marginRight || 0} onChange={e => onChange('marginRight', Number(e.target.value))} /></div>
    <div><Label className="text-xs">M.Bottom</Label><Input type="number" value={values.marginBottom || 0} onChange={e => onChange('marginBottom', Number(e.target.value))} /></div>
    <div><Label className="text-xs">M.Left</Label><Input type="number" value={values.marginLeft || 0} onChange={e => onChange('marginLeft', Number(e.target.value))} /></div>
  </div>
);

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
      setSettings({
        ...data,
        logo_config: data.logo_config || {},
        title_config: data.title_config || {},
      });
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: async (updatedSettings: Partial<ChecklistSettings>) => {
      const { error } = await supabase.from('checklist_settings').upsert({
        ...updatedSettings,
        id: settings.id || undefined,
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

  const handleConfigChange = (configType: 'logo_config' | 'title_config', field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [configType]: {
        ...prev[configType],
        [field]: value,
      },
    }));
  };

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cấu hình Logo</CardTitle>
          <CardDescription>Tùy chỉnh hiển thị logo trên trang checklist.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup value={settings.logo_config?.imageSourceType || 'url'} onValueChange={(value) => handleConfigChange('logo_config', 'imageSourceType', value)} className="flex gap-4">
            <div className="flex items-center space-x-2"><RadioGroupItem value="url" id="logo-url" /><Label htmlFor="logo-url">Nhập link</Label></div>
            <div className="flex items-center space-x-2"><RadioGroupItem value="upload" id="logo-upload" /><Label htmlFor="logo-upload">Tải ảnh</Label></div>
          </RadioGroup>
          {(settings.logo_config?.imageSourceType === 'url' || !settings.logo_config?.imageSourceType) 
            ? <Input placeholder="URL logo" value={settings.logo_config?.imageUrl || ''} onChange={(e) => handleConfigChange('logo_config', 'imageUrl', e.target.value)} /> 
            : <ImageUploader guestId="checklist-settings" onUploadSuccess={url => handleConfigChange('logo_config', 'imageUrl', url)} />}
          
          <div><Label>Rộng (%)</Label><Slider value={[settings.logo_config?.width || 100]} onValueChange={([val]) => handleConfigChange('logo_config', 'width', val)} max={100} step={1} /></div>
          <div><Label>Canh lề</Label><MarginEditor values={settings.logo_config || {}} onChange={(field, value) => handleConfigChange('logo_config', field, value)} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cấu hình Tiêu đề</CardTitle>
          <CardDescription>Tùy chỉnh hiển thị tiêu đề chính trên trang checklist.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nội dung</Label>
            <Input placeholder="The Masters Beauty Of Vietnam 2025" value={settings.title_config?.text || ''} onChange={(e) => handleConfigChange('title_config', 'text', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><Label>Font</Label><Select value={settings.title_config?.fontFamily || 'sans-serif'} onValueChange={value => handleConfigChange('title_config', 'fontFamily', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{fontFamilies.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Kiểu</Label><Select value={`${settings.title_config?.fontWeight || 'bold'}-${settings.title_config?.fontStyle || 'normal'}`} onValueChange={value => { const [fontWeight, fontStyle] = value.split('-'); handleConfigChange('title_config', 'fontWeight', fontWeight); handleConfigChange('title_config', 'fontStyle', fontStyle);}}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="normal-normal">Thường</SelectItem><SelectItem value="bold-normal">Đậm</SelectItem><SelectItem value="normal-italic">Nghiêng</SelectItem><SelectItem value="bold-italic">Đậm Nghiêng</SelectItem></SelectContent></Select></div>
            <div><Label>Cỡ chữ (px)</Label><Input type="number" value={settings.title_config?.fontSize || 24} onChange={e => handleConfigChange('title_config', 'fontSize', Number(e.target.value))} /></div>
            <div><Label>Màu chữ</Label><Input type="color" value={settings.title_config?.color || '#000000'} onChange={e => handleConfigChange('title_config', 'color', e.target.value)} className="p-1 h-10" /></div>
          </div>
          <div><Label>Canh lề</Label><MarginEditor values={settings.title_config || {}} onChange={(field, value) => handleConfigChange('title_config', field, value)} /></div>
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