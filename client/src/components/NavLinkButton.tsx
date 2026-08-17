import Link from "next/link";
import { usePathname } from "next/navigation";
import { JSX, useState } from "react";
import { motion } from "motion/react";
import { Box, Flex } from "@chakra-ui/react";

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
  const isActive = path === pathname;
  const [isHovered, setIsHovered] = useState(false);
  return (
    <motion.li
      initial={{ width: 64 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ width: 180, scale: 1.1 }}
      whileTap={{ scale: 1 }}
      style={{ overflow: "hidden" }}
    >
      <Link href={path}>
        <Flex
          fontWeight="bold"
          gap="5"
          p="4"
          bg={isActive ? undefined : "bg"}
          bgGradient={isActive ? "to-b" : undefined}
          gradientFrom={isActive ? "surface" : undefined}
          gradientTo={isActive ? "surface2" : undefined}
          borderWidth="1px"
          borderColor="border"
          justify="flex-start"
          transition="all 0.15s ease"
          align="center"
          rounded="full"
          _hover={{ bg: "surface" }}
          _active={{ bgGradient: "to-b", gradientFrom: "surface", gradientTo: "surface2" }}
        >
          <Box>{img}</Box>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 100, x: 0 }}
              transition={{ duration: 0.3 }}
              style={{ maxWidth: "6.25rem", whiteSpace: "nowrap" }}
            >
              {text}
            </motion.div>
          )}
        </Flex>
      </Link>
    </motion.li>
  );
}
