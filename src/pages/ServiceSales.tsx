import { useState, useMemo, useEffect } from "react";
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
import { PageHeader } from "@/components/PageHeader";

const ITEMS_PER_PAGE = 20;

const ServiceSalesPage = () => {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState("");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [viewingGuestSummary, setViewingGuestSummary] = useState<GuestServiceSummary | null>(null);
  const [historyGuest, setHistoryGuest] = useState<GuestRevenue | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading: isLoadingGuestServices } = useQuery({
    queryKey: ['guest_service_details', currentPage],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_guest_service_details', { limit_val: ITEMS_PER_PAGE, offset_val: (currentPage - 1) * ITEMS_PER_PAGE });
      if (error) throw error;
      const { data: countData, error: countError } = await supabase.rpc('get_guest_service_details_count');
      if (countError) throw countError;
      return { services: data || [], count: countData || 0 };
    }
  });
  
  const guestServices = data?.services || [];
  const totalServices = data?.count || 0;

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

  useEffect(() => {
    if (viewingGuestSummary) {
      const updatedSummary = guestServiceSummaries.find(
        (summary) => summary.guest_id === viewingGuestSummary.guest_id
      );
      if (updatedSummary && JSON.stringify(updatedSummary) !== JSON.stringify(viewingGuestSummary)) {
        setViewingGuestSummary(updatedSummary);
      }
    }
  }, [guestServiceSummaries, viewingGuestSummary]);

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
      <PageHeader title="Bán dịch vụ">
        <Button variant="outline" size="icon" onClick={() => setIsSettingsOpen(true)}><Settings className="h-4 w-4" /></Button>
      </PageHeader>

      <ServiceStats totalRevenue={stats.totalRevenue} totalPaid={stats.totalPaid} totalUnpaid={totalUnpaid} />

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Tổng: {totalServices}</h2>
        <Button onClick={() => setIsAddOpen(true)}><PlusCircle className="mr-2 h-4 w-4" /> Thêm</Button>
      </div>

      <div className="flex items-center gap-2">
        <Input
          placeholder="Tìm kiếm..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow"
        />
        <Select value={serviceFilter} onValueChange={setServiceFilter}>
          <SelectTrigger className="w-auto flex-shrink-0">
            <SelectValue placeholder="Lọc" />
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