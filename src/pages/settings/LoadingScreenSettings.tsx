import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { TextItem } from "@/types/profile-content";
import { showSuccess, showError } from "@/utils/toast";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Trash2 } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';

type LoaderConfig = {
  size: number;
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
};

type LoadingScreenSettingsData = {
  id: string;
  loader_config?: Partial<LoaderConfig>;
  loading_text_config?: Partial<TextItem>[];
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

const LoadingScreenSettings = () => {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<Partial<LoadingScreenSettingsData>>({});

  const { data, isLoading } = useQuery<LoadingScreenSettingsData | null>({
    queryKey: ['loading_screen_settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('checklist_settings').select('id, loader_config, loading_text_config').limit(1).single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  });

  useEffect(() => {
    if (data) {
      setSettings({
        ...data,
        loader_config: data.loader_config || { size: 48, marginTop: 0, marginRight: 0, marginBottom: 0, marginLeft: 0 },
        loading_text_config: data.loading_text_config || [],
      });
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: async (updatedSettings: Partial<LoadingScreenSettingsData>) => {
      const { error } = await supabase.from('checklist_settings').upsert({
        ...updatedSettings,
        id: settings.id || undefined,
      }, { onConflict: 'id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loading_screen_settings'] });
      queryClient.invalidateQueries({ queryKey: ['checklist_settings'] });
      showSuccess("Đã lưu cấu hình!");
    },
    onError: (error: Error) => showError(error.message),
  });

  const handleLoaderConfigChange = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      loader_config: { ...prev.loader_config, [field]: value },
    }));
  };

  const handleTextConfigChange = (id: string, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      loading_text_config: (prev.loading_text_config || []).map(item =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addTextItem = () => {
    const newItem: Partial<TextItem> = {
      id: uuidv4(),
      type: 'text',
      text: 'Nội dung mới',
      fontSize: 16,
      color: '#000000',
      fontWeight: 'normal',
      fontStyle: 'normal',
      fontFamily: 'sans-serif',
      marginTop: 10,
      marginRight: 0,
      marginBottom: 0,
      marginLeft: 0,
    };
    setSettings(prev => ({
      ...prev,
      loading_text_config: [...(prev.loading_text_config || []), newItem],
    }));
  };

  const removeTextItem = (id: string) => {
    setSettings(prev => ({
      ...prev,
      loading_text_config: (prev.loading_text_config || []).filter(item => item.id !== id),
    }));
  };

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cấu hình Icon Loader</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Kích thước (px)</Label>
            <Slider
              value={[settings.loader_config?.size || 48]}
              onValueChange={([val]) => handleLoaderConfigChange('size', val)}
              max={128}
              step={1}
            />
          </div>
          <div>
            <Label>Canh lề</Label>
            <MarginEditor
              values={settings.loader_config || {}}
              onChange={handleLoaderConfigChange}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cấu hình Text</CardTitle>
          <CardDescription>Thêm và tùy chỉnh các dòng text hiển thị dưới icon loader.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings.loading_text_config?.map(item => (
            <div key={item.id} className="p-4 border rounded-lg space-y-3 relative">
              <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7" onClick={() => removeTextItem(item.id!)}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
              <div className="space-y-2">
                <Label>Nội dung</Label>
                <Input value={item.text} onChange={e => handleTextConfigChange(item.id!, 'text', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div><Label>Font</Label><Select value={item.fontFamily || 'sans-serif'} onValueChange={value => handleTextConfigChange(item.id!, 'fontFamily', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{fontFamilies.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Kiểu</Label><Select value={`${item.fontWeight || 'normal'}-${item.fontStyle || 'normal'}`} onValueChange={value => { const [fontWeight, fontStyle] = value.split('-'); handleTextConfigChange(item.id!, 'fontWeight', fontWeight); handleTextConfigChange(item.id!, 'fontStyle', fontStyle);}}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="normal-normal">Thường</SelectItem><SelectItem value="bold-normal">Đậm</SelectItem><SelectItem value="normal-italic">Nghiêng</SelectItem><SelectItem value="bold-italic">Đậm Nghiêng</SelectItem></SelectContent></Select></div>
                <div><Label>Cỡ chữ (px)</Label><Input type="number" value={item.fontSize || 16} onChange={e => handleTextConfigChange(item.id!, 'fontSize', Number(e.target.value))} /></div>
                <div><Label>Màu chữ</Label><Input type="color" value={item.color || '#000000'} onChange={e => handleTextConfigChange(item.id!, 'color', e.target.value)} className="p-1 h-10" /></div>
              </div>
              <div><Label>Canh lề</Label><MarginEditor values={item} onChange={(field, value) => handleTextConfigChange(item.id!, field, value)} /></div>
            </div>
          ))}
          <Button variant="outline" onClick={addTextItem}>
            <PlusCircle className="mr-2 h-4 w-4" /> Thêm dòng text
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => mutation.mutate(settings)} disabled={mutation.isPending}>
          {mutation.isPending ? 'Đang lưu...' : 'Lưu cấu hình'}
        </Button>
      </div>
    </div>
  );
};

export default LoadingScreenSettings;