import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GuestService, Service } from "@/types/service-sales";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, PlusCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import ServiceStats from "@/components/service-sales/ServiceStats";
import { ServiceSettingsDialog } from "@/components/service-sales/ServiceSettingsDialog";
import { AddGuestServiceDialog } from "@/components/service-sales/AddGuestServiceDialog";
import { PayServiceDialog } from "@/components/service-sales/PayServiceDialog";
import { GuestServicesTable } from "@/components/service-sales/GuestServicesTable";
import { GuestServicesCards } from "@/components/service-sales/GuestServicesCards";
import { showError, showSuccess } from "@/utils/toast";
import { GuestDetailsDialog } from "@/components/guests/GuestDetailsDialog";
import { RoleConfiguration } from "@/types/role-configuration";
import { ServicePaymentHistoryDialog } from "@/components/service-sales/ServicePaymentHistoryDialog";

const ServiceSalesPage = () => {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [payingItem, setPayingItem] = useState<GuestService | null>(null);
  const [historyItem, setHistoryItem] = useState<GuestService | null>(null);
  const [viewingGuest, setViewingGuest] = useState<GuestService | null>(null);

  const { data: guestServices = [], isLoading } = useQuery<GuestService[]>({
    queryKey: ['guest_service_details'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_guest_service_details');
      if (error) throw error;
      return data || [];
    }
  });

  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ['services'],
    queryFn: async () => {
      const { data, error } = await supabase.from('services').select('*');
      if (error) throw error;
      return data || [];
    }
  });

  const { data: roleConfigs = [] } = useQuery<RoleConfiguration[]>({
    queryKey: ['role_configurations'],
    queryFn: async () => {
      const { data, error } = await supabase.from('role_configurations').select('*');
      if (error) throw error;
      return data || [];
    }
  });

  const statusUpdateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const { error } = await supabase.from('guest_services').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guest_service_details'] });
      showSuccess("Cập nhật trạng thái thành công!");
    },
    onError: (err: Error) => showError(err.message),
  });

  const convertTrialMutation = useMutation({
    mutationFn: async (guestServiceId: string) => {
      const { error } = await supabase.rpc('convert_free_trial', { guest_service_id_in: guestServiceId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guest_service_details'] });
      showSuccess("Chuyển đổi thành công!");
    },
    onError: (err: Error) => showError(err.message),
  });

  const filteredServices = useMemo(() => {
    return guestServices.filter(item =>
      item.guest_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.guest_phone && item.guest_phone.includes(searchTerm))
    );
  }, [guestServices, searchTerm]);

  const stats = useMemo(() => {
    return guestServices.reduce((acc, item) => {
      acc.totalRevenue += item.price;
      acc.totalPaid += item.paid_amount;
      return acc;
    }, { totalRevenue: 0, totalPaid: 0 });
  }, [guestServices]);

  const totalUnpaid = stats.totalRevenue - stats.totalPaid;

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Bán dịch vụ</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => setIsSettingsOpen(true)}><Settings className="h-4 w-4" /></Button>
          <Button onClick={() => setIsAddOpen(true)}><PlusCircle className="mr-2 h-4 w-4" /> Thêm</Button>
        </div>
      </div>

      <ServiceStats totalRevenue={stats.totalRevenue} totalPaid={stats.totalPaid} totalUnpaid={totalUnpaid} />

      <Input
        placeholder="Tìm kiếm theo tên khách, dịch vụ, SĐT..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : isMobile ? (
        <GuestServicesCards
          items={filteredServices}
          services={services}
          onStatusChange={(id, status) => statusUpdateMutation.mutate({ id, status })}
          onPay={setPayingItem}
          onConvertTrial={(id) => convertTrialMutation.mutate(id)}
          onViewGuest={setViewingGuest}
          onHistory={setHistoryItem}
        />
      ) : (
        <GuestServicesTable
          items={filteredServices}
          services={services}
          onStatusChange={(id, status) => statusUpdateMutation.mutate({ id, status })}
          onPay={setPayingItem}
          onConvertTrial={(id) => convertTrialMutation.mutate(id)}
          onViewGuest={setViewingGuest}
          onHistory={setHistoryItem}
        />
      )}

      <ServiceSettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
      <AddGuestServiceDialog open={isAddOpen} onOpenChange={setIsAddOpen} />
      <PayServiceDialog item={payingItem} open={!!payingItem} onOpenChange={() => setPayingItem(null)} />
      <ServicePaymentHistoryDialog item={historyItem} open={!!historyItem} onOpenChange={() => setHistoryItem(null)} />
      <GuestDetailsDialog
        guestId={viewingGuest?.guest_id || null}
        guestType={viewingGuest?.guest_type === 'Chức vụ' ? 'vip' : 'regular'}
        open={!!viewingGuest}
        onOpenChange={(isOpen) => !isOpen && setViewingGuest(null)}
        onEdit={() => {}}
        onDelete={() => {}}
        roleConfigs={roleConfigs}
      />
    </div>
  );
};

export default ServiceSalesPage;