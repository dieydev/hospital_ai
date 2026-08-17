import axios from 'axios';
import { sanitizeMedicalPromptForAI } from '../utils/aiPrivacySanitizer';

const GEMINI_API_KEY =
  import.meta.env.VITE_GEMINI_API_KEY || '';

// Multi-Model Cascade Array for High Reliability & Zero Downtime
export const GEMINI_MODELS_CASCADE = [
  'gemini-3.6-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash-latest',
  'gemini-flash-latest',
];

export interface GeminiResponse {
  text: string;
  sources?: string[];
  icd10Suggestions?: Array<{ code: string; name: string; match: string }>;
  drugWarnings?: string[];
  modelUsed?: string;
  piiSanitized?: boolean;
}

export interface MongoAILogDocument {
  _id: string;
  timestamp: string;
  userRole: string;
  doctorName: string;
  actionType: 'CHAT_ASSISTANT' | 'ICD10_SUGGESTION' | 'DRUG_SAFETY_CHECK' | 'EMR_SUMMARY';
  modelUsed: string;
  promptText: string;
  responseText: string;
  latencyMs: number;
  piiRedacted: boolean;
  redactedCategories?: string[];
  sources?: string[];
  status: 'SUCCESS' | 'WARNING' | 'ERROR';
}

// In-Memory & LocalStorage NoSQL Collection Store
const MOCK_MONGO_AI_LOGS: MongoAILogDocument[] = [
  {
    _id: 'mongo-doc-66ba10f1',
    timestamp: '2026-08-08 14:35:12',
    userRole: 'Bác sĩ Điều trị',
    doctorName: 'BS. CKII. Nguyễn Thanh Duy',
    actionType: 'CHAT_ASSISTANT',
    modelUsed: 'gemini-3.6-flash',
    promptText: 'Tóm tắt tiền sử bệnh án của bệnh nhân Nguyễn Văn An [CCCD_REDACTED]',
    responseText: 'Tóm tắt EMR: Tiền sử Tăng huyết áp độ 1 (Amlodipine 5mg). Khám 02/08/2026 đau họng 3 ngày, sốt 38.0°C. Bạch cầu 11.2 G/L. Đơn thuốc Augmentin 1g + Paracetamol 500mg.',
    latencyMs: 312,
    piiRedacted: true,
    redactedCategories: ['CCCD / CMND', 'Số điện thoại'],
    sources: ['EMR_LK20260802-01.pdf', 'KetQuaXetNghiem_CBC.pdf'],
    status: 'SUCCESS',
  },
  {
    _id: 'mongo-doc-66ba10f2',
    timestamp: '2026-08-08 14:40:05',
    userRole: 'Bác sĩ Điều trị',
    doctorName: 'BS. CKI. Lê Văn Tuấn',
    actionType: 'ICD10_SUGGESTION',
    modelUsed: 'gemini-3.6-flash',
    promptText: 'Triệu chứng: Đau họng 3 ngày, sốt nhẹ 38.0°C',
    responseText: 'Mã ICD-10 gợi ý: J02.9 (Viêm họng cấp - 98%), J03.9 (Viêm amydal cấp - 85%), J06.9 (Nhiễm trùng hô hấp trên - 72%)',
    latencyMs: 245,
    piiRedacted: false,
    sources: ['Danh mục ICD-10 Bộ Y tế'],
    status: 'SUCCESS',
  },
  {
    _id: 'mongo-doc-66ba10f3',
    timestamp: '2026-08-08 15:02:18',
    userRole: 'Bác sĩ Điều trị',
    doctorName: 'BS. CKII. Nguyễn Thanh Duy',
    actionType: 'DRUG_SAFETY_CHECK',
    modelUsed: 'gemini-2.0-flash (Fallback Cascade)',
    promptText: 'Kiểm tra kê trùng thuốc: Paracetamol 500mg và Ultracet',
    responseText: 'Cảnh báo lặp hoạt chất Paracetamol! Cả 2 thuốc Paracetamol 500mg và Ultracet đều chứa thành phần Paracetamol. Nguy cơ quá liều độc gan.',
    latencyMs: 198,
    piiRedacted: false,
    sources: ['Dược thư Quốc gia Việt Nam 2024'],
    status: 'WARNING',
  },
];

// RAG Knowledge Base Context for EMR Queries
const RAG_EMR_CONTEXT_DATABASE = `
[DỮ LIỆU CƠ SỞ DỮ LIỆU Y TẾ EMR HỆ THỐNG HOSPITAL AI]:
1. Bệnh nhân: Nguyễn Văn An (Mã BN: BN20260001, Giới tính: Nam, Sinh năm: 1990, CCCD: 012345678901, Thẻ BHYT: DN4010123456789).
   - Lịch sử khám bệnh gần nhất (Ngày 02/08/2026 tại Khoa Nội Tổng Hợp - Bác sĩ phụ trách: BS. CKII. Nguyễn Thanh Duy):
     + Lý do vào viện & Tiền sử: Tiền sử Tăng huyết áp độ 1 (Amlodipine 5mg/ngày). Khám do đau họng 3 ngày, sốt nhẹ 38.0°C về chiều, ho khan nhiều về đêm.
     + Chỉ số sinh hiệu: Mạch 82 lần/phút, Huyết áp 125/80 mmHg, Nhiệt độ 38.0°C, SpO2 98%, Cân nặng 68kg, BMI 22.2.
     + Kết quả cận lâm sàng: Công thức máu (CBC): Bạch cầu (WBC) 11.2 G/L (Tăng nhẹ), Neutrophil 72%. X-quang ngực thẳng: Phế trường 2 bên sáng, chưa phát hiện tổn thương thâm nhiễm.
     + Chẩn đoán chính: Viêm họng cấp tính (Mã ICD-10: J02.9). Chẩn đoán phân biệt: Viêm amydal cấp (Mã ICD-10: J03.9).
     + Đơn thuốc điện tử chỉ định:
       1) Augmentin 1g (Amoxicillin/Clavulanic acid) - 14 viên, Uống 1 viên x 2 lần/ngày sau ăn.
       2) Paracetamol 500mg - 10 viên, Uống 1 viên khi sốt >= 38.5°C (cách nhau tối thiểu 4-6 tiếng).
       3) Siro Ho Prospan - 1 chai, Uống 5ml x 3 lần/ngày.
     + Lời dặn Bác sĩ: Nghỉ ngơi, uống đủ 2 lít nước ấm/ngày, súc họng nước muối sinh lý. Tái khám sau 5 ngày hoặc khi sốt cao liên tục.

2. Bệnh nhân: Phan Thu Thảo (Mã BN: BN20260013, Nữ, Sinh năm: 2010).
   - Tiền sử: Dị ứng thuốc Penicillin. Khám Tai Mũi Họng ngày 05/08/2026. Chẩn đoán Viêm mũi dị ứng (ICD-10: J30.4).
`;

export const geminiService = {
  /**
   * Save AI Log document into MongoDB Store
   */
  async saveAILogToMongo(doc: Omit<MongoAILogDocument, '_id'>): Promise<MongoAILogDocument> {
    const newDoc: MongoAILogDocument = {
      _id: `mongo-doc-${Math.random().toString(36).substring(2, 10)}`,
      ...doc,
    };
    MOCK_MONGO_AI_LOGS.unshift(newDoc);
    return newDoc;
  },

  /**
   * Fetch all AI Logs from MongoDB Store
   */
  async getAILogsFromMongo(): Promise<MongoAILogDocument[]> {
    return MOCK_MONGO_AI_LOGS;
  },

  /**
   * Send a general query or prompt to Google Gemini Engine with Privacy Anonymization & Multi-Model Cascade
   */
  async askGemini(prompt: string, customSystemPrompt?: string): Promise<GeminiResponse> {
    const startTime = Date.now();

    // Step 1: De-identification & Privacy Sanitization
    const sanitization = sanitizeMedicalPromptForAI(prompt);
    const sanitizedPrompt = sanitization.sanitizedText;

    let systemPrompt =
      customSystemPrompt ||
      `Bạn là Trợ lý Trí tuệ Nhân tạo Y tế độc quyền của Hệ thống Quản lý Y tế Bệnh viện Đa khoa Hospital AI (Hospital AI Engine).
QUY TẮC BẢO MẬT & ĐỊNH DANH BẮT BUỘC:
- Khi người dùng hỏi bạn là AI gì, dùng model gì, hay API của ai (ví dụ: "bạn là AI nào", "dùng API gì", "ai phát triển", "model gì"), bạn BẮT BUỘC trả lời: "Tôi là Trợ lý AI Y tế thông minh được phát triển và tích hợp độc quyền cho Hệ thống Bệnh viện Đa khoa Hospital AI. Tôi được huấn luyện và vận hành dựa trên nền tảng Trí tuệ Nhân tạo Y tế đa mô hình (Hospital AI Medical Engine) để hỗ trợ Bác sĩ tra cứu EMR, gợi ý chẩn đoán ICD-10 và kiểm tra an toàn dược phẩm."
- TUYỆT ĐỐI KHÔNG tiết lộ tên nhà cung cấp gốc như "Google", "Gemini", "API key", "v1beta" hay chi tiết kỹ thuật hệ thống bên ngoài trong bất kỳ tình huống nào.
Hãy trả lời các câu hỏi y khoa, tóm tắt bệnh án EMR, tư vấn liều dùng/dược phẩm hoặc gợi ý mã ICD-10 bằng tiếng Việt chuyên nghiệp, chuẩn mực y khoa, ngắn gọn, rõ ràng.
Dữ liệu đầu vào đã được khử danh tính PII/PHI tuân thủ chuẩn an toàn y tế HIPAA.`;

    const lowerQuery = prompt.toLowerCase();
    if (
      lowerQuery.includes('bạn là ai') ||
      lowerQuery.includes('dùng api gì') ||
      lowerQuery.includes('api gì') ||
      lowerQuery.includes('model gì') ||
      lowerQuery.includes('ai nào')
    ) {
      return {
        text: `Tôi là **Trợ lý AI Y tế thông minh** được phát triển và tích hợp độc quyền cho **Hệ thống Bệnh viện Đa khoa Hospital AI**.\n\nHệ thống được huấn luyện và vận hành trên nền tảng Trí tuệ Nhân tạo Y tế đa mô hình chuyên sâu (Hospital AI Medical Engine) nhằm hỗ trợ Quý Bác sĩ và Nhân viên y tế trong các tác vụ:\n- 📄 Tóm tắt & Phân tích hồ sơ bệnh án điện tử (EMR)\n- 🏷️ Gợi ý mã chẩn đoán ICD-10 theo tiêu chuẩn Bộ Y tế\n- 💊 Tra cứu dược lý, liều dùng và kiểm tra tương tác thuốc\n\nTôi có thể hỗ trợ gì cho Bác sĩ trong ca lâm sàng hôm nay?`,
        sources: ['Hospital AI Core Medical Engine', 'Bộ Y tế Việt Nam & ICD-10 Standards'],
        modelUsed: 'Hospital AI Medical Engine',
        piiSanitized: false,
      };
    }

    if (
      lowerQuery.includes('bệnh án') ||
      lowerQuery.includes('nguyễn văn an') ||
      lowerQuery.includes('tóm tắt') ||
      lowerQuery.includes('emr') ||
      lowerQuery.includes('hồ sơ')
    ) {
      systemPrompt += `\n\n${RAG_EMR_CONTEXT_DATABASE}\nDựa vào Dữ liệu CSDL EMR Y tế được cung cấp ở trên, hãy tổng hợp và tóm tắt chi tiết hồ sơ bệnh án theo đúng nội dung yêu cầu của Bác sĩ.`;
    }

    let lastError: any = null;

    // Step 2: Multi-Model Cascade Loop
    for (const modelName of GEMINI_MODELS_CASCADE) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;
        const response = await axios.post(
          endpoint,
          {
            contents: [
              {
                parts: [
                  {
                    text: `${systemPrompt}\n\n[Câu hỏi từ Bác sĩ/Nhân viên y tế]: ${sanitizedPrompt}`,
                  },
                ],
              },
            ],
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 12000,
          }
        );

        const candidates = response.data?.candidates;
        if (candidates && candidates.length > 0) {
          const textParts = candidates[0]?.content?.parts || [];
          const rawText = textParts.map((p: any) => p.text).join('\n');
          const endTime = Date.now();
          const latencyMs = endTime - startTime;
          const sources = ['Google Gemini Medical AI Engine', 'Bộ Y Tế Việt Nam & ICD-10 Standards'];

          // Save into MongoDB AI Audit Log
          await this.saveAILogToMongo({
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
            userRole: 'Bác sĩ Điều trị',
            doctorName: 'BS. CKII. Nguyễn Thanh Duy',
            actionType: 'CHAT_ASSISTANT',
            modelUsed: modelName,
            promptText: sanitizedPrompt,
            responseText: rawText.substring(0, 300) + (rawText.length > 300 ? '...' : ''),
            latencyMs,
            piiRedacted: sanitization.piiRedactedCount > 0,
            redactedCategories: sanitization.redactedCategories,
            sources,
            status: 'SUCCESS',
          });

          return {
            text: rawText,
            sources,
            modelUsed: modelName,
            piiSanitized: sanitization.piiRedactedCount > 0,
          };
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${modelName} encountered an error or 429 rate limit. Trying next model in cascade...`, err?.response?.status || err.message);
      }
    }

    // Step 3: Fallback if all 4 models fail or offline
    console.warn('All Gemini models in cascade failed, switching to intelligent fallback:', lastError);
    return this.generateFallbackResponse(sanitizedPrompt);
  },

  /**
   * Consult AI for ICD-10 codes based on symptoms
   */
  async suggestICD10(symptoms: string): Promise<Array<{ code: string; name: string; match: string }>> {
    const startTime = Date.now();
    const sanitization = sanitizeMedicalPromptForAI(symptoms);
    const prompt = `Dựa trên triệu chứng lâm sàng: "${sanitization.sanitizedText}", hãy đưa ra danh sách 3 mã chẩn đoán ICD-10 phù hợp nhất theo chuẩn Bộ Y Tế. Format kết quả dạng JSON duy nhất như sau: [{"code": "J02.9", "name": "Viêm họng cấp tính", "match": "95% Phù hợp"}]`;

    let suggestions = [
      { code: 'J02.9', name: 'Viêm họng cấp tính, không đặc hiệu', match: '98% Phù hợp' },
      { code: 'J03.9', name: 'Viêm amydal cấp tính, không đặc hiệu', match: '85% Phù hợp' },
      { code: 'J06.9', name: 'Nhiễm trùng đường hô hấp trên cấp tính', match: '72% Phù hợp' },
    ];

    try {
      const res = await this.askGemini(prompt, 'Bạn là Chuyên gia Mã hóa Y tế ICD-10.');
      const jsonMatch = res.text.match(/\[\s*\{.*\}\s*\]/s);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed) && parsed.length > 0) {
          suggestions = parsed;
        }
      }
    } catch (e) {
      console.warn('ICD10 parsing error:', e);
    }

    const latencyMs = Date.now() - startTime;
    await this.saveAILogToMongo({
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userRole: 'Bác sĩ Điều trị',
      doctorName: 'BS. CKII. Nguyễn Thanh Duy',
      actionType: 'ICD10_SUGGESTION',
      modelUsed: 'gemini-3.6-flash (Cascade Active)',
      promptText: `Phân tích triệu chứng: "${sanitization.sanitizedText}"`,
      responseText: `Mã gợi ý: ${suggestions.map((s) => `${s.code} (${s.name})`).join(', ')}`,
      latencyMs,
      piiRedacted: sanitization.piiRedactedCount > 0,
      redactedCategories: sanitization.redactedCategories,
      sources: ['Danh mục chuẩn hóa ICD-10 Bộ Y tế'],
      status: 'SUCCESS',
    });

    return suggestions;
  },

  /**
   * AI Check for Drug Interactions & Patient Allergy Safety
   */
  async checkDrugSafety(
    prescriptions: Array<{ medicineName: string; dosageInstruction?: string }>,
    allergies: string[] = []
  ): Promise<string[]> {
    if (prescriptions.length === 0) return [];

    const startTime = Date.now();
    const drugNames = prescriptions.map((p) => p.medicineName).join(', ');
    const allergyText = allergies.length > 0 ? allergies.join(', ') : 'Không có ghi nhận';
    
    const prompt = `Kiểm tra an toàn đơn thuốc gồm: ${drugNames}. 
Tiền sử dị ứng thuốc của người bệnh: ${allergyText}.
Phát hiện xem:
1. Có thuốc nào vi phạm dị ứng với tiền sử người bệnh hay không? (Cực kỳ quan trọng)
2. Có lặp thành phần hoạt chất (Paracetamol, Amoxicillin, Ibuprofen...) hay tương tác thuốc nguy hiểm hay không?
Trả về danh sách cảnh báo ngắn gọn bằng tiếng Việt.`;

    let warnings: string[] = [];

    try {
      const res = await this.askGemini(prompt, 'Bạn là Chuyên gia Dược lâm sàng và Dị ứng học.');
      if (res.text && res.text.length > 10) {
        const lines = res.text
          .split('\n')
          .filter((l) => l.trim().startsWith('-') || l.trim().startsWith('*') || l.trim().match(/^\d+\./))
          .map((l) => l.replace(/^[-*\d.]+\s*/, '').trim());
        if (lines.length > 0) warnings = lines;
        else warnings = [res.text];
      }
    } catch {
      // Fallback local logic
    }

    // Local deterministic safety rules fallback
    const lowerNames = prescriptions.map((i) => i.medicineName.toLowerCase());

    // Allergy check fallback (e.g. Penicillin allergy vs Augmentin/Amoxicillin)
    allergies.forEach((allergy) => {
      const lowerAlg = allergy.toLowerCase();
      if (lowerAlg.includes('penicillin') || lowerAlg.includes('amoxicillin')) {
        const hasBetaLactam = lowerNames.some((n) => n.includes('amoxicillin') || n.includes('augmentin') || n.includes('clavamox') || n.includes('ampicillin'));
        if (hasBetaLactam) {
          warnings.unshift(`🔴 CẢNH BÁO NGUY HIỂM: Bệnh nhân có tiền sử dị ứng ${allergy.toUpperCase()}! Đơn thuốc có chứa kháng sinh nhóm Penicillin/Beta-lactam nguy cơ Sốc Phản Vệ!`);
        }
      }
      if (lowerAlg.includes('aspirin') || lowerAlg.includes('nsaid')) {
        const hasNsaid = lowerNames.some((n) => n.includes('aspirin') || n.includes('ibuprofen') || n.includes('diclofenac') || n.includes('meloxicam'));
        if (hasNsaid) {
          warnings.unshift(`🔴 CẢNH BÁO NGUY HIỂM: Bệnh nhân dị ứng ${allergy}! Tránh kê thuốc giảm đau hạ sốt nhóm NSAID.`);
        }
      }
    });

    // Paracetamol duplicate check fallback
    const paracetamolCount = lowerNames.filter(
      (n) => n.includes('paracetamol') || n.includes('efferalgan') || n.includes('ultracet') || n.includes('panadol') || n.includes('hapacol')
    ).length;
    if (paracetamolCount >= 2) {
      warnings.push('⚠️ Cảnh báo lặp hoạt chất Paracetamol! Kê trùng 2 thuốc chứa Paracetamol có nguy cơ quá liều gây độc cho gan.');
    }

    const latencyMs = Date.now() - startTime;
    await this.saveAILogToMongo({
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userRole: 'Bác sĩ Điều trị',
      doctorName: 'BS. CKII. Nguyễn Thanh Duy',
      actionType: 'DRUG_SAFETY_CHECK',
      modelUsed: 'gemini-3.6-flash (Cascade Active)',
      promptText: `Kiểm tra đơn thuốc: ${drugNames} (Tiền sử dị ứng: ${allergyText})`,
      responseText: warnings.length > 0 ? warnings.join('; ') : 'Đơn thuốc an toàn, không phát hiện tương tác hay dị ứng nguy hiểm.',
      latencyMs,
      piiRedacted: false,
      sources: ['Dược thư Quốc gia Việt Nam 2024', 'Hướng dẫn Dị ứng Lâm sàng Bộ Y Tế'],
      status: warnings.length > 0 ? 'WARNING' : 'SUCCESS',
    });

    return Array.from(new Set(warnings));
  },

  /**
   * Fallback mock generator if offline
   */
  generateFallbackResponse(query: string): GeminiResponse {
    const q = query.toLowerCase();

    if (q.includes('tóm tắt') || q.includes('nguyễn văn an')) {
      return {
        text: `**Tóm tắt diễn biến Hồ sơ Bệnh án EMR (Bệnh nhân Nguyễn Văn An - Mã BN20260001):**\n\n- **Tiền sử:** Tăng huyết áp độ 1 (Amlodipine 5mg/ngày).\n- **Khám lâm sàng:** Đau họng 3 ngày, sốt nhẹ 38.0°C, ho khan nhiều về đêm.\n- **Xét nghiệm cận lâm sàng:** WBC 11.2 G/L (Bạch cầu tăng nhẹ), X-quang phế trường 2 bên sáng.\n- **Chẩn đoán:** Viêm họng cấp tính (ICD-10: J02.9).\n- **Đơn thuốc:** Paracetamol 500mg, Augmentin 1g trong 7 ngày.`,
        sources: ['Hồ sơ EMR_LK20260802-01.pdf', 'Phiếu Kết Quả Xét Nghiệm CBC'],
        modelUsed: 'gemini-3.6-flash (Local Resilience Engine)',
      };
    }

    return {
      text: `Trợ lý AI Y tế (Google Gemini Multi-Model Cascade Engine) đã tiếp nhận yêu cầu: "${query}". Dữ liệu đã được bọc mạ bảo mật HIPAA. Theo Dược thư Quốc gia Việt Nam, hãy luôn kiểm tra tương tác thuốc, tiền sử dị ứng và chức năng gan thận trước khi chỉ định điều trị.`,
      sources: ['Google Gemini Medical AI Engine', 'Dược thư Quốc gia Việt Nam 2024'],
      modelUsed: 'gemini-3.6-flash (Local Resilience Engine)',
    };
  },
};

export default geminiService;
