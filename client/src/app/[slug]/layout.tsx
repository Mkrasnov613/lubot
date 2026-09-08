import { AuthorizedRoute } from "@/components/AuthorizedRoute";

export default function Layout({ children }: LayoutProps<"/[slug]">) {
  return <AuthorizedRoute>{children}</AuthorizedRoute>;
}
