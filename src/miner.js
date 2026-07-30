/**
 * 典籍谐音梗挖掘器 (src/miner.js - 精细化现代词库过滤版)
 * 职责：彻底过滤古文虚词/伪词（如“个里”、“斯海”），仅保留大众熟知的真现代词汇！
 */

const fs = require('fs');
const path = require('path');
const HomophonicEngine = require('./engine');

// 1. 彻底封杀生僻古风虚词、罕见音译词与错别字组词黑名单
const ARCHAIC_BLACK_LIST = new Set([
  "个里", "斯海", "於乎", "吾人", "斯人", "知悉", "余例", "个例", "割礼", "哥里",
  "戈里", "格里", "犁田", "蕴和", "伏倒", "伏到", "富岛", "敷到", "服到", "浮岛",
  "不箕", "不羁", "布机", "簿籍", "簿记", "补剂", "补济", "补记", "部级", "部际",
  "心腑", "义诊", "疫疹", "五胡", "齐妃", "于洲", "渝州", "梨汁", "羊脂", "油龙",
  "荣耀", "青云", "璧月", "飘摇", "刘锋", "刘封", "疯枝", "海伊", "山坞", "负压",
  "蛤蜊", "合龙", "和龙", "付到", "妇道", "附到", "不济", "不计", "季荷", "不支",
  "支息", "乌呼", "国野", "飞禽", "飞天", "下野", "需知", "须知", "月季", "冀望",
  "寄望", "客饭", "周游", "鱿鱼", "游鱼", "清丰", "轻风", "青峰", "青蜂", "青锋",
  "青风", "宋明", "月氏", "阅知", "刻有", "吹动", "洞萧", "哥儿", "歌儿", "奇声",
  "齐声", "茹素", "嫋嫋", "鸟鸟", "王弼", "王必", "李贽", "李治", "厉志", "利智",
  "吴绮", "吴起", "夏禹", "夏雨", "天仪", "周长", "彭莉", "冯至", "曜秋", "华茂",
  "划帽", "化帽", "情运", "运织", "运支", "运质", "余音", "玉音", "雨音",
  "一真", "一阵", "缔结", "地节", "武器", "海伊", "山坞", "负压", "季荷", "下野",
  "客饭", "月氏", "阅知", "刻有", "吹动", "茹素", "心腑", "于洲", "渝州", "梨汁",
  "羊脂", "疯枝", "求知", "虬枝", "支部", "私服", "捻转", "釉彩", "色友", "中古",
  "中谷", "忠骨", "终古", "禄位", "所为", "依人", "亿方", "速回", "道祖", "几许",
  "实有", "石友", "问清", "倾天", "清天", "上工", "上攻", "今昔", "矜惜", "金溪",
  "金熙", "息事", "稀世", "稀释", "西市", "西式", "适合", "玉成", "育成", "成锋",
  "成风", "御宇", "遇雨", "高矗", "不剩", "盛寒", "侮弄", "一世", "一事", "一式",
  "仪式", "宜市", "遗事", "世弟", "市地", "柿蒂", "递上", "顾湘", "棉布", "疯语",
  "语声", "衣衫", "核入", "郁琼", "李牧", "尚衣", "缩慄", "利翁", "寒螿", "涵江",
  "邗江", "之所", "渴到", "嚐到", "尝到", "肠道", "长鸣", "无明", "天帝", "地支",
  "第只", "支使", "铭万", "知母", "下接", "接枝", "每支", "只为", "丝布", "尚善",
  "仲壬", "仲仁", "重人", "支索", "儿时", "十席", "不义", "不意", "不易", "异说",
  "臆说", "友朋", "逸乐", "人部", "仁布", "汁儿", "不孕", "易军", "义军", "抑菌",
  "菌子", "知心", "卫师", "施以", "布斯", "咝儿", "吱吱", "蜘蜘", "知者", "不齿",
  "三仁", "人形", "鳏居", "知州", "好球", "流汁", "硫脂"
]);

// 2. 精选大众皆知、地道有梗的现代真实词汇库
const CURATED_MODERN_WORDS = [
  // 🎵 流行歌曲 / 影视名
  "晴天", "七里香", "稻香", "青花瓷", "双截棍", "卡路里", "小苹果", "孤勇者", "野狼", "告白气球", "奢香夫人",
  "泰坦尼克", "阿凡达", "流浪地球", "热辣滚烫", "战狼", "满江红", "大话西游", "霸王别姬", "楚门的世界", "泰囧",
  // 🌟 明星 / 名人
  "成龙", "周杰伦", "刘德华", "薛之谦", "沈腾", "贾玲", "周星驰", "张学友", "甄子丹", "徐峥", "坤坤",
  // 🔥 打工/职场/股市/网购/日常热词
  "加仓", "同事", "实习", "离职", "起飞", "鼓舞", "宇宙", "犹豫", "由于", "指导", "卧室", "新闻", "电脑",
  "软件", "快递", "加班", "买单", "首付", "退款", "下单", "包邮", "破防", "摸鱼", "吃瓜", "干饭", "社恐",
  "社牛", "涨薪", "支出", "干活", "白干", "生椰", "果汁", "奴隶", "劳大", "风雨", "上新", "上心", "资源",
  "下文", "退货", "发货", "点赞", "关注", "转发", "投币", "弹幕", "高能", "划水", "内卷", "躺平", "降维打击",
  "打工人", "程序员", "单身狗", "绝绝子", "双十一", "六一八", "尾款人", "吃瓜群众", "摸鱼侠", "有余", "有雨",
  "通风", "有限", "威武", "低薪", "董事", "砖头", "自己", "进水", "运河", "几何", "不及", "不致", "不止",
  "布置", "契约", "步行", "不幸", "不行", "知识", "指示", "语音", "兴奋", "谷物"
];

function loadAllDictionaries(dictDir = path.join(process.cwd(), 'data', 'dictionaries')) {
  const wordsSet = new Set(CURATED_MODERN_WORDS);

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
        // 过滤：仅保留 2-4 字纯汉字，且必须不在生僻古风黑名单中
        if (/^[\u4e00-\u9fa5]{2,4}$/.test(word)) {
          if (!ARCHAIC_BLACK_LIST.has(word)) {
            wordsSet.add(word);
          }
        }
      }
    }
  }

  const finalWords = Array.from(wordsSet).filter(w => !ARCHAIC_BLACK_LIST.has(w));
  console.log(`[Miner JS] 已加载并完成精细化清洗的真现代词库，共 ${finalWords.length} 个地道词汇！`);
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

  console.log('[Miner JS] 开始深度挖掘高品质真现代典籍谐音梗...');
  let totalCount = 0;
  const resultsExport = {};

  for (const [bookName, sentences] of Object.entries(corpus)) {
    const bookPuns = [];
    for (const sent of sentences) {
      const puns = engine.findPuns(sent);
      // 二次清洗：确保 replaced_word 不在黑名单里
      const cleanPuns = puns.filter(p => !ARCHAIC_BLACK_LIST.has(p.replaced_word));
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
    console.log(`  - ${bookName}: 挖掘到 ${bookPuns.length} 条高品质真梗！`);
  }

  const distDir = path.dirname(outputPath);
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(resultsExport, null, 2), 'utf-8');
  console.log(`[Miner JS] 🎉 成功挖掘出 ${totalCount} 条高品质典籍梗，已导出至 \`${outputPath}\`！`);
  return outputPath;
}

module.exports = minePuns;

if (require.main === module) {
  minePuns();
}
