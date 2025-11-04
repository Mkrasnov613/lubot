import SideNav from "@/components/SideNav";
export default function Layout({ children }: LayoutProps<"/[slug]">) {
  return (
    <div className="flex justify-between">
      <SideNav />
      <div className="flex-1">{children}</div>
    </div>
  );
}
