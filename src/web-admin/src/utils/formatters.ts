export const formatCurrency = (amount: number): string => {
  if (isNaN(amount) || amount === null) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

export const formatDateTime = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const getStatusTagColor = (status: string): string => {
  switch (status) {
    case 'Chờ xác nhận':
    case 'Đang chờ':
    case 'Chờ thực hiện':
    case 'Chưa thanh toán':
      return 'warning';
    case 'Đã xác nhận':
    case 'Đang khám':
      return 'processing';
    case 'Đã khám':
    case 'Hoàn thành':
    case 'Đã có kết quả':
    case 'Đã thanh toán':
    case 'Hoạt động':
    case 'Đang kinh doanh':
      return 'success';
    case 'Đã hủy':
    case 'Tạm ngừng':
    case 'Tạm dừng':
      return 'error';
    case 'Chờ cận lâm sàng':
      return 'purple';
    default:
      return 'default';
  }
};
