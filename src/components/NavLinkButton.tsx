import Link from "next/link";
import { JSX } from "react";

export default function NavLinkButton({
  path,
  img,
}: {
  path: string;
  img: JSX.Element;
}) {
  return (
    <Link
      href={path}
      className="p-4 flex-1 rounded-full flex items-center justify-start gap-5 hover:bg-gradient-to-b hover:from-bg2  hover:shadow-large hover:to-bg3 hover:border-1 border-t-highlight border-border "
    >
      {img}
    </Link>
  );
}
