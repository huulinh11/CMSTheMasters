import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { showSuccess, showError } from '@/utils/toast';
import { Guest } from '@/types/guest';
import { VipGuest } from '@/types/vip-guest';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type ResolutionRequest = {
  id: string;
  requested_slug: string;
  provided_name: string;
  provided_phone: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
};

type CombinedGuestForSlug = (Guest | VipGuest) & { type: 'Chức vụ' | 'Khách mời' };

const SlugResolutionSettings = () => {
  const queryClient = useQueryClient();
  const [selectedGuest, setSelectedGuest] = useState<Record<string, string>>({});
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);

  const { data: requests = [], isLoading } = useQuery<ResolutionRequest[]>({
    queryKey: ['slug_resolution_requests'],
    queryFn: async () => {
      const { data, error } = await supabase.from('slug_resolution_requests').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  const { data: allGuests = [] } = useQuery<CombinedGuestForSlug[]>({
    queryKey: ['all_guests_for_slug_resolution'],
    queryFn: async () => {
      const { data: vips } = await supabase.from('vip_guests').select('*');
      const { data: regulars } = await supabase.from('guests').select('*');
      const combinedVips = (vips || []).map(v => ({ ...v, type: 'Chức vụ' as const }));
      const combinedRegulars = (regulars || []).map(r => ({ ...r, type: 'Khách mời' as const }));
      return [...combinedVips, ...combinedRegulars];
    },
    enabled: requests.length > 0,
  });

  const mutation = useMutation({
    mutationFn: async ({ requestId, status, guestId, guestType, oldSlug }: { requestId: string, status: 'approved' | 'rejected', guestId?: string, guestType?: string, oldSlug?: string }) => {
      if (status === 'approved') {
        if (!guestId || !guestType || !oldSlug) throw new Error("Thiếu thông tin để duyệt.");
        const { error: aliasError } = await supabase.from('slug_aliases').insert({ old_slug: oldSlug, guest_id: guestId, guest_type: guestType });
        if (aliasError) throw aliasError;
      }
      const { error: statusError } = await supabase.from('slug_resolution_requests').update({ status }).eq('id', requestId);
      if (statusError) throw statusError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slug_resolution_requests'] });
      showSuccess("Thao tác thành công!");
    },
    onError: (error: Error) => showError(error.message),
  });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-slate-800">Yêu cầu xử lý link trùng lặp</h2>
      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="rounded-lg border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thời gian</TableHead>
                <TableHead>Thông tin cung cấp</TableHead>
                <TableHead>Link cũ</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Gán cho khách</TableHead>
                <TableHead className="text-right">Tác vụ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length > 0 ? (
                requests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>{format(new Date(req.created_at), 'dd/MM/yyyy HH:mm')}</TableCell>
                    <TableCell>
                      <div>{req.provided_name}</div>
                      <div className="text-sm text-muted-foreground">{req.provided_phone}</div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground truncate max-w-xs">{req.requested_slug}</TableCell>
                    <TableCell><Badge variant={req.status === 'pending' ? 'secondary' : (req.status === 'approved' ? 'default' : 'destructive')}>{req.status}</Badge></TableCell>
                    <TableCell>
                      {req.status === 'pending' && (
                        <Popover open={openPopoverId === req.id} onOpenChange={(isOpen) => setOpenPopoverId(isOpen ? req.id : null)}>
                          <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" className="w-[250px] justify-between">
                              {selectedGuest[req.id]
                                ? allGuests.find(g => g.id === selectedGuest[req.id])?.name
                                : "Chọn khách mời..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[250px] p-0">
                            <Command>
                              <CommandInput placeholder="Tìm khách theo tên, ID..." />
                              <CommandList>
                                <CommandEmpty>Không tìm thấy.</CommandEmpty>
                                <CommandGroup>
                                  {allGuests.map(guest => (
                                    <CommandItem
                                      key={guest.id}
                                      value={`${guest.name} ${guest.id}`}
                                      onSelect={() => {
                                        setSelectedGuest(prev => ({ ...prev, [req.id]: guest.id }));
                                        setOpenPopoverId(null);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          selectedGuest[req.id] === guest.id ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      {guest.name} ({guest.role})
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {req.status === 'pending' && (
                        <>
                          <Button size="sm" onClick={() => mutation.mutate({ requestId: req.id, status: 'approved', guestId: selectedGuest[req.id], guestType: allGuests.find(g => g.id === selectedGuest[req.id])?.type === 'Chức vụ' ? 'vip' : 'regular', oldSlug: req.requested_slug })} disabled={!selectedGuest[req.id]}>Duyệt</Button>
                          <Button size="sm" variant="destructive" onClick={() => mutation.mutate({ requestId: req.id, status: 'rejected' })}>Từ chối</Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Không có yêu cầu nào.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default SlugResolutionSettings;