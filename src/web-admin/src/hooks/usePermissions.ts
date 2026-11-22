import { useAuthStore } from '../store/useAuthStore';

export interface HospitalPermissions {
  userRole: string;
  roleNameVN: string;
  isAdmin: boolean;
  isDoctor: boolean;
  isPharmacy: boolean;
  isCashier: boolean;
  isReceptionist: boolean;
  isTriage: boolean;
  isNurse: boolean;
  isPatient: boolean;

  // Quyền hạn nghiệp vụ cụ thể
  canDispenseMedicine: boolean; // Cấp phát thuốc theo đơn
  canManagePharmacyInventory: boolean; // Nhập kho, chỉnh sửa danh mục thuốc
  canPrescribe: boolean; // Kê đơn thuốc, khám bệnh SOAP
  canOrderCLS: boolean; // Chỉ định Xét nghiệm, CĐHA
  canSignEMR: boolean; // Ký số bệnh án điện tử
  canProcessBilling: boolean; // Thu viện phí, hủy hóa đơn, xuất biên lai
  canRegisterPatient: boolean; // Tiếp nhận bệnh nhân, cấp STT
  canPerformTriage: boolean; // Phân loại sàng lọc ESI, đo sinh hiệu
  canManageCatalogs: boolean; // Quản lý danh mục khoa, phòng khám, dịch vụ
  canManageAccounts: boolean; // Quản lý tài khoản và phân quyền người dùng
  canViewReports: boolean; // Xem báo cáo thống kê tài chính & lâm sàng

  // Hàm trợ giúp hiển thị Tooltip khóa chức năng
  getLockTooltip: (permissionKey: keyof Omit<HospitalPermissions, 'userRole' | 'roleNameVN' | 'getLockTooltip'>) => string;
}

export const usePermissions = (): HospitalPermissions => {
  const user = useAuthStore((state) => state.user);

  const checkRole = (roleNames: string[]): boolean => {
    if (!user || !user.vaiTro || !Array.isArray(user.vaiTro)) return false;
    const lowerNames = roleNames.map((r) => r.toLowerCase());
    return user.vaiTro.some((r) => lowerNames.includes(r.toLowerCase()));
  };

  const isAdmin = checkRole(['Admin', 'Quản trị viên', 'Administrator']);
  const isDoctor = checkRole(['Doctor', 'Bác sĩ', 'Bác sĩ chuyên khoa']);
  const isPharmacy = checkRole(['Pharmacy', 'Nhà thuốc', 'Dược sĩ', 'Dược']);
  const isCashier = checkRole(['Cashier', 'Thu ngân', 'Kế toán viện phí']);
  const isReceptionist = checkRole(['Receptionist', 'Nhân viên tiếp nhận', 'Lễ tân']);
  const isTriage = checkRole(['Triage', 'Nhân viên sàng lọc bệnh', 'Sàng lọc y tế']);
  const isNurse = checkRole(['Nurse', 'Y tế', 'Nhân viên y tế']);
  const isPatient = checkRole(['Patient', 'Bệnh nhân']) || (!isAdmin && !isDoctor && !isPharmacy && !isCashier && !isReceptionist && !isTriage && !isNurse);

  let userRole = 'Patient';
  let roleNameVN = 'Bệnh nhân';

  if (isAdmin) {
    userRole = 'Admin';
    roleNameVN = 'Quản trị viên (Admin)';
  } else if (isDoctor) {
    userRole = 'Doctor';
    roleNameVN = 'Bác sĩ lâm sàng';
  } else if (isPharmacy) {
    userRole = 'Pharmacy';
    roleNameVN = 'Nhà thuốc';
  } else if (isCashier) {
    userRole = 'Cashier';
    roleNameVN = 'Thu ngân';
  } else if (isReceptionist) {
    userRole = 'Receptionist';
    roleNameVN = 'Nhân viên tiếp nhận';
  } else if (isTriage) {
    userRole = 'Triage';
    roleNameVN = 'Nhân viên sàng lọc y tế';
  } else if (isNurse) {
    userRole = 'Nurse';
    roleNameVN = 'Nhân viên Y tế';
  }

  // 1. Phân quyền nghiệp vụ Nhà thuốc & Dược: Chỉ Nhà thuốc & Admin
  const canDispenseMedicine = isAdmin || isPharmacy;
  const canManagePharmacyInventory = isAdmin || isPharmacy;

  // 2. Phân quyền Khám bệnh & Lâm sàng: Chỉ Bác sĩ lâm sàng & Admin
  const canPrescribe = isAdmin || isDoctor;
  const canOrderCLS = isAdmin || isDoctor;
  const canSignEMR = isAdmin || isDoctor;

  // 3. Phân quyền Viện phí & Tài chính: Thu ngân, Nhân viên tiếp nhận & Admin
  const canProcessBilling = isAdmin || isCashier || isReceptionist;

  // 4. Phân quyền Tiếp nhận & Sàng lọc: Nhân viên tiếp nhận, Nhân viên sàng lọc y tế, Nhân viên Y tế & Admin
  const canRegisterPatient = isAdmin || isReceptionist || isTriage || isNurse;
  const canPerformTriage = isAdmin || isTriage || isNurse || isDoctor;

  // 5. Phân quyền Quản trị hệ thống: Chỉ Quản trị viên (Admin) tuyệt đối
  const canManageCatalogs = isAdmin;
  const canManageAccounts = isAdmin;

  // 6. Phân quyền Báo cáo thống kê: Quản trị viên (Admin), Bác sĩ lâm sàng, Thu ngân
  const canViewReports = isAdmin || isDoctor || isCashier;

  const getLockTooltip = (permissionKey: keyof Omit<HospitalPermissions, 'userRole' | 'roleNameVN' | 'getLockTooltip'>): string => {
    switch (permissionKey) {
      case 'canDispenseMedicine':
        return 'Chỉ bộ phận Nhà thuốc hoặc Quản trị viên (Admin) mới có thẩm quyền Cấp phát thuốc theo đơn.';
      case 'canManagePharmacyInventory':
        return 'Chỉ bộ phận Nhà thuốc hoặc Quản trị viên (Admin) mới có thẩm quyền Nhập kho & Chỉnh sửa kho thuốc.';
      case 'canPrescribe':
        return 'Chỉ Bác sĩ lâm sàng có chứng chỉ hành nghề mới được quyền Kê đơn thuốc.';
      case 'canOrderCLS':
        return 'Chỉ Bác sĩ lâm sàng mới có quyền Chỉ định Cận lâm sàng & Xét nghiệm.';
      case 'canSignEMR':
        return 'Chỉ Bác sĩ lâm sàng mới có thẩm quyền Ký số Bệnh án điện tử.';
      case 'canProcessBilling':
        return 'Chỉ Thu ngân mới có thẩm quyền Thu tiền & Xuất hóa đơn.';
      case 'canRegisterPatient':
        return 'Chức năng dành cho Nhân viên tiếp nhận người bệnh.';
      case 'canPerformTriage':
        return 'Chức năng dành cho Nhân viên sàng lọc y tế người bệnh.';
      case 'canManageCatalogs':
      case 'canManageAccounts':
        return 'Chức năng Quản trị Bệnh viện: Chỉ Quản trị viên (Admin) mới có quyền truy cập.';
      case 'canViewReports':
        return 'Chức năng Báo cáo thống kê dành cho Quản trị viên (Admin), Bác sĩ lâm sàng và Thu ngân.';
      default:
        return 'Tài khoản của bạn không có quyền thực hiện thao tác này.';
    }
  };

  return {
    userRole,
    roleNameVN,
    isAdmin,
    isDoctor,
    isPharmacy,
    isCashier,
    isReceptionist,
    isTriage,
    isNurse,
    isPatient,
    canDispenseMedicine,
    canManagePharmacyInventory,
    canPrescribe,
    canOrderCLS,
    canSignEMR,
    canProcessBilling,
    canRegisterPatient,
    canPerformTriage,
    canManageCatalogs,
    canManageAccounts,
    canViewReports,
    getLockTooltip,
  };
};
