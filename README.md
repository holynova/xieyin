# 古籍谐音梗追踪器

从古籍原句中寻找现代汉语谐音表达，并生成可筛选的离线页面。系统严守不跨标点断句与全音节完全对齐法则，使用现代口语词频、语境覆盖度、词性过滤和人工白名单提升结果质量。

## 现代词库

- 主语料：[SUBTLEX-CH](https://www.ugent.be/pp/experimentele-psychologie/en/research/documents/subtlexch)，使用影视字幕词频、语境覆盖度和词性。
- 交叉评分：[wordfreq](https://github.com/rspeer/wordfreq)，用于多语料现代度排序。
- 人工白名单：网络生活新词及明确的流行文化词，避免低频专名自动混入。
- 默认页面只展示同音同调结果；异声调结果保留在“扩展匹配”中。

已生成的结构化词库位于 `data/dictionaries/modern_lexicon.json`，包含来源、评分与署名元数据。旧 CEDICT 和 THUOCL 文件仅作为历史数据保留，不再由挖掘器自动加载。

重新生成词库：

```bash
python3 -m pip install wordfreq jieba
python3 scripts/build_modern_lexicon.py
```

构建与回归测试：

```bash
npm run build
node --test test/lexicon.test.js
```

## 🔗 相关链接

- **GitHub 仓库**: [https://github.com/holynova/xieyin](https://github.com/holynova/xieyin)
- **GitHub Pages 在线预览**: [https://holynova.github.io/xieyin/](https://holynova.github.io/xieyin/)
