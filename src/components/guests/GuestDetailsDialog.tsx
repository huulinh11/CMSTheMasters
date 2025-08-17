import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Phone, Info, FileText, DollarSign, CheckCircle, AlertCircle, Megaphone, ClipboardList, History, Link as LinkIcon, ExternalLink, Copy, Edit, CreditCard, TrendingUp, Trash2, QrCode, Briefcase, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { MediaBenefitDisplay } from "@/components/public-checklist/MediaBenefitDisplay";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerClose } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea } from "@/components/ui/scroll-area";
import { showSuccess, showError } from "@/utils/toast";
import { ImagePreviewDialog } from "@/components/event-tasks/ImagePreviewDialog";
import { EditAllMediaBenefitsDialog } from "@/components/media-benefits/EditAllMediaBenefitsDialog";
import { TaskChecklistDialog } from "@/components/event-tasks/TaskChecklistDialog";
import { EditProfileDialog } from "@/components/public-user/EditProfileDialog";
import EditGuestRevenueDialog from "@/components/Revenue/EditGuestRevenueDialog";
import EditSponsorshipDialog from "@/components/Revenue/EditSponsorshipDialog";
import { useAuth } from "@/contexts/AuthContext";
import { ContentBlock } from "@/types/profile-content";
import { MediaBenefit } from "@/types/media-benefit";
import PaymentDialog from "@/components/Revenue/PaymentDialog";
import GuestPaymentDialog from "@/components/Revenue/GuestPaymentDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import BillPreviewDialog from "../Revenue/BillPreviewDialog";
import { useRolePermissions } from "@/hooks/useRolePermissions";
import { ProfileStatus } from "@/types/vip-guest";
import { GuestQrCodeDialog } from "./GuestQrCodeDialog";
import { AddGuestServiceDialog } from "@/components/service-sales/AddGuestServiceDialog";
import { cn } from "@/lib/utils";
import GuestHistoryDialog from "../Revenue/GuestHistoryDialog";
import { ServiceDetailsDialog } from "./ServiceDetailsDialog";

const InfoRow = ({ icon: Icon, label, value, children, valueClass, isTel = false }: { icon: React.ElementType, label: string, value?: string | null, children?: React.ReactNode, valueClass?: string, isTel?: boolean }) => {
  if (value === undefined && !children) return null;
  return (
    <div className="flex items-center justify-between py-2.5 border-b last:border-b-0 gap-4">
      <div className="flex items-center flex-shrink-0">
        <Icon className="h-4 w-4 mr-3 flex-shrink-0 text-slate-500" />
        <p className="text-sm text-slate-500">{label}</p>
      </div>
      <div className="flex items-center justify-end gap-2 text-right min-w-0">
        {value && (
          isTel ? (
            <a href={`tel:${value}`} className={cn("font-medium text-slate-800 truncate hover:underline", valueClass)}>{value}</a>
          ) : (
            <p className={cn("font-medium text-slate-800 truncate", valueClass)}>{value}</p>
          )
        )}
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

const GuestDetailsContent = ({ guestId, guestType, onEdit, onDelete, roleConfigs, isMobile }: { guestId: string, guestType: 'vip' | 'regular', onEdit: (guest: any) => void, onDelete: (guestId: string) => void, roleConfigs: any[], isMobile: boolean }) => {
  const [isMaterialsOpen, setIsMaterialsOpen] = useState(false);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const [isMediaDialogOpen, setIsMediaDialogOpen] = useState(false);
  const [isTasksDialogOpen, setIsTasksDialogOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isRevenueDialogOpen, setIsRevenueDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [revenueDialogMode, setRevenueDialogMode] = useState<'edit' | 'upsale'>('edit');
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [billPreviewUrl, setBillPreviewUrl] = useState<string | null>(null);
  const [isQrCodeDialogOpen, setIsQrCodeDialogOpen] = useState(false);
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isServiceDetailsOpen, setIsServiceDetailsOpen] = useState(false);
  const queryClient = useQueryClient();
  const { profile, user } = useAuth();
  const canDelete = profile && (profile.role === 'Admin' || profile.role === 'Quản lý');
  const { tasksByRole, benefitsByRole, allBenefits, isLoading: isLoadingPermissions } = useRolePermissions();

  const { data, isLoading } = useQuery({
    queryKey: ['guest_details', guestType, guestId],
    queryFn: async () => {
      if (!guestType || !guestId) return null;

      const guestTable = guestType === 'vip' ? 'vip_guests' : 'guests';
      const paymentTable = guestType === 'vip' ? 'vip_payments' : 'guest_payments';
      const revenueTable = guestType === 'vip' ? 'vip_guest_revenue' : 'guest_revenue';
      
      const { data: guestData, error: guestError } = await supabase.from(guestTable).select('*').eq('id', guestId).single();
      if (guestError) throw new Error(`Guest Error: ${guestError.message}`);

      const promises = [
        supabase.from('media_benefits').select('*').eq('guest_id', guestId),
        supabase.from('guest_tasks').select('*').eq('guest_id', guestId),
        supabase.from('guest_upsale_history').select('*').eq('guest_id', guestId),
        supabase.rpc('get_guest_service_details_by_guest_id', { guest_id_in: guestId }),
        (guestData.referrer && guestData.referrer !== 'ads')
          ? supabase.from('vip_guests').select('name').eq('id', guestData.referrer).single()
          : Promise.resolve({ data: null, error: null }),
        supabase.from(revenueTable).select('*').eq('guest_id', guestId).single(),
        supabase.from(paymentTable).select('*').eq('guest_id', guestId)
      ];

      const [
          { data: mediaBenefitData, error: mediaBenefitError },
          { data: tasksData, error: tasksError },
          { data: upsaleHistoryData, error: upsaleHistoryError },
          { data: servicesData, error: servicesError },
          { data: referrerData },
          { data: revenueData },
          { data: paymentsData },
      ] = await Promise.all(promises);

      if (mediaBenefitError) throw new Error(`Media Benefit Error: ${mediaBenefitError.message}`);
      if (tasksError) throw new Error(`Tasks Error: ${tasksError.message}`);
      if (upsaleHistoryError) throw new Error(`Upsale History Error: ${upsaleHistoryError.message}`);
      if (servicesError) throw new Error(`Services Error: ${servicesError.message}`);

      let referrerName: string | null = guestData.referrer;
      let isReferrerValid = true;
      if (guestData.referrer) {
          if (guestData.referrer === 'ads') {
              referrerName = 'Ads';
          } else if (referrerData) {
              referrerName = referrerData.name;
          } else {
              isReferrerValid = false;
          }
      }

      const paidAmount = (paymentsData || []).reduce((sum, p) => sum + p.amount, 0);
      const latestUpsaleWithBill = (upsaleHistoryData || []).filter(h => h.bill_image_url).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
      
      const finalRevenue = {
          ...revenueData,
          sponsorship: revenueData?.sponsorship || 0,
          paid: paidAmount,
          unpaid: (revenueData?.sponsorship || 0) - paidAmount,
          bill_image_url: latestUpsaleWithBill?.bill_image_url || null,
      };

      if (guestType === 'regular' && revenueData) {
        const originalSponsorship = revenueData.sponsorship || 0;
        let effectiveSponsorship = originalSponsorship;
        if (revenueData.is_upsaled) {
            const firstUpsale = (upsaleHistoryData || []).sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0];
            if (firstUpsale && firstUpsale.from_payment_source === 'Chỉ tiêu') {
                effectiveSponsorship = originalSponsorship - firstUpsale.from_sponsorship;
            }
        } else if (revenueData.payment_source === 'Chỉ tiêu' && guestData.referrer) {
            effectiveSponsorship = 0;
        }
        finalRevenue.original_sponsorship = originalSponsorship;
        finalRevenue.sponsorship = effectiveSponsorship;
        finalRevenue.unpaid = effectiveSponsorship - paidAmount;
      }

      return {
          guest: { ...guestData, secondaryInfo: guestData.secondary_info, referrer: referrerName, isReferrerValid },
          revenue: finalRevenue,
          mediaBenefit: (mediaBenefitData && mediaBenefitData.length > 0) ? mediaBenefitData[0] : null,
          tasks: tasksData || [],
          payments: paymentsData || [],
          upsaleHistory: upsaleHistoryData || [],
          services: servicesData || [],
      };
    },
    enabled: !!guestType && !!guestId,
  });

  const mediaBenefitMutation = useMutation({
    mutationFn: async ({ guestId, benefits }: { guestId: string, benefits: Partial<MediaBenefit> }) => {
      const { error } = await supabase.from('media_benefits').upsert(
        { guest_id: guestId, ...benefits },
        { onConflict: 'guest_id' }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guest_details', guestType, guestId] });
      queryClient.invalidateQueries({ queryKey: ['media_benefits'] });
      if (data?.guest.phone) {
        queryClient.invalidateQueries({ queryKey: ['public_checklist', data.guest.phone] });
      }
      queryClient.invalidateQueries({ queryKey: ['public_checklist', guestId] });
      showSuccess("Cập nhật quyền lợi thành công!");
      setIsMediaDialogOpen(false);
    },
    onError: (error: Error) => showError(error.message),
  });

  const taskMutation = useMutation({
    mutationFn: async (variables: { guestId: string; taskName: string; isCompleted: boolean; updatedBy: string }) => {
      const { guestId, taskName, isCompleted, updatedBy } = variables;
      const { error } = await supabase.from('guest_tasks').upsert({
        guest_id: guestId,
        task_name: taskName,
        is_completed: isCompleted,
        updated_at: new Date().toISOString(),
        updated_by: updatedBy,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guest_details', guestType, guestId] });
      queryClient.invalidateQueries({ queryKey: ['guest_tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task_history'] });
      showSuccess("Cập nhật tác vụ thành công!");
    },
    onError: (error: any) => showError(error.message),
  });

  const profileUpdateMutation = useMutation({
    mutationFn: async ({ guest, content, shouldUnlinkTemplate }: { guest: any, content: ContentBlock[], shouldUnlinkTemplate: boolean }) => {
      const tableName = guest.type === 'Chức vụ' ? 'vip_guests' : 'guests';
      const updatePayload: { profile_content: ContentBlock[], profile_status?: ProfileStatus, template_id?: string | null } = {
        profile_content: content,
      };
      if (guest.profile_status === 'Trống' || !guest.profile_status) {
        updatePayload.profile_status = 'Đang chỉnh sửa';
      }
      if (shouldUnlinkTemplate) {
        updatePayload.template_id = null;
      }
      const { error } = await supabase
        .from(tableName)
        .update(updatePayload)
        .eq('id', guest.id);
      if (error) throw error;
    },
    onSuccess: (data, variables) => {
      const { guest } = variables;
      queryClient.invalidateQueries({ queryKey: ['vip_guests'] });
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      if (guest.slug) {
        queryClient.invalidateQueries({ queryKey: ['public_profile', guest.slug] });
      }
      const guestType = guest.type === 'Chức vụ' ? 'vip' : 'regular';
      queryClient.invalidateQueries({ queryKey: ['guest_details', guestType, guest.id] });

      showSuccess("Cập nhật profile thành công!");
      setIsProfileDialogOpen(false);
    },
    onError: (error: Error) => {
      showError(`Lỗi: ${error.message}`);
    }
  });

  const handleTaskChange = (payload: { guestId: string; taskName: string; isCompleted: boolean; }) => {
    const updatedBy = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Unknown User';
    taskMutation.mutate({
      ...payload,
      updatedBy,
    });
  };

  const handleSaveProfile = ({ content, shouldUnlinkTemplate }: { content: ContentBlock[], shouldUnlinkTemplate: boolean }) => {
    if (!data?.guest) return;
    profileUpdateMutation.mutate({ guest: { ...data.guest, type: guestType === 'vip' ? 'Chức vụ' : 'Khách mời' }, content, shouldUnlinkTemplate });
  };

  const handleCopyLink = (path: string) => {
    const url = `${window.location.origin}${path}`;
    navigator.clipboard.writeText(url);
    showSuccess("Đã sao chép link!");
  };

  const handleDelete = () => {
    if (data?.guest.id) {
      onDelete(data.guest.id);
    }
  };

  const handleEditClick = () => {
    if (!data) return;
    const guestToEdit = {
      ...data.guest,
      type: guestType === 'vip' ? 'Chức vụ' : 'Khách mời',
      sponsorship_amount: data.revenue?.sponsorship,
      paid_amount: data.revenue?.paid,
      payment_source: data.revenue?.payment_source,
    };
    onEdit(guestToEdit);
  };

  if (isLoading || isLoadingPermissions) {
    return <div className="p-4 md:p-6 space-y-4"><Skeleton className="h-[80vh] w-full" /></div>;
  }

  if (!data) {
    return <div className="p-4 md:p-6">Không tìm thấy thông tin khách mời.</div>;
  }

  const { guest, revenue, mediaBenefit, tasks, payments, upsaleHistory, services } = data;
  const benefitsForRole = benefitsByRole[guest.role] || [];
  const tasksForRole = tasksByRole[guest.role] || [];
  
  const serviceRevenue = services.reduce((sum: number, s: any) => sum + s.price, 0);
  const servicePaid = services.reduce((sum: number, s: any) => sum + s.paid_amount, 0);

  let effectiveSponsorship = revenue?.sponsorship || 0;
  if (guestType === 'regular' && revenue) {
      const originalSponsorship = revenue.sponsorship || 0;
      if (revenue.is_upsaled) {
          if (upsaleHistory && upsaleHistory.length > 0) {
              const firstUpsale = (upsaleHistory as any[]).sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0];
              if (firstUpsale.from_payment_source === 'Chỉ tiêu') {
                  effectiveSponsorship = originalSponsorship - firstUpsale.from_sponsorship;
              }
          }
      } else if (revenue.payment_source === 'Chỉ tiêu' && guest.referrer) {
          effectiveSponsorship = 0;
      }
  }

  const totalRevenue = effectiveSponsorship + serviceRevenue;
  const totalPaid = (revenue?.paid || 0) + servicePaid;
  const totalUnpaid = totalRevenue - totalPaid;
  const guestWithRevenue = { ...guest, ...revenue, unpaid: totalUnpaid };
  const hasHistory = payments.length > 0 || upsaleHistory.length > 0 || services.length > 0;

  return (
    <>
      <div className="flex flex-col h-full">
        <header className="p-4 md:p-6 flex-shrink-0">
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
                      <p className="text-slate-500 mt-1">{guest.role} ({guest.id})</p>
                  </div>
              </div>
              <div className="flex items-center gap-2">
                {canDelete && (
                  <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-500" onClick={() => setIsDeleteAlertOpen(true)}>
                    <Trash2 className="h-5 w-5" />
                  </Button>
                )}
                {isMobile ? (
                  <DrawerClose asChild>
                    <Button variant="destructive" size="icon" className="h-10 w-10">
                      <X className="h-5 w-5" />
                    </Button>
                  </DrawerClose>
                ) : (
                  <DialogClose asChild>
                    <Button variant="destructive" size="icon" className="h-10 w-10">
                      <X className="h-5 w-5" />
                    </Button>
                  </DialogClose>
                )}
              </div>
          </div>
        </header>

        <ScrollArea className="flex-grow min-h-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 md:p-6 pt-0">
            <div className="space-y-6">
              <Card>
                <CardHeader className="p-3 md:p-4 flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center text-base md:text-lg"><Info className="mr-2" /> Thông tin cơ bản</CardTitle>
                  <Button variant="ghost" size="icon" onClick={handleEditClick}><Edit className="h-4 w-4" /></Button>
                </CardHeader>
                <CardContent className="p-3 md:p-4 pt-0">
                  <InfoRow icon={Phone} label="SĐT" value={guest.phone} isTel />
                  <InfoRow icon={User} label="Người giới thiệu" value={guest.referrer} valueClass={!guest.isReferrerValid ? 'text-red-500' : ''} />
                  <InfoRow icon={Info} label="Thông tin phụ" value={guest.secondaryInfo} />
                  {guestType === 'vip' && (
                    <InfoRow icon={LinkIcon} label="Facebook" value={guest.facebook_link}>
                      {guest.facebook_link && (
                        <div className="flex items-center gap-1">
                          <a href={guest.facebook_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                            Link
                          </a>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                            navigator.clipboard.writeText(guest.facebook_link!);
                            showSuccess("Đã sao chép link Facebook!");
                          }}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </InfoRow>
                  )}
                  <InfoRow icon={FileText} label="Ghi chú" value={guest.notes} />
                  <InfoRow icon={FileText} label="Tư liệu">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-800">
                        {guest.materials ? "Đã có" : "Chưa có"}
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
                        <Button size="icon" variant="outline" onClick={() => setIsProfileDialogOpen(true)}><Edit className="h-4 w-4" /></Button>
                        <a href={`/profile/${guest.slug}`} target="_blank" rel="noopener noreferrer"><Button size="icon" variant="outline"><ExternalLink className="h-4 w-4" /></Button></a>
                        <Button size="icon" variant="outline" onClick={() => handleCopyLink(`/profile/${guest.slug}`)}><Copy className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between py-2 border-b">
                    <p className="text-sm font-medium text-slate-800">Checklist Link</p>
                    <div className="flex items-center gap-1 ml-2">
                      <a href={`/checklist/${guest.id}`} target="_blank" rel="noopener noreferrer"><Button size="icon" variant="outline"><ExternalLink className="h-4 w-4" /></Button></a>
                      <Button size="icon" variant="outline" onClick={() => handleCopyLink(`/checklist/${guest.id}`)}><Copy className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  {guest.role !== 'Vé trải nghiệm' && (
                    <div className="pt-4">
                      <Button className="w-full" onClick={() => setIsQrCodeDialogOpen(true)}>
                        <QrCode className="mr-2 h-4 w-4" /> Xem tất cả mã QR
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {revenue && (
                <Card>
                  <CardHeader className="p-3 md:p-4 flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center text-base md:text-lg"><DollarSign className="mr-2" /> Doanh thu</CardTitle>
                    <div className="flex items-center gap-1">
                      <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => setIsAddServiceOpen(true)}>Thêm DV</Button>
                      <Button variant="ghost" size="icon" onClick={() => { setRevenueDialogMode('edit'); setIsRevenueDialogOpen(true); }}><Edit className="h-4 w-4" /></Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 md:p-4 pt-0">
                    <InfoRow icon={DollarSign} label="Tài trợ" value={formatCurrency(effectiveSponsorship)} />
                    <InfoRow icon={Briefcase} label="Tiền dịch vụ" value={formatCurrency(serviceRevenue)} />
                    <InfoRow icon={DollarSign} label="Tổng doanh thu" value={formatCurrency(totalRevenue)} valueClass="font-bold text-primary" />
                    <InfoRow icon={CheckCircle} label="Đã thanh toán" value={formatCurrency(totalPaid)} valueClass="text-green-600" />
                    <InfoRow icon={AlertCircle} label="Chưa thanh toán" value={formatCurrency(totalUnpaid)} valueClass="text-red-600" />
                    {guestType === 'regular' && <InfoRow icon={Info} label="Nguồn thanh toán" value={revenue.payment_source} />}
                    {revenue.is_upsaled && (
                      <InfoRow icon={FileText} label="Hình bill">
                        {revenue.bill_image_url ? (
                          <Button variant="link" className="p-0 h-auto font-medium" onClick={() => setBillPreviewUrl(revenue.bill_image_url)}>
                            Xem hình bill
                          </Button>
                        ) : (
                          <p className="font-medium text-slate-500">Trống</p>
                        )}
                      </InfoRow>
                    )}
                    
                    {services.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <Button className="w-full" variant="secondary" onClick={() => setIsServiceDetailsOpen(true)}>
                          Xem chi tiết dịch vụ ({services.length})
                        </Button>
                      </div>
                    )}

                    <div className="flex gap-2 mt-4">
                      <Button 
                        className="flex-1" 
                        onClick={() => setIsPaymentDialogOpen(true)} 
                        disabled={!revenue || revenue.unpaid <= 0}
                      >
                        <CreditCard className="mr-2 h-4 w-4" /> Thanh toán tài trợ
                      </Button>
                      {guestType === 'regular' && (
                          <Button 
                            className="flex-1" 
                            variant="secondary"
                            onClick={() => {
                                setRevenueDialogMode('upsale');
                                setIsRevenueDialogOpen(true);
                            }}
                          >
                            <TrendingUp className="mr-2 h-4 w-4" /> Upsale
                          </Button>
                      )}
                    </div>
                    {hasHistory && (
                      <Button className="w-full mt-2" variant="outline" onClick={() => setIsHistoryOpen(true)}>
                        <History className="mr-2 h-4 w-4" /> Xem lịch sử giao dịch
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
              <Card>
                <CardHeader className="p-3 md:p-4 flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center text-base md:text-lg"><Megaphone className="mr-2" /> Quyền lợi truyền thông</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setIsMediaDialogOpen(true)}><Edit className="h-4 w-4" /></Button>
                </CardHeader>
                <CardContent className="p-3 md:p-4 pt-0"><MediaBenefitDisplay benefits={benefitsForRole} mediaBenefitData={mediaBenefit} /></CardContent>
              </Card>
            </div>
            
            <div className="space-y-6">
              <Card>
                <CardHeader className="p-3 md:p-4 flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center text-base md:text-lg"><ClipboardList className="mr-2" /> Tác vụ sự kiện</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setIsTasksDialogOpen(true)}><Edit className="h-4 w-4" /></Button>
                </CardHeader>
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
      </div>
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Thao tác này sẽ xóa vĩnh viễn khách mời <strong>{guest.name}</strong> và tất cả dữ liệu liên quan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <MaterialsViewerDialog 
        open={isMaterialsOpen} 
        onOpenChange={setIsMaterialsOpen} 
        content={guest.materials || ""} 
        guestName={guest.name}
        onEdit={handleEditClick}
      />
      <ImagePreviewDialog
        guest={guest}
        open={isImagePreviewOpen}
        onOpenChange={setIsImagePreviewOpen}
        guestType={guestType}
      />
      <EditAllMediaBenefitsDialog
        guest={{ ...guest, media_benefit: mediaBenefit }}
        open={isMediaDialogOpen}
        onOpenChange={setIsMediaDialogOpen}
        onSave={(guestId, benefits) => mediaBenefitMutation.mutate({ guestId, benefits })}
        benefitsByRole={benefitsByRole}
        allBenefits={allBenefits}
      />
      <TaskChecklistDialog
        open={isTasksDialogOpen}
        onOpenChange={setIsTasksDialogOpen}
        guest={{ ...guest, tasks }}
        onTaskChange={handleTaskChange}
        tasksByRole={tasksByRole}
      />
      <EditProfileDialog
        open={isProfileDialogOpen}
        onOpenChange={(isOpen) => !isOpen && setIsProfileDialogOpen(null)}
        guest={{ ...guest, type: guestType === 'vip' ? 'Chức vụ' : 'Khách mời' }}
        onSave={handleSaveProfile}
        isSaving={profileUpdateMutation.isPending}
        isTemplateMode={!!guest.template_id}
      />
      {guestType === 'vip' ? (
        <PaymentDialog
          guest={guestWithRevenue}
          open={isPaymentDialogOpen}
          onOpenChange={setIsPaymentDialogOpen}
        />
      ) : (
        <GuestPaymentDialog
          guest={guestWithRevenue}
          open={isPaymentDialogOpen}
          onOpenChange={setIsPaymentDialogOpen}
        />
      )}
      {guestType === 'vip' ? (
        <EditSponsorshipDialog
          guest={guestWithRevenue}
          open={isRevenueDialogOpen}
          onOpenChange={setIsRevenueDialogOpen}
        />
      ) : (
        <EditGuestRevenueDialog
          guest={guestWithRevenue}
          open={isRevenueDialogOpen}
          onOpenChange={setIsRevenueDialogOpen}
          mode={revenueDialogMode}
          roleConfigs={roleConfigs}
        />
      )}
      <BillPreviewDialog
        imageUrl={billPreviewUrl}
        open={!!billPreviewUrl}
        onOpenChange={() => setBillPreviewUrl(null)}
      />
      <GuestQrCodeDialog
        open={isQrCodeDialogOpen}
        onOpenChange={setIsQrCodeDialogOpen}
        guest={guest ? { ...guest, type: guestType === 'vip' ? 'Chức vụ' : 'Khách mời' } : null}
      />
      <AddGuestServiceDialog
        open={isAddServiceOpen}
        onOpenChange={setIsAddServiceOpen}
        defaultGuestId={guest.id}
      />
      <GuestHistoryDialog
        guest={guest ? { ...guest, ...revenue, unpaid: totalUnpaid } : null}
        open={isHistoryOpen}
        onOpenChange={setIsHistoryOpen}
      />
      <ServiceDetailsDialog
        guestName={guest.name}
        services={services}
        open={isServiceDetailsOpen}
        onOpenChange={setIsServiceDetailsOpen}
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
  onDelete: (guestId: string) => void;
  roleConfigs: any[];
}

export const GuestDetailsDialog = ({ guestId, guestType, open, onOpenChange, onEdit, onDelete, roleConfigs }: GuestDetailsDialogProps) => {
  const isMobile = useIsMobile();

  return (
    <>
      {isMobile ? (
        <Drawer open={open} onOpenChange={onOpenChange}>
          <DrawerContent className="h-[calc(100dvh-60px)] bg-gradient-to-br from-[#fff5ea] to-[#e5b899] flex flex-col">
            {guestId && guestType && <GuestDetailsContent isMobile={isMobile} guestId={guestId} guestType={guestType} onEdit={onEdit} onDelete={onDelete} roleConfigs={roleConfigs} />}
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-7xl h-[90vh] p-0 bg-gradient-to-br from-[#fff5ea] to-[#e5b899] flex flex-col [&>button]:hidden">
            {guestId && guestType && <GuestDetailsContent isMobile={isMobile} guestId={guestId} guestType={guestType} onEdit={onEdit} onDelete={onDelete} roleConfigs={roleConfigs} />}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};