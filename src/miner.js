/**
 * Textbook-classic homophone miner.
 *
 * The output is ranked by result quality and source familiarity. Candidate
 * volume is deliberately capped per work so long prose cannot swamp familiar
 * short poems.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const HomophonicEngine = require('./engine');
const { loadAllCorpusCollections } = require('./corpus');

const DEFAULT_LEXICON_PATH = path.join(process.cwd(), 'data', 'dictionaries', 'modern_lexicon.json');
const DEFAULT_CORPUS_DIR = path.join(process.cwd(), 'data', 'corpus');
const REGRESSION_BAD_WORDS = new Set(['脂习', '封谞', '姬奭', '死股', '豫尔', '粿汁', '计网', '视向']);
const UNSUITABLE_SHARE_WORDS = new Set(['白痴', '贱人', '性交', '做爱', '蛋蛋']);

function loadModernLexicon(lexiconPath = DEFAULT_LEXICON_PATH) {
  if (!fs.existsSync(lexiconPath)) {
    throw new Error(`现代词库不存在：${lexiconPath}。请先运行 scripts/build_modern_lexicon.py`);
  }
  const payload = JSON.parse(fs.readFileSync(lexiconPath, 'utf8'));
  if (payload.schema_version !== 1 || !Array.isArray(payload.words)) {
    throw new Error(`现代词库格式无效：${lexiconPath}`);
  }
  const metadataByWord = new Map();
  for (const item of payload.words) {
    if (!item || !/^\p{Script=Han}{2,4}$/u.test(item.word)) {
      throw new Error(`现代词库含无效词条：${JSON.stringify(item)}`);
    }
    if (metadataByWord.has(item.word)) throw new Error(`现代词库含重复词条：${item.word}`);
    if (REGRESSION_BAD_WORDS.has(item.word)) throw new Error(`现代词库重新引入已知低质量词：${item.word}`);
    metadataByWord.set(item.word, item);
  }
  console.log(`[Miner JS] 已载入 ${metadataByWord.size} 个现代词`);
  return { payload, metadataByWord, words: Array.from(metadataByWord.keys()) };
}

function loadAllCorpus(corpusDir = DEFAULT_CORPUS_DIR) {
  const records = loadAllCorpusCollections(corpusDir).flatMap(collection => collection.records);
  const tiers = records.reduce((counts, record) => {
    counts[record.familiarity_tier] = (counts[record.familiarity_tier] || 0) + 1;
    return counts;
  }, {});
  console.log(`[Miner JS] 已加载 A级 ${tiers.A || 0} 篇、B级 ${tiers.B || 0} 篇`);
  return records;
}

function loadPinyinOverrides(corpusDir = DEFAULT_CORPUS_DIR) {
  const filePath = path.join(corpusDir, 'pinyin_overrides.json');
  if (!fs.existsSync(filePath)) return {};
  const payload = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (payload.schema_version !== 1 || !payload.overrides) {
    throw new Error(`上下文读音覆盖格式无效：${filePath}`);
  }
  return payload.overrides;
}

function splitPassageIntoUnits(passage) {
  const normalized = passage.replace(/[\u200b\ufeff]/g, '').replace(/\s+/g, '');
  const units = normalized.match(/[^。？！!?\n]+[。？！!?]?/g) || [];
  return units.flatMap(unit => {
    if (unit.length <= 120) return [unit];
    return (unit.match(/[^；;]+[；;]?/g) || [unit]).filter(Boolean);
  });
}

function resultQuality(pun, wordMetadata, record) {
  return (
    (pun.is_same_tone ? 120 : 0)
    + wordMetadata.modern_score
    + record.familiarity_score
    + (wordMetadata.curated ? 10 : 0)
    + pun.length * 3
  );
}

function compareResults(a, b) {
  if (a.is_same_tone !== b.is_same_tone) return a.is_same_tone ? -1 : 1;
  if (a.quality_score !== b.quality_score) return b.quality_score - a.quality_score;
  if (a.familiarity_score !== b.familiarity_score) return b.familiarity_score - a.familiarity_score;
  return b.length - a.length || a.replaced_word.localeCompare(b.replaced_word, 'zh-CN');
}

function fingerprint(result) {
  return crypto
    .createHash('sha1')
    .update(`${result.corpus_id}\u0000${result.pun_sentence}\u0000${result.replaced_word}`)
    .digest('hex')
    .slice(0, 12);
}

function loadManualDecisions() {
  const reviewPath = path.join(process.cwd(), 'data', 'quality', 'manual_review.json');
  if (!fs.existsSync(reviewPath)) return new Map();
  const payload = JSON.parse(fs.readFileSync(reviewPath, 'utf8'));
  return new Map((payload.samples || []).map(sample => [sample.result_id, sample.verdict]));
}

function minePuns(
  outputPath = path.join(process.cwd(), 'dist', 'xieyin_results.json'),
  lexiconPath = DEFAULT_LEXICON_PATH
) {
  const { words, metadataByWord } = loadModernLexicon(lexiconPath);
  const records = loadAllCorpus();
  const pinyinOverrides = loadPinyinOverrides();
  const engine = new HomophonicEngine(words, { pinyinOverrides });
  const allResults = [];

  console.log('[Miner JS] 按篇目挖掘，并限制每篇低价值候选占比...');
  for (const record of records) {
    const recordCandidates = [];
    for (const unit of splitPassageIntoUnits(record.passage)) {
      for (const pun of engine.findPuns(unit)) {
        const metadata = metadataByWord.get(pun.replaced_word);
        if (!metadata || metadata.modern_score < 55 || UNSUITABLE_SHARE_WORDS.has(pun.replaced_word)) continue;
        if (!pun.is_same_tone && metadata.modern_score < 75) continue;
        recordCandidates.push({
          ...pun,
          quality_score: resultQuality(pun, metadata, record),
          modern_score: metadata.modern_score,
          modern_source: metadata.source,
          category: metadata.category,
          pos: metadata.pos,
          word_count: metadata.word_count,
          context_diversity: metadata.context_diversity,
          zipf: metadata.zipf,
          curated: metadata.curated,
          corpus_id: record.id,
          work_title: record.work_title,
          author: record.author,
          dynasty: record.dynasty,
          school_stage: record.school_stage,
          grade: record.grade,
          semester: record.semester,
          textbook_location: record.textbook_location,
          familiarity_tier: record.familiarity_tier,
          familiarity_score: record.familiarity_score,
          curriculum_sources: record.curriculum_sources,
          text_source_url: record.text_source_url
        });
      }
    }

    recordCandidates.sort(compareResults);
    const seen = new Set();
    const limit = record.familiarity_tier === 'A' ? 12 : 6;
    const selected = recordCandidates.filter(item => {
      const key = `${item.pun_sentence}\u0000${item.replaced_word}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, limit);
    allResults.push(...selected);
  }

  const manualDecisions = loadManualDecisions();
  const reviewedResults = allResults
    .map(result => ({
      ...result,
      result_id: fingerprint(result),
      manual_review: manualDecisions.get(fingerprint(result)) || null
    }))
    .filter(result => result.manual_review !== 'fail');
  reviewedResults.sort(compareResults);
  const seenResults = new Set();
  const uniqueResults = reviewedResults.filter(result => {
    const key = `${result.familiarity_tier}\u0000${result.pun_sentence}\u0000${result.replaced_word}`;
    if (seenResults.has(key)) return false;
    seenResults.add(key);
    return true;
  });
  const stages = records.reduce((counts, record) => {
    counts[record.school_stage] = (counts[record.school_stage] || 0) + 1;
    return counts;
  }, {});
  const output = {
    schema_version: 2,
    generated_at: new Date().toISOString(),
    corpus_summary: {
      total_works: records.length,
      tier_a_works: records.filter(record => record.familiarity_tier === 'A').length,
      tier_b_works: records.filter(record => record.familiarity_tier === 'B').length,
      stages
    },
    result_count: uniqueResults.length,
    results: uniqueResults
  };

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  const sameToneCount = uniqueResults.filter(item => item.is_same_tone).length;
  console.log(`[Miner JS] 输出 ${uniqueResults.length} 条优选候选，其中同音同调 ${sameToneCount} 条`);
  return outputPath;
}

module.exports = minePuns;
module.exports.loadModernLexicon = loadModernLexicon;
module.exports.loadAllCorpus = loadAllCorpus;
module.exports.loadPinyinOverrides = loadPinyinOverrides;
module.exports.splitPassageIntoUnits = splitPassageIntoUnits;
module.exports.DEFAULT_LEXICON_PATH = DEFAULT_LEXICON_PATH;

if (require.main === module) minePuns();
