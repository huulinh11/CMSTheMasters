import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { VipGuest } from "@/types/vip-guest";
import { RoleConfiguration } from "@/types/role-configuration";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { InformationTable } from "@/components/information/InformationTable";
import { InformationCards } from "@/components/information/InformationCards";
import { EditInformationDialog } from "@/components/information/EditInformationDialog";
import { showSuccess, showError } from "@/utils/toast";
import { useNavigate } from "react-router-dom";

const Information = () => {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilters, setRoleFilters] = useState<string[]>([]);
  const [editingGuest, setEditingGuest] = useState<VipGuest | null>(null);

  const { data: guests = [], isLoading: isLoadingGuests } = useQuery<VipGuest[]>({
    queryKey: ['vip_guests_information'],
    queryFn: async () => {
      const { data, error } = await supabase.from('vip_guests').select('*').order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data || []).map((item: any) => ({
        ...item,
        secondaryInfo: item.secondary_info,
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

  const editMutation = useMutation({
    mutationFn: async (guest: Partial<VipGuest> & { id: string }) => {
      const { id, secondaryInfo, ...rest } = guest;
      const { name, role, phone, referrer, notes, ...infoFields } = rest;
      const guestForDb = { ...infoFields, secondary_info: secondaryInfo };
      const { error } = await supabase.from('vip_guests').update(guestForDb).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vip_guests_information'] });
      showSuccess("Cập nhật thông tin thành công!");
      setEditingGuest(null);
    },
    onError: (error) => showError(error.message),
  });

  const filteredGuests = useMemo(() => {
    return guests.filter((guest) => {
      const searchMatch =
        guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (guest.role && guest.role.toLowerCase().includes(searchTerm.toLowerCase()));
      const roleMatch = roleFilters.length === 0 || (guest.role && roleFilters.includes(guest.role));
      return searchMatch && roleMatch;
    });
  }, [guests, searchTerm, roleFilters]);

  const handleViewDetails = (guest: VipGuest) => {
    navigate(`/guests/vip/${guest.id}`);
  };

  const isLoading = isLoadingGuests || isLoadingRoles;

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Thông tin</h1>
      </div>
      <div className="flex items-center gap-2">
        <Input
          placeholder="Tìm kiếm theo tên, ID, vai trò..."
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
        <InformationCards guests={filteredGuests} onEdit={setEditingGuest} onView={handleViewDetails} roleConfigs={roleConfigs} />
      ) : (
        <InformationTable guests={filteredGuests} onEdit={setEditingGuest} onView={handleViewDetails} />
      )}

      <EditInformationDialog
        guest={editingGuest}
        open={!!editingGuest}
        onOpenChange={(open) => !open && setEditingGuest(null)}
        onSubmit={editMutation.mutate}
      />
    </div>
  );
};

export default Information;