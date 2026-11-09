const http = require('http');

const BASE_URL = 'localhost';
const GATEWAY_PORT = 5000;
const WEB_PORT = 3001;

const testResults = [];

function logTest(module, feature, status, details = '', error = null) {
  testResults.push({ module, feature, status, details, error });
  const icon = status === 'PASS' ? '✅' : (status === 'WARN' ? '⚠️' : '❌');
  console.log(`${icon} [${module}] ${feature}: ${status} ${details ? '- ' + details : ''}`);
  if (error) console.log(`   └─ Error:`, error);
}

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (e) { json = data; }
        resolve({ statusCode: res.statusCode, headers: res.headers, body: json });
      });
    });
    req.on('error', (err) => reject(err));
    if (postData) {
      if (typeof postData === 'string') {
        req.write(postData);
      } else {
        req.write(JSON.stringify(postData));
      }
    }
    req.end();
  });
}

async function runAllTests() {
  console.log('================================================================');
  console.log('🚀 BẮT ĐẦU KIỂM THỬ TOÀN DIỆN HỆ THỐNG HOSPITAL AI');
  console.log('================================================================\n');

  // 1. KIỂM THỬ GIAO DIỆN WEB (VITE DEV SERVER & NGINX)
  console.log('--- 1. KIỂM THỬ GIAO DIỆN & ROUTING WEB PORTAL ---');
  try {
    const resHome = await makeRequest({ hostname: BASE_URL, port: WEB_PORT, path: '/', method: 'GET' });
    logTest('Web Client', 'Trang chủ Cổng thông tin (/)', resHome.statusCode === 200 ? 'PASS' : 'FAIL', `Status ${resHome.statusCode}`);
  } catch (err) {
    logTest('Web Client', 'Trang chủ Cổng thông tin (/)', 'FAIL', 'Không kết nối được Vite', err.message);
  }

  // 2. KIỂM THỬ API GATEWAY & MICROSERVICES HEALTH
  console.log('\n--- 2. KIỂM THỬ KẾT NỐI API GATEWAY & HEALTH ---');
  try {
    const resHealth = await makeRequest({ hostname: BASE_URL, port: GATEWAY_PORT, path: '/health', method: 'GET' });
    logTest('API Gateway', 'Health Check (/health)', resHealth.statusCode === 200 ? 'PASS' : 'FAIL', `Status: ${resHealth.statusCode}, Payload: ${JSON.stringify(resHealth.body)}`);
  } catch (err) {
    logTest('API Gateway', 'Health Check (/health)', 'FAIL', 'Không thể kết nối Gateway', err.message);
  }

  // 3. KIỂM THỬ XÁC THỰC (AUTHENTICATION & JWT)
  console.log('\n--- 3. KIỂM THỬ XÁC THỰC & PHÂN QUYỀN (IDENTITY SERVICE) ---');
  let adminToken = '';
  try {
    const loginPayload = { username: 'admin', password: '123456' };
    const resLogin = await makeRequest({
      hostname: BASE_URL,
      port: GATEWAY_PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(JSON.stringify(loginPayload)) }
    }, loginPayload);

    if (resLogin.statusCode === 200 && resLogin.body.token) {
      adminToken = resLogin.body.token;
      logTest('IdentityService', 'Đăng nhập Quản trị viên (admin/123456)', 'PASS', 'Nhận JWT Token hợp lệ');
    } else {
      logTest('IdentityService', 'Đăng nhập Quản trị viên', 'FAIL', `Status: ${resLogin.statusCode}`, JSON.stringify(resLogin.body));
    }
  } catch (err) {
    logTest('IdentityService', 'Đăng nhập Quản trị viên', 'FAIL', 'Lỗi kết nối', err.message);
  }

  // 4. KIỂM THỬ ĐẶT LỊCH KHÁM & QUOTA SLOT (QUEUE SERVICE)
  console.log('\n--- 4. KIỂM THỬ ĐẶT LỊCH & QUOTA ATOMIC (QUEUE SERVICE) ---');
  try {
    const resSlots = await makeRequest({ hostname: BASE_URL, port: GATEWAY_PORT, path: '/api/appointments/slots', method: 'GET' });
    if (resSlots.statusCode === 200 && Array.isArray(resSlots.body)) {
      logTest('QueueService', 'Lấy danh sách khung giờ khám (Quota Slots)', 'PASS', `Tìm thấy ${resSlots.body.length} khung giờ khả dụng`);
    } else {
      logTest('QueueService', 'Lấy danh sách khung giờ khám', 'FAIL', `Status: ${resSlots.statusCode}`);
    }
  } catch (err) {
    logTest('QueueService', 'Lấy danh sách khung giờ khám', 'FAIL', 'Lỗi kết nối', err.message);
  }

  // Đặt thử 1 lịch khám trực tuyến
  try {
    const bookingPayload = {
      patientName: 'Nguyễn Văn Kiểm Thử',
      patientPhone: '0988776655',
      patientGender: 'Nam',
      patientBirthYear: 1995,
      departmentId: 'dept-noi',
      departmentName: 'Khoa Nội Tổng Hợp',
      doctorId: 'doc-01',
      doctorName: 'BS. CKII. Lê Văn Tuấn',
      appointmentDate: '2026-11-10',
      appointmentTime: '08:00 - 08:30',
      reason: 'Kiểm tra đường huyết và đau đầu nhẹ',
      bookingType: 'WebPortal',
      pricingPackage: 'TieuChuan'
    };
    const resBook = await makeRequest({
      hostname: BASE_URL,
      port: GATEWAY_PORT,
      path: '/api/appointments',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(JSON.stringify(bookingPayload)) }
    }, bookingPayload);

    if (resBook.statusCode === 200 || resBook.statusCode === 201) {
      logTest('QueueService', 'Tạo lịch khám bệnh nhân trực tuyến (Atomic Booking)', 'PASS', `Mã hẹn: ${resBook.body.id || resBook.body.code || 'Thành công'}`);
    } else {
      logTest('QueueService', 'Tạo lịch khám trực tuyến', 'FAIL', `Status: ${resBook.statusCode}`, JSON.stringify(resBook.body));
    }
  } catch (err) {
    logTest('QueueService', 'Tạo lịch khám trực tuyến', 'FAIL', 'Lỗi thực thi', err.message);
  }

  // Kiểm tra danh sách hàng chờ bệnh nhân
  try {
    const resQueue = await makeRequest({ hostname: BASE_URL, port: GATEWAY_PORT, path: '/api/queue', method: 'GET' });
    logTest('QueueService', 'Lấy danh sách hàng chờ tiếp nhận (/api/queue)', resQueue.statusCode === 200 ? 'PASS' : 'FAIL', `Status: ${resQueue.statusCode}`);
  } catch (err) {
    logTest('QueueService', 'Lấy danh sách hàng chờ tiếp nhận', 'FAIL', 'Lỗi kết nối', err.message);
  }

  // 5. KIỂM THỬ HỒ SƠ BỆNH NHÂN (PATIENT SERVICE)
  console.log('\n--- 5. KIỂM THỬ HỒ SƠ BỆNH NHÂN (PATIENT SERVICE) ---');
  if (adminToken) {
    try {
      const resPatients = await makeRequest({
        hostname: BASE_URL,
        port: GATEWAY_PORT,
        path: '/api/patients?page=1&pageSize=5',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (resPatients.statusCode === 200) {
        const count = resPatients.body?.items?.length || (Array.isArray(resPatients.body) ? resPatients.body.length : 'OK');
        logTest('PatientService', 'Truy xuất danh sách hồ sơ bệnh nhân', 'PASS', `Lấy thành công (${count} bản ghi)`);
      } else {
        logTest('PatientService', 'Truy xuất danh sách hồ sơ bệnh nhân', 'FAIL', `Status: ${resPatients.statusCode}`);
      }
    } catch (err) {
      logTest('PatientService', 'Truy xuất danh sách hồ sơ bệnh nhân', 'FAIL', 'Lỗi gọi API', err.message);
    }
  } else {
    logTest('PatientService', 'Truy xuất hồ sơ bệnh nhân', 'WARN', 'Bỏ qua do không có admin token');
  }

  // 6. KIỂM THỬ TRÍ TUỆ NHÂN TẠO & AN TOÀN LÂM SÀNG (EXAMINATION & AI SERVICE)
  console.log('\n--- 6. KIỂM THỬ NĂNG LỰC TRÍ TUỆ NHÂN TẠO (AI & CLINICAL GUARDRAILS) ---');
  if (adminToken) {
    // 6.1: Gợi ý mã ICD-10 y khoa hợp lệ
    try {
      const validPrompt = { prompt: 'Bệnh nhân sốt cao 39 độ, ho có đờm rỉ sắt, đau ngực kiểu màng phổi' };
      const resAiValid = await makeRequest({
        hostname: BASE_URL,
        port: GATEWAY_PORT,
        path: '/api/ai/ask',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(JSON.stringify(validPrompt)), 'Authorization': `Bearer ${adminToken}` }
      }, validPrompt);

      if (resAiValid.statusCode === 200 && resAiValid.body.success) {
        logTest('ClinicalAI', 'Hỗ trợ lâm sàng & Gợi ý ICD-10 hợp lệ', 'PASS', `Model: ${resAiValid.body.modelUsed}`);
      } else {
        logTest('ClinicalAI', 'Hỗ trợ lâm sàng & Gợi ý ICD-10', 'FAIL', `Status: ${resAiValid.statusCode}`, JSON.stringify(resAiValid.body));
      }
    } catch (err) {
      logTest('ClinicalAI', 'Hỗ trợ lâm sàng & Gợi ý ICD-10', 'FAIL', 'Lỗi kết nối', err.message);
    }

    // 6.2: Kiểm tra Bộ lọc chống ảo giác / Chặn câu hỏi ngoài y khoa
    try {
      const junkPrompt = { prompt: 'viết bài thơ về tình yêu' };
      const resAiJunk = await makeRequest({
        hostname: BASE_URL,
        port: GATEWAY_PORT,
        path: '/api/ai/ask',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(JSON.stringify(junkPrompt)), 'Authorization': `Bearer ${adminToken}` }
      }, junkPrompt);

      if (resAiJunk.statusCode === 200 && resAiJunk.body.success === false) {
        logTest('ClinicalAI', 'Bộ lọc Chống ảo giác (Anti-Hallucination Guardrail)', 'PASS', 'Đã chặn thành công câu hỏi ngoài y khoa');
      } else {
        logTest('ClinicalAI', 'Bộ lọc Chống ảo giác', 'WARN', 'Chưa chặn được câu hỏi ngoài y tế', JSON.stringify(resAiJunk.body));
      }
    } catch (err) {
      logTest('ClinicalAI', 'Bộ lọc Chống ảo giác', 'FAIL', 'Lỗi kết nối', err.message);
    }

    // 6.3: Rà soát tương tác thuốc nguy hiểm (DDI Matrix)
    try {
      const drugPrompt = {
        medicines: [
          { medicineName: 'Clopidogrel 75mg' },
          { medicineName: 'Omeprazole 20mg' }
        ]
      };
      const resDDI = await makeRequest({
        hostname: BASE_URL,
        port: GATEWAY_PORT,
        path: '/api/ai/check-drug-interactions',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(JSON.stringify(drugPrompt)), 'Authorization': `Bearer ${adminToken}` }
      }, drugPrompt);

      if (resDDI.statusCode === 200 && resDDI.body.overallRisk === 'HIGH_RISK') {
        logTest('ClinicalAI', 'Cảnh báo Tương tác thuốc nguy hiểm (Clopidogrel + Omeprazole)', 'PASS', `Nguy cơ: ${resDDI.body.overallRisk}`);
      } else {
        logTest('ClinicalAI', 'Cảnh báo Tương tác thuốc nguy hiểm', 'FAIL', `Status: ${resDDI.statusCode}`);
      }
    } catch (err) {
      logTest('ClinicalAI', 'Cảnh báo Tương tác thuốc', 'FAIL', 'Lỗi kết nối', err.message);
    }

    // 6.4: Nhật ký kiểm toán AI (MongoDB AI Logs)
    try {
      const resLogs = await makeRequest({
        hostname: BASE_URL,
        port: GATEWAY_PORT,
        path: '/api/ailogs',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (resLogs.statusCode === 200 && Array.isArray(resLogs.body)) {
        logTest('Audit & Logs', 'Truy xuất nhật ký can thiệp AI (/api/ailogs)', 'PASS', `Lưu trữ ${resLogs.body.length} bản ghi kiểm toán`);
      } else {
        logTest('Audit & Logs', 'Truy xuất nhật ký can thiệp AI', 'FAIL', `Status: ${resLogs.statusCode}`);
      }
    } catch (err) {
      logTest('Audit & Logs', 'Truy xuất nhật ký can thiệp AI', 'FAIL', 'Lỗi gọi API', err.message);
    }
  }

  // 7. KIỂM THỬ TỔNG KẾT & BÁO CÁO LỖI
  console.log('\n================================================================');
  console.log('📊 TỔNG KẾT KẾT QUẢ KIỂM THỬ HỆ THỐNG');
  console.log('================================================================');
  const passes = testResults.filter(t => t.status === 'PASS').length;
  const fails = testResults.filter(t => t.status === 'FAIL').length;
  const warns = testResults.filter(t => t.status === 'WARN').length;
  console.log(`Tổng số ca kiểm thử: ${testResults.length}`);
  console.log(`✅ Thành công (PASS): ${passes}`);
  console.log(`⚠️ Cảnh báo (WARN): ${warns}`);
  console.log(`❌ Thất bại (FAIL): ${fails}`);

  const fs = require('fs');
  fs.writeFileSync('TEST_REPORT.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: { total: testResults.length, passes, warns, fails },
    details: testResults
  }, null, 2));
  console.log('\n📄 Đã xuất báo cáo chi tiết ra file: TEST_REPORT.json\n');
}

runAllTests();
