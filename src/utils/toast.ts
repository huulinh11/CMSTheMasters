import { toast } from "sonner";

export const showSuccess = (message: string) => {
  toast.success(message);
};

export const showError = (message: string) => {
  toast.error(message);
};

export const showLoading = (message: string) => {
  return toast.loading(message);
};

export const dismissToast = (toastId: string) => {
  toast.dismiss(toastId);
};

export const showNotice = (message: string) => {
  toast(message, {
    style: {
      background: 'hsl(25 95% 45%)',
      color: 'hsl(210 40% 98%)',
      border: '1px solid hsl(25.17 42.19% 72.58%)',
    },
  });
};