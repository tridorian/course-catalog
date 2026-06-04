import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

async function run() {
  console.log('=== STARTING SCREENSHOT GENERATION ===');

  // 1. Create screenshots directory
  const screenshotDir = path.join(process.cwd(), 'public/assets/screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
    console.log('Created directory:', screenshotDir);
  }

  // 2. Spawn Vite dev server
  console.log('Launching Vite dev server...');
  const devServer = spawn('npx', ['vite', '--port', '5173'], {
    stdio: 'inherit',
    shell: true
  });

  // Give the server 4 seconds to start up
  await new Promise(resolve => setTimeout(resolve, 4000));

  let browser;
  let page;
  try {
    console.log('Launching Headless Chrome...');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    page = await browser.newPage();
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', err => console.error('BROWSER ERROR:', err.message || err));
    // Use high resolution for clean, crisp screenshots
    await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 });

    // Scenario 1: Dashboard Disconnected (Clear Storage, show banner)
    console.log('Scenario 1: Dashboard Disconnected...');
    await page.goto('http://localhost:5173/');
    await page.evaluate(() => {
      window.sessionStorage.clear();
      window.localStorage.clear();
    });
    // Reload to apply cleared state
    await page.goto('http://localhost:5173/');
    await page.waitForSelector('h1');
    await new Promise(resolve => setTimeout(resolve, 1500)); // wait for transitions
    await page.screenshot({ path: path.join(screenshotDir, 'dashboard-disconnected.png') });
    console.log('Saved dashboard-disconnected.png');

    // Scenario 2: Dashboard Connected (Mock Token & localStorage progress)
    console.log('Scenario 2: Dashboard Connected...');
    await page.goto('http://localhost:5173/?mockToken=valid-token');
    await page.evaluate(() => {
      window.sessionStorage.setItem('mockToken', 'valid-token');
      // Set some mock progress
      window.localStorage.setItem('agy_local_progress', JSON.stringify({
        'agentic-engineering_agy-101': {
          completedIndices: ['0', '1'],
          activeModuleId: '3',
          lastUpdated: new Date().toISOString()
        }
      }));
    });
    await page.goto('http://localhost:5173/');
    await page.waitForSelector('h1');
    await new Promise(resolve => setTimeout(resolve, 1500));
    await page.screenshot({ path: path.join(screenshotDir, 'dashboard-connected.png') });
    console.log('Saved dashboard-connected.png');

    // Scenario 3: Course Map
    console.log('Scenario 3: Course Map...');
    await page.goto('http://localhost:5173/#/agentic-engineering/agy-101');
    await page.waitForSelector('h1');
    await new Promise(resolve => setTimeout(resolve, 1500));
    await page.screenshot({ path: path.join(screenshotDir, 'course-map.png') });
    console.log('Saved course-map.png');

    // Scenario 4: Module View
    console.log('Scenario 4: Module View...');
    await page.goto('http://localhost:5173/#/agentic-engineering/agy-101/1');
    await page.waitForSelector('main');
    await new Promise(resolve => setTimeout(resolve, 1500));
    await page.screenshot({ path: path.join(screenshotDir, 'module-view.png') });
    console.log('Saved module-view.png');

    // Scenario 5: Reset Modal
    console.log('Scenario 5: Reset Modal...');
    await page.goto('http://localhost:5173/#/agentic-engineering/agy-101/1');
    await page.waitForSelector('button');
    await page.evaluate(() => {
      // Find the button and trigger click
      const buttons = Array.from(document.querySelectorAll('button'));
      const resetBtn = buttons.find(b => b.textContent.toLowerCase().includes('reset progress'));
      if (resetBtn) resetBtn.click();
    });
    await new Promise(resolve => setTimeout(resolve, 1000)); // wait for modal fade in
    await page.screenshot({ path: path.join(screenshotDir, 'reset-modal.png') });
    console.log('Saved reset-modal.png');

  } catch (error) {
    console.error('An error occurred during screenshot generation:', error);
    if (page) {
      try {
        await page.screenshot({ path: path.join(screenshotDir, 'debug-error.png') });
        console.log('Saved debug-error.png');
      } catch (err) {
        console.error('Failed to save debug-error.png:', err);
      }
    }
  } finally {
    if (browser) {
      await browser.close();
    }
    console.log('Shutting down dev server...');
    devServer.kill('SIGINT');
    console.log('=== SCREENSHOT GENERATION FINISHED ===');
  }
}

run();
