/**
 * 典籍谐音梗挖掘器 (src/miner.js - Node.js JavaScript 版)
 * 职责：读取 data/ 词库与典籍，进行逻辑匹配，导出 dist/xieyin_results.json
 */

const fs = require('fs');
const path = require('path');
const HomophonicEngine = require('./engine');

function loadAllDictionaries(dictDir = path.join(process.cwd(), 'data', 'dictionaries')) {
  const wordsSet = new Set();

  if (fs.existsSync(dictDir)) {
    const files = fs.readdirSync(dictDir);
    for (const fname of files) {
      const fpath = path.join(dictDir, fname);
      if (!fs.statSync(fpath).isFile()) continue;

      const content = fs.readFileSync(fpath, 'utf-8');
      const lines = content.split('\n');

      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (!parts || parts.length === 0) continue;
        const word = parts[0];
        if (/^[\u4e00-\u9fa5]{2,4}$/.test(word)) {
          wordsSet.add(word);
        }
      }
    }
  }

  // 流行文化词汇
  const popCulture = [
    "成龙", "周杰伦", "刘德华", "薛之谦", "沈腾", "贾玲", "周星驰", "张学友", "甄子丹", "徐峥", "坤坤",
    "泰坦尼克", "阿凡达", "流浪地球", "热辣滚烫", "战狼", "满江红", "大话西游", "霸王别姬", "楚门的世界", "泰囧",
    "七里香", "晴天", "稻香", "青花瓷", "双截棍", "卡路里", "小苹果", "孤勇者", "野狼", "告白气球", "奢香夫人",
    "打工人", "程序员", "单身狗", "绝绝子", "降维打击", "双十一", "六一八", "尾款人", "吃瓜群众", "摸鱼侠",
    "涨薪", "支出", "实习", "加仓", "摸鱼", "退款", "下单", "包邮", "离职", "社恐", "社牛", "破防", "加班",
    "吃瓜", "干饭", "白干", "买单", "首付", "有余", "有雨", "通风", "有限", "威武", "低薪", "董事", "砖头"
  ];

  for (const w of popCulture) {
    wordsSet.add(w);
  }

  const finalWords = Array.from(wordsSet);
  console.log(`[Miner JS] 已加载开源词库，共包含 ${finalWords.length} 个常用词汇！`);
  return finalWords;
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

function minePuns(outputPath = path.join(process.cwd(), 'dist', 'xieyin_results.json')) {
  const words = loadAllDictionaries();
  const corpus = loadAllCorpus();

  console.log('[Miner JS] 初始化 Node.js 谐音匹配引擎...');
  const engine = new HomophonicEngine(words);

  console.log('[Miner JS] 开始深度挖掘古籍典籍谐音梗...');
  let totalCount = 0;
  const resultsExport = {};

  for (const [bookName, sentences] of Object.entries(corpus)) {
    const bookPuns = [];
    for (const sent of sentences) {
      const puns = engine.findPuns(sent);
      bookPuns.push(...puns);
    }

    // 排序：先同音同调，再按长度降序
    bookPuns.sort((a, b) => {
      if (a.is_same_tone !== b.is_same_tone) {
        return a.is_same_tone ? -1 : 1;
      }
      return b.length - a.length;
    });

    resultsExport[bookName] = bookPuns;
    totalCount += bookPuns.length;
    console.log(`  - ${bookName}: 挖掘到 ${bookPuns.length} 条梗！`);
  }

  const distDir = path.dirname(outputPath);
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(resultsExport, null, 2), 'utf-8');
  console.log(`[Miner JS] 🎉 成功挖掘出 ${totalCount} 条典籍梗，已导出至 \`${outputPath}\`！`);
  return outputPath;
}

module.exports = minePuns;

if (require.main === module) {
  minePuns();
}
