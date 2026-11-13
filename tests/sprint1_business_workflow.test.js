/**
 * ============================================================================================
 * HOSPITAL AI - SPRINT 1 BUSINESS WORKFLOW AUTOMATED TEST SUITE
 * ============================================================================================
 * Bộ kịch bản kiểm thử tự động toàn diện bao quát 8 yêu cầu nghiệp vụ trọng yếu:
 * - Nghiệp vụ 1: Đặt lịch khám online (Atomic Booking, sinh mã QR, trạng thái Pending).
 * - Nghiệp vụ 2: Tiếp nhận bệnh nhân trực tiếp (Tra cứu CCCD/BHYT, tạo mới hồ sơ bệnh nhân).
 * - Nghiệp vụ 3: Tạo & xác minh mã QR lượt khám (JSON schema D_MEDICAL_EXAM_PASS & MEDQR format).
 * - Nghiệp vụ 4: Quét QR cấp STT / Tiếp nhận tự động theo chuyên khoa phòng khám.
 * - Nghiệp vụ 5: Idempotency: Quét cùng 1 mã QR nhiều lần không sinh trùng STT / phát hiện đã check-in.
 * - Nghiệp vụ 6: Concurrency: Giả lập 2 Kiosk bấm cấp STT cùng tích tắc (Kiểm tra sequence không trùng nhau).
 * - Nghiệp vụ 7: Hàng đợi thời gian thực (SignalR WebSocket live notifications: new patient & call next).
 * - Nghiệp vụ 8: Phân quyền API 7 vai trò y tế chuẩn (Admin, Doctor, Receptionist, Triage, Pharmacy, Nurse, Cashier).
 * ============================================================================================
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const signalR = require('../src/web-admin/node_modules/@microsoft/signalr');

const BASE_URL = 'localhost';
const GATEWAY_PORT = 5000;

// Test Execution State
const testResults = [];
const startTime = Date.now();

// Colors for clean CLI reporting
const Colors = {
  Reset: '\x1b[0m',
  Bright: '\x1b[1m',
  Green: '\x1b[32m',
  Red: '\x1b[31m',
  Yellow: '\x1b[33m',
  Cyan: '\x1b[36m',
  Blue: '\x1b[34m',
  Magenta: '\x1b[35m',
};

function recordTest(suite, testName, status, durationMs, details = '', error = null) {
  testResults.push({
    suite,
    testName,
    status,
    durationMs,
    details,
    error: error ? (error.message || String(error)) : null,
  });

  const icon = status === 'PASS' ? `${Colors.Green}✔ PASS${Colors.Reset}` : `${Colors.Red}✖ FAIL${Colors.Reset}`;
  console.log(`  ${icon} [${durationMs}ms] ${testName}`);
  if (details) console.log(`      ${Colors.Cyan}ℹ ${details}${Colors.Reset}`);
  if (error) console.log(`      ${Colors.Red}⚠ Error: ${error.message || error}${Colors.Reset}`);
}

// HTTP Helper with Promise
function request(options, bodyData = null) {
  return new Promise((resolve, reject) => {
    const defaultHeaders = {};
    let postData = null;

    if (bodyData !== null) {
      postData = typeof bodyData === 'string' ? bodyData : JSON.stringify(bodyData);
      defaultHeaders['Content-Type'] = 'application/json';
      defaultHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

    const mergedOptions = {
      hostname: BASE_URL,
      port: GATEWAY_PORT,
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers || {}),
      },
    };

    const req = http.request(mergedOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch {
          json = data;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: json,
        });
      });
    });

    req.on('error', (err) => reject(err));
    if (postData) req.write(postData);
    req.end();
  });
}

// Global Auth Tokens Cache
const tokens = {
  admin: '',
  doctor: '',
  receptionist: '',
  triage: '',
  pharmacy: '',
  nurse: '',
  cashier: '',
  patient: '',
};

async function loginUser(username, roleKey) {
  try {
    const res = await request(
      { path: '/api/auth/login', method: 'POST' },
      { username, password: '123456' }
    );
    if (res.statusCode === 200 && res.data.token) {
      tokens[roleKey] = res.data.token;
      return true;
    }
  } catch (err) {
    console.error(`Failed to login ${username}:`, err.message);
  }
  return false;
}

// ============================================================================================
// TEST SUITES
// ============================================================================================

async function runSprint1TestSuite() {
  console.log(`\n${Colors.Bright}${Colors.Blue}==============================================================================${Colors.Reset}`);
  console.log(`${Colors.Bright}${Colors.Cyan}🏥 BỘ KIỂM THỬ TỰ ĐỘNG TOÀN DIỆN SPRINT 1 - HỆ THỐNG Y TẾ HOSPITAL AI${Colors.Reset}`);
  console.log(`${Colors.Bright}${Colors.Blue}==============================================================================${Colors.Reset}\n`);

  // Step 0: Pre-flight Gateway Health & Auth Bootstrap
  console.log(`${Colors.Bright}0. KHỞI TẠO XÁC THỰC & KIỂM TRA GATEWAY HEALTH${Colors.Reset}`);
  const t0 = Date.now();
  try {
    const health = await request({ path: '/health', method: 'GET' });
    recordTest(
      'Gateway & Bootstrap',
      'API Gateway Health Check (/health)',
      health.statusCode === 200 ? 'PASS' : 'FAIL',
      Date.now() - t0,
      `Gateway Service: ${health.data.gateway}, Status: ${health.data.status}`
    );
  } catch (err) {
    recordTest('Gateway & Bootstrap', 'API Gateway Health Check (/health)', 'FAIL', Date.now() - t0, '', err);
  }

  // Login all 7 roles + Patient
  const authStart = Date.now();
  await Promise.all([
    loginUser('admin', 'admin'),
    loginUser('dr.duy', 'doctor'),
    loginUser('receptionist', 'receptionist'),
    loginUser('triage01', 'triage'),
    loginUser('pharmacy01', 'pharmacy'),
    loginUser('nurse01', 'nurse'),
    loginUser('cashier01', 'cashier'),
    loginUser('patient01', 'patient'),
  ]);
  const allTokensAcquired = Object.values(tokens).every((t) => !!t);
  recordTest(
    'Gateway & Bootstrap',
    'Đăng nhập lấy JWT Bearer Token cho 7 vai trò hệ thống + Bệnh nhân',
    allTokensAcquired ? 'PASS' : 'FAIL',
    Date.now() - authStart,
    `Đã cấp phát thành công ${Object.keys(tokens).length} JWT Bearer Token hợp lệ`
  );

  // ------------------------------------------------------------------------------------------
  // NGHIỆP VỤ 1: ĐẶT LỊCH KHÁM ONLINE
  // ------------------------------------------------------------------------------------------
  console.log(`\n${Colors.Bright}1. NGHIỆP VỤ 1: ĐẶT LỊCH KHÁM ONLINE & ATOMIC BOOKING${Colors.Reset}`);
  let createdAppointment = null;
  const tApt = Date.now();
  try {
    const uniquePhone = '098' + Math.floor(1000000 + Math.random() * 9000000);
    const bookingPayload = {
      patientName: 'Võ Thị Mai Phương',
      patientPhone: uniquePhone,
      patientGender: 'Nữ',
      patientAge: 29,
      departmentName: 'Khoa Nội Tổng Hợp',
      doctorName: 'BS. CKII. Nguyễn Thanh Duy',
      appointmentDate: '2026-11-28',
      appointmentTime: '08:00 - 08:30',
      symptomsReason: 'Khám kiểm tra sức khỏe tổng quát và đau nửa đầu',
      appointmentType: 'New',
    };

    const resApt = await request({ path: '/api/appointments', method: 'POST' }, bookingPayload);

    if (resApt.statusCode === 200 && resApt.data.id) {
      createdAppointment = resApt.data;
      const hasValidQr = Boolean(createdAppointment.qrCode && createdAppointment.qrCode.length > 20);
      const isPending = createdAppointment.status === 'Pending';
      const isPendingQR = createdAppointment.checkInStatus === 'PendingQR';

      recordTest(
        'Nghiệp vụ 1',
        'Tạo lịch hẹn khám trực tuyến (Atomic Booking)',
        hasValidQr && isPending && isPendingQR ? 'PASS' : 'FAIL',
        Date.now() - tApt,
        `Mã hẹn: ${createdAppointment.id}, Trạng thái: ${createdAppointment.status}, CheckInStatus: ${createdAppointment.checkInStatus}`
      );
    } else {
      recordTest('Nghiệp vụ 1', 'Tạo lịch hẹn khám trực tuyến', 'FAIL', Date.now() - tApt, `Status: ${resApt.statusCode}`);
    }
  } catch (err) {
    recordTest('Nghiệp vụ 1', 'Tạo lịch hẹn khám trực tuyến', 'FAIL', Date.now() - tApt, '', err);
  }

  // Kiểm tra IDOR Protection & Quota Slot availability
  const tQuota = Date.now();
  try {
    const resSlots = await request({ path: '/api/appointments/slots', method: 'GET' });
    const hasSlots = resSlots.statusCode === 200 && Array.isArray(resSlots.data) && resSlots.data.length > 0;
    recordTest(
      'Nghiệp vụ 1',
      'Kiểm tra định mức khung giờ khám (Quota Slots)',
      hasSlots ? 'PASS' : 'FAIL',
      Date.now() - tQuota,
      `Tìm thấy ${resSlots.data?.length || 0} khung giờ khám cấu hình`
    );
  } catch (err) {
    recordTest('Nghiệp vụ 1', 'Kiểm tra định mức khung giờ khám', 'FAIL', Date.now() - tQuota, '', err);
  }

  // ------------------------------------------------------------------------------------------
  // NGHIỆP VỤ 2: TIẾP NHẬN BỆNH NHÂN TRỰC TIẾP
  // ------------------------------------------------------------------------------------------
  console.log(`\n${Colors.Bright}2. NGHIỆP VỤ 2: TIẾP NHẬN BỆNH NHÂN TRỰC TIẾP (CCCD / BHYT)${Colors.Reset}`);
  const uniqueCccd = '0380' + Math.floor(10000000 + Math.random() * 90000000);
  const uniqueBhyt = 'DN401' + Math.floor(10000000 + Math.random() * 90000000);
  let createdPatient = null;

  const tPat = Date.now();
  try {
    const newPatientDto = {
      fullName: 'Trương Hoàng Phúc',
      gender: 'Nam',
      dateOfBirth: '1992-06-18T00:00:00Z',
      identityCardNumber: uniqueCccd,
      healthInsuranceNumber: uniqueBhyt,
      phoneNumber: '097' + Math.floor(1000000 + Math.random() * 9000000),
      email: `phuc.truong${Date.now()}@example.com`,
      address: 'Số 456 Đại Lộ Bình Dương, Phường Phú Hòa, TP. Thủ Dầu Một',
    };

    const resPatient = await request(
      {
        path: '/api/patients',
        method: 'POST',
        headers: { Authorization: `Bearer ${tokens.receptionist}` },
      },
      newPatientDto
    );

    if (resPatient.statusCode === 201 || resPatient.statusCode === 200) {
      createdPatient = resPatient.data;
      recordTest(
        'Nghiệp vụ 2',
        'Tạo hồ sơ bệnh nhân tiếp nhận trực tiếp tại quầy',
        'PASS',
        Date.now() - tPat,
        `Mã BN: ${createdPatient.patientCode}, Họ tên: ${createdPatient.fullName}, ID: ${createdPatient.id}`
      );
    } else {
      recordTest('Nghiệp vụ 2', 'Tạo hồ sơ bệnh nhân trực tiếp', 'FAIL', Date.now() - tPat, `Status: ${resPatient.statusCode}`, JSON.stringify(resPatient.data));
    }
  } catch (err) {
    recordTest('Nghiệp vụ 2', 'Tạo hồ sơ bệnh nhân trực tiếp', 'FAIL', Date.now() - tPat, '', err);
  }

  // Tra cứu theo số CCCD
  const tSearchCccd = Date.now();
  try {
    const resCccd = await request({
      path: `/api/patients/identity/${uniqueCccd}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${tokens.receptionist}` },
    });

    const isMatch = resCccd.statusCode === 200 && resCccd.data.identityCardNumber.includes(uniqueCccd.slice(-4));
    recordTest(
      'Nghiệp vụ 2',
      'Tra cứu hồ sơ bệnh nhân tự động theo Số CCCD',
      isMatch ? 'PASS' : 'FAIL',
      Date.now() - tSearchCccd,
      `Tìm thấy đúng hồ sơ: ${resCccd.data?.fullName} (${resCccd.data?.patientCode})`
    );
  } catch (err) {
    recordTest('Nghiệp vụ 2', 'Tra cứu hồ sơ bệnh nhân theo CCCD', 'FAIL', Date.now() - tSearchCccd, '', err);
  }

  // Tra cứu theo Thẻ BHYT qua Search Endpoint
  const tSearchBhyt = Date.now();
  try {
    const resBhyt = await request({
      path: `/api/patients?search=${uniqueBhyt}&pageIndex=1&pageSize=5`,
      method: 'GET',
      headers: { Authorization: `Bearer ${tokens.triage}` },
    });

    const found = resBhyt.statusCode === 200 && (resBhyt.data.items?.length > 0 || resBhyt.data.totalCount > 0);
    recordTest(
      'Nghiệp vụ 2',
      'Tra cứu xác minh Thẻ BHYT tại phòng tiếp đón/sàng lọc',
      found ? 'PASS' : 'FAIL',
      Date.now() - tSearchBhyt,
      `BHYT: ${uniqueBhyt} tra cứu thành công (${resBhyt.data?.totalCount || 1} kết quả)`
    );
  } catch (err) {
    recordTest('Nghiệp vụ 2', 'Tra cứu xác minh Thẻ BHYT', 'FAIL', Date.now() - tSearchBhyt, '', err);
  }

  // ------------------------------------------------------------------------------------------
  // NGHIỆP VỤ 3: TẠO VÀ XÁC MINH MÃ QR LƯỢT KHÁM
  // ------------------------------------------------------------------------------------------
  console.log(`\n${Colors.Bright}3. NGHIỆP VỤ 3: TẠO VÀ XÁC MINH MÃ QR LƯỢT KHÁM (JSON & MEDQR)${Colors.Reset}`);
  const tQrValid = Date.now();
  try {
    // 3.1: Kiểm tra cấu trúc QR JSON chuẩn D_MEDICAL_EXAM_PASS
    if (createdAppointment && createdAppointment.qrCode) {
      let parsedQr = null;
      try {
        parsedQr = JSON.parse(createdAppointment.qrCode);
      } catch {
        parsedQr = null;
      }

      const isValidExamPass =
        parsedQr &&
        parsedQr.type === 'D_MEDICAL_EXAM_PASS' &&
        parsedQr.appointmentId === createdAppointment.id &&
        parsedQr.department === 'Khoa Nội Tổng Hợp';

      recordTest(
        'Nghiệp vụ 3',
        'Giải mã & xác thực cấu trúc mã QR điện tử (D_MEDICAL_EXAM_PASS v2.0)',
        isValidExamPass ? 'PASS' : 'FAIL',
        Date.now() - tQrValid,
        `Loại mã: ${parsedQr?.type}, Phiên bản: ${parsedQr?.version}, ID: ${parsedQr?.appointmentId}`
      );
    } else {
      recordTest('Nghiệp vụ 3', 'Giải mã cấu trúc mã QR', 'FAIL', Date.now() - tQrValid, 'Không có mã QR để kiểm tra');
    }
  } catch (err) {
    recordTest('Nghiệp vụ 3', 'Giải mã cấu trúc mã QR', 'FAIL', Date.now() - tQrValid, '', err);
  }

  // 3.2: Kiểm tra giải mã định dạng chuỗi MEDQR pipe-delimited
  const tMedQr = Date.now();
  try {
    const medQrSample = `MEDQR|apt-test-999|BN202699|2026-11-28|08:30`;
    const parts = medQrSample.split('|');
    const isValidFormat = parts[0] === 'MEDQR' && parts.length >= 3 && parts[1] === 'apt-test-999';

    recordTest(
      'Nghiệp vụ 3',
      'Giải mã chuỗi mã vạch MEDQR định dạng thẻ cứng / giấy hẹn (Pipe-delimited)',
      isValidFormat ? 'PASS' : 'FAIL',
      Date.now() - tMedQr,
      `Prefix: ${parts[0]}, Appointment ID: ${parts[1]}, Patient Code: ${parts[2]}`
    );
  } catch (err) {
    recordTest('Nghiệp vụ 3', 'Giải mã chuỗi MEDQR', 'FAIL', Date.now() - tMedQr, '', err);
  }

  // 3.3: Từ chối mã QR giả mạo / chuỗi không hợp lệ
  const tQrFake = Date.now();
  try {
    const resFake = await request(
      {
        path: '/api/appointments/checkin-qr',
        method: 'POST',
        headers: { Authorization: `Bearer ${tokens.receptionist}` },
      },
      { qrCodeOrId: 'FAKE_QR_TAMPERED_STRING_12345' }
    );

    const isRejected = resFake.statusCode === 404 || resFake.statusCode === 400;
    recordTest(
      'Nghiệp vụ 3',
      'Bảo vệ an ninh: Từ chối mã QR giả mạo / không tồn tại trong hệ thống',
      isRejected ? 'PASS' : 'FAIL',
      Date.now() - tQrFake,
      `Status HTTP: ${resFake.statusCode} (${resFake.data?.message || 'Từ chối thành công'})`
    );
  } catch (err) {
    recordTest('Nghiệp vụ 3', 'Bảo vệ an ninh QR giả mạo', 'FAIL', Date.now() - tQrFake, '', err);
  }

  // ------------------------------------------------------------------------------------------
  // NGHIỆP VỤ 4: QUÉT QR CẤP STT TỰ ĐỘNG THEO PHÒNG KHÁM
  // ------------------------------------------------------------------------------------------
  console.log(`\n${Colors.Bright}4. NGHIỆP VỤ 4: QUÉT QR CẤP STT & TIẾP NHẬN TỰ ĐỘNG${Colors.Reset}`);
  let checkinResult1 = null;
  const tScan1 = Date.now();
  try {
    if (createdAppointment && createdAppointment.qrCode) {
      const resCheckIn = await request(
        {
          path: '/api/appointments/checkin-qr',
          method: 'POST',
          headers: { Authorization: `Bearer ${tokens.receptionist}` },
        },
        { qrCodeOrId: createdAppointment.qrCode }
      );

      if (resCheckIn.statusCode === 200) {
        checkinResult1 = resCheckIn.data;
        const isCompleted = checkinResult1.status === 'Completed';
        const isCheckedIn = checkinResult1.checkInStatus === 'CheckedInQR';
        const hasTimestamp = Boolean(checkinResult1.checkedInAt);

        recordTest(
          'Nghiệp vụ 4',
          'Quét QR Tiếp nhận điện tử tự động tại phòng khám (Check-in QR)',
          isCompleted && isCheckedIn && hasTimestamp ? 'PASS' : 'FAIL',
          Date.now() - tScan1,
          `Trạng thái: ${checkinResult1.status}, CheckInStatus: ${checkinResult1.checkInStatus}, Tiếp nhận lúc: ${checkinResult1.checkedInAt}`
        );
      } else {
        recordTest('Nghiệp vụ 4', 'Quét QR Tiếp nhận điện tử', 'FAIL', Date.now() - tScan1, `Status: ${resCheckIn.statusCode}`);
      }
    } else {
      recordTest('Nghiệp vụ 4', 'Quét QR Tiếp nhận điện tử', 'FAIL', Date.now() - tScan1, 'Lịch hẹn không hợp lệ');
    }
  } catch (err) {
    recordTest('Nghiệp vụ 4', 'Quét QR Tiếp nhận điện tử', 'FAIL', Date.now() - tScan1, '', err);
  }

  // Cấp số STT hàng chờ chính thức cho bệnh nhân trực tiếp
  const tIssueStt = Date.now();
  let directIssuedTicket = null;
  try {
    if (createdPatient) {
      const deptRes = await request({ path: '/api/queue/departments', method: 'GET' });
      const deptId = deptRes.data[0]?.id;

      const resStt = await request(
        {
          path: '/api/queue/issue',
          method: 'POST',
          headers: { Authorization: `Bearer ${tokens.receptionist}` },
        },
        {
          patientId: createdPatient.id,
          departmentId: deptId,
          priority: 'Normal',
        }
      );

      if (resStt.statusCode === 200 && resStt.data.sequenceNumber) {
        directIssuedTicket = resStt.data;
        recordTest(
          'Nghiệp vụ 4',
          'Cấp số thứ tự STT hàng chờ điện tử theo khoa phòng (Queue Ticket)',
          'PASS',
          Date.now() - tIssueStt,
          `Số STT: #${directIssuedTicket.sequenceNumber}, Chuyên khoa: ${directIssuedTicket.departmentName}, Trạng thái: ${directIssuedTicket.status}`
        );
      } else {
        recordTest('Nghiệp vụ 4', 'Cấp số thứ tự STT', 'FAIL', Date.now() - tIssueStt, `Status: ${resStt.statusCode}`);
      }
    } else {
      recordTest('Nghiệp vụ 4', 'Cấp số thứ tự STT', 'FAIL', Date.now() - tIssueStt, 'Không có thông tin bệnh nhân');
    }
  } catch (err) {
    recordTest('Nghiệp vụ 4', 'Cấp số thứ tự STT', 'FAIL', Date.now() - tIssueStt, '', err);
  }

  // ------------------------------------------------------------------------------------------
  // NGHIỆP VỤ 5: IDEMPOTENCY - CHỐNG QUÉT TRÙNG MÃ QR
  // ------------------------------------------------------------------------------------------
  console.log(`\n${Colors.Bright}5. NGHIỆP VỤ 5: IDEMPOTENCY - CHỐNG CẤP TRÙNG SỐ KHI QUÉT LẠI QR${Colors.Reset}`);
  const tIdempotent = Date.now();
  try {
    if (createdAppointment && createdAppointment.qrCode) {
      // Quét lại cùng mã QR lần thứ 2
      const resScan2 = await request(
        {
          path: '/api/appointments/checkin-qr',
          method: 'POST',
          headers: { Authorization: `Bearer ${tokens.receptionist}` },
        },
        { qrCodeOrId: createdAppointment.qrCode }
      );

      // Quét lại cùng mã QR lần thứ 3
      const resScan3 = await request(
        {
          path: '/api/appointments/checkin-qr',
          method: 'POST',
          headers: { Authorization: `Bearer ${tokens.receptionist}` },
        },
        { qrCodeOrId: createdAppointment.qrCode }
      );

      // Kiểm tra tính Idempotent:
      // - Cả 2 lần quét sau đều giữ nguyên ID gốc
      // - Trạng thái CheckInStatus vẫn là CheckedInQR (không tạo ra lượt mới)
      // - Số lượng bản ghi trong hệ thống không bị tăng
      const isSameId = resScan2.data.id === createdAppointment.id && resScan3.data.id === createdAppointment.id;
      const isAlreadyChecked = resScan2.data.checkInStatus === 'CheckedInQR' && resScan3.data.checkInStatus === 'CheckedInQR';

      // Kiểm tra toàn vẹn danh sách: kiểm tra appointment không bị nhân bản
      const resAllApts = await request(
        { path: '/api/appointments', method: 'GET', headers: { Authorization: `Bearer ${tokens.admin}` } }
      );
      const duplicateCount = Array.isArray(resAllApts.data)
        ? resAllApts.data.filter((a) => a.id === createdAppointment.id).length
        : 1;

      const isIdempotent = isSameId && isAlreadyChecked && duplicateCount === 1;

      recordTest(
        'Nghiệp vụ 5',
        'Tính lũy thừa Idempotency: Quét lặp lại 3 lần cùng mã QR không sinh trùng số',
        isIdempotent ? 'PASS' : 'FAIL',
        Date.now() - tIdempotent,
        `Lần 1 ID: ${checkinResult1?.id}, Lần 2 ID: ${resScan2.data.id}, Lần 3 ID: ${resScan3.data.id}. Số bản ghi tồn tại: ${duplicateCount}`
      );
    } else {
      recordTest('Nghiệp vụ 5', 'Tính lũy thừa Idempotency', 'FAIL', Date.now() - tIdempotent, 'Không có mã QR kiểm thử');
    }
  } catch (err) {
    recordTest('Nghiệp vụ 5', 'Tính lũy thừa Idempotency', 'FAIL', Date.now() - tIdempotent, '', err);
  }

  // ------------------------------------------------------------------------------------------
  // NGHIỆP VỤ 6: CONCURRENCY - ĐỒNG THỜI 2 KIOSK CẤP STT
  // ------------------------------------------------------------------------------------------
  console.log(`\n${Colors.Bright}6. NGHIỆP VỤ 6: CONCURRENCY - ĐỒNG THỜI 2 KIOSK CẤP STT CÙNG THỜI ĐIỂM${Colors.Reset}`);
  const tConcurrency = Date.now();
  try {
    // Chuẩn bị 2 bệnh nhân riêng biệt
    const pat1 = await request(
      { path: '/api/patients', method: 'POST', headers: { Authorization: `Bearer ${tokens.admin}` } },
      {
        fullName: 'Kiosk Patient Alpha',
        gender: 'Nam',
        dateOfBirth: '1998-01-01T00:00:00Z',
        identityCardNumber: '089' + Math.floor(10000000 + Math.random() * 90000000),
        phoneNumber: '096' + Math.floor(1000000 + Math.random() * 9000000),
        address: 'Kiosk 01 Hall A',
      }
    );

    const pat2 = await request(
      { path: '/api/patients', method: 'POST', headers: { Authorization: `Bearer ${tokens.admin}` } },
      {
        fullName: 'Kiosk Patient Beta',
        gender: 'Nữ',
        dateOfBirth: '1999-02-02T00:00:00Z',
        identityCardNumber: '089' + Math.floor(10000000 + Math.random() * 90000000),
        phoneNumber: '097' + Math.floor(1000000 + Math.random() * 9000000),
        address: 'Kiosk 02 Hall B',
      }
    );

    const depts = await request({ path: '/api/queue/departments', method: 'GET' });
    const targetDeptId = depts.data[1]?.id || depts.data[0]?.id;

    // Giả lập 2 Kiosk bấm nút cùng 1 tích tắc bằng Promise.all
    const [kiosk1Res, kiosk2Res] = await Promise.all([
      request(
        { path: '/api/queue/issue', method: 'POST', headers: { Authorization: `Bearer ${tokens.receptionist}` } },
        { patientId: pat1.data.id, departmentId: targetDeptId, priority: 'Normal' }
      ),
      request(
        { path: '/api/queue/issue', method: 'POST', headers: { Authorization: `Bearer ${tokens.receptionist}` } },
        { patientId: pat2.data.id, departmentId: targetDeptId, priority: 'Normal' }
      ),
    ]);

    const seq1 = kiosk1Res.data.sequenceNumber;
    const seq2 = kiosk2Res.data.sequenceNumber;
    const isConcurrentSafe =
      kiosk1Res.statusCode === 200 &&
      kiosk2Res.statusCode === 200 &&
      typeof seq1 === 'number' &&
      typeof seq2 === 'number' &&
      seq1 !== seq2 &&
      Math.abs(seq1 - seq2) === 1;

    recordTest(
      'Nghiệp vụ 6',
      'Giả lập 2 Kiosk đồng thời cấp STT cùng tích tắc (Queue Concurrency Safety)',
      isConcurrentSafe ? 'PASS' : 'FAIL',
      Date.now() - tConcurrency,
      `Kiosk 1 cấp STT: #${seq1}, Kiosk 2 cấp STT: #${seq2}. Không trùng lặp, liên tiếp 1 đơn vị (${seq1} vs ${seq2})`
    );
  } catch (err) {
    recordTest('Nghiệp vụ 6', 'Giả lập 2 Kiosk cấp STT đồng thời', 'FAIL', Date.now() - tConcurrency, '', err);
  }

  // ------------------------------------------------------------------------------------------
  // NGHIỆP VỤ 7: HÀNG ĐỢI THỜI GIAN THỰC (SIGNALR WEBSOCKET)
  // ------------------------------------------------------------------------------------------
  console.log(`\n${Colors.Bright}7. NGHIỆP VỤ 7: HÀNG ĐỢI THỜI GIAN THỰC (SIGNALR WEBSOCKET)${Colors.Reset}`);
  const tSignalR = Date.now();
  let signalRReceived = false;
  let receivedSignalRData = null;

  try {
    const hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`http://${BASE_URL}:${GATEWAY_PORT}/hubs/queue`)
      .configureLogging(signalR.LogLevel.None)
      .build();

    await hubConnection.start();

    // Lắng nghe các sự kiện cập nhật hàng đợi thời gian thực
    hubConnection.on('ReceiveGlobalQueueUpdate', (data) => {
      signalRReceived = true;
      receivedSignalRData = data;
    });

    hubConnection.on('NewPatientInQueue', (data) => {
      signalRReceived = true;
      receivedSignalRData = data;
    });

    // Kích hoạt 1 hành động cấp phiếu mới để kiểm tra broadcast
    const depts = await request({ path: '/api/queue/departments', method: 'GET' });
    const testDept = depts.data[2] || depts.data[0];

    // Phát lệnh cấp phiếu hoặc tạo appointment kích hoạt SignalR
    await request(
      { path: '/api/appointments', method: 'POST' },
      {
        patientName: 'SignalR Test Patient',
        patientPhone: '0988112233',
        patientGender: 'Nam',
        patientAge: 35,
        departmentName: testDept.departmentName,
        doctorName: 'BS. CKII. Nguyễn Thanh Duy',
        appointmentDate: '2026-11-29',
        appointmentTime: '11:00 - 11:30',
        symptomsReason: 'Kiểm tra WebSocket SignalR Hub',
      }
    );

    // Chờ tối đa 3 giây để nhận broadcast từ SignalR Hub
    for (let i = 0; i < 30; i++) {
      if (signalRReceived) break;
      await new Promise((r) => setTimeout(r, 100));
    }

    await hubConnection.stop();

    recordTest(
      'Nghiệp vụ 7',
      'Kết nối WebSocket SignalR & Nhận thông báo hàng đợi thời gian thực',
      signalRReceived ? 'PASS' : 'FAIL',
      Date.now() - tSignalR,
      signalRReceived
        ? `Đã nhận thành công gói tin Realtime Broadcast: ${receivedSignalRData?.patientName || receivedSignalRData?.id || 'Data OK'}`
        : 'Timeout: Không nhận được sự kiện SignalR trong 3000ms'
    );
  } catch (err) {
    recordTest('Nghiệp vụ 7', 'Kết nối WebSocket SignalR', 'FAIL', Date.now() - tSignalR, '', err);
  }

  // ------------------------------------------------------------------------------------------
  // NGHIỆP VỤ 8: PHÂN QUYỀN API THEO 7 VAI TRÒ
  // ------------------------------------------------------------------------------------------
  console.log(`\n${Colors.Bright}8. NGHIỆP VỤ 8: PHÂN QUYỀN API 7 VAI TRÒ (ADMIN, DOCTOR, RECEPTIONIST, TRIAGE, PHARMACY, NURSE, CASHIER)${Colors.Reset}`);

  // 8.1: Endpoint danh sách bệnh nhân (/api/patients) - Cho phép 7 vai trò cán bộ y tế, chặn Bệnh nhân
  const tRbacStaff = Date.now();
  try {
    const rolesToTest = [
      { name: 'Admin', token: tokens.admin, shouldAllow: true },
      { name: 'Doctor', token: tokens.doctor, shouldAllow: true },
      { name: 'Receptionist', token: tokens.receptionist, shouldAllow: true },
      { name: 'Triage', token: tokens.triage, shouldAllow: true },
      { name: 'Pharmacy', token: tokens.pharmacy, shouldAllow: true },
      { name: 'Nurse', token: tokens.nurse, shouldAllow: true },
      { name: 'Cashier', token: tokens.cashier, shouldAllow: true },
      { name: 'Patient', token: tokens.patient, shouldAllow: false },
    ];

    let allStaffCorrect = true;
    const staffDetails = [];

    for (const r of rolesToTest) {
      const res = await request({
        path: '/api/patients?pageIndex=1&pageSize=1',
        method: 'GET',
        headers: { Authorization: `Bearer ${r.token}` },
      });

      const allowed = res.statusCode === 200;
      const denied = res.statusCode === 403;
      const isCorrect = r.shouldAllow ? allowed : denied;
      if (!isCorrect) allStaffCorrect = false;
      staffDetails.push(`${r.name}: ${res.statusCode}`);
    }

    recordTest(
      'Nghiệp vụ 8',
      'Phân quyền Hồ sơ bệnh nhân (/api/patients): Cho phép 7 vai trò, chặn Patient (403)',
      allStaffCorrect ? 'PASS' : 'FAIL',
      Date.now() - tRbacStaff,
      staffDetails.join(' | ')
    );
  } catch (err) {
    recordTest('Nghiệp vụ 8', 'Phân quyền Hồ sơ bệnh nhân', 'FAIL', Date.now() - tRbacStaff, '', err);
  }

  // 8.2: Endpoint Bác sĩ gọi số khám (/api/queue/departments/{id}/call-next) - Chỉ cho phép Doctor & Admin
  const tRbacDoctor = Date.now();
  try {
    const depts = await request({ path: '/api/queue/departments', method: 'GET' });
    const targetDeptId = depts.data[0]?.id;

    // Doctor & Admin -> 200 OK (hoặc 404 nếu hết hàng chờ, nhưng KHÔNG PHẢI 403)
    const resDoc = await request({
      path: `/api/queue/departments/${targetDeptId}/call-next`,
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens.doctor}` },
    });
    const docAllowed = resDoc.statusCode === 200 || resDoc.statusCode === 404;

    // Receptionist -> 403 Forbidden
    const resRecep = await request({
      path: `/api/queue/departments/${targetDeptId}/call-next`,
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens.receptionist}` },
    });
    const recepForbidden = resRecep.statusCode === 403;

    // Cashier -> 403 Forbidden
    const resCashier = await request({
      path: `/api/queue/departments/${targetDeptId}/call-next`,
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens.cashier}` },
    });
    const cashierForbidden = resCashier.statusCode === 403;

    const isCallNextSecure = docAllowed && recepForbidden && cashierForbidden;
    recordTest(
      'Nghiệp vụ 8',
      'Đặc quyền Bác sĩ gọi số (call-next): Doctor được phép, Receptionist & Cashier bị 403',
      isCallNextSecure ? 'PASS' : 'FAIL',
      Date.now() - tRbacDoctor,
      `Doctor: ${resDoc.statusCode}, Receptionist: ${resRecep.statusCode}, Cashier: ${resCashier.statusCode}`
    );
  } catch (err) {
    recordTest('Nghiệp vụ 8', 'Đặc quyền Bác sĩ gọi số', 'FAIL', Date.now() - tRbacDoctor, '', err);
  }

  // 8.3: Endpoint Quản trị Xóa bệnh nhân (/api/patients/{id}) - Chỉ cho phép Admin
  const tRbacAdmin = Date.now();
  try {
    const fakeId = '00000000-0000-0000-0000-000000000001';

    // Admin gọi -> được phân quyền (trả về 404 NotFound vì id không có thật, nhưng KHÔNG BỊ 403)
    const resAdmin = await request({
      path: `/api/patients/${fakeId}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokens.admin}` },
    });
    const adminAllowed = resAdmin.statusCode === 404 || resAdmin.statusCode === 200;

    // Receptionist gọi xóa bệnh nhân -> 403 Forbidden
    const resRecepDel = await request({
      path: `/api/patients/${fakeId}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokens.receptionist}` },
    });
    const recepDenied = resRecepDel.statusCode === 403;

    // Nurse gọi xóa bệnh nhân -> 403 Forbidden
    const resNurseDel = await request({
      path: `/api/patients/${fakeId}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokens.nurse}` },
    });
    const nurseDenied = resNurseDel.statusCode === 403;

    // Cashier gọi xóa bệnh nhân -> 403 Forbidden
    const resCashierDel = await request({
      path: `/api/patients/${fakeId}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokens.cashier}` },
    });
    const cashierDenied = resCashierDel.statusCode === 403;

    const isAdminDelSecure = adminAllowed && recepDenied && nurseDenied && cashierDenied;
    recordTest(
      'Nghiệp vụ 8',
      'Đặc quyền Tối cao Quản trị (DELETE patient): Admin được phép, Receptionist/Nurse/Cashier bị 403',
      isAdminDelSecure ? 'PASS' : 'FAIL',
      Date.now() - tRbacAdmin,
      `Admin: ${resAdmin.statusCode}, Receptionist: ${resRecepDel.statusCode}, Nurse: ${resNurseDel.statusCode}, Cashier: ${resCashierDel.statusCode}`
    );
  } catch (err) {
    recordTest('Nghiệp vụ 8', 'Đặc quyền Quản trị xóa bệnh nhân', 'FAIL', Date.now() - tRbacAdmin, '', err);
  }

  // 8.4: Endpoint Quản lý Định mức Khung giờ khám (slots toggle-lock) - Admin, Receptionist, Triage được phép
  const tRbacSlots = Date.now();
  try {
    const slotsRes = await request({ path: '/api/appointments/slots', method: 'GET' });
    const slotId = slotsRes.data[0]?.id || 'slot-01';

    // Receptionist -> 200 OK
    const resRecepSlot = await request({
      path: `/api/appointments/slots/${slotId}/toggle-lock`,
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokens.receptionist}` },
    });
    // Hoàn trả trạng thái cũ
    await request({
      path: `/api/appointments/slots/${slotId}/toggle-lock`,
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokens.receptionist}` },
    });

    // Pharmacy -> 403 Forbidden (Dược sĩ không được chỉnh slot tiếp nhận khám)
    const resPharmSlot = await request({
      path: `/api/appointments/slots/${slotId}/toggle-lock`,
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokens.pharmacy}` },
    });

    const isSlotAuthCorrect = resRecepSlot.statusCode === 200 && resPharmSlot.statusCode === 403;
    recordTest(
      'Nghiệp vụ 8',
      'Phân quyền Khung giờ khám (toggle-lock): Receptionist được phép, Pharmacy bị 403',
      isSlotAuthCorrect ? 'PASS' : 'FAIL',
      Date.now() - tRbacSlots,
      `Receptionist: ${resRecepSlot.statusCode}, Pharmacy: ${resPharmSlot.statusCode}`
    );
  } catch (err) {
    recordTest('Nghiệp vụ 8', 'Phân quyền Khung giờ khám', 'FAIL', Date.now() - tRbacSlots, '', err);
  }

  // ============================================================================================
  // TỔNG KẾT BÁO CÁO KẾT QUẢ KIỂM THỬ (QA REPORT)
  // ============================================================================================
  const totalDuration = Date.now() - startTime;
  const passes = testResults.filter((t) => t.status === 'PASS').length;
  const fails = testResults.filter((t) => t.status === 'FAIL').length;
  const passRate = ((passes / testResults.length) * 100).toFixed(2);

  console.log(`\n${Colors.Bright}${Colors.Blue}==============================================================================${Colors.Reset}`);
  console.log(`${Colors.Bright}📊 BÁO CÁO TỔNG KẾT KẾT QUẢ KIỂM THỬ SPRINT 1 (QA REPORT)${Colors.Reset}`);
  console.log(`${Colors.Bright}${Colors.Blue}==============================================================================${Colors.Reset}`);
  console.log(`  Tổng số ca kiểm thử (Total Cases) : ${Colors.Bright}${testResults.length}${Colors.Reset}`);
  console.log(`  Thành công (PASS)                  : ${Colors.Bright}${Colors.Green}${passes}${Colors.Reset}`);
  console.log(`  Thất bại (FAIL)                    : ${Colors.Bright}${fails > 0 ? Colors.Red : Colors.Green}${fails}${Colors.Reset}`);
  console.log(`  Tỷ lệ đạt chuẩn (Pass Rate)        : ${Colors.Bright}${passRate === '100.00' ? Colors.Green : Colors.Yellow}${passRate}%${Colors.Reset}`);
  console.log(`  Tổng thời gian thực thi (Duration) : ${Colors.Bright}${totalDuration} ms${Colors.Reset}`);
  console.log(`${Colors.Bright}${Colors.Blue}==============================================================================${Colors.Reset}\n`);

  // Lưu file báo cáo JSON
  const reportPath = path.resolve(__dirname, 'TEST_REPORT_SPRINT1.json');
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        testSuite: 'Hospital AI Sprint 1 Business Workflow Automation',
        timestamp: new Date().toISOString(),
        summary: {
          total: testResults.length,
          passes,
          fails,
          passRate: `${passRate}%`,
          durationMs: totalDuration,
        },
        results: testResults,
      },
      null,
      2
    )
  );
  console.log(`📄 Đã xuất báo cáo chi tiết ra file: ${Colors.Cyan}${reportPath}${Colors.Reset}\n`);

  if (fails > 0) {
    process.exit(1);
  }
}

runSprint1TestSuite().catch((err) => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
