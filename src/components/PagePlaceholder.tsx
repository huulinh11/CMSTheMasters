import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface PagePlaceholderProps {
  title: string;
}

const PagePlaceholder = ({ title }: PagePlaceholderProps) => {
  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6 text-slate-800">{title}</h1>
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Nội dung trang</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Nội dung cho trang {title.toLowerCase()} sẽ được hiển thị ở đây.</p>
          <p className="mt-4 text-sm text-slate-500">Giao diện chi tiết và chức năng sẽ được xây dựng trong các bước tiếp theo.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PagePlaceholder;