const assert = require('assert');

const MONTH_MAP = {
  jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
  apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6,
  aug: 7, august: 7, sep: 8, september: 8, oct: 9, october: 9,
  nov: 10, november: 10, dec: 11, december: 11
};

const MONTH_REGEX = '(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember))';

function extractTimestamp(text, now = Date.now()) {
  if (!text) return null;
  const cleanText = text.replace(/\xa0/g, ' ').trim();

  // 1. Natural Language Indicators
  if (/(?:just now|moments ago|たった今)/i.test(cleanText)) {
    return now;
  }
  if (/(?:\btoday\b|今日)/i.test(cleanText)) {
    return now;
  }
  if (/(?:\byesterday\b|昨日)/i.test(cleanText)) {
    return now - (24 * 60 * 60 * 1000);
  }

  // 2. Relative Dates (English + Japanese + Abbreviations)
  const relMatch = cleanText.match(/(\d+)\s*(secs?|seconds?|mins?|minutes?|hrs?|hours?|days?|wks?|weeks?|mos?|months?|yrs?|years?|秒|分|時間|日|週間|ヶ月|か月|カ月|箇月|年)\s*(?:ago|前)/i);
  if (relMatch) {
    const amount = parseInt(relMatch[1], 10);
    const unit = relMatch[2].toLowerCase();
    let multiplier = 0;

    if (/^(secs?|seconds?|秒)$/.test(unit)) multiplier = 1000;
    else if (/^(mins?|minutes?|分)$/.test(unit)) multiplier = 60 * 1000;
    else if (/^(hrs?|hours?|時間)$/.test(unit)) multiplier = 60 * 60 * 1000;
    else if (/^(days?|日)$/.test(unit)) multiplier = 24 * 60 * 60 * 1000;
    else if (/^(wks?|weeks?|週間)$/.test(unit)) multiplier = 7 * 24 * 60 * 60 * 1000;
    else if (/^(mos?|months?|ヶ月|か月|カ月|箇月)$/.test(unit)) multiplier = 30 * 24 * 60 * 60 * 1000;
    else if (/^(yrs?|years?|年)$/.test(unit)) multiplier = 365 * 24 * 60 * 60 * 1000;

    if (multiplier > 0) {
      return now - (amount * multiplier);
    }
  }

  // 3. Live / Streamed / Premiere fallback
  if (/(?:Streamed|Premiered|LIVE|ライブ|プレミア公開)/i.test(cleanText)) {
    return now;
  }

  // 4. Explicit Dates with Month Names
  const engDateWithYear = cleanText.match(new RegExp('(?:(' + MONTH_REGEX + ')\\s+(\\d{1,2}),?\\s+(\\d{4})|(\\d{1,2})\\s+(' + MONTH_REGEX + '),?\\s+(\\d{4}))', 'i'));
  if (engDateWithYear) {
    const monthStr = (engDateWithYear[1] || engDateWithYear[5]).toLowerCase();
    const day = parseInt(engDateWithYear[2] || engDateWithYear[4], 10);
    const year = parseInt(engDateWithYear[3] || engDateWithYear[6], 10);
    const month = MONTH_MAP[monthStr];
    if (month !== undefined && !isNaN(day) && !isNaN(year)) {
      return new Date(year, month, day).getTime();
    }
  }

  // 5. Month + Year
  const monthYearMatch = cleanText.match(new RegExp('\\b(' + MONTH_REGEX + ')\\s+(\\d{4})\\b', 'i'));
  if (monthYearMatch) {
    const monthStr = monthYearMatch[1].toLowerCase();
    const year = parseInt(monthYearMatch[2], 10);
    const month = MONTH_MAP[monthStr];
    if (month !== undefined && !isNaN(year)) {
      return new Date(year, month, 1).getTime();
    }
  }

  // 6. Month + Day without Year
  const engDateNoYear = cleanText.match(new RegExp('(?:\\b(' + MONTH_REGEX + ')\\s+(\\d{1,2})\\b|\\b(\\d{1,2})\\s+(' + MONTH_REGEX + ')\\b)', 'i'));
  if (engDateNoYear) {
    const monthStr = (engDateNoYear[1] || engDateNoYear[4]).toLowerCase();
    const day = parseInt(engDateNoYear[2] || engDateNoYear[3], 10);
    const month = MONTH_MAP[monthStr];
    if (month !== undefined && !isNaN(day)) {
      const currentYear = new Date(now).getFullYear();
      return new Date(currentYear, month, day).getTime();
    }
  }

  // 7. Japanese Explicit Dates
  const jpMatch = cleanText.match(/(?:(\d{4})年\s*)?(\d{1,2})月\s*(\d{1,2})日/);
  if (jpMatch) {
    const year = jpMatch[1] ? parseInt(jpMatch[1], 10) : new Date(now).getFullYear();
    const month = parseInt(jpMatch[2], 10) - 1;
    const day = parseInt(jpMatch[3], 10);
    return new Date(year, month, day).getTime();
  }

  // 8. Numeric Dates (YYYY-MM-DD)
  const numMatchYMD = cleanText.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (numMatchYMD) {
    const year = parseInt(numMatchYMD[1], 10);
    const month = parseInt(numMatchYMD[2], 10) - 1;
    const day = parseInt(numMatchYMD[3], 10);
    return new Date(year, month, day).getTime();
  }

  // 9. Numeric Dates (DD/MM/YYYY)
  const numMatchDMY = cleanText.match(/(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (numMatchDMY) {
    const p1 = parseInt(numMatchDMY[1], 10);
    const p2 = parseInt(numMatchDMY[2], 10);
    const year = parseInt(numMatchDMY[3], 10);
    const month = (p1 > 12 ? p2 : p1) - 1;
    const day = p1 > 12 ? p1 : p2;
    return new Date(year, month, day).getTime();
  }

  // 10. Standalone 4-digit Year
  const yearMatch = cleanText.match(/\b(19\d{2}|20[0-2]\d|203\d)\b/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1], 10);
    return new Date(year, 0, 1).getTime();
  }

  return null;
}

function shouldHide(text, { filterMode = 'future', cutoffDate = '2020-01-01', now = Date.now() } = {}) {
  const ts = extractTimestamp(text, now);
  if (ts === null || isNaN(ts)) return false;
  const cutoffTimestamp = new Date(cutoffDate + "T00:00:00").getTime();
  return filterMode === 'future' ? ts >= cutoffTimestamp : ts < cutoffTimestamp;
}

// Test Runner
const FIXED_NOW = new Date('2026-08-25T12:00:00Z').getTime();
let passed = 0;
let failed = 0;

function test(description, fn) {
  try {
    fn();
    console.log(`  ✓ ${description}`);
    passed++;
  } catch (e) {
    console.error(`  ✗ ${description}`);
    console.error(`    ${e.message}`);
    failed++;
  }
}

console.log('\n--- Running Date Parser Test Suite ---');

test('Parses English relative date abbreviations (hrs, mins, wks, mos, yrs)', () => {
  const ts2hrs = extractTimestamp('2 hrs ago', FIXED_NOW);
  assert.strictEqual(ts2hrs, FIXED_NOW - 2 * 60 * 60 * 1000);

  const ts45mins = extractTimestamp('45 mins ago', FIXED_NOW);
  assert.strictEqual(ts45mins, FIXED_NOW - 45 * 60 * 1000);

  const ts3wks = extractTimestamp('3 wks ago', FIXED_NOW);
  assert.strictEqual(ts3wks, FIXED_NOW - 3 * 7 * 24 * 60 * 60 * 1000);

  const ts1mo = extractTimestamp('1 mo ago', FIXED_NOW);
  assert.strictEqual(ts1mo, FIXED_NOW - 30 * 24 * 60 * 60 * 1000);

  const ts2yrs = extractTimestamp('2 yrs ago', FIXED_NOW);
  assert.strictEqual(ts2yrs, FIXED_NOW - 2 * 365 * 24 * 60 * 60 * 1000);
});

test('Parses Natural Language dates (Yesterday, Today, Just now)', () => {
  const tsYesterday = extractTimestamp('Yesterday', FIXED_NOW);
  assert.strictEqual(tsYesterday, FIXED_NOW - 24 * 60 * 60 * 1000);

  const tsToday = extractTimestamp('Today', FIXED_NOW);
  assert.strictEqual(tsToday, FIXED_NOW);

  const tsJustNow = extractTimestamp('just now', FIXED_NOW);
  assert.strictEqual(tsJustNow, FIXED_NOW);
});

test('Correctly ignores false word matches (Release 3, 2024) and finds real date', () => {
  const ts = extractTimestamp('Release 3, 2024 - Official update published Jan 15, 2024', FIXED_NOW);
  assert.strictEqual(ts, new Date(2024, 0, 15).getTime());
});

test('Parses Month + Year (Nov 2022)', () => {
  const ts = extractTimestamp('Nov 2022 — An introduction to machine learning.', FIXED_NOW);
  assert.strictEqual(ts, new Date(2022, 10, 1).getTime());
});

test('Parses isolated 4-digit years in titles/snippets', () => {
  const ts2024 = extractTimestamp('Learn Python in 2024 - Complete Guide', FIXED_NOW);
  assert.strictEqual(ts2024, new Date(2024, 0, 1).getTime());

  const ts2018 = extractTimestamp('Learn Python in 2018 - Complete Guide', FIXED_NOW);
  assert.strictEqual(ts2018, new Date(2018, 0, 1).getTime());
});

test('Parses Japanese relative and explicit dates', () => {
  const tsJpRel = extractTimestamp('3日前', FIXED_NOW);
  assert.strictEqual(tsJpRel, FIXED_NOW - 3 * 24 * 60 * 60 * 1000);

  const tsJpExplicit = extractTimestamp('2021年5月10日', FIXED_NOW);
  assert.strictEqual(tsJpExplicit, new Date(2021, 4, 10).getTime());
});

test('Filter Future mode hides items newer than cutoff date (2020-01-01)', () => {
  assert.strictEqual(shouldHide('Jan 15, 2022', { filterMode: 'future', cutoffDate: '2020-01-01', now: FIXED_NOW }), true);
  assert.strictEqual(shouldHide('2 hrs ago', { filterMode: 'future', cutoffDate: '2020-01-01', now: FIXED_NOW }), true);
  assert.strictEqual(shouldHide('Nov 2022', { filterMode: 'future', cutoffDate: '2020-01-01', now: FIXED_NOW }), true);
  assert.strictEqual(shouldHide('2024 edition', { filterMode: 'future', cutoffDate: '2020-01-01', now: FIXED_NOW }), true);
  assert.strictEqual(shouldHide('Oct 15, 2018', { filterMode: 'future', cutoffDate: '2020-01-01', now: FIXED_NOW }), false);
  assert.strictEqual(shouldHide('2018 guide', { filterMode: 'future', cutoffDate: '2020-01-01', now: FIXED_NOW }), false);
});

test('Filter Past mode hides items older than cutoff date (2020-01-01)', () => {
  assert.strictEqual(shouldHide('Oct 15, 2018', { filterMode: 'past', cutoffDate: '2020-01-01', now: FIXED_NOW }), true);
  assert.strictEqual(shouldHide('2018 guide', { filterMode: 'past', cutoffDate: '2020-01-01', now: FIXED_NOW }), true);
  assert.strictEqual(shouldHide('Jan 15, 2022', { filterMode: 'past', cutoffDate: '2020-01-01', now: FIXED_NOW }), false);
  assert.strictEqual(shouldHide('2024 edition', { filterMode: 'past', cutoffDate: '2020-01-01', now: FIXED_NOW }), false);
});

console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
