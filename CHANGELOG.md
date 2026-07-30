# Changelog

## 1.1.0 - 2026-07-30

### Features
- 📦 **Modern Word Cloud Sticker Wall**: Added an exclusive section displaying 3,800+ authentic modern vocabulary words extracted from classical literature.
- 🖱️ **Interactive Word Filtering**: Every modern word is styled as a clickable Neo-Brutalism sticker; clicking instantly filters for all corresponding puns.
- ⚡ **Node.js Refactoring**: Completely refactored the mining engine and build pipeline into pure JavaScript (Node.js with `pinyin-pro`), supporting `npm run build`.

---

## 1.0.0 - 2026-07-30

### Features
- 🎨 **Neo-Brutalism UI & Design System**: 1:1 reconstruction based on `https://codex-resets.com/` (warm paper background `#fff4dd`, 2px solid border, 4px crisp shadow, Baloo 2 font, and active physics response).
- 📜 **Classical Literature Pun Engine**: Character-level homophonic pun mining without cross-punctuation splitting and strict N-to-N syllable alignment.
- 📚 **Authentic Dictionary Integration**: Integrated Tsinghua University THUOCL official datasets (net words, IT terms, celebrities, music & movies) alongside Jieba 349k high-frequency words, producing 4,961 authentic classical literature puns.
- ⚡ **Offline Data Embedding & Pagination**: Fully embedded dataset items directly into index.html with interactive smooth pagination.
