import Link from "next/link";
import { usePathname } from "next/navigation";
import { JSX } from "react";

export default function NavLinkButton({
  path,
  img,
  text,
}: {
  path: string;
  img: JSX.Element;
  text: string;
}) {
  const pathname = usePathname()
  return (
    <Link
      href={path}
      className=""
    >
      <div className={`${path === pathname && 'bg-bg3'} flex w-full font-bold pl-7 py-3 gap-5 justify-start items-center hover:bg-bg3`}>
        {img}
        <span>{text}</span>
      </div>
    </Link>
  );
}
