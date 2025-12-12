"use client";

import Image from "next/image";
import { useParams } from "next/navigation";
import SideNavFooter from "./SIdeNavFooter";

export default function Header() {
  const { slug } = useParams();
  

  return (
    <aside className="flex items-center w-full py-5 px-10">
      <div className="flex-1 flex justify-start items-start">
        <div className="flex items-center gap-5">
          <Image src="/logo.png" width={72} height={72} alt="" />
        </div>

        
      </div>

      <SideNavFooter slug={slug!.toString()} />
    </aside>
  );
}
