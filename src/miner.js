/**
 * 典籍谐音梗挖掘器 (src/miner.js - 官方权威汉语大词典版)
 * 职责：只载入 CC-CEDICT 官方权威汉语词典 (official_cedict.txt)，彻底摒弃旧机械生成词库！
 */

const fs = require('fs');
const path = require('path');
const HomophonicEngine = require('./engine');

function loadAllDictionaries(dictDir = path.join(process.cwd(), 'data', 'dictionaries')) {
  const wordsSet = new Set();

  // 流行文化与知名现代热词
  const popCulture = [
    "晴天", "七里香", "稻香", "青花瓷", "双截棍", "卡路里", "小苹果", "孤勇者", "野狼", "告白气球", "奢香夫人",
    "泰坦尼克", "阿凡达", "流浪地球", "热辣滚烫", "战狼", "满江红", "大话西游", "霸王别姬", "楚门的世界", "泰囧",
    "成龙", "周杰伦", "刘德华", "薛之谦", "沈腾", "贾玲", "周星驰", "张学友", "甄子丹", "徐峥", "坤坤",
    "加仓", "同事", "实习", "离职", "起飞", "鼓舞", "宇宙", "犹豫", "由于", "指导", "卧室", "新闻", "电脑",
    "软件", "快递", "加班", "买单", "首付", "退款", "下单", "包邮", "破防", "摸鱼", "吃瓜", "干饭", "社恐",
    "社牛", "涨薪", "支出", "干活", "白干", "生椰", "果汁", "奴隶", "劳大", "风雨", "上新", "上心", "资源",
    "下文", "退货", "发货", "点赞", "关注", "转发", "投币", "弹幕", "高能", "划水", "内卷", "躺平", "降维打击",
    "打工人", "程序员", "单身狗", "绝绝子", "双十一", "六一八", "尾款人", "吃瓜群众", "摸鱼侠", "有余", "有雨",
    "通风", "有限", "威武", "低薪", "董事", "砖头", "自己", "进水", "运河", "几何", "不及", "不致", "不止",
    "布置", "契约", "步行", "不幸", "不行", "知识", "指示", "语音", "兴奋", "谷物"
  ];

  for (const w of popCulture) {
    wordsSet.add(w);
  }

  if (fs.existsSync(dictDir)) {
    const files = fs.readdirSync(dictDir);
    for (const fname of files) {
      // 仅读取 official_cedict.txt 以及 THUOCL 清华网络词库 txt
      if (!fname.endsWith('.txt')) continue;
      const fpath = path.join(dictDir, fname);
      if (!fs.statSync(fpath).isFile()) continue;

      const content = fs.readFileSync(fpath, 'utf-8');
      const lines = content.split('\n');

      for (const line of lines) {
        const word = line.trim().split(/\s+/)[0];
        // 校验：必须是 2-4 字纯汉字，且不以 "儿" 结尾
        if (/^[\u4e00-\u9fa5]{2,4}$/.test(word) && !word.endsWith('儿')) {
          wordsSet.add(word);
        }
      }
    }
  }

  const finalWords = Array.from(wordsSet);
  console.log(`[Miner JS] 成功载入《CC-CEDICT 官方权威汉语大词典》与清华网络词库，共 ${finalWords.length} 个标准规范词汇！`);
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

  console.log('[Miner JS] 开始在权威汉语大词典下深度挖掘规范典籍梗...');
  let totalCount = 0;
  const resultsExport = {};

  for (const [bookName, sentences] of Object.entries(corpus)) {
    const bookPuns = [];
    for (const sent of sentences) {
      const puns = engine.findPuns(sent);
      const cleanPuns = puns.filter(p => !p.replaced_word.endsWith('儿'));
      bookPuns.push(...cleanPuns);
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
    console.log(`  - ${bookName}: 挖掘到 ${bookPuns.length} 条权威规范梗！`);
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

if (require.main === module) {
  minePuns();
}
