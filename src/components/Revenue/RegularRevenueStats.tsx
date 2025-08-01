import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatCurrencyShort } from "@/lib/utils";
import { GuestRevenue } from "@/types/guest-revenue";
import { DollarSign, CheckCircle, AlertCircle } from "lucide-react";
import { useMemo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface RegularRevenueStatsProps {
  guests: GuestRevenue[];
}

const RegularRevenueStats = ({ guests }: RegularRevenueStatsProps) => {
  const isMobile = useIsMobile();

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

  const formatValue = isMobile ? formatCurrencyShort : formatCurrency;

  return (
    <div className="grid grid-cols-3 gap-2 md:gap-4">
      <StatCard
        title="Tổng tài trợ"
        value={formatValue(stats.totalSponsorship)}
        icon={DollarSign}
      />
      <StatCard
        title="Tổng đã thanh toán"
        value={formatValue(stats.totalPaid)}
        icon={CheckCircle}
        className="text-green-600"
      />
      <StatCard
        title="Tổng chưa thanh toán"
        value={formatValue(stats.totalUnpaid)}
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

export default RegularRevenueStats;