import Link from "next/link";
import { usePathname } from "next/navigation";
import { JSX, useState } from "react";
import { motion } from "motion/react";

export default function NavLinkButton({
  path,
  img,
  text,
}: {
  path: string;
  img: JSX.Element;
  text: string;
}) {
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);
  return (
    <motion.li
      initial={{ width: 64 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ width: 180, scale: 1.1 }}
      whileTap={{scale: 1}}
      className="group overflow-hidden"
    >
      <Link href={path} className="">
        <div
          className={`${
            path === pathname && "bg-gradient-to-b from-bg2 to-40% to-bg3"
          } flex font-bold gap-5 p-4 bg-bg1 border-border border justify-start transition-all items-center rounded-full hover:bg-bg2 active:bg-gradient-to-b active:from-bg2 active:to-40% active:to-bg3`}
        >
          <div>{img}</div>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 100, x: 0 }}
              transition={{ duration: 0.3 }}
              className="max-w-25 whitespace-nowrap"
            >
              {text}
            </motion.div>
          )}
        </div>
      </Link>
    </motion.li>
  );
}
