const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const HomophonicEngine = require('../src/engine');
const minePuns = require('../src/miner');
const buildHtml = require('../src/builder');
const { matchesSearchRecord } = buildHtml;
const prepareData = require('../src/prepareData');
const { loadModernLexicon, loadAllCorpus, loadPinyinOverrides } = minePuns;

const BAD_WORDS = ['脂习', '封谞', '姬奭', '死股', '豫尔', '粿汁', '计网', '视向'];
const EXPECTED_WORDS = ['知道', '可以', '同事', '实习', '鼓舞', '晴天', '摸鱼', '内卷'];
const EXPECTED_IDIOMS = ['坚定不移', '全力以赴', '实事求是', '不可思议', '理所当然', '迫不及待', '不知不觉', '叹为观止'];
const LEGACY_BRAND = ['Codex', 'Resets'].join(' ');
const LEGACY_HOST = ['codex', 'resets.com'].join('-');

test('modern lexicon is structured, scored, and excludes known pollution', () => {
  const { payload, metadataByWord, words } = loadModernLexicon();
  assert.equal(payload.schema_version, 1);
  assert.equal(payload.record_count, words.length);
  assert.ok(words.length > 1000 && words.length < 20000);
  for (const word of BAD_WORDS) assert.equal(metadataByWord.has(word), false);
  for (const word of EXPECTED_WORDS) {
    assert.equal(metadataByWord.has(word), true, `${word} should remain available`);
    assert.ok(Number.isFinite(metadataByWord.get(word).modern_score));
  }
  for (const word of EXPECTED_IDIOMS) {
    const item = metadataByWord.get(word);
    assert.ok(item, `${word} should be included as a common idiom`);
    assert.equal(item.category, '常用成语');
    assert.match(item.source, /^THUOCL高频成语/);
    assert.ok(item.modern_score >= 84);
    assert.ok(Number.isInteger(item.idiom_rank));
    assert.ok(Number.isInteger(item.idiom_frequency));
  }
  assert.equal(payload.criteria.common_idioms.selected, 500);
  assert.equal(payload.words.filter(item => item.category === '常用成语').length, 500);
});

test('curated textbook corpus and restored legacy classics load together', () => {
  const summary = prepareData();
  const records = loadAllCorpus();
  const legacyRecords = records.filter(row => row.id.startsWith('legacy-'));
  assert.ok(summary.tierACount >= 280 && summary.tierACount <= 360);
  assert.ok(summary.tierBCount >= 90 && summary.tierBCount < 150);
  assert.equal(legacyRecords.length, 87);
  assert.deepEqual(new Set(legacyRecords.map(row => row.work_title)), new Set([
    '历代名篇辞赋', '道德经八十一章全本', '论语全篇精选',
    '诗经全集名篇', '宋词名篇全本', '唐诗名篇全本'
  ]));
  assert.equal(records.some(row => row.work_title === '三字经·人之初'), true);
  assert.deepEqual(new Set(records.filter(row => row.familiarity_tier === 'A').map(row => row.school_stage)), new Set(['小学', '初中', '高中']));
  for (const record of records) {
    assert.ok(record.id);
    assert.ok(record.work_title);
    assert.ok(record.author);
    assert.ok(record.grade);
    assert.ok(record.passage);
    assert.ok(Number.isFinite(record.familiarity_score));
    assert.match(record.text_source_url, /^https:\/\//);
    if (record.familiarity_tier === 'A') assert.ok(record.curriculum_sources.length > 0);
  }
});

test('engine respects punctuation and resolves polyphones from full context', () => {
  const overrides = loadPinyinOverrides();
  const engine = new HomophonicEngine(['天下', '环来'], { pinyinOverrides: overrides });
  assert.equal(engine.findPuns('天，下。').some(row => row.replaced_word === '天下'), false);
  assert.equal(engine.findPuns('天：下。').some(row => row.replaced_word === '天下'), false);
  assert.deepEqual(engine._splitIntoSubsentences('归来兮去').map(row => row.subText), ['归来兮去']);
  const contextual = engine.findPuns('待到重阳日，还来就菊花。');
  assert.ok(contextual.some(row => row.original_text === '还来' && row.replaced_word === '环来'));
  assert.equal(contextual.find(row => row.replaced_word === '环来').pinyin_orig, 'huán lái');
});

test('search only matches structured fields, not unrelated words in the full sentence', () => {
  const xiangshuiResult = {
    pun: '汉文有道恩犹薄，【香水】无情吊岂知？',
    orig: '汉文有道恩犹薄，湘水无情吊岂知？',
    kw: '香水',
    oText: '湘水',
    work: '长沙过贾谊宅',
    author: '刘长卿',
    stage: '初中',
    grade: '九年级上册',
    semester: '上'
  };

  assert.equal(matchesSearchRecord(xiangshuiResult, '无情'), false);
  assert.equal(matchesSearchRecord(xiangshuiResult, '香水'), true);
  assert.equal(matchesSearchRecord(xiangshuiResult, '湘水'), true);
  assert.equal(matchesSearchRecord(xiangshuiResult, '长沙过贾谊宅'), true);
});

test('mined output merges textbook and restored classics by default', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xieyin-test-'));
  const jsonPath = path.join(tempDir, 'results.json');
  const htmlPath = path.join(tempDir, 'index.html');
  try {
    minePuns(jsonPath);
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const rows = data.results;
    const sameToneRows = rows.filter(item => item.is_same_tone);
    assert.equal(data.schema_version, 2);
    assert.ok(data.corpus_summary.tier_a_works >= 280);
    assert.ok(rows.length > 1000 && rows.length < 3000);
    assert.ok(sameToneRows.length > 500 && sameToneRows.length < rows.length);
    assert.ok(sameToneRows.some(item => item.replaced_word === '知道'));
    assert.ok(sameToneRows.some(item => item.replaced_word === '可以'));
    const restoredRows = rows.filter(item => item.corpus_id.startsWith('legacy-'));
    assert.equal(new Set(restoredRows.map(item => item.work_title)).size, 6);
    assert.ok(restoredRows.length >= 100);
    assert.ok(new Set(restoredRows.map(item => item.replaced_word)).size >= 80);
    assert.equal(rows.some(item => BAD_WORDS.includes(item.replaced_word)), false);
    assert.equal(rows.some(item => item.manual_review === 'fail'), false);
    for (const item of rows) {
      assert.ok(item.result_id);
      assert.ok(item.work_title);
      assert.ok(item.author);
      assert.ok(item.school_stage);
      assert.ok(item.grade);
      assert.ok(['A', 'B'].includes(item.familiarity_tier));
      assert.ok(Number.isFinite(item.modern_score));
      assert.ok(Number.isFinite(item.quality_score));
    }

    buildHtml(jsonPath, htmlPath, false);
    const html = fs.readFileSync(htmlPath, 'utf8');
    assert.match(html, /let toneMode = 'same'/);
    assert.match(html, /let activeScope = 'ALL'/);
    assert.match(html, /匹配方式/);
    assert.match(html, /data-tone-count="same"/);
    assert.match(html, /data-tone-count="all"/);
    assert.match(html, /内容范围/);
    assert.match(html, /data-scope-count="B"/);
    assert.match(html, /updateFilterCounts\(\)/);
    assert.match(html, /toLocaleString\('zh-CN'\) \+ '条'/);
    assert.match(html, /数字为匹配结果条数，“全部”已合并重复内容。/);
    assert.equal(html.includes('匹配精度'), false);
    assert.equal(html.includes('全部经典 ('), false);
    assert.match(html, /data-scope="小学"/);
    assert.match(html, /data-scope="初中"/);
    assert.match(html, /data-scope="高中"/);
    assert.match(html, /e\.target\.closest\('\.pill-btn'\)/);
    assert.match(html, /人工抽查通过率/);
    assert.match(html, /79%/);
    assert.match(html, /现代词来源：/);
    assert.match(html, /new Intl\.Collator\('zh-CN-u-co-pinyin'\)/);
    assert.match(html, /PINYIN_COLLATOR\.compare\(a, b\)/);
    assert.match(html, /生成分享卡/);
    assert.match(html, /1080 × 1440 PNG/);
    assert.match(html, /holynova\.github\.io\/xieyin\//);
    assert.match(html, /QR_CODE_DATA_URL = "data:image\/svg\+xml;base64,/);
    assert.match(html, /canvas\.toDataURL\('image\/png'\)/);
    assert.match(html, /原来的词/);
    assert.match(html, /现代词/);
    assert.equal(html.includes('古籍原句'), false);
    assert.equal(html.includes('原切片  '), false);
    assert.equal(/fillText\(item\.py[OT]/.test(html), false);
    assert.match(html, /token\.highlight \? 52 : 0/);
    assert.match(html, /const boxX = x \+ 14/);
    assert.match(html, /const boxWidth = token\.textWidth \+ 24/);
    assert.match(html, /<title>古籍谐音梗追踪器<\/title>/);
    assert.equal(html.includes(LEGACY_BRAND), false);
    assert.equal(html.includes(LEGACY_HOST), false);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
