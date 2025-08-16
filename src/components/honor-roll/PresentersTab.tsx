import { useState, useMemo } from "react";
import { HonorCategory } from "@/types/honor-roll";
import { VipGuest } from "@/types/vip-guest";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface PresentersTabProps {
  categories: HonorCategory[];
  vipGuests: VipGuest[];
}

export const PresentersTab = ({ categories, vipGuests }: PresentersTabProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  const presentersData = useMemo(() => {
    const presenterMap = new Map<string, { guest: VipGuest; categories: string[] }>();
    vipGuests.forEach(guest => {
      presenterMap.set(guest.id, { guest, categories: [] });
    });
    categories.forEach(category => {
      category.presenters?.forEach(presenter => {
        if (presenterMap.has(presenter.guest_id)) {
          presenterMap.get(presenter.guest_id)!.categories.push(category.name);
        }
      });
    });
    return Array.from(presenterMap.values());
  }, [categories, vipGuests]);

  const filteredData = useMemo(() => {
    return presentersData.filter(({ guest, categories }) => {
      const searchMatch = guest.name.toLowerCase().includes(searchTerm.toLowerCase());
      const statusMatch = statusFilter === 'all' || (statusFilter === 'yes' ? categories.length > 0 : categories.length === 0);
      const roleMatch = roleFilter === 'all' || guest.role === roleFilter;
      return searchMatch && statusMatch && roleMatch;
    });
  }, [presentersData, searchTerm, statusFilter, roleFilter]);

  const roles = useMemo(() => [...new Set(vipGuests.map(g => g.role))], [vipGuests]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-2">
        <Input
          placeholder="Tìm kiếm theo tên..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow"
        />
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Lọc trạng thái" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="yes">Đã lên trao</SelectItem>
              <SelectItem value="no">Chưa lên trao</SelectItem>
            </SelectContent>
          </Select>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Lọc vai trò" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả vai trò</SelectItem>
              {roles.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">STT</TableHead>
              <TableHead>Tên</TableHead>
              <TableHead>Chức vụ</TableHead>
              <TableHead>Trao giải</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map(({ guest, categories }, index) => (
                <TableRow key={guest.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-medium">{guest.name}</TableCell>
                  <TableCell>{guest.role}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 items-start">
                      {categories.map(catName => <Badge key={catName} variant="outline">{catName}</Badge>)}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={4} className="h-24 text-center">Không tìm thấy kết quả.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};