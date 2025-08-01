import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { VipGuestRevenue } from "@/types/vip-guest-revenue";
import { DollarSign, CheckCircle, AlertCircle } from "lucide-react";
import { useMemo } from "react";

interface VipRevenueStatsProps {
  guests: VipGuestRevenue[];
}

const VipRevenueStats = ({ guests }: VipRevenueStatsProps) => {
  const stats = useMemo(() => {
    return guests.reduce(
      (acc, guest) => {
        acc.totalSponsorship += guest.sponsorship;
        acc.totalPaid += guest.paid;
        acc.totalUnpaid += guest.unpaid;
        return acc;
      },
      { totalSponsorship: 0, totalPaid: 0, totalUnpaid: 0 }
    );
  }, [guests]);

  return (
    <div className="grid grid-cols-3 gap-2 md:gap-4">
      <StatCard
        title="Tổng tài trợ"
        value={formatCurrency(stats.totalSponsorship)}
        icon={DollarSign}
      />
      <StatCard
        title="Tổng đã thanh toán"
        value={formatCurrency(stats.totalPaid)}
        icon={CheckCircle}
        className="text-green-600"
      />
      <StatCard
        title="Tổng chưa thanh toán"
        value={formatCurrency(stats.totalUnpaid)}
        icon={AlertCircle}
        className="text-red-600"
      />
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, className }: { title: string; value: string; icon: React.ElementType, className?: string }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3">
      <CardTitle className="text-xs md:text-sm font-medium">{title}</CardTitle>
      <Icon className={`h-4 w-4 text-muted-foreground ${className}`} />
    </CardHeader>
    <CardContent className="p-3 pt-0">
      <div className={`text-lg md:text-2xl font-bold ${className}`}>{value}</div>
    </CardContent>
  </Card>
);

export default VipRevenueStats;