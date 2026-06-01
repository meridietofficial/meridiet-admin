import toast from "react-hot-toast";

/**
 * Shows a success toast message.
 * @param {string} message - The success message to display.
 */
export const showSuccessToast = (message) => {
  toast.success(message, {
    position: "top-right",
    duration: 3000,
    className: "toast-success",
    style: {
      margin: "0 25px 0 0",
    },
  });
};

/**
 * Shows an error toast with border-bottom animation
 * @param {Error|object} error - The error object
 * @param {string} fallbackMessage - Default message
 */
export const showBackendErrorToast = (
  error,
  fallbackMessage = "Something went wrong."
) => {
  const errorMessage =
    error?.response?.data?.error?.errorMessage ||
    error?.message ||
    fallbackMessage;

  toast.error(errorMessage, {
    position: "top-right",
    duration: 3000,
    className: "toast-error",
    style: {
      margin: "0 25px 0 0",
    },
  });
};

/**
 * Shows an info toast message.
 * @param {string} message - The info message to display.
 */
export const showInfoToast = (message) => {
  toast(message, {
    icon: "ℹ️",
    position: "top-right",
    duration: 3000,
    className: "toast-info",
    style: {
      margin: "0 25px 0 0",
    },
  });
};
