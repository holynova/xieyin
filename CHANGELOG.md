# Changelog

## 1.2.0 - 2026-07-30

### Features
- Replace the broad legacy dictionaries with a curated 11,713-word modern lexicon built from SUBTLEX-CH, wordfreq, and a small reviewed whitelist.
- Add modernity scores and source provenance to mined results, and rank candidates by tone accuracy and lexical quality.
- Default the page to same-tone matches while keeping broader candidates available through an explicit filter.

### Fixes
- Remove low-quality, rare, and malformed modern-word candidates through validation and regression exclusions.
- Remove unrelated template branding and content from the generated page, project metadata, and documentation.

### Documentation
- Document the lexicon sources, regeneration workflow, and regression test commands.

---

## 1.1.0 - 2026-07-30

### Features
- 📦 **Modern Word Cloud Sticker Wall**: Added an exclusive section displaying 3,800+ authentic modern vocabulary words extracted from classical literature.
- 🖱️ **Interactive Word Filtering**: Every modern word is shown as a clickable card label; clicking instantly filters for all corresponding puns.
- ⚡ **Node.js Refactoring**: Completely refactored the mining engine and build pipeline into pure JavaScript (Node.js with `pinyin-pro`), supporting `npm run build`.

---

## 1.0.0 - 2026-07-30

### Features
- 🎨 **Project UI styling**: Added a warm-toned background (`#fff4dd`), 2px borders, crisp shadows, rounded display type, and physical button feedback.
- 📜 **Classical Literature Pun Engine**: Character-level homophonic pun mining without cross-punctuation splitting and strict N-to-N syllable alignment.
- 📚 **Authentic Dictionary Integration**: Integrated Tsinghua University THUOCL official datasets (net words, IT terms, celebrities, music & movies) alongside Jieba 349k high-frequency words, producing 4,961 authentic classical literature puns.
- ⚡ **Offline Data Embedding & Pagination**: Fully embedded dataset items directly into index.html with interactive smooth pagination.
