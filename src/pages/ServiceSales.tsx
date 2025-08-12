import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GuestService, Service, GuestServiceSummary } from "@/types/service-sales";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, PlusCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import ServiceStats from "@/components/service-sales/ServiceStats";
import { ServiceSettingsDialog } from "@/components/service-sales/ServiceSettingsDialog";
import { AddGuestServiceDialog } from "@/components/service-sales/AddGuestServiceDialog";
import { showError, showSuccess } from "@/utils/toast";
import { GuestServiceSummaryTable } from "@/components/service-sales/GuestServiceSummaryTable";
import { GuestServiceSummaryCards } from "@/components/service-sales/GuestServiceSummaryCards";
import { ServiceDetailsDialog } from "@/components/service-sales/ServiceDetailsDialog";
import GuestHistoryDialog from "@/components/Revenue/GuestHistoryDialog";
import { GuestRevenue } from "@/types/guest-revenue";
import { VipGuest } from "@/types/vip-guest";

const ServiceSalesPage = () => {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState("");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [viewingGuestSummary, setViewingGuestSummary] = useState<GuestServiceSummary | null>(null);
  const [historyGuest, setHistoryGuest] = useState<GuestRevenue | null>(null);

  const { data: guestServices = [], isLoading: isLoadingGuestServices } = useQuery<GuestService[]>({
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

  const { data: vipGuestsWithImages = [], isLoading: isLoadingVipImages } = useQuery<Pick<VipGuest, 'id' | 'image_url'>[]>({
    queryKey: ['vip_guests_images_for_service_sales'],
    queryFn: async () => {
      const { data, error } = await supabase.from('vip_guests').select('id, image_url');
      if (error) throw new Error(error.message);
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

  const guestServiceSummaries = useMemo((): GuestServiceSummary[] => {
    const groupedByGuest = new Map<string, GuestServiceSummary>();
    const vipImagesMap = new Map(vipGuestsWithImages.map(g => [g.id, g.image_url]));

    guestServices.forEach(service => {
        let summary = groupedByGuest.get(service.guest_id);
        if (!summary) {
            summary = {
                guest_id: service.guest_id,
                guest_name: service.guest_name,
                guest_phone: service.guest_phone,
                guest_type: service.guest_type,
                services: [],
                total_revenue: 0,
                total_paid: 0,
                total_unpaid: 0,
                image_url: service.guest_type === 'Chức vụ' ? vipImagesMap.get(service.guest_id) : null,
            };
            groupedByGuest.set(service.guest_id, summary);
        }
        summary.services.push(service);
        summary.total_revenue += service.price;
        summary.total_paid += service.paid_amount;
        summary.total_unpaid += service.unpaid_amount;
    });

    return Array.from(groupedByGuest.values());
  }, [guestServices, vipGuestsWithImages]);

  const filteredSummaries = useMemo(() => {
    return guestServiceSummaries.filter(summary => {
        const searchTermLower = searchTerm.toLowerCase();
        const guestMatch = summary.guest_name.toLowerCase().includes(searchTermLower) ||
                           (summary.guest_phone && summary.guest_phone.includes(searchTerm));
        const serviceMatch = summary.services.some(s => s.service_name.toLowerCase().includes(searchTermLower));
        
        const serviceFilterMatch = serviceFilter === 'all' || summary.services.some(s => s.service_id === serviceFilter);

        return (guestMatch || serviceMatch) && serviceFilterMatch;
    });
  }, [guestServiceSummaries, searchTerm, serviceFilter]);

  const stats = useMemo(() => {
    return guestServices.reduce((acc, item) => {
      acc.totalRevenue += item.price;
      acc.totalPaid += item.paid_amount;
      return acc;
    }, { totalRevenue: 0, totalPaid: 0 });
  }, [guestServices]);

  const totalGuests = useMemo(() => {
    return guestServiceSummaries.length;
  }, [guestServiceSummaries]);

  const totalUnpaid = stats.totalRevenue - stats.totalPaid;

  const handleHistory = (summary: GuestServiceSummary) => {
    setHistoryGuest({ id: summary.guest_id, name: summary.guest_name } as GuestRevenue);
  };

  const handleConvertTrial = (serviceId: string) => {
    convertTrialMutation.mutate(serviceId);
  };

  const isLoading = isLoadingGuestServices || isLoadingVipImages;

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Bán dịch vụ</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => setIsSettingsOpen(true)}><Settings className="h-4 w-4" /></Button>
          <Button onClick={() => setIsAddOpen(true)}><PlusCircle className="mr-2 h-4 w-4" /> Thêm</Button>
        </div>
      </div>

      <ServiceStats totalRevenue={stats.totalRevenue} totalPaid={stats.totalPaid} totalUnpaid={totalUnpaid} totalGuests={totalGuests} />

      <div className="flex flex-col md:flex-row gap-4 md:items-center">
        <Input
          placeholder="Tìm kiếm theo tên khách, dịch vụ, SĐT..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow"
        />
        <Select value={serviceFilter} onValueChange={setServiceFilter}>
          <SelectTrigger className="w-full md:w-[240px]">
            <SelectValue placeholder="Lọc theo dịch vụ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả dịch vụ</SelectItem>
            {services.map(service => (
              <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : isMobile ? (
        <GuestServiceSummaryCards
          summaries={filteredSummaries}
          onViewDetails={setViewingGuestSummary}
          onHistory={handleHistory}
          onConvertTrial={handleConvertTrial}
        />
      ) : (
        <GuestServiceSummaryTable
          summaries={filteredSummaries}
          onViewDetails={setViewingGuestSummary}
          onHistory={handleHistory}
          onConvertTrial={handleConvertTrial}
        />
      )}

      <ServiceSettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
      <AddGuestServiceDialog open={isAddOpen} onOpenChange={setIsAddOpen} />
      <ServiceDetailsDialog
        open={!!viewingGuestSummary}
        onOpenChange={(isOpen) => !isOpen && setViewingGuestSummary(null)}
        guestSummary={viewingGuestSummary}
        allServices={services}
        onStatusChange={(id, status) => statusUpdateMutation.mutate({ id, status })}
        onConvertTrial={handleConvertTrial}
      />
      <GuestHistoryDialog guest={historyGuest} open={!!historyGuest} onOpenChange={() => setHistoryGuest(null)} />
    </div>
  );
};

export default ServiceSalesPage;