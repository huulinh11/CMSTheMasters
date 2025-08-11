import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { showSuccess, showError } from "@/utils/toast";
import { Upload } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type GeneralSettingsData = {
  id: string;
  qr_scan_sound_url?: string | null;
  default_dashboard_tab?: 'khach-moi' | 'tac-vu' | 'quyen-loi' | null;
  service_commission_rate?: number | null; // Thêm trường mới
};

const GeneralSettings = () => {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<Partial<GeneralSettingsData>>({});
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery<GeneralSettingsData | null>({
    queryKey: ['general_settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('checklist_settings').select('id, qr_scan_sound_url, default_dashboard_tab, service_commission_rate').limit(1).single();
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
    mutationFn: async (updatedSettings: Partial<GeneralSettingsData>) => {
      const { error } = await supabase.from('checklist_settings').upsert({
        ...updatedSettings,
        id: settings.id || undefined,
      }, { onConflict: 'id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['general_settings'] });
      queryClient.invalidateQueries({ queryKey: ['checklist_settings'] });
      showSuccess("Đã lưu cấu hình!");
    },
    onError: (error: Error) => showError(error.message),
  });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'audio/mpeg') {
      showError("Vui lòng chỉ tải lên file MP3.");
      return;
    }

    setIsUploading(true);
    try {
      const filePath = `public/assets/qr-scan-success.mp3`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      const urlWithCacheBuster = `${publicUrl}?t=${new Date().getTime()}`;

      setSettings(prev => ({ ...prev, qr_scan_sound_url: urlWithCacheBuster }));
      showSuccess("Tải lên thành công! Nhấn 'Lưu' để áp dụng.");
    } catch (error: any) {
      showError(`Lỗi tải lên: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfigChange = (field: keyof GeneralSettingsData, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cấu hình Dashboard</CardTitle>
          <CardDescription>Chọn tab mặc định khi truy cập trang Dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <Label>Tab mặc định</Label>
          <Select
            value={settings.default_dashboard_tab || 'khach-moi'}
            onValueChange={(value) => handleConfigChange('default_dashboard_tab', value)}
          >
            <SelectTrigger className="max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="khach-moi">Khách mời</SelectItem>
              <SelectItem value="tac-vu">Tác vụ</SelectItem>
              <SelectItem value="quyen-loi">Quyền lợi</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cấu hình Hoa hồng</CardTitle>
          <CardDescription>Cài đặt tỷ lệ hoa hồng cho các dịch vụ bán thêm.</CardDescription>
        </CardHeader>
        <CardContent>
          <Label htmlFor="commission-rate">Tỷ lệ hoa hồng dịch vụ (%)</Label>
          <Input
            id="commission-rate"
            type="number"
            value={(settings.service_commission_rate || 0) * 100}
            onChange={(e) => handleConfigChange('service_commission_rate', Number(e.target.value) / 100)}
            className="max-w-xs"
            placeholder="Ví dụ: 10"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Âm thanh quét QR thành công</CardTitle>
          <CardDescription>Tải lên file âm thanh (MP3) để phát khi quét mã QR thành công.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
              <Upload className="mr-2 h-4 w-4" />
              {isUploading ? 'Đang tải...' : 'Tải lên file MP3'}
            </Button>
            <Input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".mp3"
              onChange={handleFileChange}
            />
          </div>
          {settings.qr_scan_sound_url && (
            <div>
              <Label>Nghe thử âm thanh hiện tại</Label>
              <audio controls src={settings.qr_scan_sound_url} className="w-full mt-2">
                Trình duyệt của bạn không hỗ trợ thẻ audio.
              </audio>
            </div>
          )}
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

export default GeneralSettings;