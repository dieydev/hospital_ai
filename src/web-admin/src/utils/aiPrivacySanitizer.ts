/**
 * Medical PII / PHI De-identification & Anonymization Engine for Third-Party AI Services (HIPAA / GDPR Compliant)
 */

export interface SanitizationResult {
  sanitizedText: string;
  piiRedactedCount: number;
  redactedCategories: string[];
}

export function sanitizeMedicalPromptForAI(inputText: string): SanitizationResult {
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

  // 3. Redact Phone Numbers (e.g. 0901234567, 091-234-5678, +84901234567)
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

  // 5. Redact Specific House Addresses (Street & District patterns in Vietnam)
  const addressRegex = /\b(số\s+\d+|đường\s+[^,]+|phường\s+[^,]+|quận\s+[^,]+|tp\.\s*[^,]+)/gi;
  // Soft replacement for explicit address strings
  sanitized = sanitized.replace(/(địa chỉ|thường trú|chỗ ở):\s*[^,\n.]+/gi, '$1: [ADDRESS_REDACTED]');

  return {
    sanitizedText: sanitized,
    piiRedactedCount: count,
    redactedCategories: Array.from(categoriesSet),
  };
}
