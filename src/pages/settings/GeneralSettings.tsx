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

type GeneralSettingsData = {
  id: string;
  qr_scan_sound_url?: string | null;
};

const GeneralSettings = () => {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<Partial<GeneralSettingsData>>({});
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery<GeneralSettingsData | null>({
    queryKey: ['general_settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('checklist_settings').select('id, qr_scan_sound_url').limit(1).single();
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
      
      // Add a timestamp to bust the cache
      const urlWithCacheBuster = `${publicUrl}?t=${new Date().getTime()}`;

      setSettings(prev => ({ ...prev, qr_scan_sound_url: urlWithCacheBuster }));
      showSuccess("Tải lên thành công! Nhấn 'Lưu' để áp dụng.");
    } catch (error: any) {
      showError(`Lỗi tải lên: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="space-y-6">
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