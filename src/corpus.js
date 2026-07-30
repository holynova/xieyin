const fs = require('fs');
const path = require('path');

const CURATED_FILES = ['textbook_classics.json', 'more_classics.json'];
const LEGACY_COLLECTIONS = {
  'ci_fu.json': { author: '历代作者', dynasty: '历代' },
  'dao_de_jing.json': { author: '老子', dynasty: '春秋' },
  'lun_yu.json': { author: '孔子及其弟子', dynasty: '先秦' },
  'shi_jing.json': { author: '佚名', dynasty: '先秦' },
  'song_ci.json': { author: '多位作者', dynasty: '宋代' },
  'tang_shi.json': { author: '多位作者', dynasty: '唐代' }
};

function stripBookMarks(value) {
  return String(value || '').replace(/^《|》$/g, '');
}

function normalizeLegacyPayload(payload, fileName) {
  const metadata = LEGACY_COLLECTIONS[fileName];
  if (!metadata || !payload.book_name || !Array.isArray(payload.sentences)) {
    throw new Error(`旧版语料格式无效：${fileName}`);
  }
  const collectionTitle = stripBookMarks(payload.book_name);
  const fileStem = path.basename(fileName, '.json');
  const records = payload.sentences.map((passage, index) => {
    if (typeof passage !== 'string' || !passage.trim()) {
      throw new Error(`${fileName} 的第 ${index + 1} 条旧版语料为空`);
    }
    return {
      id: `legacy-${fileStem}-${String(index + 1).padStart(3, '0')}`,
      work_title: collectionTitle,
      author: metadata.author,
      dynasty: metadata.dynasty,
      school_stage: '更多经典',
      grade: '课外熟知',
      semester: null,
      textbook_location: `旧版经典语料 · ${collectionTitle}`,
      familiarity_tier: 'B',
      familiarity_score: 82,
      curriculum_sources: [],
      collection_source_url: null,
      text_source_url: 'https://zh.wikisource.org/',
      passage_scope: '原版收录片段',
      passage: passage.trim()
    };
  });
  return {
    corpusName: `${collectionTitle}（旧版恢复）`,
    format: 'legacy',
    records
  };
}

function loadCorpusCollection(filePath) {
  if (!fs.existsSync(filePath)) throw new Error(`缺少经典语料：${filePath}`);
  const payload = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const fileName = path.basename(filePath);
  if (payload.schema_version === 2 && Array.isArray(payload.records)) {
    if (payload.record_count !== payload.records.length) {
      throw new Error(`record_count 与实际篇目数不一致：${filePath}`);
    }
    return {
      corpusName: payload.corpus_name,
      format: 'curated',
      records: payload.records
    };
  }
  return normalizeLegacyPayload(payload, fileName);
}

function loadAllCorpusCollections(corpusDir) {
  const fileNames = [...CURATED_FILES, ...Object.keys(LEGACY_COLLECTIONS)];
  return fileNames.map(fileName => ({
    fileName,
    ...loadCorpusCollection(path.join(corpusDir, fileName))
  }));
}

module.exports = {
  CURATED_FILES,
  LEGACY_COLLECTIONS,
  loadCorpusCollection,
  loadAllCorpusCollections,
  normalizeLegacyPayload
};
