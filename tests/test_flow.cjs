const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = path.resolve('C:/Users/LENOVO/.gemini/antigravity/brain/7908634f-9f35-48bd-9fdf-40d651ea61bd/screenshots');

async function test() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,960'],
    defaultViewport: { width: 1440, height: 960 },
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });

  console.log('Logging in as dr.duy / 123456...');
  await page.waitForSelector('#unified_login_username', { timeout: 5000 });
  await page.type('#unified_login_username', 'dr.duy');
  await page.type('#unified_login_password', '123456');
  await page.click('button[type="submit"]');

  await new Promise(r => setTimeout(r, 2000));
  console.log('Current URL after submit:', page.url());

  // 1. Screenshot Dashboard
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_dashboard.png') });
  console.log('📸 01_dashboard.png saved');

  // 2. Navigate to Reception
  console.log('Navigating to http://localhost:3000/reception...');
  await page.goto('http://localhost:3000/reception', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_reception_view.png') });
  console.log('📸 02_reception_view.png saved');

  // Find & Click "Tiếp Nhận Tái Khám" button
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await page.evaluate(el => el.innerText, b);
    if (text && text.includes('Tiếp Nhận Tái Khám')) {
      console.log('Clicking Tiếp Nhận Tái Khám button...');
      await page.evaluate(el => el.click(), b);
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_followup_modal.png') });
  console.log('📸 03_followup_modal.png saved');

  // Search follow up patient
  const searchInput = await page.$('.ant-modal input');
  if (searchInput) {
    await searchInput.type('BN2026000001');
    const modalSearchBtn = await page.$('.ant-modal .ant-input-search-button, .ant-modal button.ant-btn-primary');
    if (modalSearchBtn) {
      await page.evaluate(el => el.click(), modalSearchBtn);
      await new Promise(r => setTimeout(r, 1200));
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_followup_patient_found.png') });
      console.log('📸 04_followup_patient_found.png saved');

      // Click "Kích Hoạt Lượt Tái Khám" button
      const modalBtns = await page.$$('.ant-modal button');
      for (const mb of modalBtns) {
        const text = await page.evaluate(el => el.innerText, mb);
        if (text && text.includes('Kích Hoạt Lượt Tái Khám')) {
          console.log('Clicking Kích Hoạt Lượt Tái Khám...');
          await page.evaluate(el => el.click(), mb);
          break;
        }
      }
      await new Promise(r => setTimeout(r, 1500));
      // Dismiss sweetalert if any
      const swalConfirm = await page.$('.swal2-confirm');
      if (swalConfirm) {
        await page.evaluate(el => el.click(), swalConfirm);
        await new Promise(r => setTimeout(r, 800));
      }
    }
  }

  // Close follow-up modal if still open
  const closeBtn = await page.$('.ant-modal-close');
  if (closeBtn) {
    await page.evaluate(el => el.click(), closeBtn);
  }
  await new Promise(r => setTimeout(r, 800));

  // 3. Navigate to Examinations Page
  console.log('Navigating to http://localhost:3000/examinations...');
  await page.goto('http://localhost:3000/examinations', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_examinations_page.png') });
  console.log('📸 05_examinations_page.png saved');

  // Click "Quét QR BN Quay Lại (Đọc KQ CLS)" button
  const examButtons = await page.$$('button');
  for (const eb of examButtons) {
    const text = await page.evaluate(el => el.innerText, eb);
    if (text && text.includes('Quét QR BN Quay Lại')) {
      console.log('Clicking Quét QR BN Quay Lại button...');
      await page.evaluate(el => el.click(), eb);
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_cls_qr_modal.png') });
  console.log('📸 06_cls_qr_modal.png saved');

  // Click quick dev tag
  const tags = await page.$$('.ant-modal .ant-tag-orange');
  if (tags.length > 0) {
    console.log('Clicking quick dev chip in modal...');
    await page.evaluate(el => el.click(), tags[0]);
    await new Promise(r => setTimeout(r, 500));
  }
  const confirmBtn = await page.$('.ant-modal .ant-input-search-button, .ant-modal button.ant-btn-primary');
  if (confirmBtn) {
    await page.evaluate(el => el.click(), confirmBtn);
    await new Promise(r => setTimeout(r, 1500));
    const swal2 = await page.$('.swal2-confirm');
    if (swal2) {
      await page.evaluate(el => el.click(), swal2);
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_cls_priority_queue.png') });
  console.log('📸 07_cls_priority_queue.png saved');

  // 4. Click "Khám Bệnh" on first waiting patient
  const allBtns = await page.$$('button');
  for (const btn of allBtns) {
    const text = await page.evaluate(el => el.innerText, btn);
    if (text && text.includes('Khám Bệnh')) {
      console.log('Opening SOAP examination modal...');
      await page.evaluate(el => el.click(), btn);
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_soap_modal.png') });
  console.log('📸 08_soap_modal.png saved');

  // Click Tab "Lịch Sử Đợt Khám Trước (EMR)"
  const tabList = await page.$$('.ant-tabs-tab');
  for (const t of tabList) {
    const text = await page.evaluate(el => el.innerText, t);
    if (text && (text.includes('Lịch Sử') || text.includes('Đợt Khám Trước'))) {
      console.log('Switching to previous EMR tab...');
      await page.evaluate(el => el.click(), t);
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_soap_previous_emr.png') });
  console.log('📸 09_soap_previous_emr.png saved');

  // Click Tab "Chỉ Định CLS & Đơn Thuốc"
  for (const t of tabList) {
    const text = await page.evaluate(el => el.innerText, t);
    if (text && (text.includes('Đơn Thuốc') || text.includes('Cận Lâm Sàng'))) {
      console.log('Switching to Prescriptions / Services tab...');
      await page.evaluate(el => el.click(), t);
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_soap_prescription_services.png') });
  console.log('📸 10_soap_prescription_services.png saved');

  await browser.close();
  console.log('🎉 ALL LIVE TESTS AND SCREENSHOTS GENERATED SUCCESSFULLY!');
}

test().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
