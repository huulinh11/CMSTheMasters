import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GuestRevenue } from "@/types/guest-revenue";
import { GUEST_ROLES } from "@/types/guest";
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
import GuestPaymentDialog from "@/components/Revenue/GuestPaymentDialog";
import GuestHistoryDialog from "@/components/Revenue/GuestHistoryDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { ViewGuestSheet } from "@/components/guests/ViewGuestSheet";
import { Guest } from "@/types/guest";
import { showError, showSuccess } from "@/utils/toast";

const RegularGuestRevenueTab = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilters, setRoleFilters] = useState<string[]>([]);
  const [payingGuest, setPayingGuest] = useState<GuestRevenue | null>(null);
  const [historyGuest, setHistoryGuest] = useState<GuestRevenue | null>(null);
  const [viewingGuest, setViewingGuest] = useState<GuestRevenue | null>(null);
  const isMobile = useIsMobile();

  const { data: guests = [], isLoading } = useQuery<GuestRevenue[]>({
    queryKey: ['guest_revenue'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_guest_revenue_details');
      if (error) throw new Error(error.message);
      return (data || []).map(g => ({
        ...g,
        sponsorship: g.sponsorship || 0,
        paid: g.paid_amount || 0,
        unpaid: (g.sponsorship || 0) - (g.paid_amount || 0),
        is_upsaled: g.is_upsaled || false,
        commission: 0, // Placeholder
      }));
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

  const handleUpsale = (guest: GuestRevenue) => {
    // Placeholder for upsale functionality
    showSuccess(`Chức năng Upsale cho ${guest.name} sẽ được phát triển sau.`);
  };

  const handleEdit = (guest: GuestRevenue) => {
    // Placeholder for edit functionality
    showSuccess(`Chức năng sửa tài trợ cho ${guest.name} sẽ được phát triển sau.`);
  };

  return (
    <div className="space-y-4">
      {/* Placeholder for stats */}
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
            {GUEST_ROLES.map((role) => (
              <DropdownMenuCheckboxItem
                key={role}
                checked={roleFilters.includes(role)}
                onCheckedChange={(checked) => {
                  setRoleFilters(
                    checked ? [...roleFilters, role] : roleFilters.filter((r) => r !== role)
                  );
                }}
              >
                {role}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isLoading ? (
        <Skeleton className="h-96 w-full rounded-lg" />
      ) : (
        <RegularRevenueTable
          guests={filteredGuests}
          onPay={setPayingGuest}
          onHistory={setHistoryGuest}
          onEdit={handleEdit}
          onUpsale={handleUpsale}
          onView={setViewingGuest}
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
       <ViewGuestSheet
        guest={viewingGuest as Guest | null}
        open={!!viewingGuest}
        onOpenChange={(open) => !open && setViewingGuest(null)}
        onEdit={() => { /* No edit from this view */}}
      />
    </div>
  );
};

export default RegularGuestRevenueTab;