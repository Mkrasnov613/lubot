import { toast } from "sonner";

type ToastStatus = "success" | "error" | "warning";

/**
 * Toasts are chassis, like everything else — the status shows as a lit left
 * edge rather than a colored fill, so they sit in the same visual language as
 * a selected nav item or an active panel. Base styling lives on <Toaster> in
 * layout.tsx; only the edge changes here.
 *
 * Note the edge for an error is coral, not tally red: red is reserved for the
 * on-air lamp so that red on screen means exactly one thing.
 */
const edgeByStatus: Record<ToastStatus, string> = {
  success: "var(--color-ok)",
  error: "var(--color-danger)",
  warning: "var(--color-warn)",
};

export function showToast({
  status,
  title,
  description,
}: {
  status: ToastStatus;
  title: string;
  description?: string;
}): void {
  toast(title, {
    description,
    duration: status === "error" ? 8000 : 4000,
    style: { borderLeft: `2px solid ${edgeByStatus[status]}` },
  });
}
