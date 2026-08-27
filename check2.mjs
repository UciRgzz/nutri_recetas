import { chromium } from 'playwright';

const browser = await chromium.launch({ executablePath: 'C:\\Users\\ucima\\AppData\\Local\\ms-playwright\\chromium-1223\\chrome-win64\\chrome.exe' });
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 800 });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2000);


// Step 1 - fill patient form
await page.fill('input[placeholder*="Nombre"]', 'María López');
const numInputs = await page.$$('input[type="number"]');
await numInputs[0].fill('35'); // edad
await numInputs[1].fill('65'); // peso actual
await numInputs[2].fill('58'); // peso ideal
await numInputs[3].fill('160'); // talla
await page.waitForTimeout(500);
await page.click('button:has-text("Continuar")');
await page.waitForTimeout(1000);

// Step 2 - calorie method (select Harris-Benedict, leave defaults)
// Select actividad 30%
await page.selectOption('select', { index: 3 }); // 30 ligero
await page.waitForTimeout(500);
await page.click('button:has-text("Continuar")');
await page.waitForTimeout(1000);

// Step 3 - macros (defaults 60/15/25 sum to 100, just continue)
await page.click('button:has-text("Continuar")');
await page.waitForTimeout(1000);

// Step 4 - food equivalents: enter some values
const eqInputs = await page.$$('input[type="number"][placeholder="0"]');
// Set fruta=3, verdura=4, cereales=5, leguminosas=1, OA bajo=3, leche=1, grasa=2
if (eqInputs[0]) await eqInputs[0].fill('4');  // Verdura
if (eqInputs[1]) await eqInputs[1].fill('3');  // Fruta
if (eqInputs[2]) await eqInputs[2].fill('5');  // Cereales y tubérculos
if (eqInputs[4]) await eqInputs[4].fill('1');  // Leguminosas
if (eqInputs[6]) await eqInputs[6].fill('3');  // OA bajo en grasa
if (eqInputs[9]) await eqInputs[9].fill('1');  // Leche descremada
if (eqInputs[12]) await eqInputs[12].fill('2'); // Grasa sin proteína
await page.waitForTimeout(500);

// Click Generar dieta
await page.click('button:has-text("Generar dieta")');
await page.waitForTimeout(2000);

await page.screenshot({ path: 'C:/Users/ucima/AppData/Local/Temp/nutri-diet.png', fullPage: false });
console.log('ERRORS:', JSON.stringify(errors));
await browser.close();
