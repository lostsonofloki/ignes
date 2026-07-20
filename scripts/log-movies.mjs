/**
 * One-off production movie logging — not part of CI. Run from project root:
 *   node scripts/log-movies.mjs [baseUrl]
 *
 * Uses TEST_USER_EMAIL / TEST_USER_PASSWORD from .env.
 * Screenshots + report go to test-results/log-movies/ (gitignored).
 */
import { chromium } from '@playwright/test';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const BASE_URL = process.argv[2] || process.env.PLAYWRIGHT_BASE_URL || 'https://filmgraph.app';
const EMAIL = process.env.TEST_USER_EMAIL;
const PASSWORD = process.env.TEST_USER_PASSWORD;
const OUT_DIR = path.resolve(__dirname, '../test-results/log-movies');
const TARGET_COUNT = 4;

/** Distinctive titles unlikely to already be on a casual test account */
const CANDIDATES = [
  {
    query: 'Hundreds of Beavers',
    match: /Hundreds of Beavers/i,
    rating: 4.2,
    moods: ['Hilarious', 'Campy'],
    notes: 'Playwright log: absurdist beaver mayhem.',
  },
  {
    query: 'Evil Does Not Exist',
    match: /Evil Does Not Exist/i,
    rating: 3.8,
    moods: ['Atmospheric', 'Bleak'],
    notes: 'Playwright log: quiet dread in the woods.',
  },
  {
    query: 'Do Not Expect Too Much from the End of the World',
    match: /Do Not Expect Too Much from the End of the World/i,
    rating: 4.0,
    moods: ['Satirical', 'Bleak'],
    notes: 'Playwright log: Romanian road-movie exhaustion.',
  },
  {
    query: 'Petite Maman',
    match: /Petite Maman/i,
    rating: 4.5,
    moods: ['Bittersweet', 'Nostalgic'],
    notes: 'Playwright log: gentle childhood time-slip.',
  },
  {
    query: 'About Dry Grasses',
    match: /About Dry Grasses/i,
    rating: 3.5,
    moods: ['Cerebral', 'Bleak'],
    notes: 'Playwright log: Anatolian winter moral tangle.',
  },
  {
    query: 'The Quiet Girl',
    match: /The Quiet Girl/i,
    rating: 4.7,
    moods: ['Heart-wrenching', 'Feel-good'],
    notes: 'Playwright log: quiet Irish foster-care gem.',
  },
  {
    query: 'Green Border',
    match: /Green Border/i,
    rating: 4.1,
    moods: ['Political', 'Bleak'],
    notes: 'Playwright log: border crisis drama.',
  },
  {
    query: 'EO',
    match: /^EO$/i,
    rating: 3.9,
    moods: ['Profound', 'Bleak'],
    notes: 'Playwright log: donkey odyssey.',
  },
];

function slugify(title) {
  return String(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

async function login(page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.locator('#email, input[type="email"]').first().fill(EMAIL);
  await page.locator('#password, input[type="password"]').first().fill(PASSWORD);
  await page.locator('button[type="submit"], .login-button').first().click();
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 25000 });
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  return !page.url().includes('/login');
}

async function openMovieFromSearch(page, candidate) {
  await page.goto(`${BASE_URL}/search?q=${encodeURIComponent(candidate.query)}`, {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});

  const resultCards = page.locator('.movies-grid .movie-card-wrapper').filter({
    hasNot: page.locator('.person-card-wrapper'),
  });
  await resultCards.first().waitFor({ state: 'visible', timeout: 20000 });

  const count = await resultCards.count();
  let clicked = false;
  for (let i = 0; i < count; i += 1) {
    const card = resultCards.nth(i);
    const titleText = (await card.locator('.movie-card-title, h3').first().innerText().catch(() => '')) || '';
    if (candidate.match.test(titleText.trim())) {
      await card.click();
      clicked = true;
      break;
    }
  }
  if (!clicked) {
    // Fallback: first non-person result
    await resultCards.first().click();
  }

  await page.waitForURL(/\/movie\/\d+/, { timeout: 20000 });
  await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
  await page.locator('.log-movie-btn-primary').waitFor({ state: 'visible', timeout: 20000 });
}

async function isAlreadyLogged(page) {
  const label = (await page.locator('.log-movie-btn-primary span').innerText().catch(() => '')) || '';
  return /edit log/i.test(label);
}

async function fillAndSubmitLog(page, candidate) {
  await page.locator('.log-movie-btn-primary').click();
  const modalHeading = page.getByRole('heading', { name: /log movie|edit movie log/i });
  await modalHeading.waitFor({ state: 'visible', timeout: 15000 });

  // Prefer Watched status
  const watchedBtn = page.getByRole('button', { name: /^Watched$/i });
  if (await watchedBtn.isVisible().catch(() => false)) {
    await watchedBtn.click();
  }

  const slider = page.locator('input.rating-slider');
  await slider.waitFor({ state: 'visible', timeout: 10000 });
  await slider.fill(String(candidate.rating));

  for (const mood of candidate.moods) {
    const moodBtn = page.getByRole('button', { name: new RegExp(mood, 'i') }).first();
    if (await moodBtn.isVisible().catch(() => false)) {
      await moodBtn.click();
    }
  }

  const notes = page.locator('textarea[placeholder*="thoughts" i]');
  if (await notes.isVisible().catch(() => false)) {
    await notes.fill(candidate.notes);
  }

  // Modal submit (page also has a "Log Movie" primary button — scope to submit)
  await page.locator('button[type="submit"]').filter({ hasText: /^Log Movie$/i }).click();

  // Success: toast and/or modal closes and primary button becomes Edit Log
  const toast = page.locator('.toast-success, .toast').filter({ hasText: /logged successfully/i });
  const modalGone = modalHeading.waitFor({ state: 'hidden', timeout: 20000 }).then(() => true).catch(() => false);
  const toastSeen = toast.first().waitFor({ state: 'visible', timeout: 20000 }).then(() => true).catch(() => false);

  const [closed, toasted] = await Promise.all([modalGone, toastSeen]);

  // Surface modal error if still open
  if (!closed) {
    const errText = await page
      .locator('form')
      .locator('div')
      .filter({ hasText: /Anti-Double-Buy|Failed|already exists|must be logged/i })
      .first()
      .innerText()
      .catch(() => '');
    if (errText) {
      throw new Error(errText.slice(0, 240));
    }
  }

  // Confirm persisted UI state
  await page.waitForTimeout(800);
  const editVisible = await isAlreadyLogged(page);
  if (!editVisible && !toasted && !closed) {
    throw new Error('Log submit did not confirm success (no toast / modal / Edit Log)');
  }

  return {
    toasted,
    modalClosed: closed,
    editLogVisible: editVisible,
  };
}

async function main() {
  if (!EMAIL || !PASSWORD) {
    console.error('FAIL: Missing TEST_USER_EMAIL or TEST_USER_PASSWORD in .env');
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const consoleErrors = [];
  const networkErrors = [];

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('response', (res) => {
    const url = res.url();
    if (res.status() >= 400 && (url.includes('supabase') || url.includes('tmdb') || url.includes('filmgraph'))) {
      networkErrors.push({ url: url.slice(0, 180), status: res.status() });
    }
  });

  const result = {
    baseUrl: BASE_URL,
    loginSuccess: false,
    titlesLogged: [],
    attempts: [],
    finalUrl: null,
    consoleErrors: [],
    networkErrors: [],
    screenshots: [],
    error: null,
  };

  try {
    result.loginSuccess = await login(page);
    await page.screenshot({ path: path.join(OUT_DIR, '01-after-login.png'), fullPage: false });
    result.screenshots.push('01-after-login.png');

    if (!result.loginSuccess) {
      throw new Error('Login failed — still on /login');
    }

    let shotIndex = 2;
    for (const candidate of CANDIDATES) {
      if (result.titlesLogged.length >= TARGET_COUNT) break;

      const attempt = {
        query: candidate.query,
        title: null,
        success: false,
        skipped: false,
        reason: null,
        movieUrl: null,
        details: null,
      };

      try {
        await openMovieFromSearch(page, candidate);
        attempt.movieUrl = page.url();
        const pageTitle =
          (await page.locator('h1, .movie-title, .detail-title').first().innerText().catch(() => '')) ||
          candidate.query;
        attempt.title = pageTitle.trim();

        if (await isAlreadyLogged(page)) {
          attempt.skipped = true;
          attempt.reason = 'already logged (Edit Log visible)';
          result.attempts.push(attempt);
          continue;
        }

        const details = await fillAndSubmitLog(page, candidate);
        attempt.details = details;
        attempt.success = true;
        result.titlesLogged.push(attempt.title);

        const shotName = `${String(shotIndex).padStart(2, '0')}-logged-${slugify(attempt.title)}.png`;
        shotIndex += 1;
        await page.screenshot({ path: path.join(OUT_DIR, shotName), fullPage: false });
        result.screenshots.push(shotName);
      } catch (err) {
        attempt.success = false;
        attempt.reason = err.message;
        const errShot = `${String(shotIndex).padStart(2, '0')}-error-${slugify(candidate.query)}.png`;
        shotIndex += 1;
        await page.screenshot({ path: path.join(OUT_DIR, errShot), fullPage: false }).catch(() => {});
        result.screenshots.push(errShot);
      }

      result.attempts.push(attempt);
    }

    await page.goto(`${BASE_URL}/library`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(1500);
    result.finalUrl = page.url();
    await page.screenshot({ path: path.join(OUT_DIR, '99-library-final.png'), fullPage: true });
    result.screenshots.push('99-library-final.png');
  } catch (err) {
    result.error = err.message;
    await page.screenshot({ path: path.join(OUT_DIR, '99-error.png'), fullPage: false }).catch(() => {});
    result.screenshots.push('99-error.png');
    result.finalUrl = page.url();
  } finally {
    result.consoleErrors = [...new Set(consoleErrors)].slice(0, 20);
    result.networkErrors = networkErrors.slice(0, 20);
    await browser.close();
  }

  const reportPath = path.join(OUT_DIR, 'report.json');
  fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));

  const ok = result.loginSuccess && result.titlesLogged.length >= 3;
  process.exit(ok ? 0 : 1);
}

main();
