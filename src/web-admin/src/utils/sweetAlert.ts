import Swal from 'sweetalert2';

// Standard Medical Theme SweetAlert2 Instance
export const SwalMedical = Swal.mixin({
  customClass: {
    confirmButton: 'swal2-medical-confirm',
    cancelButton: 'swal2-medical-cancel',
    popup: 'swal2-medical-popup',
  },
  buttonsStyling: false,
});

export const showSuccessAlert = (title: string, text?: string) => {
  return Swal.fire({
    icon: 'success',
    title,
    text,
    confirmButtonColor: '#0284c7',
    confirmButtonText: 'Đồng ý',
    customClass: {
      popup: 'rounded-xl',
      confirmButton: 'ant-btn ant-btn-primary ant-btn-lg',
    },
  });
};

export const showErrorAlert = (title: string, text?: string) => {
  return Swal.fire({
    icon: 'error',
    title: title || 'Đã xảy ra lỗi!',
    text: text || 'Vui lòng kiểm tra lại thao tác hoặc kết nối hệ thống.',
    confirmButtonColor: '#dc2626',
    confirmButtonText: 'Đóng',
    customClass: {
      popup: 'rounded-xl',
    },
  });
};

export const showConfirmDelete = (title: string, text: string) => {
  return Swal.fire({
    icon: 'warning',
    title,
    text,
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Xác nhận xóa',
    cancelButtonText: 'Hủy bỏ',
    reverseButtons: true,
    focusCancel: true,
  });
};

export const showToast = (title: string, icon: 'success' | 'error' | 'warning' | 'info' = 'success') => {
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    },
  });

  return Toast.fire({
    icon,
    title,
  });
};
