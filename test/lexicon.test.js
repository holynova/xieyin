const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const minePuns = require('../src/miner');
const buildHtml = require('../src/builder');
const { loadModernLexicon } = minePuns;

const BAD_WORDS = ['脂习', '封谞', '姬奭', '死股', '豫尔', '粿汁', '计网', '视向'];
const EXPECTED_WORDS = ['知道', '可以', '同事', '实习', '鼓舞', '晴天', '摸鱼', '内卷'];
const LEGACY_BRAND = ['Codex', 'Resets'].join(' ');
const LEGACY_HOST = ['codex', 'resets.com'].join('-');

test('modern lexicon is structured, scored, and excludes known pollution', () => {
  const { payload, metadataByWord, words } = loadModernLexicon();

  assert.equal(payload.schema_version, 1);
  assert.equal(payload.record_count, words.length);
  assert.ok(words.length > 1000 && words.length < 20000);

  for (const word of BAD_WORDS) {
    assert.equal(metadataByWord.has(word), false, `${word} should stay excluded`);
  }
  for (const word of EXPECTED_WORDS) {
    assert.equal(metadataByWord.has(word), true, `${word} should remain available`);
    const item = metadataByWord.get(word);
    assert.ok(Number.isFinite(item.modern_score));
    assert.ok(item.source);
  }
});

test('mined results keep provenance and default UI favors same-tone matches', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xieyin-test-'));
  const jsonPath = path.join(tempDir, 'results.json');
  const htmlPath = path.join(tempDir, 'index.html');

  try {
    minePuns(jsonPath);
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    const rows = Object.values(data).flat();
    const sameToneRows = rows.filter(item => item.is_same_tone);

    assert.ok(rows.length > 100 && rows.length < 1000);
    assert.ok(sameToneRows.length > 20 && sameToneRows.length < rows.length);
    assert.ok(sameToneRows.some(item => item.replaced_word === '知道'));
    assert.ok(sameToneRows.some(item => item.replaced_word === '可以'));
    assert.equal(rows.some(item => BAD_WORDS.includes(item.replaced_word)), false);

    for (const item of rows) {
      assert.ok(item.source);
      assert.ok(Number.isFinite(item.modern_score));
      assert.ok(Number.isFinite(item.quality_score));
    }

    buildHtml(jsonPath, htmlPath, false);
    const html = fs.readFileSync(htmlPath, 'utf-8');
    assert.match(html, /let toneMode = 'same'/);
    assert.match(html, /同音同调 \(\d+\)/);
    assert.match(html, /扩展匹配 \(\d+\)/);
    assert.match(html, /来源：/);
    assert.match(html, /<title>古籍谐音梗追踪器<\/title>/);
    assert.match(html, /<h1 class="masthead-title">古籍谐音梗追踪器<\/h1>/);
    assert.equal(html.includes(LEGACY_BRAND), false);
    assert.equal(html.includes(LEGACY_HOST), false);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
