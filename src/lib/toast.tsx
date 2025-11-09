import "../app/globals.css";
import { toast } from "sonner";

type ToastStatus = "success" | "error" | "warning";

const toastColors: Record<ToastStatus, string> = {
  success: "oklch(0.7 0.11 160)",
  error: "oklch(0.7 0.11 30)",
  warning: "oklch(0.7 0.11 100)",
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
    className: `w-52 min-h-10 rounded-md shadow-md`,
    description,
    style: { background: toastColors[status], border: "0px" },
    duration: 5000,
  });
}
