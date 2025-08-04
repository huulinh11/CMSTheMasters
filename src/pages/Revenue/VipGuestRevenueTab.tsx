import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { VipGuestRevenue } from "@/types/vip-guest-revenue";
import { VipGuest } from "@/types/vip-guest";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import VipRevenueStats from "@/components/Revenue/VipRevenueStats";
import VipRevenueTable from "@/components/Revenue/VipRevenueTable";
import { VipRevenueCards } from "@/components/Revenue/VipRevenueCards";
import EditSponsorshipDialog from "@/components/Revenue/EditSponsorshipDialog";
import PaymentDialog from "@/components/Revenue/PaymentDialog";
import HistoryDialog from "@/components/Revenue/HistoryDialog";
import { ViewVipGuestSheet } from "@/components/vip-guests/ViewVipGuestSheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { RoleConfiguration } from "@/types/role-configuration";
import { useAuth } from "@/contexts/AuthContext";

const VipGuestRevenueTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilters, setRoleFilters] = useState<string[]>([]);
  const [editingGuest, setEditingGuest] = useState<VipGuestRevenue | null>(null);
  const [payingGuest, setPayingGuest] = useState<VipGuestRevenue | null>(null);
  const [historyGuest, setHistoryGuest] = useState<VipGuestRevenue | null>(null);
  const [viewingGuest, setViewingGuest] = useState<VipGuestRevenue | null>(null);
  const isMobile = useIsMobile();
  const { profile } = useAuth();
  const canViewSummaryStats = profile?.role === 'Admin' || profile?.role === 'Quản lý';

  const { data: guests = [], isLoading: isLoadingGuests } = useQuery<VipGuestRevenue[]>({
    queryKey: ['vip_revenue'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_vip_guest_revenue_details');
      if (error) throw new Error(error.message);
      return (data || []).map(g => ({
        ...g,
        sponsorship: g.sponsorship || 0,
        paid: g.paid_amount || 0,
        unpaid: (g.sponsorship || 0) - (g.paid_amount || 0),
        secondaryInfo: g.secondary_info,
        commission: 0, // Placeholder
      }));
    }
  });

  const { data: roleConfigs = [], isLoading: isLoadingRoles } = useQuery<RoleConfiguration[]>({
    queryKey: ['role_configurations', 'Chức vụ'],
    queryFn: async () => {
      const { data, error } = await supabase.from('role_configurations').select('*').eq('type', 'Chức vụ');
      if (error) throw new Error(error.message);
      return data || [];
    }
  });

  const filteredGuests = useMemo(() => {
    return guests.filter((guest) => {
      const searchMatch =
        guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.id.toLowerCase().includes(searchTerm.toLowerCase());
      const roleMatch = roleFilters.length === 0 || roleFilters.includes(guest.role);
      return searchMatch && roleMatch;
    });
  }, [guests, searchTerm, roleFilters]);

  const isLoading = isLoadingGuests || isLoadingRoles;

  return (
    <div className="space-y-4">
      {canViewSummaryStats && <VipRevenueStats guests={filteredGuests} />}
      
      <div className="flex items-center gap-2">
        <Input
          placeholder="Tìm kiếm theo tên, ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow bg-white/80"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-auto justify-between bg-white/80 flex-shrink-0">
              Lọc <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {roleConfigs.map((role) => (
              <DropdownMenuCheckboxItem
                key={role.id}
                checked={roleFilters.includes(role.name)}
                onCheckedChange={(checked) => {
                  setRoleFilters(
                    checked ? [...roleFilters, role.name] : roleFilters.filter((r) => r !== role.name)
                  );
                }}
              >
                {role.name}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isLoading ? (
        <Skeleton className="h-96 w-full rounded-lg" />
      ) : isMobile ? (
        <VipRevenueCards
          guests={filteredGuests}
          onPay={setPayingGuest}
          onHistory={setHistoryGuest}
          onEdit={setEditingGuest}
          onView={setViewingGuest}
          roleConfigs={roleConfigs}
        />
      ) : (
        <VipRevenueTable
          guests={filteredGuests}
          onPay={setPayingGuest}
          onHistory={setHistoryGuest}
          onEdit={setEditingGuest}
          onView={setViewingGuest}
          roleConfigs={roleConfigs}
        />
      )}

      <EditSponsorshipDialog
        guest={editingGuest}
        open={!!editingGuest}
        onOpenChange={(open) => !open && setEditingGuest(null)}
      />
      <PaymentDialog
        guest={payingGuest}
        open={!!payingGuest}
        onOpenChange={(open) => !open && setPayingGuest(null)}
      />
      <HistoryDialog
        guest={historyGuest}
        open={!!historyGuest}
        onOpenChange={(open) => !open && setHistoryGuest(null)}
      />
      <ViewVipGuestSheet
        guest={viewingGuest as VipGuest | null}
        open={!!viewingGuest}
        onOpenChange={(open) => !open && setViewingGuest(null)}
        roleConfigs={roleConfigs}
      />
    </div>
  );
};

export default VipGuestRevenueTab;