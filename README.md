<p align="right"><a href="README.en.md">English</a></p>

<p align="center">
  <img src="./assets/readme/hero.svg" width="100%" alt="古籍谐音梗追踪器 — 【得到】者多助，失道者寡助：得道 dé dào 与现代词得到 dé dào 同音同调">
</p>

<p align="center">
  <a href="https://xiaosang.cc/xieyin/">▶ 在线浏览</a>
  ·
  <a href="https://github.com/holynova/xieyin">GitHub 仓库</a>
</p>

古籍谐音梗追踪器：从小学、初中、高中课本经典与熟知古籍中，找出撞上现代汉语常用词的同音表达，做成可筛选的离线页面。共 413 篇经典、1,549 条谐音结果：得道 → 得到（《得道多助失道寡助》）、看道 → 看到（《王戎不取道旁李》）、之道 → 知道（《三字经》）。系统严守不跨标点断句与全音节完全对齐两条法则，再用现代口语词频、语境覆盖度、词性过滤和人工白名单提升结果质量。

## 截图

<p align="center">
  <img src="./assets/readme/screenshot-home.png" width="800" alt="首页：古籍谐音梗追踪器，典籍反差梗示范【得到】者多助，失道者寡助；统计 413 篇/段、人工抽查通过率 79%、分层抽查样本 48 条；下方是候选现代词标签墙">
</p>

## 数字

| 维度 | 数量 |
|---|---|
| 经典篇目 | 413 篇/段（A 级教材 314 + B 级课外 99） |
| 谐音结果 | 1,549 条（同音同调 866 + 异声调 683） |
| 按字数 | 2 字 1,542 条、3 字 6 条、4 字 1 条 |
| 按学段 | 小学 252、初中 623、高中 553、更多经典 121 |
| 人工抽查 | 分层样本 48 条，通过率 79% |

以上数字均取自 `dist/xieyin_results.json` 与页面统计（v1.2.1）。

## 语料

- **A 级 · 314 篇教材经典**：小学 124、初中 124、高中 66 篇，依据人教社小学 112 首、初中 85 首古诗词与 39 篇古文书目，以及教育部高中语文课程标准附录；现代诗词不进入古文匹配源。
- **B 级 · 99 篇课外经典**：12 篇人工精选高认知经典，加上旧版完整恢复的唐诗、宋词、诗经、论语、道德经与历代辞赋片段。
- **每篇记录**：学习阶段、年级／册次、作品、作者、朝代、熟悉度、教材依据和原文来源；古代公版原文独立记录来源，不复制教材注释和译文。
- **筛选**：页面默认合并展示 A、B 两级，可按"课本 / 课外经典"及学习阶段筛选；默认只展示同音同调结果，异声调结果在"包含异调"中。

课本与人工精选数据位于 `data/corpus/textbook_classics.json` 与 `data/corpus/more_classics.json`，旧版六组语料继续保留在 `data/corpus/`。普通构建只校验快照，不联网、也不会自动覆盖人工整理的数据。如需主动刷新课本原文快照：

```bash
npm run corpus:refresh
```

## 匹配规则

- **不跨标点断句**：冒号、引号、括号等均作为边界，"兮"等正文汉字不会被误当作标点。
- **全音节完全对齐**：先按完整子句确定多音字读音，再从已确定的读音序列切出 2–4 字窗口。
- **分层人工抽查**：抽查记录在 `data/quality/manual_review.json`，质量指标使用分阶段、分声调抽样的通过率；已判定失败的结果会在后续挖掘时自动排除。

## 现代词库

- **主语料**：[SUBTLEX-CH](https://www.ugent.be/pp/experimentele-psychologie/en/research/documents/subtlexch)，影视字幕词频、语境覆盖度和词性。
- **交叉评分**：[wordfreq](https://github.com/rspeer/wordfreq)，用于多语料现代度排序。
- **常用成语**：[THUOCL 成语词表](https://github.com/thunlp/THUOCL)，按语料频次只取前 500 条，单独标记为"常用成语"；不整表引入生僻成语。
- **人工白名单**：网络生活新词及明确的流行文化词，避免低频专名自动混入。

已生成的结构化词库位于 `data/dictionaries/modern_lexicon.json`，包含来源、评分与署名元数据。旧 CEDICT 和 THUOCL 文件仅作为历史数据保留，不再由挖掘器自动加载。重新生成词库：

```bash
python3 -m pip install wordfreq jieba
python3 scripts/build_modern_lexicon.py
```

**流行歌词来源边界**：流行歌曲歌词默认不随项目发布。只有公版歌词、取得明确网络传播许可的歌词，或用户在本地临时输入且不上传、不保存的文本，才适合作为匹配源。歌曲名、歌手、词曲作者和正版页面链接可以作为来源元数据，但仅有元数据不能参与逐字谐音匹配。

## 分享卡片

每条匹配结果都可以生成一张 1080 × 1440 的手机分享卡片：保留谐音改写、原词与现代词对照、作品来源信息，并内置项目二维码；支持直接保存为 PNG，在支持文件分享的手机浏览器中也可以调起系统分享。

## 构建与测试

```bash
npm run build   # 一键三步：准备数据 → 挖掘导出 JSON → 构建静态 HTML
npm test        # 回归测试（node --test）
```

构建产物同时写到 `dist/` 与根目录 `index.html`，直接打开即用，离线可看。

## 技术

- 挖掘引擎：Node.js，拼音用 [pinyin-pro](https://github.com/zh-lx/pinyin-pro)（3.27，唯一依赖）。
- 构建流水线：`build.js` 串起三步——`src/prepareData.js` 准备典籍与词库、`src/miner.js` 挖掘并导出 `dist/xieyin_results.json`、`src/builder.js` 读 JSON 生成单文件静态页。
- 前端：单文件 `index.html`（约 1.1 MB，数据内嵌），暖纸底 + 贴纸卡片风格，设计规范见 `design.md`；无构建工具、无运行时依赖。
- 词库构建脚本：`scripts/build_modern_lexicon.py`（Python，需 wordfreq / jieba）、`scripts/build_textbook_corpus.js`。

```
build.js                    一键构建流水线（准备数据 → 挖掘 → 生成 HTML）
src/prepareData.js          数据准备：典籍 + 词库
src/miner.js                谐音挖掘引擎，导出 dist/xieyin_results.json
src/builder.js              前端构建：JSON → 单文件 index.html
src/engine.js  src/corpus.js  匹配核心与语料加载
data/corpus/                课本经典（314 篇）+ 课外经典 + 旧版六组语料
data/dictionaries/          现代词库 modern_lexicon.json（+ 历史 CEDICT / THUOCL）
data/quality/               分层人工抽查记录
test/lexicon.test.js        词库回归测试
design.md                   页面视觉设计规范
```
