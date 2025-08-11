import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Phone, Info, FileText, DollarSign, CheckCircle, AlertCircle, Megaphone, ClipboardList, History, Link as LinkIcon, ExternalLink, Copy, Edit, CreditCard, TrendingUp, Trash2, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { MediaBenefitDisplay } from "@/components/public-checklist/MediaBenefitDisplay";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader } from "@/components/ui/drawer";
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

const InfoRow = ({ icon: Icon, label, value, children }: { icon: React.ElementType, label: string, value?: string | null, children?: React.ReactNode }) => {
  if (!value && !children) return null;
  return (
    <div className="flex items-center justify-between py-2.5 border-b last:border-b-0">
      <div className="flex items-center">
        <Icon className="h-4 w-4 mr-3 flex-shrink-0 text-slate-500" />
        <p className="text-sm text-slate-500">{label}</p>
      </div>
      <div className="flex items-center gap-2 ml-4">
        {value && <p className="font-medium text-slate-800 text-right">{value}</p>}
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
      
      let referrerName: string | null = guestData.referrer;
      if (guestData.referrer && !allRevenueData.some((r: any) => r.name === guestData.referrer)) {
        const { data: referrerGuest } = await supabase.from('vip_guests').select('name').eq('id', guestData.referrer).single();
        if (referrerGuest) {
          referrerName = referrerGuest.name;
        }
      }

      return {
        guest: { ...guestData, secondaryInfo: guestData.secondary_info, referrer: referrerName },
        revenue: revenueData ? {
          ...revenueData,
          sponsorship: revenueData.sponsorship || 0,
          paid: revenueData.paid_amount || 0,
          unpaid: (revenueData.sponsorship || 0) - (revenueData.paid_amount || 0),
        } : null,
        mediaBenefit: mediaBenefitData,
        tasks: tasksData || [],
        payments: paymentsData || [],
        upsaleHistory: upsaleHistoryData || [],
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

  if (isLoading || isLoadingPermissions) {
    return <div className="p-4 md:p-6 space-y-4"><Skeleton className="h-[80vh] w-full" /></div>;
  }

  if (!data) {
    return <div className="p-4 md:p-6">Không tìm thấy thông tin khách mời.</div>;
  }

  const { guest, revenue, mediaBenefit, tasks, payments, upsaleHistory } = data;
  const benefitsForRole = benefitsByRole[guest.role] || [];
  const tasksForRole = tasksByRole[guest.role] || [];
  const guestWithRevenue = { ...guest, ...revenue };

  return (
    <>
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
            {canDelete && !isMobile && (
              <Button variant="destructive" onClick={() => setIsDeleteAlertOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4" /> Xóa
              </Button>
            )}
        </div>
      </header>

      <ScrollArea className="flex-grow min-h-0">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 md:p-6 pt-0 lg:pb-6 pb-24">
          <div className="space-y-6">
            <Card>
              <CardHeader className="p-3 md:p-4 flex flex-row items-center justify-between">
                <CardTitle className="flex items-center text-base md:text-lg"><Info className="mr-2" /> Thông tin cơ bản</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => onEdit(guest)}><Edit className="h-4 w-4" /></Button>
              </CardHeader>
              <CardContent className="p-3 md:p-4 pt-0">
                <InfoRow icon={Phone} label="SĐT" value={guest.phone} />
                <InfoRow icon={User} label="Người giới thiệu" value={guest.referrer} />
                {guest.secondaryInfo && <InfoRow icon={Info} label="Thông tin phụ" value={guest.secondaryInfo} />}
                <InfoRow icon={FileText} label="Ghi chú" value={guest.notes} />
                <InfoRow icon={FileText} label="Tư liệu">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-800 whitespace-nowrap overflow-hidden text-ellipsis max-w-[100px] sm:max-w-[150px]">
                      {guest.materials || "Chưa có"}
                    </p>
                    <Button variant="outline" size="sm" onClick={() => setIsMaterialsOpen(true)} disabled={!guest.materials}>Xem</Button>
                  </div>
                </InfoRow>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {revenue && (
              <Card>
                <CardHeader className="p-3 md:p-4 flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center text-base md:text-lg"><DollarSign className="mr-2" /> Doanh thu</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => { setRevenueDialogMode('edit'); setIsRevenueDialogOpen(true); }}><Edit className="h-4 w-4" /></Button>
                </CardHeader>
                <CardContent className="p-3 md:p-4 pt-0">
                  <InfoRow icon={DollarSign} label="Tài trợ" value={formatCurrency(revenue.sponsorship)} />
                  <InfoRow icon={CheckCircle} label="Đã thanh toán" value={formatCurrency(revenue.paid)} />
                  <InfoRow icon={AlertCircle} label="Chưa thanh toán" value={formatCurrency(revenue.unpaid)} />
                  <InfoRow icon={Info} label="Nguồn thanh toán" value={revenue.payment_source} />
                  {revenue.is_upsaled && (
                    <InfoRow icon={FileText} label="Bill">
                      {revenue.bill_image_url ? (
                        <Button variant="link" className="p-0 h-auto font-medium" onClick={() => setBillPreviewUrl(revenue.bill_image_url)}>
                          Xem bill
                        </Button>
                      ) : (
                        <p className="font-medium text-slate-500">Trống</p>
                      )}
                    </InfoRow>
                  )}
                  <div className="flex gap-2 mt-4">
                    <Button 
                      className="flex-1" 
                      onClick={() => setIsPaymentDialogOpen(true)} 
                      disabled={!revenue || revenue.unpaid <= 0}
                    >
                      <CreditCard className="mr-2 h-4 w-4" /> Thanh toán
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
                  <div className="mt-4">
                    <InfoRow icon={History} label="Lịch sử giao dịch">
                      {payments.length === 0 && upsaleHistory.length === 0 ? (
                        <p className="font-medium text-slate-800">Chưa có giao dịch.</p>
                      ) : (
                        <div className="max-h-40 overflow-y-auto space-y-2 text-sm text-right">
                          {payments.map((p: any) => (<div key={p.id} className="flex justify-end"><span>Thanh toán ({format(new Date(p.created_at), 'dd/MM/yy')})</span><span className="font-medium text-green-600 ml-2">{formatCurrency(p.amount)}</span></div>))}
                          {upsaleHistory.map((u: any) => (<div key={u.id} className="flex justify-end"><span>Upsale ({format(new Date(u.created_at), 'dd/MM/yy')})</span><span className="font-medium text-blue-600 ml-2">{formatCurrency(u.to_sponsorship - u.from_sponsorship)}</span></div>))}
                        </div>
                      )}
                    </InfoRow>
                  </div>
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
        </div>
      </ScrollArea>
      {isMobile && canDelete && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200/50 bg-gradient-to-t from-[#e5b899]/80 via-[#e5b899]/50 to-transparent backdrop-blur-sm">
          <Button variant="destructive" className="w-full" onClick={() => setIsDeleteAlertOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" /> Xóa khách mời
          </Button>
        </div>
      )}
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
      <EditAllMediaBenefitsDialog
        open={isMediaDialogOpen}
        onOpenChange={setIsMediaDialogOpen}
        guest={{ ...guest, media_benefit: mediaBenefit }}
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
        onOpenChange={setIsProfileDialogOpen}
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
          <DrawerContent className="h-[calc(100dvh-60px)] bg-gradient-to-br from-[#fff5ea] to-[#e5b899] flex flex-col relative [&>div:first-child]:bg-slate-400">
            {guestId && guestType && <GuestDetailsContent isMobile={isMobile} guestId={guestId} guestType={guestType} onEdit={onEdit} onDelete={onDelete} roleConfigs={roleConfigs} />}
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-7xl h-[90vh] p-0 bg-gradient-to-br from-[#fff5ea] to-[#e5b899]">
            {guestId && guestType && <GuestDetailsContent isMobile={isMobile} guestId={guestId} guestType={guestType} onEdit={onEdit} onDelete={onDelete} roleConfigs={roleConfigs} />}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};