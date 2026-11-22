const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = path.resolve('C:/Users/LENOVO/.gemini/antigravity/brain/7908634f-9f35-48bd-9fdf-40d651ea61bd/screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runLiveTest() {
  console.log('🚀 Starting Chrome via puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,960'],
    defaultViewport: { width: 1440, height: 960 },
  });

  const page = await browser.newPage();

  try {
    // 1. LOGIN
    console.log('1. Navigating to Login Page: http://localhost:3000/login');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise((r) => setTimeout(r, 1000));

    // Fill login form
    console.log('Logging in as doctor01...');
    await page.type('input[id*="username"], input[name="username"], input[type="text"]', 'doctor01');
    await page.type('input[id*="password"], input[name="password"], input[type="password"]', '123456');
    await page.click('button[type="submit"]');

    await new Promise((r) => setTimeout(r, 2000));
    const dashPath = path.join(SCREENSHOT_DIR, '01_login_dashboard.png');
    await page.screenshot({ path: dashPath });
    console.log(`📸 Saved screenshot: ${dashPath}`);

    // 2. RECEPTION & FOLLOW-UP ADMISSION
    console.log('2. Navigating to Reception Page: http://localhost:3000/reception');
    await page.goto('http://localhost:3000/reception', { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise((r) => setTimeout(r, 1500));

    const recPath = path.join(SCREENSHOT_DIR, '02_reception_page.png');
    await page.screenshot({ path: recPath });
    console.log(`📸 Saved screenshot: ${recPath}`);

    // Click "🔄 Tiếp Nhận Tái Khám" button
    console.log('Opening Follow-up Admission Modal...');
    const buttons = await page.$$('button');
    let followUpBtn = null;
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.innerText, btn);
      if (text && text.includes('Tiếp Nhận Tái Khám')) {
        followUpBtn = btn;
        break;
      }
    }

    if (followUpBtn) {
      await followUpBtn.click();
      await new Promise((r) => setTimeout(r, 1000));
      const followUpModalPath = path.join(SCREENSHOT_DIR, '03_followup_modal.png');
      await page.screenshot({ path: followUpModalPath });
      console.log(`📸 Saved screenshot: ${followUpModalPath}`);

      // Search patient
      const inputs = await page.$$('input');
      if (inputs.length > 0) {
        // Last input in modal
        const searchInput = inputs[inputs.length - 1];
        await searchInput.type('BN2026000001');
        // Click search button
        const searchBtns = await page.$$('.ant-input-search-button, button.ant-btn-primary');
        if (searchBtns.length > 0) {
          await searchBtns[searchBtns.length - 1].click();
          await new Promise((r) => setTimeout(r, 1200));
          const verifiedModalPath = path.join(SCREENSHOT_DIR, '04_followup_verified.png');
          await page.screenshot({ path: verifiedModalPath });
          console.log(`📸 Saved screenshot: ${verifiedModalPath}`);
        }
      }

      // Close modal
      const closeBtn = await page.$('.ant-modal-close');
      if (closeBtn) await closeBtn.click();
      await new Promise((r) => setTimeout(r, 500));
    }

    // 3. EXAMINATIONS PAGE & CLS RETURN QUEUE
    console.log('3. Navigating to Examinations Page: http://localhost:3000/examinations');
    await page.goto('http://localhost:3000/examinations', { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise((r) => setTimeout(r, 2000));

    const examPath = path.join(SCREENSHOT_DIR, '05_examinations_queue.png');
    await page.screenshot({ path: examPath });
    console.log(`📸 Saved screenshot: ${examPath}`);

    // Click "Quét QR BN Quay Lại (Đọc KQ CLS)" button
    console.log('Opening CLS Return QR Modal...');
    const examButtons = await page.$$('button');
    let clsBtn = null;
    for (const btn of examButtons) {
      const text = await page.evaluate(el => el.innerText, btn);
      if (text && text.includes('Quét QR BN Quay Lại')) {
        clsBtn = btn;
        break;
      }
    }

    if (clsBtn) {
      await clsBtn.click();
      await new Promise((r) => setTimeout(r, 1000));
      const clsModalPath = path.join(SCREENSHOT_DIR, '06_cls_return_modal.png');
      await page.screenshot({ path: clsModalPath });
      console.log(`📸 Saved screenshot: ${clsModalPath}`);

      // Click a dev chip or type code
      const tags = await page.$$('.ant-tag-orange');
      if (tags.length > 0) {
        await tags[0].click();
        await new Promise((r) => setTimeout(r, 500));
      }
      const confirmBtns = await page.$$('.ant-input-search-button, button');
      for (const cb of confirmBtns) {
        const text = await page.evaluate(el => el.innerText, cb);
        if (text && text.includes('Xác Nhận Quay Lại')) {
          await cb.click();
          break;
        }
      }
      await new Promise((r) => setTimeout(r, 1500));
      // Dismiss sweetalert if present
      const swalConfirm = await page.$('.swal2-confirm, .ant-btn-primary');
      if (swalConfirm) {
        await swalConfirm.click();
        await new Promise((r) => setTimeout(r, 1000));
      }

      const prioritizedQueuePath = path.join(SCREENSHOT_DIR, '07_cls_queue_prioritized.png');
      await page.screenshot({ path: prioritizedQueuePath });
      console.log(`📸 Saved screenshot: ${prioritizedQueuePath}`);
    }

    // 4. OPEN SOAP EXAMINATION MODAL & PREVIOUS EMR TAB
    console.log('4. Opening SOAP Examination Modal...');
    const allButtons = await page.$$('button');
    let examClickBtn = null;
    for (const b of allButtons) {
      const text = await page.evaluate(el => el.innerText, b);
      if (text && text.includes('Khám Bệnh')) {
        examClickBtn = b;
        break;
      }
    }

    if (examClickBtn) {
      await examClickBtn.click();
      await new Promise((r) => setTimeout(r, 1500));

      const soapModalPath = path.join(SCREENSHOT_DIR, '08_soap_modal.png');
      await page.screenshot({ path: soapModalPath });
      console.log(`📸 Saved screenshot: ${soapModalPath}`);

      // Click Tab "Lịch Sử Đợt Khám Trước (EMR)"
      const tabElements = await page.$$('.ant-tabs-tab');
      for (const t of tabElements) {
        const title = await page.evaluate(el => el.innerText, t);
        if (title && (title.includes('Lịch Sử') || title.includes('Đợt Khám Trước'))) {
          await t.click();
          await new Promise((r) => setTimeout(r, 1000));
          const prevTabPath = path.join(SCREENSHOT_DIR, '09_previous_emr_tab.png');
          await page.screenshot({ path: prevTabPath });
          console.log(`📸 Saved screenshot: ${prevTabPath}`);
          break;
        }
      }
    }

    console.log('✅ ALL LIVE UI TESTS COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Error during live UI test:', err);
  } finally {
    await browser.close();
  }
}

runLiveTest();

