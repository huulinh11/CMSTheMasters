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
import { ChevronDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { InformationTable } from "@/components/information/InformationTable";
import { InformationCards } from "@/components/information/InformationCards";
import { EditInformationDialog } from "@/components/information/EditInformationDialog";
import { showSuccess, showError } from "@/utils/toast";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { DataTablePagination } from "@/components/DataTablePagination";

const ITEMS_PER_PAGE = 10;

const Information = () => {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilters, setRoleFilters] = useState<string[]>([]);
  const [editingGuest, setEditingGuest] = useState<VipGuest | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading: isLoadingGuests } = useQuery({
    queryKey: ['vip_guests_information', currentPage, searchTerm, roleFilters],
    queryFn: async () => {
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let query = supabase.from('vip_guests').select('*', { count: 'exact' });

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,id.ilike.%${searchTerm}%,role.ilike.%${searchTerm}%`);
      }
      if (roleFilters.length > 0) {
        query = query.in('role', roleFilters);
      }

      const { data, error, count } = await query.order('created_at', { ascending: false }).range(from, to);

      if (error) throw new Error(error.message);
      
      const guests = (data || []).map((item: any) => ({
        ...item,
        secondaryInfo: item.secondary_info,
      }));

      return { guests, count: count || 0 };
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
    },
    onError: (error) => showError((error as Error).message),
    onSettled: () => {
      setEditingGuest(null);
    },
  });

  const handleViewDetails = (guest: VipGuest) => {
    navigate(`/guests?view_vip=${guest.id}`);
  };

  const isLoading = isLoadingGuests || isLoadingRoles;
  const guests = data?.guests || [];
  const totalGuests = data?.count || 0;
  const totalPages = Math.ceil(totalGuests / ITEMS_PER_PAGE);

  return (
    <div className="p-4 md:p-6 space-y-4">
      <PageHeader title="Thông tin">
        <h2 className="text-xl font-bold text-slate-800">Tổng: {totalGuests}</h2>
      </PageHeader>
      <div className="flex items-center gap-2">
        <Input
          placeholder="Tìm kiếm theo tên, ID, vai trò..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
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
                  setCurrentPage(1);
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
        <InformationCards guests={guests} onEdit={setEditingGuest} onView={handleViewDetails} roleConfigs={roleConfigs} />
      ) : (
        <InformationTable guests={guests} onEdit={setEditingGuest} onView={handleViewDetails} />
      )}

      <DataTablePagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

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