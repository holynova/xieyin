# 古籍谐音梗追踪器

从小学、初中、高中课本经典与旧版熟知古籍中寻找现代汉语谐音表达，并生成可筛选的离线页面。系统严守不跨标点断句与全音节完全对齐法则，使用现代口语词频、语境覆盖度、词性过滤和人工白名单提升结果质量。

## 课本经典白名单

- A 级：314 篇小学、初中、高中教材或课标古诗文经典；现代诗词不进入古文匹配源。
- B 级：12 篇课外高认知经典，加上旧版完整恢复的唐诗、宋词、诗经、论语、道德经与历代辞赋片段。
- 页面默认合并展示 A、B 两级，可以继续按“课本”“课外经典”及学习阶段筛选。
- 每篇记录均包含学习阶段、年级／册次、作品、作者、朝代、熟悉度、教材依据和原文来源。
- 教材范围依据人教社的小学 112 首、初中 85 首古诗词与 39 篇古文书目，以及教育部高中语文课程标准附录；古代公版原文独立记录来源，不复制教材注释和译文。
- 匹配时先按完整子句确定多音字读音，再从已确定的读音序列切出 2–4 字窗口；冒号、引号、括号等均作为边界，“兮”等正文汉字不会被误当作标点。

课本与人工精选数据位于 `data/corpus/textbook_classics.json` 与 `data/corpus/more_classics.json`，旧版六组语料继续保留在 `data/corpus/`。普通构建只校验快照，不联网、也不会自动覆盖人工整理的数据。如需主动刷新课本原文快照：

```bash
npm run corpus:refresh
```

当前的分层人工抽查记录位于 `data/quality/manual_review.json`。质量指标使用分阶段、分声调抽样的通过率，已判定失败的结果会在后续挖掘时自动排除。

## 现代词库

- 主语料：[SUBTLEX-CH](https://www.ugent.be/pp/experimentele-psychologie/en/research/documents/subtlexch)，使用影视字幕词频、语境覆盖度和词性。
- 交叉评分：[wordfreq](https://github.com/rspeer/wordfreq)，用于多语料现代度排序。
- 常用成语：[THUOCL 成语词表](https://github.com/thunlp/THUOCL)，按语料频次只取前 500 条，并单独标记为“常用成语”；不整表引入生僻成语。
- 人工白名单：网络生活新词及明确的流行文化词，避免低频专名自动混入。
- 默认页面只展示同音同调结果；异声调结果保留在“包含异调”中。

已生成的结构化词库位于 `data/dictionaries/modern_lexicon.json`，包含来源、评分与署名元数据。旧 CEDICT 和 THUOCL 文件仅作为历史数据保留，不再由挖掘器自动加载。

## 流行歌词来源边界

流行歌曲歌词默认不随项目发布。只有公版歌词、取得明确网络传播许可的歌词，或用户在本地临时输入且不上传、不保存的文本，才适合作为匹配源。歌曲名、歌手、词曲作者和正版页面链接可以作为来源元数据，但仅有元数据不能参与逐字谐音匹配。

重新生成词库：

```bash
python3 -m pip install wordfreq jieba
python3 scripts/build_modern_lexicon.py
```

构建与回归测试：

```bash
npm run build
npm test
```

## 分享卡片

每条匹配结果都可以生成一张 1080 × 1440 的手机分享卡片。卡片保留谐音改写、原词与现代词对照、作品来源信息，并内置项目二维码；支持直接保存为 PNG，在支持文件分享的手机浏览器中也可以调起系统分享。

## 🔗 相关链接

- **GitHub 仓库**: [https://github.com/holynova/xieyin](https://github.com/holynova/xieyin)
- **GitHub Pages 在线预览**: [https://holynova.github.io/xieyin/](https://holynova.github.io/xieyin/)
