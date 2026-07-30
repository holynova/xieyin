/**
 * Curated corpus validation.
 *
 * Corpus content is editorial data. A normal build validates it and never
 * silently overwrites it. Use scripts/build_textbook_corpus.js explicitly when
 * refreshing the source snapshot.
 */

const path = require('path');
const { loadCorpusCollection, loadAllCorpusCollections } = require('./corpus');

const REQUIRED_FIELDS = [
  'id',
  'work_title',
  'author',
  'school_stage',
  'grade',
  'familiarity_tier',
  'familiarity_score',
  'text_source_url',
  'passage'
];

function validateCorpusFile(filePath) {
  const payload = loadCorpusCollection(filePath);
  const ids = new Set();
  for (const record of payload.records) {
    for (const field of REQUIRED_FIELDS) {
      if (record[field] === undefined || record[field] === null || record[field] === '') {
        throw new Error(`${path.basename(filePath)} 的 ${record.id || '未知记录'} 缺少 ${field}`);
      }
    }
    if (!['A', 'B'].includes(record.familiarity_tier)) {
      throw new Error(`${record.id} 的熟悉度分级无效`);
    }
    if (record.familiarity_score < 0 || record.familiarity_score > 100) {
      throw new Error(`${record.id} 的熟悉度分数超出范围`);
    }
    if (ids.has(record.id)) throw new Error(`重复语料 ID：${record.id}`);
    ids.add(record.id);
  }
  return payload;
}

function prepareData(corpusDir = path.join(process.cwd(), 'data', 'corpus')) {
  const summaries = loadAllCorpusCollections(corpusDir).map(collection => {
    const payload = validateCorpusFile(path.join(corpusDir, collection.fileName));
    console.log(
      `[PrepareData] ${payload.corpusName}: ${payload.records.length} ${payload.format === 'legacy' ? '段' : '篇'}，格式与来源字段校验通过`
    );
    return payload;
  });
  const records = summaries.flatMap(payload => payload.records);
  const tierACount = records.filter(record => record.familiarity_tier === 'A').length;
  const tierBCount = records.filter(record => record.familiarity_tier === 'B').length;
  if (tierACount < 280 || tierACount > 360) {
    throw new Error(`A级课本白名单应保持在约 300 篇，当前为 ${tierACount} 篇`);
  }
  if (tierBCount === 0) throw new Error('B级“更多经典”不能为空');
  return { tierACount, tierBCount, total: records.length };
}

module.exports = prepareData;
module.exports.validateCorpusFile = validateCorpusFile;

if (require.main === module) prepareData();
