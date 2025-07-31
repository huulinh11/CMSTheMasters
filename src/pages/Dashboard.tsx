import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Cloud, Users, UserCheck, CircleDollarSign, ClipboardList } from "lucide-react";

const Dashboard = () => {
  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-full">
      <header className="flex justify-between items-center mb-6">
        <div>
          <p className="text-slate-500 text-sm md:text-base">Welcome home</p>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800">Ivanovic Suparjo</h1>
        </div>
        <div className="flex items-center space-x-4">
          <button className="relative p-2 rounded-full hover:bg-slate-200/50">
            <Bell className="text-slate-600 h-5 w-5 md:h-6 md:w-6" />
            <span className="absolute top-1 right-1.5 block h-2 w-2 rounded-full bg-primary ring-2 ring-slate-50"></span>
          </button>
          <Avatar className="h-9 w-9 md:h-10 md:w-10">
            <AvatarImage src="https://i.pravatar.cc/150?u=a042581f4e29026024d" alt="User" />
            <AvatarFallback>IS</AvatarFallback>
          </Avatar>
        </div>
      </header>

      <Card className="mb-6 bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg rounded-2xl">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center">
            <Cloud className="w-10 h-10 md:w-12 md:w-12 mr-4" />
            <div>
              <p className="text-sm font-light">Partly Cloudy</p>
              <p className="text-2xl md:text-3xl font-bold">27°</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-light">Humidity</p>
            <p className="text-lg md:text-xl font-bold">62%</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <InfoCard title="Khách chức vụ" value="15" icon={UserCheck} />
        <InfoCard title="Khách mời" value="128" icon={Users} />
        <InfoCard title="Doanh thu" value="$12k" icon={CircleDollarSign} />
        <InfoCard title="Tác vụ" value="8" icon={ClipboardList} />
      </div>
    </div>
  );
};

const InfoCard = ({ title, value, icon: Icon }: { title: string; value: string, icon: React.ElementType }) => (
  <Card className="bg-white shadow-md hover:shadow-lg transition-shadow rounded-2xl">
    <CardContent className="p-4">
      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 mb-3">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <p className="text-sm text-slate-500">{title}</p>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </CardContent>
  </Card>
);

export default Dashboard;