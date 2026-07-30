#!/usr/bin/env node

/**
 * One-time corpus refresh tool.
 *
 * Curriculum membership is anchored to official PEP / Ministry of Education
 * references. Ancient source text is fetched separately from public-domain
 * transcriptions. The normal site build never performs network requests.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CORPUS_DIR = path.join(ROOT, 'data', 'corpus');
const TEXT_SOURCE = 'https://www.gushiwenku.cn';
const MODERN_EXCLUSIONS = new Set([
  '卜算子·咏梅|毛泽东',
  '七律·长征|毛泽东',
  '沁园春·雪|毛泽东',
  '梅岭三章|陈毅',
  '沁园春·长沙|毛泽东'
]);
const METADATA_OVERRIDES = {
  '人之初': { workTitle: '三字经·人之初' },
  '王戎不取道旁李': { author: '刘义庆', dynasty: '南北朝' },
  '囊萤夜读': { author: '房玄龄等', dynasty: '唐代' },
  '铁杵成针': { author: '祝穆', dynasty: '宋代' },
  '伯牙鼓琴': { author: '吕不韦', dynasty: '先秦' },
  '学弈': { author: '孟子', dynasty: '先秦' }
};

const COLLECTIONS = [
  {
    stage: '小学',
    url: `${TEXT_SOURCE}/xuanji/xiaoxue-gushi/`,
    curriculumSources: [
      {
        label: '人教社《小学生必背古诗词112首》',
        url: 'https://www.pep.com.cn/products/jf/zhxxjf/ywxkjf/202004/t20200417_1950862.shtml'
      },
      {
        label: '人民教育出版社教材目录（小学语文各册）',
        url: 'https://www.pep.com.cn/products/jc/'
      }
    ]
  },
  {
    stage: '初中',
    url: `${TEXT_SOURCE}/xuanji/chuzhong-gushi/`,
    curriculumSources: [
      {
        label: '人教社《初中生必背古诗词85首》',
        url: 'https://www.pep.com.cn/xw/zt/cp/zxxbbgsc/czsgsc85/202204/t20220406_1976043.html'
      },
      {
        label: '人教社《初中生必背古文39篇》',
        url: 'https://www.pep.com.cn/xw/zt/cp/zxxbbgsc/czsgw39/202204/t20220406_1976044.html'
      }
    ]
  },
  {
    stage: '高中',
    url: `${TEXT_SOURCE}/xuanji/gaozhong-gushi/`,
    curriculumSources: [
      {
        label: '教育部《普通高中语文课程标准（2017年版2020年修订）》附录1',
        url: 'https://www.pep.com.cn/xw/zt/rjwy/gzkb2020/202205/P020220517522412911080.pdf'
      }
    ]
  }
];

const MORE_CLASSICS = [
  ['清平调·其一', '李白', '唐代', '云想衣裳花想容，春风拂槛露华浓。若非群玉山头见，会向瑶台月下逢。'],
  ['赠花卿', '杜甫', '唐代', '锦城丝管日纷纷，半入江风半入云。此曲只应天上有，人间能得几回闻。'],
  ['乌衣巷', '刘禹锡', '唐代', '朱雀桥边野草花，乌衣巷口夕阳斜。旧时王谢堂前燕，飞入寻常百姓家。'],
  ['题乌江亭', '杜牧', '唐代', '胜败兵家事不期，包羞忍耻是男儿。江东子弟多才俊，卷土重来未可知。'],
  ['金缕衣', '佚名', '唐代', '劝君莫惜金缕衣，劝君惜取少年时。花开堪折直须折，莫待无花空折枝。'],
  ['临江仙·滚滚长江东逝水', '杨慎', '明代', '滚滚长江东逝水，浪花淘尽英雄。是非成败转头空。青山依旧在，几度夕阳红。'],
  ['木兰花·拟古决绝词柬友', '纳兰性德', '清代', '人生若只如初见，何事秋风悲画扇。等闲变却故人心，却道故人心易变。'],
  ['浣溪沙·谁念西风独自凉', '纳兰性德', '清代', '谁念西风独自凉，萧萧黄叶闭疏窗，沉思往事立残阳。被酒莫惊春睡重，赌书消得泼茶香，当时只道是寻常。'],
  ['浪淘沙令·帘外雨潺潺', '李煜', '五代', '帘外雨潺潺，春意阑珊。罗衾不耐五更寒。梦里不知身是客，一晌贪欢。'],
  ['钗头凤·红酥手', '陆游', '宋代', '红酥手，黄縢酒，满城春色宫墙柳。东风恶，欢情薄。一怀愁绪，几年离索。错、错、错。'],
  ['摸鱼儿·更能消几番风雨', '辛弃疾', '宋代', '更能消、几番风雨，匆匆春又归去。惜春长怕花开早，何况落红无数。'],
  ['正气歌', '文天祥', '宋代', '天地有正气，杂然赋流形。下则为河岳，上则为日星。于人曰浩然，沛乎塞苍冥。']
];

function decodeHtml(value) {
  return value
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&ldquo;|&rdquo;/g, '”')
    .replace(/&lsquo;/g, '‘')
    .replace(/&rsquo;/g, '’')
    .replace(/&middot;/g, '·')
    .replace(/&mdash;/g, '—')
    .replace(/&hellip;/g, '…')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/[\u200b\ufeff]/g, '')
    .trim();
}

async function fetchText(url, attempt = 1) {
  const response = await fetch(url, {
    headers: { 'user-agent': 'xieyin-corpus-refresh/1.0' },
    signal: AbortSignal.timeout(20_000)
  });
  if (!response.ok) {
    if (attempt < 3) return fetchText(url, attempt + 1);
    throw new Error(`${response.status} ${url}`);
  }
  return response.text();
}

function parseCollection(html, collection) {
  const records = [];
  const sectionPattern = /<section class="card" id="([^"]+)">([\s\S]*?)<\/section>/g;
  let sectionMatch;
  while ((sectionMatch = sectionPattern.exec(html))) {
    const gradeBook = decodeHtml(sectionMatch[1]);
    const workPattern = /href="(\/shiwen\/([a-z0-9]+)\/)"[^>]*>[\s\S]*?<h3 class="works-name">《([\s\S]*?)》<\/h3>[\s\S]*?<span class="works-author">([\s\S]*?)<\/span>/g;
    let workMatch;
    while ((workMatch = workPattern.exec(sectionMatch[2]))) {
      records.push({
        id: `${collection.stage}-${workMatch[2]}`,
        workTitle: decodeHtml(workMatch[3]),
        author: decodeHtml(workMatch[4]),
        gradeBook,
        textSourceUrl: `${TEXT_SOURCE}${workMatch[1]}`
      });
    }
  }
  return records.filter(record => !MODERN_EXCLUSIONS.has(`${record.workTitle}|${record.author}`));
}

function gradeMetadata(stage, gradeBook) {
  if (stage === '小学' || stage === '初中') {
    const match = gradeBook.match(/^(.+?年级)(上册|下册)$/);
    return { grade: match ? match[1] : gradeBook, semester: match ? match[2] : null };
  }
  const semester = /上册|中册|下册/.exec(gradeBook)?.[0] || null;
  return {
    grade: gradeBook.replace(/[（(]?(上册|中册|下册)[）)]?/g, ''),
    semester
  };
}

function selectFamiliarPassage(paragraphs, maxCharacters = 1400) {
  const fullText = paragraphs.join('');
  if (fullText.length <= maxCharacters) return { passage: fullText, passageScope: '全文' };
  const rough = fullText.slice(0, maxCharacters);
  const boundary = Math.max(
    rough.lastIndexOf('。'),
    rough.lastIndexOf('！'),
    rough.lastIndexOf('？')
  );
  const passage = rough.slice(0, boundary > maxCharacters * 0.7 ? boundary + 1 : maxCharacters);
  return { passage, passageScope: '熟知段落' };
}

async function hydrateRecord(seed, collection) {
  const html = await fetchText(seed.textSourceUrl);
  const dynasty = decodeHtml(/<span class="poem-dynasty">([\s\S]*?)<\/span>/.exec(html)?.[1] || '')
    .replace(/^〔|〕$/g, '');
  const originalArticle = /<article class="poem-content"[^>]*>([\s\S]*?)<\/article>/.exec(html)?.[1] || '';
  const paragraphs = Array.from(originalArticle.matchAll(/<p class="original">([\s\S]*?)<\/p>/g))
    .map(match => decodeHtml(match[1]))
    .filter(Boolean);
  if (!paragraphs.length) throw new Error(`原文为空：${seed.textSourceUrl}`);
  const { grade, semester } = gradeMetadata(collection.stage, seed.gradeBook);
  const { passage, passageScope } = selectFamiliarPassage(paragraphs);
  const metadataOverride = METADATA_OVERRIDES[seed.workTitle] || {};
  return {
    id: seed.id,
    work_title: metadataOverride.workTitle || seed.workTitle.replace(/（高中课文）$/, ''),
    author: metadataOverride.author || seed.author,
    dynasty: metadataOverride.dynasty || dynasty,
    school_stage: collection.stage,
    grade,
    semester,
    textbook_location: seed.gradeBook,
    familiarity_tier: 'A',
    familiarity_score: collection.stage === '小学' ? 100 : collection.stage === '初中' ? 97 : 94,
    curriculum_sources: collection.curriculumSources,
    collection_source_url: collection.url,
    text_source_url: seed.textSourceUrl,
    passage_scope: passageScope,
    passage
  };
}

async function mapLimit(values, limit, mapper) {
  const result = new Array(values.length);
  let cursor = 0;
  async function worker() {
    while (cursor < values.length) {
      const index = cursor++;
      result[index] = await mapper(values[index], index);
      process.stdout.write(`\r已抓取 ${result.filter(Boolean).length}/${values.length}`);
    }
  }
  await Promise.all(Array.from({ length: limit }, worker));
  process.stdout.write('\n');
  return result;
}

function writeJson(fileName, payload) {
  fs.mkdirSync(CORPUS_DIR, { recursive: true });
  fs.writeFileSync(path.join(CORPUS_DIR, fileName), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

async function main() {
  const allRecords = [];
  for (const collection of COLLECTIONS) {
    const indexHtml = await fetchText(collection.url);
    const seeds = parseCollection(indexHtml, collection);
    console.log(`${collection.stage}目录：${seeds.length}篇`);
    const records = await mapLimit(seeds, 8, seed => hydrateRecord(seed, collection));
    allRecords.push(...records);
  }

  const ids = new Set();
  for (const record of allRecords) {
    if (ids.has(record.id)) throw new Error(`重复ID：${record.id}`);
    ids.add(record.id);
  }

  writeJson('textbook_classics.json', {
    schema_version: 2,
    corpus_name: '中小学课本经典白名单',
    generated_at: new Date().toISOString().slice(0, 10),
    editorial_policy: 'A 级仅收录小学、初中、高中教材或课标中的高认知古诗文，默认展示。',
    record_count: allRecords.length,
    records: allRecords
  });

  const moreRecords = MORE_CLASSICS.map((item, index) => ({
    id: `more-${String(index + 1).padStart(3, '0')}`,
    work_title: item[0],
    author: item[1],
    dynasty: item[2],
    school_stage: '更多经典',
    grade: '课外熟知',
    semester: null,
    textbook_location: '更多经典',
    familiarity_tier: 'B',
    familiarity_score: 86,
    curriculum_sources: [],
    collection_source_url: null,
    text_source_url: 'https://zh.wikisource.org/',
    passage_scope: '全文或熟知段落',
    passage: item[3]
  }));
  writeJson('more_classics.json', {
    schema_version: 2,
    corpus_name: '更多熟悉经典',
    generated_at: new Date().toISOString().slice(0, 10),
    editorial_policy: 'B 级仅放人人熟悉但不在当前 A 级教材白名单内的作品，须由用户主动开启。',
    record_count: moreRecords.length,
    records: moreRecords
  });
  console.log(`完成：A级 ${allRecords.length} 篇，B级 ${moreRecords.length} 篇`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
