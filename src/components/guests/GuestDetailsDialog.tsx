import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Phone, Info, FileText, DollarSign, CheckCircle, AlertCircle, Megaphone, ClipboardList, History, Link as LinkIcon, ExternalLink, Copy, Edit } from "lucide-react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea } from "@/components/ui/scroll-area";
import { showSuccess } from "@/utils/toast";
import { ImagePreviewDialog } from "@/components/event-tasks/ImagePreviewDialog";

const InfoRow = ({ icon: Icon, label, value, children }: { icon: React.ElementType, label: string, value?: string | null, children?: React.ReactNode }) => {
  if (!value && !children) return null;
  return (
    <div className="flex items-start py-1.5 md:py-2 border-b last:border-b-0">
      <Icon className="h-4 w-4 mr-3 mt-1 flex-shrink-0 text-slate-500" />
      <div className="flex-1">
        <p className="text-sm text-slate-500">{label}</p>
        {value && <p className="font-medium text-slate-800 whitespace-pre-wrap">{value}</p>}
        {children}
      </div>
    </div>
  );
};

const MaterialsViewerDialog = ({ open, onOpenChange, content, guestName, onEdit }: { open: boolean, onOpenChange: (open: boolean) => void, content: string, guestName: string, onEdit: () => void }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Tư liệu của {guestName}</DialogTitle>
      </DialogHeader>
      <ScrollArea className="max-h-[60vh] mt-4">
        <div className="whitespace-pre-wrap p-1">{content}</div>
      </ScrollArea>
      <DialogFooter>
        <Button variant="outline" onClick={() => { navigator.clipboard.writeText(content); showSuccess("Đã sao chép tư liệu!"); }}>
          <Copy className="mr-2 h-4 w-4" /> Sao chép
        </Button>
        <Button onClick={onEdit}>
          <Edit className="mr-2 h-4 w-4" /> Sửa
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

const GuestDetailsContent = ({ guestId, guestType, onEdit }: { guestId: string, guestType: 'vip' | 'regular', onEdit: (guest: any) => void }) => {
  const [isMaterialsOpen, setIsMaterialsOpen] = useState(false);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['guest_details', guestType, guestId],
    queryFn: async () => {
      if (!guestType || !guestId) return null;

      const guestTable = guestType === 'vip' ? 'vip_guests' : 'guests';
      const paymentTable = guestType === 'vip' ? 'vip_payments' : 'guest_payments';

      const guestPromise = supabase.from(guestTable).select('*').eq('id', guestId).single();
      const revenuePromise = supabase.rpc(guestType === 'vip' ? 'get_vip_guest_revenue_details' : 'get_guest_revenue_details');
      const mediaBenefitPromise = supabase.from('media_benefits').select('*').eq('guest_id', guestId).single();
      const tasksPromise = supabase.from('guest_tasks').select('*').eq('guest_id', guestId);
      const paymentsPromise = supabase.from(paymentTable).select('*').eq('guest_id', guestId);
      const upsaleHistoryPromise = supabase.from('guest_upsale_history').select('*').eq('guest_id', guestId);

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

      const revenueData = allRevenueData.find((r: any) => r.id === guestId);

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
    enabled: !!guestType && !!guestId,
  });

  const handleCopyLink = (path: string) => {
    const url = `${window.location.origin}${path}`;
    navigator.clipboard.writeText(url);
    showSuccess("Đã sao chép link!");
  };

  if (isLoading) {
    return <div className="p-4 md:p-6 space-y-4"><Skeleton className="h-[80vh] w-full" /></div>;
  }

  if (!data) {
    return <div className="p-4 md:p-6">Không tìm thấy thông tin khách mời.</div>;
  }

  const { guest, revenue, mediaBenefit, tasks, payments, upsaleHistory } = data;
  const benefitsForRole = MEDIA_BENEFITS_BY_ROLE[guest.role] || [];
  const tasksForRole = TASKS_BY_ROLE[guest.role] || [];

  return (
    <>
      <header className="p-4 md:p-6">
        <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <button onClick={() => setIsImagePreviewOpen(true)}>
                    <Avatar className="h-16 w-16 md:h-20 md:w-20">
                        <AvatarImage src={guest.image_url} />
                        <AvatarFallback>{guest.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                </button>
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl md:text-3xl font-bold text-slate-800 truncate">{guest.name}</h1>
                    <div className="flex items-center gap-x-4 gap-y-1 flex-wrap mt-1">
                        <p className="text-slate-500">{guest.role} ({guest.id})</p>
                        <Button size="sm" variant="outline" className="md:hidden" onClick={() => onEdit(guest)}>
                            <Edit className="mr-1.5 h-3 w-3" /> Sửa
                        </Button>
                    </div>
                </div>
            </div>
            <Button className="hidden md:flex flex-shrink-0" onClick={() => onEdit(guest)}>
                <Edit className="mr-2 h-4 w-4" /> Sửa
            </Button>
        </div>
      </header>

      <ScrollArea className="h-[calc(100% - 120px)]">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 md:p-6 pt-2">
          <div className="space-y-6">
            <Card>
              <CardHeader className="p-3 md:p-4"><CardTitle className="flex items-center text-base md:text-lg"><Info className="mr-2" /> Thông tin cơ bản</CardTitle></CardHeader>
              <CardContent className="p-3 md:p-4 pt-0">
                <InfoRow icon={Phone} label="SĐT" value={guest.phone} />
                <InfoRow icon={User} label="Người giới thiệu" value={guest.referrer} />
                {guest.secondaryInfo && <InfoRow icon={Info} label="Thông tin phụ" value={guest.secondaryInfo} />}
                <InfoRow icon={FileText} label="Ghi chú" value={guest.notes} />
                <InfoRow icon={FileText} label="Tư liệu">
                  <div className="flex justify-between items-center w-full">
                    <p className="font-medium text-slate-800 whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px] sm:max-w-[200px]">
                      {guest.materials || "Chưa có"}
                    </p>
                    <Button variant="outline" size="sm" onClick={() => setIsMaterialsOpen(true)} disabled={!guest.materials}>Xem</Button>
                  </div>
                </InfoRow>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-3 md:p-4"><CardTitle className="flex items-center text-base md:text-lg"><LinkIcon className="mr-2" /> Liên kết</CardTitle></CardHeader>
              <CardContent className="p-3 md:p-4 pt-0">
                {guest.slug && (
                  <div className="flex items-center justify-between py-2 border-b">
                    <p className="text-sm font-medium text-slate-800">Profile Link</p>
                    <div className="flex items-center gap-1 ml-2">
                      <a href={`/profile/${guest.slug}`} target="_blank" rel="noopener noreferrer"><Button size="sm"><ExternalLink className="mr-2 h-4 w-4" /> Mở</Button></a>
                      <Button size="sm" variant="outline" onClick={() => handleCopyLink(`/profile/${guest.slug}`)}><Copy className="mr-2 h-4 w-4" /> Sao chép</Button>
                    </div>
                  </div>
                )}
                {guest.phone && (
                  <div className="flex items-center justify-between py-2">
                    <p className="text-sm font-medium text-slate-800">Checklist Link</p>
                    <div className="flex items-center gap-1 ml-2">
                      <a href={`/checklist/${guest.phone}`} target="_blank" rel="noopener noreferrer"><Button size="sm"><ExternalLink className="mr-2 h-4 w-4" /> Mở</Button></a>
                      <Button size="sm" variant="outline" onClick={() => handleCopyLink(`/checklist/${guest.phone}`)}><Copy className="mr-2 h-4 w-4" /> Sao chép</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {revenue && (
              <Card>
                <CardHeader className="p-3 md:p-4"><CardTitle className="flex items-center text-base md:text-lg"><DollarSign className="mr-2" /> Doanh thu</CardTitle></CardHeader>
                <CardContent className="p-3 md:p-4 pt-0">
                  <InfoRow icon={DollarSign} label="Tài trợ" value={formatCurrency(revenue.sponsorship)} />
                  <InfoRow icon={CheckCircle} label="Đã thanh toán" value={formatCurrency(revenue.paid)} />
                  <InfoRow icon={AlertCircle} label="Chưa thanh toán" value={formatCurrency(revenue.unpaid)} />
                  <InfoRow icon={Info} label="Nguồn thanh toán" value={revenue.payment_source} />
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2 flex items-center"><History className="mr-2 h-4 w-4" /> Lịch sử giao dịch</h4>
                    <div className="max-h-40 overflow-y-auto space-y-2 text-sm">
                      {payments.map((p: any) => (<div key={p.id} className="flex justify-between"><span>Thanh toán ({format(new Date(p.created_at), 'dd/MM/yy')})</span><span className="font-medium text-green-600">{formatCurrency(p.amount)}</span></div>))}
                      {upsaleHistory.map((u: any) => (<div key={u.id} className="flex justify-between"><span>Upsale ({format(new Date(u.created_at), 'dd/MM/yy')})</span><span className="font-medium text-blue-600">{formatCurrency(u.to_sponsorship - u.from_sponsorship)}</span></div>))}
                      {payments.length === 0 && upsaleHistory.length === 0 && <p className="text-slate-500">Chưa có giao dịch.</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardHeader className="p-3 md:p-4"><CardTitle className="flex items-center text-base md:text-lg"><Megaphone className="mr-2" /> Quyền lợi truyền thông</CardTitle></CardHeader>
              <CardContent className="p-3 md:p-4 pt-0"><MediaBenefitDisplay benefits={benefitsForRole} mediaBenefitData={mediaBenefit} /></CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader className="p-3 md:p-4"><CardTitle className="flex items-center text-base md:text-lg"><ClipboardList className="mr-2" /> Tác vụ sự kiện</CardTitle></CardHeader>
              <CardContent className="p-3 md:p-4 pt-0">
                <div className="space-y-2">
                  {tasksForRole.map(taskName => (<div key={taskName} className="flex items-center space-x-2"><Checkbox id={taskName} checked={tasks.find(t => t.task_name === taskName)?.is_completed} disabled /><Label htmlFor={taskName}>{taskName}</Label></div>))}
                  {tasksForRole.length === 0 && <p className="text-slate-500">Không có tác vụ nào cho vai trò này.</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </ScrollArea>
      <MaterialsViewerDialog 
        open={isMaterialsOpen} 
        onOpenChange={setIsMaterialsOpen} 
        content={guest.materials} 
        guestName={guest.name}
        onEdit={() => {
          setIsMaterialsOpen(false);
          onEdit(guest);
        }}
      />
      <ImagePreviewDialog
        guest={guest}
        open={isImagePreviewOpen}
        onOpenChange={setIsImagePreviewOpen}
        guestType={guestType}
      />
    </>
  );
};

interface GuestDetailsDialogProps {
  guestId: string | null;
  guestType: 'vip' | 'regular' | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (guest: any) => void;
}

export const GuestDetailsDialog = ({ guestId, guestType, open, onOpenChange, onEdit }: GuestDetailsDialogProps) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[90vh]">
          {guestId && guestType && <GuestDetailsContent guestId={guestId} guestType={guestType} onEdit={onEdit} />}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[90vh] p-0">
        {guestId && guestType && <GuestDetailsContent guestId={guestId} guestType={guestType} onEdit={onEdit} />}
      </DialogContent>
    </Dialog>
  );
};