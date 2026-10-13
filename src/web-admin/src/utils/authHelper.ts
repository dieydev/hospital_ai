import { UserAccount } from '../types';

/**
 * Kiểm tra xem tài khoản có thuộc nhóm Cán bộ Y tế / Quản trị viên hay không
 */
export const isStaffOrAdminUser = (user: UserAccount | null): boolean => {
  if (!user || !user.vaiTro) return false;
  return user.vaiTro.some((role) =>
    ['Admin', 'Doctor', 'Nurse', 'Receptionist'].includes(role)
  );
};

/**
 * Kiểm tra xem tài khoản có phải là Bệnh nhân hay không
 */
export const isPatientUser = (user: UserAccount | null): boolean => {
  if (!user) return false;
  if (isStaffOrAdminUser(user)) return false;
  return user.vaiTro?.includes('Patient') || true;
};

/**
 * Kiểm tra xem thông tin hồ sơ của Bệnh nhân đã hoàn thiện để sử dụng hệ thống hay chưa.
 * Các trường BẮT BUỘC theo quy định y tế:
 * 1. Họ và tên (hoTen)
 * 2. Số điện thoại (soDienThoai)
 * 3. Số Căn cước công dân / Định danh (soCCCD)
 * 4. Ngày sinh (ngaySinh) hoặc Năm sinh (namSinh)
 * 5. Giới tính (gioiTinh)
 * 6. Địa chỉ thường trú / tạm trú (diaChi)
 */
export const isPatientProfileComplete = (user: UserAccount | null): boolean => {
  if (!user) return false;

  // Nếu là cán bộ y tế thì không áp dụng ràng buộc hồ sơ bệnh nhân
  if (isStaffOrAdminUser(user)) return true;

  // Nếu đã được backend hoặc hệ thống xác nhận hoàn tất hồ sơ
  if (user.isProfileComplete === true) return true;

  // Kiểm tra tính đầy đủ của các trường thông tin cơ bản
  const hasFullName = Boolean(user.hoTen && user.hoTen.trim().length >= 2 && !user.hoTen.startsWith('Bệnh nhân ('));
  const hasPhone = Boolean(user.soDienThoai && user.soDienThoai.trim().length >= 9);
  const hasCCCD = Boolean(
    user.soCCCD &&
    user.soCCCD.trim().length >= 9 &&
    !user.soCCCD.startsWith('CD') &&
    !user.soCCCD.startsWith('P') &&
    user.soCCCD !== user.soDienThoai
  );
  const hasBirth = Boolean(user.ngaySinh || user.namSinh);
  const hasGender = Boolean(user.gioiTinh);
  const hasAddress = Boolean(
    user.diaChi &&
    user.diaChi.trim().length >= 5 &&
    user.diaChi.trim() !== 'Chưa cập nhật'
  );

  return Boolean(hasFullName && hasPhone && hasCCCD && hasBirth && hasGender && hasAddress);
};
