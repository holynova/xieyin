/**
 * 典籍谐音梗挖掘器
 * 职责：只载入经过现代词频、语境覆盖度、词性和人工审核的结构化词库。
 */

const fs = require('fs');
const path = require('path');
const HomophonicEngine = require('./engine');

const DEFAULT_LEXICON_PATH = path.join(
  process.cwd(),
  'data',
  'dictionaries',
  'modern_lexicon.json'
);
const REGRESSION_BAD_WORDS = new Set([
  '脂习', '封谞', '姬奭', '死股', '豫尔', '粿汁', '计网', '视向'
]);

function loadModernLexicon(lexiconPath = DEFAULT_LEXICON_PATH) {
  if (!fs.existsSync(lexiconPath)) {
    throw new Error(
      `现代词库不存在：${lexiconPath}。请先运行 scripts/build_modern_lexicon.py`
    );
  }

  const payload = JSON.parse(fs.readFileSync(lexiconPath, 'utf-8'));
  if (payload.schema_version !== 1 || !Array.isArray(payload.words)) {
    throw new Error(`现代词库格式无效：${lexiconPath}`);
  }

  const metadataByWord = new Map();
  for (const item of payload.words) {
    if (!item || !/^[\u4e00-\u9fff]{2,4}$/.test(item.word)) {
      throw new Error(`现代词库含无效词条：${JSON.stringify(item)}`);
    }
    if (metadataByWord.has(item.word)) {
      throw new Error(`现代词库含重复词条：${item.word}`);
    }
    if (REGRESSION_BAD_WORDS.has(item.word)) {
      throw new Error(`现代词库重新引入已知低质量词：${item.word}`);
    }
    metadataByWord.set(item.word, item);
  }

  console.log(
    `[Miner JS] 已载入 ${metadataByWord.size} 个经过词频、词性与人工审核的现代词！`
  );
  return { payload, metadataByWord, words: Array.from(metadataByWord.keys()) };
}

function loadAllCorpus(corpusDir = path.join(process.cwd(), 'data', 'corpus')) {
  const corpusMap = {};
  if (fs.existsSync(corpusDir)) {
    const files = fs.readdirSync(corpusDir).sort();
    for (const fname of files) {
      if (!fname.endsWith('.json')) continue;
      const fpath = path.join(corpusDir, fname);
      const content = fs.readFileSync(fpath, 'utf-8');
      const data = JSON.parse(content);
      const bookName = data.book_name || fname;
      corpusMap[bookName] = data.sentences || [];
    }
  }
  console.log(`[Miner JS] 已加载 ${Object.keys(corpusMap).length} 本古典书籍名篇库！`);
  return corpusMap;
}

function minePuns(
  outputPath = path.join(process.cwd(), 'dist', 'xieyin_results.json'),
  lexiconPath = DEFAULT_LEXICON_PATH
) {
  const { words, metadataByWord } = loadModernLexicon(lexiconPath);
  const corpus = loadAllCorpus();

  console.log('[Miner JS] 初始化 Node.js 谐音匹配引擎...');
  const engine = new HomophonicEngine(words);

  console.log('[Miner JS] 开始按现代度与谐音质量挖掘典籍梗...');
  let totalCount = 0;
  const resultsExport = {};

  for (const [bookName, sentences] of Object.entries(corpus)) {
    const bookPuns = [];
    for (const sent of sentences) {
      const puns = engine.findPuns(sent);
      const cleanPuns = puns.map((pun) => {
        const metadata = metadataByWord.get(pun.replaced_word);
        const qualityScore =
          (pun.is_same_tone ? 100 : 0)
          + metadata.modern_score
          + (metadata.curated ? 8 : 0)
          + pun.length * 2;
        return {
          ...pun,
          quality_score: qualityScore,
          modern_score: metadata.modern_score,
          source: metadata.source,
          category: metadata.category,
          pos: metadata.pos,
          word_count: metadata.word_count,
          context_diversity: metadata.context_diversity,
          zipf: metadata.zipf,
          curated: metadata.curated
        };
      });
      bookPuns.push(...cleanPuns);
    }

    // 排序：先同音同调，再按现代度、人工审核和长度综合质量排序。
    bookPuns.sort((a, b) => {
      if (a.is_same_tone !== b.is_same_tone) {
        return a.is_same_tone ? -1 : 1;
      }
      if (a.quality_score !== b.quality_score) {
        return b.quality_score - a.quality_score;
      }
      return b.length - a.length || a.replaced_word.localeCompare(b.replaced_word, 'zh-CN');
    });

    resultsExport[bookName] = bookPuns;
    totalCount += bookPuns.length;
    const sameToneCount = bookPuns.filter(item => item.is_same_tone).length;
    console.log(`  - ${bookName}: ${bookPuns.length} 条候选，其中同音同调 ${sameToneCount} 条`);
  }

  const distDir = path.dirname(outputPath);
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(resultsExport, null, 2), 'utf-8');
  console.log(`[Miner JS] 🎉 成功挖掘出 ${totalCount} 条规范典籍梗，已导出至 \`${outputPath}\`！`);
  return outputPath;
}

module.exports = minePuns;
module.exports.loadModernLexicon = loadModernLexicon;
module.exports.loadAllCorpus = loadAllCorpus;
module.exports.DEFAULT_LEXICON_PATH = DEFAULT_LEXICON_PATH;

if (require.main === module) {
  minePuns();
}
