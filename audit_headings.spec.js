import { test, expect } from '@playwright/test';

test('Audit headings', async ({ page }) => {
  await page.goto('http://localhost:5173/#/');
  await page.waitForSelector('h1');

  console.log('--- Dashboard ---');
  const headings = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => ({
      tag: h.tagName.toLowerCase(),
      text: h.innerText.trim()
    }));
  });
  console.log(JSON.stringify(headings, null, 2));

  // Navigate to a track (Agentic Engineering)
  await page.click('aria-label=View courses in Agentic Engineering track');
  await page.waitForSelector('h1');

  console.log('--- Track Page ---');
  const trackHeadings = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => ({
      tag: h.tagName.toLowerCase(),
      text: h.innerText.trim()
    }));
  });
  console.log(JSON.stringify(trackHeadings, null, 2));

  // Navigate to a course (agv-101)
  await page.click('aria-label=Start course: Secure Agentic Development: Installation & Setup');
  await page.waitForSelector('h1, h2');

  console.log('--- Course Page ---');
  const courseHeadings = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => ({
      tag: h.tagName.toLowerCase(),
      text: h.innerText.trim()
    }));
  });
  console.log(JSON.stringify(courseHeadings, null, 2));
});
