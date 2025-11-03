import SideNav from "@/components/SideNav";
export default function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  return (
    <div className="flex justify-between">
      <SideNav />
      <div className="flex-1">{children}</div>
    </div>
  );
}
