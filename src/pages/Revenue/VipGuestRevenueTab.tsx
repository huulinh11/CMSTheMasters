import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { VipGuestRevenue } from "@/types/vip-guest-revenue";
import { ROLES } from "@/types/vip-guest";
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
import EditSponsorshipDialog from "@/components/Revenue/EditSponsorshipDialog";
import PaymentDialog from "@/components/Revenue/PaymentDialog";
import HistoryDialog from "@/components/Revenue/HistoryDialog";

const VipGuestRevenueTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilters, setRoleFilters] = useState<string[]>([]);
  const [editingGuest, setEditingGuest] = useState<VipGuestRevenue | null>(null);
  const [payingGuest, setPayingGuest] = useState<VipGuestRevenue | null>(null);
  const [historyGuest, setHistoryGuest] = useState<VipGuestRevenue | null>(null);

  const { data: guests = [], isLoading } = useQuery<VipGuestRevenue[]>({
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

  const filteredGuests = useMemo(() => {
    return guests.filter((guest) => {
      const searchMatch =
        guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.id.toLowerCase().includes(searchTerm.toLowerCase());
      const roleMatch = roleFilters.length === 0 || roleFilters.includes(guest.role);
      return searchMatch && roleMatch;
    });
  }, [guests, searchTerm, roleFilters]);

  return (
    <div className="space-y-4">
      <VipRevenueStats guests={filteredGuests} />
      
      <div className="flex flex-col md:flex-row items-center gap-2">
        <Input
          placeholder="Tìm kiếm theo tên, ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow bg-white/80"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full md:w-auto justify-between bg-white/80">
              Lọc theo vai trò <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {ROLES.map((role) => (
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
        <VipRevenueTable
          guests={filteredGuests}
          onPay={setPayingGuest}
          onHistory={setHistoryGuest}
          onEdit={setEditingGuest}
          onView={() => { /* Placeholder for view details */ }}
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
    </div>
  );
};

export default VipGuestRevenueTab;