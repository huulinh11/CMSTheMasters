import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Download, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import Papa from "papaparse";
import { useQueryClient } from "@tanstack/react-query";
import { generateGuestSlug } from "@/lib/slug";
import { VipGuest } from "@/types/vip-guest";
import { Guest } from "@/types/guest";

// Define headers for the CSV file
const CSV_HEADERS = [
  "id", "name", "role", "phone", "type", "referrer", "notes", 
  "secondary_info", "sponsorship", "payment_source", "materials"
];

// Helper to generate a unique ID for new guests
const generateNewId = (role: string, type: 'Chức vụ' | 'Khách mời', existingGuests: (VipGuest | Guest)[]): string => {
    const prefixMap: Record<string, string> = {
        // VIP
        "Prime Speaker": "PS", "Guest Speaker": "GS", "Mentor kiến tạo": "ME", "Phó BTC": "PB",
        "Đại sứ": "DS", "Cố vấn": "CV", "Giám đốc": "GD", "Nhà tài trợ": "NT",
        // Regular
        "Khách phổ thông": "KPT", "VIP": "VIP", "V-Vip": "VVP", "Super Vip": "SVP", "Vé trải nghiệm": "VTN"
    };
    const prefix = prefixMap[role] || role.substring(0, 2).toUpperCase();
    
    const roleGuests = existingGuests.filter(g => g.id.startsWith(prefix));
    const nextId = roleGuests.length + 1;
    return `${prefix}${String(nextId).padStart(3, '0')}`;
};

export const ImportExportActions = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handleDownloadTemplate = async () => {
    setIsProcessing(true);
    const toastId = showLoading("Đang tạo file mẫu...");
    try {
      let sampleData = null;

      // Try to get the latest VIP guest
      const { data: latestVip } = await supabase.from('vip_guests').select('*').order('created_at', { ascending: false }).limit(1).single();
      if (latestVip) {
        const { data: revenue } = await supabase.from('vip_guest_revenue').select('sponsorship').eq('guest_id', latestVip.id).single();
        sampleData = {
          ...latestVip,
          type: 'Chức vụ',
          secondary_info: latestVip.secondary_info,
          sponsorship: revenue?.sponsorship || 0,
          payment_source: '',
        };
      } else {
        // If no VIP, try the latest regular guest
        const { data: latestGuest } = await supabase.from('guests').select('*').order('created_at', { ascending: false }).limit(1).single();
        if (latestGuest) {
          const { data: revenue } = await supabase.from('guest_revenue').select('sponsorship, payment_source').eq('guest_id', latestGuest.id).single();
          sampleData = {
            ...latestGuest,
            type: 'Khách mời',
            secondary_info: '',
            sponsorship: revenue?.sponsorship || 0,
            payment_source: revenue?.payment_source || '',
          };
        }
      }

      const headerRow = CSV_HEADERS.join(',');
      let csvContent = [headerRow];

      if (sampleData) {
        // Clear the ID for the template, as it should be auto-generated on import if empty
        (sampleData as any).id = ''; 
        const sampleRow = CSV_HEADERS.map(header => {
          const value = (sampleData as any)[header];
          if (value === null || value === undefined) return '';
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',');
        csvContent.push(sampleRow);
      }

      const csv = csvContent.join('\n');
      const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "mau-import-khach-moi.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      dismissToast(toastId);
      showSuccess("Tải file mẫu thành công!");
    } catch (error: any) {
      dismissToast(toastId);
      showError(`Lỗi khi tạo file mẫu: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = async () => {
    setIsProcessing(true);
    const toastId = showLoading("Đang xuất dữ liệu...");

    try {
      // Fetch all data
      const { data: vipGuests, error: vipError } = await supabase.from('vip_guests').select('*');
      if (vipError) throw vipError;
      const { data: guests, error: guestError } = await supabase.from('guests').select('*');
      if (guestError) throw guestError;
      const { data: vipRevenue, error: vipRevenueError } = await supabase.from('vip_guest_revenue').select('*');
      if (vipRevenueError) throw vipRevenueError;
      const { data: guestRevenue, error: guestRevenueError } = await supabase.from('guest_revenue').select('*');
      if (guestRevenueError) throw guestRevenueError;

      const vipRevenueMap = new Map(vipRevenue.map(r => [r.guest_id, r]));
      const guestRevenueMap = new Map(guestRevenue.map(r => [r.guest_id, r]));

      const combinedData = [
        ...vipGuests.map(g => ({
          ...g,
          type: 'Chức vụ',
          secondary_info: g.secondary_info,
          sponsorship: vipRevenueMap.get(g.id)?.sponsorship || 0,
          payment_source: '',
        })),
        ...guests.map(g => ({
          ...g,
          type: 'Khách mời',
          secondary_info: '',
          sponsorship: guestRevenueMap.get(g.id)?.sponsorship || 0,
          payment_source: guestRevenueMap.get(g.id)?.payment_source || '',
        })),
      ];

      const csvData = combinedData.map(row => {
        return CSV_HEADERS.map(header => {
          const value = (row as any)[header];
          if (value === null || value === undefined) return '';
          return `"${String(value).replace(/"/g, '""')}"`; // Escape quotes
        }).join(',');
      });

      const csv = [CSV_HEADERS.join(','), ...csvData].join('\n');
      const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' }); // Add BOM for Excel
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "danh-sach-khach-moi.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      dismissToast(toastId);
      showSuccess("Xuất dữ liệu thành công!");
    } catch (error: any) {
      dismissToast(toastId);
      showError(`Lỗi khi xuất dữ liệu: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImport(file);
    }
  };

  const handleImport = async (file: File) => {
    setIsProcessing(true);
    const toastId = showLoading("Đang xử lý file import...");

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data as any[];
          if (rows.length === 0) throw new Error("File không có dữ liệu.");

          const { data: existingVipGuests } = await supabase.from('vip_guests').select('id, role');
          const { data: existingGuests } = await supabase.from('guests').select('id, role');
          const { data: roleConfigs, error: roleError } = await supabase.from('role_configurations').select('name, type');
          if (roleError) throw new Error(`Không thể tải cấu hình vai trò: ${roleError.message}`);

          const roleTypeMap = new Map(roleConfigs.map(rc => [rc.name, rc.type]));

          const vipGuestsToUpsert: any[] = [];
          const guestsToUpsert: any[] = [];
          const vipRevenueToUpsert: any[] = [];
          const guestRevenueToUpsert: any[] = [];

          for (const row of rows) {
            let type = row.type;
            if (!type && row.role) {
              type = roleTypeMap.get(row.role);
            }

            if (!['Chức vụ', 'Khách mời'].includes(type)) {
              console.warn(`Bỏ qua dòng do không xác định được loại khách mời cho vai trò "${row.role}":`, row);
              continue;
            }

            const isVip = type === 'Chức vụ';
            const guestId = row.id || generateNewId(row.role, type, isVip ? (existingVipGuests || []) : (existingGuests || []));

            const commonData = {
              id: guestId,
              name: row.name,
              role: row.role,
              phone: row.phone,
              referrer: row.referrer || null,
              notes: row.notes || null,
              materials: row.materials || null,
              slug: row.slug || generateGuestSlug(row.name),
            };

            if (isVip) {
              vipGuestsToUpsert.push({
                ...commonData,
                secondary_info: row.secondary_info || null,
              });
              if (row.sponsorship) {
                vipRevenueToUpsert.push({
                  guest_id: guestId,
                  sponsorship: Number(row.sponsorship) || 0,
                });
              }
            } else {
              guestsToUpsert.push(commonData);
              if (row.sponsorship || row.payment_source) {
                guestRevenueToUpsert.push({
                  guest_id: guestId,
                  sponsorship: Number(row.sponsorship) || 0,
                  payment_source: row.payment_source || 'Trống',
                });
              }
            }
          }

          if (vipGuestsToUpsert.length > 0) {
            const { error } = await supabase.from('vip_guests').upsert(vipGuestsToUpsert);
            if (error) throw new Error(`Lỗi import khách chức vụ: ${error.message}`);
          }
          if (guestsToUpsert.length > 0) {
            const { error } = await supabase.from('guests').upsert(guestsToUpsert);
            if (error) throw new Error(`Lỗi import khách mời: ${error.message}`);
          }
          if (vipRevenueToUpsert.length > 0) {
            const { error } = await supabase.from('vip_guest_revenue').upsert(vipRevenueToUpsert);
            if (error) throw new Error(`Lỗi import doanh thu VIP: ${error.message}`);
          }
          if (guestRevenueToUpsert.length > 0) {
            const { error } = await supabase.from('guest_revenue').upsert(guestRevenueToUpsert);
            if (error) throw new Error(`Lỗi import doanh thu khách mời: ${error.message}`);
          }

          dismissToast(toastId);
          showSuccess(`Import thành công ${rows.length} dòng dữ liệu!`);
          queryClient.invalidateQueries({ queryKey: ['vip_guests'] });
          queryClient.invalidateQueries({ queryKey: ['guests'] });
          queryClient.invalidateQueries({ queryKey: ['vip_revenue'] });
          queryClient.invalidateQueries({ queryKey: ['guest_revenue_details'] });
        } catch (error: any) {
          dismissToast(toastId);
          showError(`Lỗi import: ${error.message}`);
        } finally {
          setIsProcessing(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      },
      error: (error: any) => {
        dismissToast(toastId);
        showError(`Lỗi parse file: ${error.message}`);
        setIsProcessing(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" onClick={handleDownloadTemplate} disabled={isProcessing}>
        <FileText className="mr-2 h-4 w-4" /> Tải mẫu
      </Button>
      <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isProcessing}>
        <Upload className="mr-2 h-4 w-4" /> Import
      </Button>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".csv"
      />
      <Button onClick={handleExport} disabled={isProcessing}>
        <Download className="mr-2 h-4 w-4" /> Export
      </Button>
    </div>
  );
};