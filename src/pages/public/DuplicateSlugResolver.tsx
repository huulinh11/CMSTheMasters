import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Loader2 } from 'lucide-react';

interface DuplicateSlugResolverProps {
  slug: string;
}

const DuplicateSlugResolver = ({ slug }: DuplicateSlugResolverProps) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      showError("Vui lòng điền tên của bạn.");
      return;
    }
    setIsLoading(true);
    try {
      // Call RPC function to handle resolution
      const { data, error } = await supabase.rpc('resolve_slug_conflict', {
        p_requested_slug: slug,
        p_provided_name: name,
        p_provided_phone: phone
      });

      if (error) throw error;

      if (data.status === 'approved') {
        showSuccess("Xác thực thành công! Đang chuyển hướng...");
        // Redirect to the correct profile
        navigate(`/profile/${data.new_slug}`, { replace: true });
      } else {
        // Status is 'pending'
        setIsSubmitted(true);
        showSuccess("Yêu cầu của bạn đã được gửi đi!");
      }
    } catch (error: any) {
      showError(`Lỗi: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-[#fff5ea] to-[#e5b899] flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Yêu cầu đã được gửi</CardTitle>
            <CardDescription>
              Cảm ơn bạn! Ban tổ chức sẽ xem xét và cập nhật đường link của bạn trong thời gian sớm nhất.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-[#fff5ea] to-[#e5b899] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Thông báo cập nhật thông tin</CardTitle>
          <CardDescription>
            Xin lỗi bạn, Do trùng tên khách mời nên có sự nhầm lẫn trong dữ liệu. Vui lòng điền thông tin dưới đây để Ban tổ chức cập nhật đúng profile cho bạn. Xin cảm ơn.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tên (tên hiển thị trong thiệp mời)</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại (không bắt buộc)</Label>
              <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Yêu cầu cập nhật
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default DuplicateSlugResolver;