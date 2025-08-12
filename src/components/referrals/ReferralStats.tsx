import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatCurrencyShort } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Users, DollarSign, Percent } from "lucide-react";
import React from "react";

interface ReferralStatsProps {
  totalReferrals: number;
  totalRevenue: number;
  totalCommission: number;
}

const ReferralStats = ({ totalReferrals, totalRevenue, totalCommission }: ReferralStatsProps) => {
  const isMobile = useIsMobile();
  const formatValue = isMobile ? formatCurrencyShort : formatCurrency;

  return (
    <div className="grid grid-cols-3 gap-2 md:gap-4">
      <StatCard
        title="Tổng lượt giới thiệu"
        value={totalReferrals.toString()}
        icon={Users}
      />
      <StatCard
        title="Tổng doanh thu"
        value={formatValue(totalRevenue)}
        icon={DollarSign}
      />
      <StatCard
        title="Tổng hoa hồng"
        value={formatValue(totalCommission)}
        icon={Percent}
        className="text-green-600"
      />
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, className }: { title: string; value: string; icon: React.ElementType, className?: string }) => (
  <Card className="bg-white/70 border-none shadow-sm rounded-2xl">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-4">
      <CardTitle className="text-xs md:text-sm font-medium text-slate-500">{title}</CardTitle>
      <Icon className={`h-4 w-4 text-muted-foreground ${className}`} />
    </CardHeader>
    <CardContent className="p-3 md:p-4 pt-0">
      <div className={`text-lg md:text-2xl font-bold ${className}`}>{value}</div>
    </CardContent>
  </Card>
);

export default ReferralStats;