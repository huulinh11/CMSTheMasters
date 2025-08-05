import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, User, Phone, Info, FileText, DollarSign, CheckCircle, AlertCircle, Megaphone, ClipboardList, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { MediaBenefitDisplay } from "@/components/public-checklist/MediaBenefitDisplay";
import { MEDIA_BENEFITS_BY_ROLE } from "@/config/media-benefits-by-role";
import { TASKS_BY_ROLE } from "@/config/event-tasks";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const InfoRow = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value?: string | null }) => {
  if (!value) return null;
  return (
    <div className="flex items-start py-2 border-b last:border-b-0">
      <Icon className="h-4 w-4 mr-3 mt-1 flex-shrink-0 text-slate-500" />
      <div className="flex-1">
        <p className="text-sm text-slate-500">{label}</p>
        <p className="font-medium text-slate-800 whitespace-pre-wrap">{value}</p>
      </div>
    </div>
  );
};

const GuestDetailsPage = () => {
  const { type, id } = useParams<{ type: 'vip' | 'regular'; id: string }>();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['guest_details', type, id],
    queryFn: async () => {
      if (!type || !id) return null;

      const guestTable = type === 'vip' ? 'vip_guests' : 'guests';
      const paymentTable = type === 'vip' ? 'vip_payments' : 'guest_payments';

      const guestPromise = supabase.from(guestTable).select('*').eq('id', id).single();
      const revenuePromise = supabase.rpc(type === 'vip' ? 'get_vip_guest_revenue_details' : 'get_guest_revenue_details');
      const mediaBenefitPromise = supabase.from('media_benefits').select('*').eq('guest_id', id).single();
      const tasksPromise = supabase.from('guest_tasks').select('*').eq('guest_id', id);
      const paymentsPromise = supabase.from(paymentTable).select('*').eq('guest_id', id);
      const upsaleHistoryPromise = supabase.from('guest_upsale_history').select('*').eq('guest_id', id);

      const [
        { data: guestData, error: guestError },
        { data: allRevenueData, error: revenueError },
        { data: mediaBenefitData, error: mediaBenefitError },
        { data: tasksData, error: tasksError },
        { data: paymentsData, error: paymentsError },
        { data: upsaleHistoryData, error: upsaleHistoryError },
      ] = await Promise.all([guestPromise, revenuePromise, mediaBenefitPromise, tasksPromise, paymentsPromise, upsaleHistoryPromise]);

      if (guestError) throw new Error(`Guest Error: ${guestError.message}`);
      if (revenueError) throw new Error(`Revenue Error: ${revenueError.message}`);
      if (mediaBenefitError && mediaBenefitError.code !== 'PGRST116') throw new Error(`Media Benefit Error: ${mediaBenefitError.message}`);
      if (tasksError) throw new Error(`Tasks Error: ${tasksError.message}`);
      if (paymentsError) throw new Error(`Payments Error: ${paymentsError.message}`);
      if (upsaleHistoryError) throw new Error(`Upsale History Error: ${upsaleHistoryError.message}`);

      const revenueData = allRevenueData.find((r: any) => r.id === id);

      return {
        guest: { ...guestData, secondaryInfo: guestData.secondary_info },
        revenue: revenueData ? {
          sponsorship: revenueData.sponsorship || 0,
          paid: revenueData.paid_amount || 0,
          unpaid: (revenueData.sponsorship || 0) - (revenueData.paid_amount || 0),
          payment_source: revenueData.payment_source,
        } : null,
        mediaBenefit: mediaBenefitData,
        tasks: tasksData || [],
        payments: paymentsData || [],
        upsaleHistory: upsaleHistoryData || [],
      };
    },
    enabled: !!type && !!id,
  });

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-32 w-full" />
        <div className="grid md:grid-cols-2 gap-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="p-4 md:p-6">Không tìm thấy thông tin khách mời.</div>;
  }

  const { guest, revenue, mediaBenefit, tasks, payments, upsaleHistory } = data;
  const benefitsForRole = MEDIA_BENEFITS_BY_ROLE[guest.role] || [];
  const tasksForRole = TASKS_BY_ROLE[guest.role] || [];

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-full">
      <Button variant="outline" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
      </Button>

      {/* Header */}
      <header className="flex items-center gap-4 mb-6">
        <Avatar className="h-20 w-20">
          <AvatarImage src={guest.image_url} />
          <AvatarFallback>{guest.name?.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-bold text-slate-800">{guest.name}</h1>
          <p className="text-slate-500">{guest.role} ({guest.id})</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center"><Info className="mr-2" /> Thông tin cơ bản</CardTitle></CardHeader>
            <CardContent>
              <InfoRow icon={Phone} label="SĐT" value={guest.phone} />
              <InfoRow icon={User} label="Người giới thiệu" value={guest.referrer} />
              {guest.secondaryInfo && <InfoRow icon={Info} label="Thông tin phụ" value={guest.secondaryInfo} />}
              <InfoRow icon={FileText} label="Ghi chú" value={guest.notes} />
              <InfoRow icon={FileText} label="Tư liệu" value={guest.materials} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center"><Megaphone className="mr-2" /> Quyền lợi truyền thông</CardTitle></CardHeader>
            <CardContent>
              <MediaBenefitDisplay benefits={benefitsForRole} mediaBenefitData={mediaBenefit} />
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {revenue && (
            <Card>
              <CardHeader><CardTitle className="flex items-center"><DollarSign className="mr-2" /> Doanh thu</CardTitle></CardHeader>
              <CardContent>
                <InfoRow icon={DollarSign} label="Tài trợ" value={formatCurrency(revenue.sponsorship)} />
                <InfoRow icon={CheckCircle} label="Đã thanh toán" value={formatCurrency(revenue.paid)} />
                <InfoRow icon={AlertCircle} label="Chưa thanh toán" value={formatCurrency(revenue.unpaid)} />
                <InfoRow icon={Info} label="Nguồn thanh toán" value={revenue.payment_source} />
                
                <div className="mt-4">
                  <h4 className="font-semibold mb-2 flex items-center"><History className="mr-2 h-4 w-4" /> Lịch sử giao dịch</h4>
                  <div className="max-h-40 overflow-y-auto space-y-2 text-sm">
                    {payments.map((p: any) => (
                      <div key={p.id} className="flex justify-between">
                        <span>Thanh toán ({format(new Date(p.created_at), 'dd/MM/yy')})</span>
                        <span className="font-medium text-green-600">{formatCurrency(p.amount)}</span>
                      </div>
                    ))}
                    {upsaleHistory.map((u: any) => (
                      <div key={u.id} className="flex justify-between">
                        <span>Upsale ({format(new Date(u.created_at), 'dd/MM/yy')})</span>
                        <span className="font-medium text-blue-600">{formatCurrency(u.to_sponsorship - u.from_sponsorship)}</span>
                      </div>
                    ))}
                    {payments.length === 0 && upsaleHistory.length === 0 && <p className="text-slate-500">Chưa có giao dịch.</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="flex items-center"><ClipboardList className="mr-2" /> Tác vụ sự kiện</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {tasksForRole.map(taskName => (
                  <div key={taskName} className="flex items-center space-x-2">
                    <Checkbox id={taskName} checked={tasks.find(t => t.task_name === taskName)?.is_completed} disabled />
                    <Label htmlFor={taskName}>{taskName}</Label>
                  </div>
                ))}
                {tasksForRole.length === 0 && <p className="text-slate-500">Không có tác vụ nào cho vai trò này.</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GuestDetailsPage;