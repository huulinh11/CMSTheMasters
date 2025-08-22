import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Download, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError, showLoading, dismissToast, showNotice } from "@/utils/toast";
import Papa from "papaparse";
import { useQueryClient } from "@tanstack/react-query";
import { generateGuestSlug } from "@/lib/slug";
import { DuplicateGuestDialog } from "./DuplicateGuestDialog";
import { CombinedGuestRevenue } from "@/pages/Guests";

// Define headers for the CSV file
const CSV_HEADERS = [
  "id", "name", "role", "phone", "type", "referrer", "notes", 
  "secondary_info", "sponsorship", "paid_amount", "payment_source", "materials", "facebook_link"
];

const CSV_DISPLAY_HEADERS = [
  "ID (để trống nếu tạo mới)", "Tên", "Vai trò", "SĐT", "Loại (Chức vụ/Khách mời)", "Người giới thiệu", "Ghi chú", 
  "Thông tin phụ (cho Chức vụ)", "Tài trợ", "Số tiền đã thanh toán (chỉ cho khách mới)", "Nguồn thanh toán (cho Khách mời)", "Tư liệu", "Link Facebook (cho Chức vụ)"
];

interface ImportExportActionsProps {
  guestsToExport: CombinedGuestRevenue[];
}

export const ImportExportActions = ({ guestsToExport }: ImportExportActionsProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [duplicateRows, setDuplicateRows] = useState<any[]>([]);
  const [allParsedRows, setAllParsedRows] = useState<any[]>([]);
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);

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
          paid_amount: 0,
          payment_source: '',
          facebook_link: latestVip.facebook_link || '',
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
            paid_amount: 0,
            payment_source: revenue?.payment_source || '',
            facebook_link: '',
          };
        }
      }

      const displayHeaderRow = CSV_DISPLAY_HEADERS.join(',');
      const headerRow = CSV_HEADERS.join(',');
      let csvContent = [displayHeaderRow, headerRow];

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
      const csvData = guestsToExport.map(row => {
        const rowForCsv = {
          id: row.id,
          name: row.name,
          role: row.role,
          phone: row.phone,
          type: row.type,
          referrer: row.referrer,
          notes: row.notes,
          secondary_info: row.type === 'Chức vụ' ? row.secondaryInfo : '',
          sponsorship: row.sponsorship,
          paid_amount: 0, // Paid amount is not exported
          payment_source: row.type === 'Khách mời' ? row.payment_source : '',
          materials: row.materials,
          facebook_link: row.type === 'Chức vụ' ? row.facebook_link : '',
        };
        return CSV_HEADERS.map(header => {
          const value = (rowForCsv as any)[header];
          if (value === null || value === undefined) return '';
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',');
      });

      const csv = [CSV_DISPLAY_HEADERS.join(','), CSV_HEADERS.join(','), ...csvData].join('\n');
      const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
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

  const processImport = async (rowsToProcess: any[]) => {
    const toastId = showLoading("Đang import dữ liệu...");
    try {
      const { data: existingVipGuests, error: vipError } = await supabase.from('vip_guests').select('id, phone, name');
      if (vipError) throw vipError;
      const { data: existingGuests, error: guestError } = await supabase.from('guests').select('id, phone');
      if (guestError) throw guestError;
      const { data: roleConfigs, error: roleError } = await supabase.from('role_configurations').select('name, type');
      if (roleError) throw new Error(`Không thể tải cấu hình vai trò: ${roleError.message}`);

      const vipGuestNameMap = new Map<string, string>();
      (existingVipGuests || []).forEach(g => { if (g.name) vipGuestNameMap.set(g.name.toLowerCase().trim(), g.id) });
      const roleTypeMap = new Map(roleConfigs.map(rc => [rc.name, rc.type]));

      const vipGuestsToUpsert: any[] = [];
      const guestsToUpsert: any[] = [];
      const vipRevenueToUpsert: any[] = [];
      const guestRevenueToUpsert: any[] = [];
      const vipPaymentsToInsert: any[] = [];
      const guestPaymentsToInsert: any[] = [];

      const newIdCounters: Record<string, number> = {};
      const prefixMap: Record<string, string> = {
        "Prime Speaker": "PS", "Guest Speaker": "GS", "Mentor kiến tạo": "ME", "Phó BTC": "PB",
        "Đại sứ": "DS", "Cố vấn": "CV", "Giám đốc": "GD", "Nhà tài trợ": "NT",
        "Khách phổ thông": "KPT", "VIP": "VIP", "V-Vip": "VVP", "Super Vip": "SVP", "Vé trải nghiệm": "VTN"
      };

      for (const row of rowsToProcess) {
        let type = row.type;
        if (!type && row.role) type = roleTypeMap.get(row.role);
        if (!['Chức vụ', 'Khách mời'].includes(type)) continue;

        const isVip = type === 'Chức vụ';
        const isNewGuest = !row.id;
        let guestId = row.id;

        if (isNewGuest) {
          const prefix = prefixMap[row.role] || row.role.substring(0, 2).toUpperCase();
          if (newIdCounters[prefix] === undefined) {
            const existingRoleGuests = (isVip ? (existingVipGuests || []) : (existingGuests || [])).filter(g => g.id.startsWith(prefix));
            newIdCounters[prefix] = existingRoleGuests.length;
          }
          newIdCounters[prefix]++;
          guestId = `${prefix}${String(newIdCounters[prefix]).padStart(3, '0')}`;
        }

        let referrerValue = row.referrer ? row.referrer.trim() : null;
        if (referrerValue) {
          if (referrerValue.toLowerCase() === 'ads') {
            referrerValue = 'ads';
          } else {
            const foundId = vipGuestNameMap.get(referrerValue.toLowerCase());
            if (foundId) referrerValue = foundId;
          }
        }

        const commonData = {
          id: guestId, name: row.name, role: row.role, phone: row.phone,
          referrer: referrerValue, notes: row.notes || null, materials: row.materials || null,
          slug: row.slug || generateGuestSlug(row.name, guestId),
        };

        if (isVip) {
          vipGuestsToUpsert.push({ ...commonData, secondary_info: row.secondary_info || null, facebook_link: row.facebook_link || null });
          if (row.sponsorship) vipRevenueToUpsert.push({ guest_id: guestId, sponsorship: Number(row.sponsorship) || 0 });
        } else {
          guestsToUpsert.push(commonData);
          if (row.sponsorship || row.payment_source) guestRevenueToUpsert.push({ guest_id: guestId, sponsorship: Number(row.sponsorship) || 0, payment_source: row.payment_source || 'Trống' });
        }

        if (isNewGuest && row.paid_amount && Number(row.paid_amount) > 0) {
          const payment = { guest_id: guestId, amount: Number(row.paid_amount) };
          if (isVip) vipPaymentsToInsert.push(payment);
          else guestPaymentsToInsert.push(payment);
        }
      }

      if (vipGuestsToUpsert.length > 0) await supabase.from('vip_guests').upsert(vipGuestsToUpsert).then(({ error }) => { if (error) throw error; });
      if (guestsToUpsert.length > 0) await supabase.from('guests').upsert(guestsToUpsert).then(({ error }) => { if (error) throw error; });
      if (vipRevenueToUpsert.length > 0) await supabase.from('vip_guest_revenue').upsert(vipRevenueToUpsert).then(({ error }) => { if (error) throw error; });
      if (guestRevenueToUpsert.length > 0) await supabase.from('guest_revenue').upsert(guestRevenueToUpsert).then(({ error }) => { if (error) throw error; });
      if (vipPaymentsToInsert.length > 0) await supabase.from('vip_payments').insert(vipPaymentsToInsert).then(({ error }) => { if (error) throw error; });
      if (guestPaymentsToInsert.length > 0) await supabase.from('guest_payments').insert(guestPaymentsToInsert).then(({ error }) => { if (error) throw error; });

      dismissToast(toastId);
      showSuccess(`Import thành công ${rowsToProcess.length} dòng dữ liệu!`);
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
  };

  const handleImport = (file: File) => {
    setIsProcessing(true);
    const toastId = showLoading("Đang kiểm tra file...");

    Papa.parse(file, {
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const data = results.data as string[][];
          if (data.length < 2) throw new Error("File không có dữ liệu hoặc thiếu header.");
          if (data[0][0].includes("ID")) data.shift();
          const headers = data.shift();
          if (!headers || headers.join(',') !== CSV_HEADERS.join(',')) throw new Error("Headers của file không khớp với mẫu.");
          
          const rows = data.map(rowArray => {
            const obj: { [key: string]: string } = {};
            headers.forEach((header, i) => { obj[header] = rowArray[i]; });
            return obj;
          });

          const { data: existingVipGuests } = await supabase.from('vip_guests').select('id, phone');
          const { data: existingGuests } = await supabase.from('guests').select('id, phone');
          const phoneToIdMap = new Map<string, string>();
          (existingVipGuests || []).forEach(g => { if (g.phone) phoneToIdMap.set(g.phone, g.id) });
          (existingGuests || []).forEach(g => { if (g.phone) phoneToIdMap.set(g.phone, g.id) });

          const duplicates = rows.filter(row => row.phone && phoneToIdMap.has(row.phone) && phoneToIdMap.get(row.phone) !== row.id);

          if (duplicates.length > 0) {
            setAllParsedRows(rows);
            setDuplicateRows(duplicates);
            setIsDuplicateDialogOpen(true);
            dismissToast(toastId);
          } else {
            await processImport(rows);
          }
        } catch (error: any) {
          dismissToast(toastId);
          showError(`Lỗi xử lý file: ${error.message}`);
          setIsProcessing(false);
        }
      },
      error: (error: any) => {
        dismissToast(toastId);
        showError(`Lỗi parse file: ${error.message}`);
        setIsProcessing(false);
      }
    });
  };

  const handleConfirmSkip = () => {
    const duplicatePhones = new Set(duplicateRows.map(r => r.phone));
    const rowsToImport = allParsedRows.filter(row => !row.phone || !duplicatePhones.has(row.phone));
    processImport(rowsToImport);
    setIsDuplicateDialogOpen(false);
  };

  const handleConfirmImportAnyway = () => {
    const duplicatePhones = new Set(duplicateRows.map(r => r.phone));
    const rowsToImport = allParsedRows.map(row => {
      if (row.phone && duplicatePhones.has(row.phone)) {
        return {
          ...row,
          phone: '',
          notes: row.notes ? `${row.notes}\nTrùng số điện thoại.` : 'Trùng số điện thoại.'
        };
      }
      return row;
    });
    processImport(rowsToImport);
    setIsDuplicateDialogOpen(false);
  };

  return (
    <>
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
      <DuplicateGuestDialog
        open={isDuplicateDialogOpen}
        onOpenChange={setIsDuplicateDialogOpen}
        duplicates={duplicateRows}
        onConfirmSkip={handleConfirmSkip}
        onConfirmImportAnyway={handleConfirmImportAnyway}
      />
    </>
  );
};