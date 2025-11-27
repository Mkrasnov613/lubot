import SideNav from "@/components/SideNav";
export default function Layout({ children }: LayoutProps<"/[slug]">) {
  return (
    <div className="flex justify-between max-w-screen lg:max-h-screen overflow-hidden">
      <SideNav />
      <div className="flex-1 ml-60">{children}</div>
    </div>
  );
}
