const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const executablePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const baseUrl = process.env.PROTOTYPE_URL || "http://127.0.0.1:5175/light-pos-cashier-demo/";
const outDir = path.resolve(__dirname, "../screenshots");

fs.mkdirSync(path.join(outDir, "pc"), { recursive: true });
fs.mkdirSync(path.join(outDir, "h5"), { recursive: true });

async function settle(page, extra = 350) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.evaluate(() => document.fonts && document.fonts.ready).catch(() => {});
  await page.waitForTimeout(extra);
}

async function capture(page, group, name) {
  await settle(page);
  await page.screenshot({
    path: path.join(outDir, group, `${name}.png`),
    fullPage: false,
  });
}

async function clickText(page, text) {
  await page.locator("button", { hasText: text }).first().click();
}

async function setupPc(page, caseKey = "payment-200") {
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.locator('[data-testid="scenario-payment"]').click();
  if (caseKey) {
    await page.locator(`[data-testid="${caseKey}"]`).click();
  }
  await page.locator('[data-testid="simulate-submit"]').click();
  await page.waitForSelector('[data-testid="primary-action"]');
  await settle(page);
}

async function setupPcPending(page, caseKey = "payment-0") {
  await setupPc(page, caseKey);
  await page.locator('[data-testid="transfer-option"]').click();
  await page.locator('[data-testid="primary-action"]').click();
  await page.waitForSelector("text=复制到企业网银转账");
  await page.locator('[data-testid="weiqifu-finance"]').click();
  await page.waitForSelector('[data-testid="pending-transfer-panel"]');
  await settle(page, 950);
}

async function setupMobile(page, caseLabel = "￥200.00") {
  await page.goto(`${baseUrl}?demo=mobile`, { waitUntil: "networkidle" });
  await page.locator(".mobile-sim-options button", { hasText: "企业付款" }).click();
  if (caseLabel) {
    await page.locator(".mobile-sim-cases button", { hasText: caseLabel }).click();
  }
  await page.locator(".mobile-primary-button", { hasText: "模拟下单" }).click();
  await page.waitForSelector("text=企业钱包账户");
  await settle(page);
}

async function setupMobilePending(page, caseLabel = "￥0.00") {
  await setupMobile(page, caseLabel);
  await page.locator(".mobile-section", { hasText: "银行转账" }).locator("button", { hasText: "腾讯微企付" }).click();
  await page.locator(".mobile-primary-button", { hasText: "去支付" }).click();
  await page.waitForSelector("text=复制到企业网银转账");
  await page.locator(".mobile-wqf-demo button", { hasText: "找财务转账" }).click();
  await page.waitForSelector("text=银行转账处理中");
  await settle(page, 800);
}

async function capturePc(browser) {
  const page = await browser.newPage({ viewport: { width: 1365, height: 900 }, deviceScaleFactor: 1 });

  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await capture(page, "pc", "01-order-simulator");

  await setupPc(page, "payment-200");
  await capture(page, "pc", "02-cashier-idle");

  await page.locator('[data-testid="wallet-option"]').click();
  await capture(page, "pc", "03-wallet-insufficient-selected");

  await page.locator('[data-testid="online-wechat"]').click();
  await capture(page, "pc", "04-wallet-online-combo");

  await setupPc(page, "payment-4000");
  await page.locator('[data-testid="wallet-option"]').click();
  await capture(page, "pc", "05-wallet-full-selected");

  await setupPc(page, "payment-0");
  await page.locator('[data-testid="transfer-option"]').click();
  await capture(page, "pc", "06-transfer-selected");

  await setupPc(page, "payment-200");
  await page.locator('[data-testid="wallet-option"]').click();
  await page.locator('[data-testid="transfer-option"]').click();
  await page.waitForSelector("text=切换支付方式？");
  await capture(page, "pc", "07-wallet-transfer-switch-dialog");

  await setupPc(page, "payment-0");
  await page.locator('[data-testid="transfer-option"]').click();
  await page.locator('[data-testid="primary-action"]').click();
  await page.waitForSelector("text=复制到企业网银转账");
  await capture(page, "pc", "08-weiqifu-page");

  await page.locator('[data-testid="weiqifu-finance"]').click();
  await page.waitForSelector('[data-testid="pending-transfer-panel"]');
  await settle(page, 950);
  await capture(page, "pc", "09-transfer-pending");

  await page.locator("button", { hasText: "已转账" }).click();
  await page.waitForSelector("text=暂未查询到到账结果");
  await capture(page, "pc", "10-query-result-dialog");

  await setupPcPending(page, "payment-0");
  await page.locator('[data-testid="cancel-transfer"]').click();
  await page.waitForSelector("text=取消本次银行转账？");
  await capture(page, "pc", "11-cancel-transfer-dialog");

  await setupPc(page, "payment-4000");
  await page.locator('[data-testid="wallet-option"]').click();
  await page.locator('[data-testid="primary-action"]').click();
  await page.waitForSelector("text=支付成功");
  await settle(page, 950);
  await capture(page, "pc", "12-merchant-result");

  await page.close();
}

async function captureMobile(browser) {
  const page = await browser.newPage({ viewport: { width: 700, height: 980 }, deviceScaleFactor: 1 });

  await page.goto(`${baseUrl}?demo=mobile`, { waitUntil: "networkidle" });
  await capture(page, "h5", "01-order-simulator");

  await setupMobile(page, "￥200.00");
  await capture(page, "h5", "02-cashier-idle");

  await page.locator(".mobile-wallet-section button", { hasText: "企业钱包账户" }).click();
  await capture(page, "h5", "03-wallet-insufficient-selected");

  await page.locator(".mobile-section", { hasText: "在线支付" }).locator("button", { hasText: "微信支付" }).click();
  await capture(page, "h5", "04-wallet-online-combo");

  await setupMobile(page, "￥4,000.00");
  await page.locator(".mobile-wallet-section button", { hasText: "企业钱包账户" }).click();
  await capture(page, "h5", "05-wallet-full-selected");

  await setupMobile(page, "￥0.00");
  await page.locator(".mobile-section", { hasText: "银行转账" }).locator("button", { hasText: "腾讯微企付" }).click();
  await capture(page, "h5", "06-transfer-selected");

  await setupMobile(page, "￥200.00");
  await page.locator(".mobile-wallet-section button", { hasText: "企业钱包账户" }).click();
  await page.locator(".mobile-section", { hasText: "银行转账" }).locator("button", { hasText: "腾讯微企付" }).click();
  await page.waitForSelector("text=切换支付方式？");
  await capture(page, "h5", "07-wallet-transfer-switch-dialog");

  await setupMobile(page, "￥0.00");
  await page.locator(".mobile-section", { hasText: "银行转账" }).locator("button", { hasText: "腾讯微企付" }).click();
  await page.locator(".mobile-primary-button", { hasText: "去支付" }).click();
  await page.waitForSelector("text=复制到企业网银转账");
  await capture(page, "h5", "08-weiqifu-page");

  await page.locator(".mobile-wqf-demo button", { hasText: "找财务转账" }).click();
  await page.waitForSelector("text=银行转账处理中");
  await settle(page, 800);
  await capture(page, "h5", "09-transfer-pending");

  await page.locator(".mobile-pending-actions button", { hasText: "已转账" }).click();
  await page.waitForSelector("text=暂未查询到到账结果");
  await capture(page, "h5", "10-query-result-dialog");

  await setupMobilePending(page, "￥0.00");
  await page.locator(".mobile-pending-actions button", { hasText: "取消" }).click();
  await page.waitForSelector("text=取消本次银行转账？");
  await capture(page, "h5", "11-cancel-transfer-dialog");

  await setupMobile(page, "￥4,000.00");
  await page.locator(".mobile-wallet-section button", { hasText: "企业钱包账户" }).click();
  await page.locator(".mobile-primary-button", { hasText: "去支付" }).click();
  await page.waitForSelector("text=支付成功");
  await settle(page, 800);
  await capture(page, "h5", "12-merchant-result");

  await page.close();
}

(async () => {
  const browser = await chromium.launch({ executablePath, headless: true });
  try {
    await capturePc(browser);
    await captureMobile(browser);
  } finally {
    await browser.close();
  }
  console.log(`screenshots written to ${outDir}`);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
