import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GuestRevenue } from "@/types/guest-revenue";
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
import RegularRevenueTable from "@/components/Revenue/RegularRevenueTable";
import { RegularRevenueCards } from "@/components/Revenue/RegularRevenueCards";
import RegularRevenueStats from "@/components/Revenue/RegularRevenueStats";
import GuestPaymentDialog from "@/components/Revenue/GuestPaymentDialog";
import GuestHistoryDialog from "@/components/Revenue/GuestHistoryDialog";
import EditGuestRevenueDialog from "@/components/Revenue/EditGuestRevenueDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { ViewGuestSheet } from "@/components/guests/ViewGuestSheet";
import { Guest } from "@/types/guest";
import { RoleConfiguration } from "@/types/role-configuration";
import { VipGuest } from "@/types/vip-guest";

type UpsaleHistory = {
  guest_id: string;
  from_sponsorship: number;
  from_payment_source: string | null;
  created_at: string;
};

const RegularGuestRevenueTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilters, setRoleFilters] = useState<string[]>([]);
  const [payingGuest, setPayingGuest] = useState<GuestRevenue | null>(null);
  const [historyGuest, setHistoryGuest] = useState<GuestRevenue | null>(null);
  const [editingGuest, setEditingGuest] = useState<GuestRevenue | null>(null);
  const [editMode, setEditMode] = useState<'edit' | 'upsale'>('edit');
  const [viewingGuest, setViewingGuest] = useState<GuestRevenue | null>(null);
  const isMobile = useIsMobile();

  const { data: guestsData = [], isLoading: isLoadingGuests } = useQuery<any[]>({
    queryKey: ['guest_revenue_details'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_guest_revenue_details');
      if (error) throw new Error(error.message);
      return data || [];
    }
  });

  const { data: upsaleHistory = [], isLoading: isLoadingHistory } = useQuery<UpsaleHistory[]>({
    queryKey: ['guest_upsale_history'],
    queryFn: async () => {
        const { data, error } = await supabase.from('guest_upsale_history').select('guest_id, from_sponsorship, from_payment_source, created_at');
        if (error) throw error;
        return data || [];
    }
  });

  const { data: roleConfigs = [], isLoading: isLoadingRoles } = useQuery<RoleConfiguration[]>({
    queryKey: ['role_configurations', 'Khách mời'],
    queryFn: async () => {
      const { data, error } = await supabase.from('role_configurations').select('*').eq('type', 'Khách mời');
      if (error) throw new Error(error.message);
      return data || [];
    }
  });

  const { data: vipGuests = [] } = useQuery<VipGuest[]>({
    queryKey: ['vip_guests_for_upsale'],
    queryFn: async () => {
      const { data, error } = await supabase.from('vip_guests').select('id, name');
      if (error) throw new Error(error.message);
      return data || [];
    }
  });

  const guests = useMemo((): GuestRevenue[] => {
    if (isLoadingGuests || isLoadingHistory) return [];

    const historyMap = new Map<string, UpsaleHistory[]>();
    upsaleHistory.forEach(h => {
        const history = historyMap.get(h.guest_id) || [];
        history.push(h);
        historyMap.set(h.guest_id, history);
    });

    return guestsData.map(g => {
      const originalSponsorship = g.sponsorship || 0;
      let effectiveSponsorship = originalSponsorship;

      if (g.is_upsaled) {
        const guestHistory = historyMap.get(g.id);
        if (guestHistory && guestHistory.length > 0) {
          const firstUpsale = guestHistory.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0];
          if (firstUpsale.from_payment_source === 'Chỉ tiêu') {
            effectiveSponsorship = originalSponsorship - firstUpsale.from_sponsorship;
          }
        }
      } else if (g.payment_source === 'Chỉ tiêu') {
        effectiveSponsorship = 0;
      }

      return {
        ...g,
        original_sponsorship: originalSponsorship,
        sponsorship: effectiveSponsorship,
        paid: g.paid_amount || 0,
        unpaid: effectiveSponsorship - (g.paid_amount || 0),
        is_upsaled: g.is_upsaled || false,
        commission: 0, // Placeholder
      };
    });
  }, [guestsData, upsaleHistory, isLoadingGuests, isLoadingHistory]);

  const filteredGuests = useMemo(() => {
    return guests.filter((guest) => {
      const searchMatch =
        guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.id.toLowerCase().includes(searchTerm.toLowerCase());
      const roleMatch = roleFilters.length === 0 || roleFilters.includes(guest.role);
      return searchMatch && roleMatch;
    });
  }, [guests, searchTerm, roleFilters]);

  const handleOpenEditDialog = (guest: GuestRevenue) => {
    setEditMode('edit');
    setEditingGuest(guest);
  };

  const handleOpenUpsaleDialog = (guest: GuestRevenue) => {
    setEditMode('upsale');
    setEditingGuest(guest);
  };

  const isLoading = isLoadingGuests || isLoadingRoles || isLoadingHistory;

  return (
    <div className="space-y-4">
      <RegularRevenueStats guests={filteredGuests} />
      
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
        <RegularRevenueCards
          guests={filteredGuests}
          onPay={setPayingGuest}
          onHistory={setHistoryGuest}
          onEdit={handleOpenEditDialog}
          onUpsale={handleOpenUpsaleDialog}
          onView={setViewingGuest}
          roleConfigs={roleConfigs}
        />
      ) : (
        <RegularRevenueTable
          guests={filteredGuests}
          onPay={setPayingGuest}
          onHistory={setHistoryGuest}
          onEdit={handleOpenEditDialog}
          onUpsale={handleOpenUpsaleDialog}
          onView={setViewingGuest}
          roleConfigs={roleConfigs}
        />
      )}

      <GuestPaymentDialog
        guest={payingGuest}
        open={!!payingGuest}
        onOpenChange={(open) => !open && setPayingGuest(null)}
      />
      <GuestHistoryDialog
        guest={historyGuest}
        open={!!historyGuest}
        onOpenChange={(open) => !open && setHistoryGuest(null)}
      />
      <EditGuestRevenueDialog
        guest={editingGuest}
        open={!!editingGuest}
        onOpenChange={(open) => !open && setEditingGuest(null)}
        mode={editMode}
        roleConfigs={roleConfigs}
        vipGuests={vipGuests}
      />
       <ViewGuestSheet
        guest={viewingGuest as Guest | null}
        open={!!viewingGuest}
        onOpenChange={(open) => !open && setViewingGuest(null)}
        onEdit={() => { /* No edit from this view */}}
        roleConfigs={roleConfigs}
      />
    </div>
  );
};

export default RegularGuestRevenueTab;