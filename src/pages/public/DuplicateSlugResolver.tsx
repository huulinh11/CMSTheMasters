import { useState } from 'react';
import { useLocation, useOutletContext } from 'react-router-dom';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      showError("Vui lòng điền đầy đủ thông tin.");
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.from('slug_resolution_requests').insert({
        requested_slug: slug,
        provided_name: name,
        provided_phone: phone,
      });
      if (error) throw error;
      setIsSubmitted(true);
      showSuccess("Yêu cầu của bạn đã được gửi đi!");
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
          <CardTitle>Xác thực thông tin</CardTitle>
          <CardDescription>
            Xin lỗi bạn, có vẻ như có sự nhầm lẫn trong dữ liệu. Vui lòng điền thông tin dưới đây để Ban tổ chức cập nhật đúng profile cho bạn.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tên (như trong thiệp mời)</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
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