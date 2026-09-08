import { Box, Flex } from "@chakra-ui/react";
import type { ReactNode } from "react";

type PanelProps = {
  /**
   * The panel's name, set into its top edge like silkscreen on a faceplate.
   * Omit it for a panel whose content names itself (a video, a chat embed).
   */
  label?: string;
  /** Right-aligned control or status in the label strip. */
  action?: ReactNode;
  /**
   * Lights the top edge violet. Reserve this for the panel that is currently
   * the live one — if everything is lit, nothing is.
   */
  lit?: boolean;
  /** Turn off body padding for content that should meet the panel edge. */
  flush?: boolean;
  children: ReactNode;
};

/**
 * A rack unit: a flat chassis face with a machined edge, no drop shadow, and
 * an optional lit top edge. Depth in this system comes from value steps and
 * light — see the rules at the top of globals.css.
 */
export default function Panel({
  label,
  action,
  lit = false,
  flush = false,
  children,
}: PanelProps) {
  return (
    <Box
      bg="chassis"
      borderWidth="1px"
      borderColor="edge"
      rounded="sm"
      overflow="hidden"
      /* The lit edge is drawn as a border-top swap rather than an extra
         element, so it can't shift the panel's height when it turns on. */
      borderTopWidth={lit ? "2px" : "1px"}
      borderTopColor={lit ? "signal" : "edge"}
      boxShadow={lit ? "glowSignal" : undefined}
      transition="border-top-color 0.2s ease, box-shadow 0.2s ease"
    >
      {(label || action) && (
        <Flex
          align="center"
          justify="space-between"
          gap="3"
          h="34px"
          px="3"
          borderBottomWidth="1px"
          borderColor="seam"
        >
          {label && (
            <Box as="h2" className="engrave">
              {label}
            </Box>
          )}
          {action}
        </Flex>
      )}
      <Box p={flush ? "0" : "var(--panel-pad)"}>{children}</Box>
    </Box>
  );
}
