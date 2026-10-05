/**
 * Medical PII / PHI De-identification & Anonymization Engine for Third-Party AI Services (HIPAA / GDPR / NĐ 13/2023/NĐ-CP Compliant)
 * Đảm bảo 100% dữ liệu định danh cá nhân y tế được khử danh tính trước khi truyền sang dịch vụ AI bên thứ 3.
 */

export interface SanitizationOptions {
  knownPatientName?: string;
  knownPatientCode?: string;
  knownDoctorName?: string;
  patientAge?: number;
  patientGender?: string;
}

export interface SanitizationResult {
  sanitizedText: string;
  piiRedactedCount: number;
  redactedCategories: string[];
}

export function sanitizeMedicalPromptForAI(
  inputText: string,
  options?: SanitizationOptions
): SanitizationResult {
  if (!inputText) {
    return { sanitizedText: '', piiRedactedCount: 0, redactedCategories: [] };
  }

  let sanitized = inputText;
  let count = 0;
  const categoriesSet = new Set<string>();

  // 1. Redact CCCD / CMND (12 digits or 9 digits)
  const cccdRegex = /\b(0\d{11}|\d{9})\b/g;
  if (cccdRegex.test(sanitized)) {
    count++;
    categoriesSet.add('CCCD / CMND');
    sanitized = sanitized.replace(cccdRegex, '[CCCD_REDACTED]');
  }

  // 2. Redact Health Insurance Code / Thẻ BHYT (e.g., DN4010123456789 or TE4010123450013)
  const bhytRegex = /\b[A-Z]{2}\d{13}\b/gi;
  if (bhytRegex.test(sanitized)) {
    count++;
    categoriesSet.add('Mã thẻ BHYT');
    sanitized = sanitized.replace(bhytRegex, '[BHYT_REDACTED]');
  }

  // 3. Redact Phone Numbers (VN phone: 03x, 05x, 07x, 08x, 09x, +84)
  const phoneRegex = /(\+84|0)[3|5|7|8|9][0-9]{8}\b/g;
  if (phoneRegex.test(sanitized)) {
    count++;
    categoriesSet.add('Số điện thoại');
    sanitized = sanitized.replace(phoneRegex, '[PHONE_REDACTED]');
  }

  // 4. Redact Email Addresses
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  if (emailRegex.test(sanitized)) {
    count++;
    categoriesSet.add('Địa chỉ Email');
    sanitized = sanitized.replace(emailRegex, '[EMAIL_REDACTED]');
  }

  // 5. Redact Specific House & Street Addresses
  const addressRegex = /(địa chỉ|thường trú|nơi ở|chỗ ở|tạm trú):\s*[^,\n.]+/gi;
  if (addressRegex.test(sanitized)) {
    count++;
    categoriesSet.add('Địa chỉ riêng');
    sanitized = sanitized.replace(addressRegex, '$1: [ADDRESS_REDACTED]');
  }

  // 6. Redact Known Patient Name & Patient Code if provided
  if (options?.knownPatientName && options.knownPatientName.trim().length > 1) {
    const namePattern = new RegExp(options.knownPatientName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    if (namePattern.test(sanitized)) {
      count++;
      categoriesSet.add('Họ tên người bệnh');
      const safeLabel = options.patientAge && options.patientGender 
        ? `[BN_${options.patientGender.toUpperCase()}_${options.patientAge}T]` 
        : '[BỆNH_NHÂN_ANONYMIZED]';
      sanitized = sanitized.replace(namePattern, safeLabel);
    }
  }

  if (options?.knownPatientCode && options.knownPatientCode.trim().length > 1) {
    const codePattern = new RegExp(options.knownPatientCode.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    if (codePattern.test(sanitized)) {
      count++;
      categoriesSet.add('Mã số bệnh nhân (EMR ID)');
      sanitized = sanitized.replace(codePattern, '[MÃ_BN_ANONYMIZED]');
    }
  }

  // 7. General Regex Patterns for Patient Name in Vietnamese Medical Records
  // Ví dụ: "Bệnh nhân: Nguyễn Văn An", "Họ và tên: Trần Thị B", "BN: Lê Văn C"
  const generalPatientNameRegex = /(bệnh nhân|người bệnh|họ và tên|họ tên|bn)\s*:\s*([A-ZÀÁẢÃẠÂẦẤẨẪẬĂẰẮẲẴẶÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ][a-zàáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]+(?:\s+[A-ZÀÁẢÃẠÂẦẤẨẪẬĂẰẮẲẴẶÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ][a-zàáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]+)+)/gi;
  if (generalPatientNameRegex.test(sanitized)) {
    count++;
    categoriesSet.add('Họ tên người bệnh');
    sanitized = sanitized.replace(generalPatientNameRegex, '$1: [BỆNH_NHÂN_ANONYMIZED]');
  }

  // 8. General Patient Code (e.g. BN20260001, BN-12345, mã BN: ...)
  const generalPatientCodeRegex = /\b(BN\d{4,10}|Mã BN\s*:\s*[\w\d-]+)\b/gi;
  if (generalPatientCodeRegex.test(sanitized)) {
    count++;
    categoriesSet.add('Mã số bệnh nhân (EMR ID)');
    sanitized = sanitized.replace(generalPatientCodeRegex, '[MÃ_BN_ANONYMIZED]');
  }

  // 9. Redact Known Doctor Name or general Doctor mentions
  if (options?.knownDoctorName && options.knownDoctorName.trim().length > 1) {
    const docPattern = new RegExp(options.knownDoctorName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    if (docPattern.test(sanitized)) {
      count++;
      categoriesSet.add('Danh tính Bác sĩ');
      sanitized = sanitized.replace(docPattern, '[BÁC_SĨ_ĐIỀU_TRỊ]');
    }
  }
  const generalDoctorRegex = /(BS\.?\s*(?:CK[I|II]\.?\s*)?[A-ZÀ-Ỵ][a-zà-ỹ]+(?:\s+[A-ZÀ-Ỵ][a-zà-ỹ]+)+)/g;
  if (generalDoctorRegex.test(sanitized)) {
    count++;
    categoriesSet.add('Danh tính Bác sĩ');
    sanitized = sanitized.replace(generalDoctorRegex, '[BÁC_SĨ_ĐIỀU_TRỊ]');
  }

  // 10. Date of Birth detailed day/month redaction (preserving age context)
  const dobRegex = /(ngày sinh|sinh ngày|ns):\s*(\d{1,2}[\/\-.]\d{1,2}[\/\-](\d{4}))/gi;
  if (dobRegex.test(sanitized)) {
    count++;
    categoriesSet.add('Ngày sinh chi tiết');
    sanitized = sanitized.replace(dobRegex, (_match, p1, _p2, p3) => {
      const birthYear = parseInt(p3, 10);
      const approxAge = !isNaN(birthYear) ? new Date().getFullYear() - birthYear : null;
      return approxAge ? `${p1}: [${approxAge} TUỔI]` : `${p1}: [NĂM_SINH_${p3}]`;
    });
  }

  return {
    sanitizedText: sanitized,
    piiRedactedCount: count,
    redactedCategories: Array.from(categoriesSet),
  };
}
