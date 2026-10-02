import Swal from 'sweetalert2';

// Upkotha Toast Notification Mixin
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  background: '#ffffff',
  color: '#1e293b',
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  },
  customClass: {
    popup: 'rounded-xl shadow-lg border border-slate-200 text-xs font-sans',
    title: 'font-semibold text-slate-800 text-sm',
    timerProgressBar: 'bg-emerald-600',
  },
});

export const showToast = {
  success: (message, title = 'সফল হয়েছে') => {
    Toast.fire({
      icon: 'success',
      title: title ? `${title}: ${message}` : message,
      iconColor: '#059669',
    });
  },
  error: (message, title = 'ত্রুটি') => {
    Toast.fire({
      icon: 'error',
      title: title ? `${title}: ${message}` : message,
      iconColor: '#dc2626',
    });
  },
  info: (message, title = 'তথ্য') => {
    Toast.fire({
      icon: 'info',
      title: title ? `${title}: ${message}` : message,
      iconColor: '#2563eb',
    });
  },
  warning: (message, title = 'সতর্কতা') => {
    Toast.fire({
      icon: 'warning',
      title: title ? `${title}: ${message}` : message,
      iconColor: '#d97706',
    });
  },
};

export const showAlert = ({
  title = 'বিজ্ঞপ্তি',
  text = '',
  icon = 'info',
  confirmButtonText = 'ঠিক আছে',
}) => {
  return Swal.fire({
    title,
    text,
    icon,
    confirmButtonText,
    confirmButtonColor: '#047857',
    background: '#ffffff',
    color: '#0f172a',
    customClass: {
      popup: 'rounded-2xl shadow-xl border border-slate-200 p-6',
      title: 'text-lg font-bold text-slate-900',
      confirmButton: 'rounded-xl px-5 py-2.5 font-medium text-sm',
    },
  });
};

export const showConfirm = async ({
  title = 'আপনি কি নিশ্চিত?',
  text = 'এই কাজটি সম্পন্ন করতে চাচ্ছেন?',
  icon = 'question',
  confirmButtonText = 'হ্যাঁ, নিশ্চিত করুন',
  cancelButtonText = 'বাতিল',
}) => {
  const result = await Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonColor: '#047857',
    cancelButtonColor: '#64748b',
    confirmButtonText,
    cancelButtonText,
    background: '#ffffff',
    color: '#0f172a',
    customClass: {
      popup: 'rounded-2xl shadow-xl border border-slate-200 p-6',
      title: 'text-lg font-bold text-slate-900',
      confirmButton: 'rounded-xl px-5 py-2.5 font-medium text-sm',
      cancelButton: 'rounded-xl px-5 py-2.5 font-medium text-sm',
    },
  });
  return result.isConfirmed;
};

export const showExplainModal = ({ title, explanation, transactionId }) => {
  return Swal.fire({
    title: `উপকথার ব্যাখ্যা • ${title}`,
    html: `
      <div class="text-left text-xs sm:text-sm text-slate-700 space-y-3 pt-2">
        <div class="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 font-normal leading-relaxed">
          ${explanation}
        </div>
        ${transactionId ? `<div class="text-[11px] text-slate-400 font-mono">ট্রানজ্যাকশন আইডি: ${transactionId}</div>` : ''}
      </div>
    `,
    icon: 'info',
    iconColor: '#047857',
    confirmButtonText: 'ধন্যবাদ, বুঝেছি',
    confirmButtonColor: '#047857',
    customClass: {
      popup: 'rounded-2xl shadow-2xl border border-slate-200 p-6 max-w-md w-full',
      title: 'text-base font-bold text-slate-900',
      confirmButton: 'rounded-xl px-5 py-2.5 font-medium text-sm',
    },
  });
};
