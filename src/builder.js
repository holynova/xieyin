/**
 * 前端 HTML 构建器 (src/builder.js - Node.js JavaScript 版)
 * 职责：读取 dist/xieyin_results.json，生成离线单文件 HTML 网页
 * 特性：提供词库质量信息、筛选和项目源码入口
 */

const fs = require('fs');
const path = require('path');

const PROJECT_URL = 'https://holynova.github.io/xieyin/';
const SEARCH_FIELDS = ['kw', 'oText', 'work', 'author', 'stage', 'grade', 'semester', 'doc'];

function matchesSearchRecord(item, query) {
  const normalizedQuery = String(query || '').toLowerCase().trim();
  if (!normalizedQuery) return true;
  const haystack = SEARCH_FIELDS
    .map(field => item[field] || '')
    .join(' ')
    .toLowerCase();
  return haystack.includes(normalizedQuery);
}
const PROJECT_QR_DATA_URL = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzNyAzNyIgc2hhcGUtcmVuZGVyaW5nPSJjcmlzcEVkZ2VzIj48cGF0aCBmaWxsPSIjZmZmZGY3IiBkPSJNMCAwaDM3djM3SDB6Ii8+PHBhdGggZmlsbD0iIzI2MjAxYSIgZD0iTTQgNGg3djFINHpNMTIgNGgydjFIMTJ6TTE2IDRoMnYxSDE2ek0xOSA0aDF2MUgxOXpNMjIgNGgxdjFIMjJ6TTI0IDRoMXYxSDI0ek0yNiA0aDd2MUgyNnpNNCA1aDF2MUg0ek0xMCA1aDF2MUgxMHpNMTUgNWgydjFIMTV6TTE5IDVoNHYxSDE5ek0yNCA1aDF2MUgyNHpNMjYgNWgxdjFIMjZ6TTMyIDVoMXYxSDMyek00IDZoMXYxSDR6TTYgNmgzdjFINnpNMTAgNmgxdjFIMTB6TTEyIDZoM3YxSDEyek0xOCA2aDF2MUgxOHpNMjAgNmgxdjFIMjB6TTIyIDZoM3YxSDIyek0yNiA2aDF2MUgyNnpNMjggNmgzdjFIMjh6TTMyIDZoMXYxSDMyek00IDdoMXYxSDR6TTYgN2gzdjFINnpNMTAgN2gxdjFIMTB6TTEzIDdoMXYxSDEzek0xNSA3aDF2MUgxNXpNMTcgN2gxdjFIMTd6TTE5IDdoMXYxSDE5ek0yMSA3aDJ2MUgyMXpNMjQgN2gxdjFIMjR6TTI2IDdoMXYxSDI2ek0yOCA3aDN2MUgyOHpNMzIgN2gxdjFIMzJ6TTQgOGgxdjFINHpNNiA4aDN2MUg2ek0xMCA4aDF2MUgxMHpNMTQgOGg1djFIMTR6TTIwIDhoMXYxSDIwek0yNCA4aDF2MUgyNHpNMjYgOGgxdjFIMjZ6TTI4IDhoM3YxSDI4ek0zMiA4aDF2MUgzMnpNNCA5aDF2MUg0ek0xMCA5aDF2MUgxMHpNMTUgOWgxdjFIMTV6TTE3IDloMXYxSDE3ek0yMSA5aDJ2MUgyMXpNMjQgOWgxdjFIMjR6TTI2IDloMXYxSDI2ek0zMiA5aDF2MUgzMnpNNCAxMGg3djFINHpNMTIgMTBoMXYxSDEyek0xNCAxMGgxdjFIMTR6TTE2IDEwaDF2MUgxNnpNMTggMTBoMXYxSDE4ek0yMCAxMGgxdjFIMjB6TTIyIDEwaDF2MUgyMnpNMjQgMTBoMXYxSDI0ek0yNiAxMGg3djFIMjZ6TTEyIDExaDJ2MUgxMnpNMTYgMTFoMnYxSDE2ek0xOSAxMWgxdjFIMTl6TTIyIDExaDJ2MUgyMnpNNCAxMmgxdjFINHpNNiAxMmgxdjFINnpNOSAxMmgydjFIOXpNMTUgMTJoMXYxSDE1ek0xNyAxMmgzdjFIMTd6TTI0IDEyaDN2MUgyNHpNMzAgMTJoMXYxSDMwek0zMiAxMmgxdjFIMzJ6TTYgMTNoMnYxSDZ6TTExIDEzaDF2MUgxMXpNMTMgMTNoMXYxSDEzek0xNiAxM2gxdjFIMTZ6TTE5IDEzaDJ2MUgxOXpNMjQgMTNoMXYxSDI0ek0yNyAxM2g1djFIMjd6TTQgMTRoMXYxSDR6TTcgMTRoMXYxSDd6TTkgMTRoNXYxSDl6TTE2IDE0aDF2MUgxNnpNMTggMTRoMnYxSDE4ek0yMSAxNGg0djFIMjF6TTI3IDE0aDR2MUgyN3pNMzIgMTRoMXYxSDMyek01IDE1aDF2MUg1ek03IDE1aDF2MUg3ek0xMyAxNWgxdjFIMTN6TTE2IDE1aDN2MUgxNnpNMjIgMTVoMXYxSDIyek0yNSAxNWgydjFIMjV6TTMwIDE1aDF2MUgzMHpNMzIgMTVoMXYxSDMyek01IDE2aDN2MUg1ek0xMCAxNmgxdjFIMTB6TTEzIDE2aDJ2MUgxM3pNMTcgMTZoMXYxSDE3ek0yMCAxNmgzdjFIMjB6TTI2IDE2aDF2MUgyNnpNMjggMTZoMXYxSDI4ek0zMiAxNmgxdjFIMzJ6TTUgMTdoMXYxSDV6TTggMTdoMXYxSDh6TTEyIDE3aDJ2MUgxMnpNMTUgMTdoMnYxSDE1ek0xOCAxN2gxdjFIMTh6TTIwIDE3aDJ2MUgyMHpNMjMgMTdoMnYxSDIzek0yNiAxN2gxdjFIMjZ6TTI4IDE3aDF2MUgyOHpNMzAgMTdoMXYxSDMwek01IDE4aDR2MUg1ek0xMCAxOGg0djFIMTB6TTE4IDE4aDR2MUgxOHpNMjYgMThoNHYxSDI2ek0zMSAxOGgydjFIMzF6TTQgMTloMXYxSDR6TTYgMTloMXYxSDZ6TTggMTloMnYxSDh6TTExIDE5aDF2MUgxMXpNMTQgMTloMnYxSDE0ek0xNyAxOWgzdjFIMTd6TTIxIDE5aDJ2MUgyMXpNMjUgMTloMnYxSDI1ek0yOSAxOWgydjFIMjl6TTMyIDE5aDF2MUgzMnpNNCAyMGgzdjFINHpNMTAgMjBoM3YxSDEwek0xNSAyMGgydjFIMTV6TTE4IDIwaDR2MUgxOHpNMjQgMjBoMnYxSDI0ek0yOSAyMGgxdjFIMjl6TTMxIDIwaDJ2MUgzMXpNNCAyMWg0djFINHpNOSAyMWgxdjFIOXpNMTMgMjFoMnYxSDEzek0xNyAyMWgxdjFIMTd6TTIxIDIxaDF2MUgyMXpNMjUgMjFoMnYxSDI1ek0yOSAyMWgydjFIMjl6TTQgMjJoMXYxSDR6TTYgMjJoMXYxSDZ6TTggMjJoM3YxSDh6TTE0IDIyaDJ2MUgxNHpNMTkgMjJoMnYxSDE5ek0yMyAyMmgxdjFIMjN6TTI1IDIyaDJ2MUgyNXpNMzAgMjJoMnYxSDMwek02IDIzaDF2MUg2ek0xMyAyM2gydjFIMTN6TTE2IDIzaDN2MUgxNnpNMjEgMjNoNHYxSDIxek0yNyAyM2gydjFIMjd6TTMyIDIzaDF2MUgzMnpNNSAyNGgxdjFINXpNNyAyNGgxdjFIN3pNMTAgMjRoMXYxSDEwek0xMiAyNGg0djFIMTJ6TTE3IDI0aDF2MUgxN3pNMjAgMjRoMnYxSDIwek0yMyAyNGg3djFIMjN6TTMxIDI0aDJ2MUgzMXpNMTkgMjVoMXYxSDE5ek0yMSAyNWgxdjFIMjF6TTI0IDI1aDF2MUgyNHpNMjggMjVoM3YxSDI4ek00IDI2aDd2MUg0ek0xMyAyNmgxdjFIMTN6TTE1IDI2aDN2MUgxNXpNMTkgMjZoNnYxSDE5ek0yNiAyNmgxdjFIMjZ6TTI4IDI2aDF2MUgyOHpNMzIgMjZoMXYxSDMyek00IDI3aDF2MUg0ek0xMCAyN2gxdjFIMTB6TTEyIDI3aDJ2MUgxMnpNMTcgMjdoNXYxSDE3ek0yMyAyN2gydjFIMjN6TTI4IDI3aDF2MUgyOHpNMzIgMjdoMXYxSDMyek00IDI4aDF2MUg0ek02IDI4aDN2MUg2ek0xMCAyOGgxdjFIMTB6TTE0IDI4aDJ2MUgxNHpNMTggMjhoMnYxSDE4ek0yMyAyOGg4djFIMjN6TTQgMjloMXYxSDR6TTYgMjloM3YxSDZ6TTEwIDI5aDF2MUgxMHpNMTQgMjloMnYxSDE0ek0yMiAyOWgxdjFIMjJ6TTI0IDI5aDJ2MUgyNHpNMjggMjloMnYxSDI4ek0zMSAyOWgydjFIMzF6TTQgMzBoMXYxSDR6TTYgMzBoM3YxSDZ6TTEwIDMwaDF2MUgxMHpNMTIgMzBoMXYxSDEyek0xNCAzMGgxdjFIMTR6TTIxIDMwaDF2MUgyMXpNMjUgMzBoMXYxSDI1ek0yOSAzMGgxdjFIMjl6TTQgMzFoMXYxSDR6TTEwIDMxaDF2MUgxMHpNMTMgMzFoMXYxSDEzek0xNyAzMWgxdjFIMTd6TTIxIDMxaDF2MUgyMXpNMjQgMzFoMXYxSDI0ek0yOCAzMWgxdjFIMjh6TTMwIDMxaDF2MUgzMHpNNCAzMmg3djFINHpNMTIgMzJoM3YxSDEyek0xNiAzMmgzdjFIMTZ6TTIwIDMyaDN2MUgyMHpNMjUgMzJoNnYxSDI1ek0zMiAzMmgxdjFIMzJ6Ii8+PC9zdmc+";

function buildHtml(
  jsonPath = path.join(process.cwd(), 'dist', 'xieyin_results.json'),
  outputHtmlPath = path.join(process.cwd(), 'dist', 'index.html'),
  copyToRoot = true
) {
  console.log(`[Builder JS] 读取挖掘成果 JSON: ${jsonPath} ...`);
  const content = fs.readFileSync(jsonPath, 'utf-8');
  const dataJson = JSON.parse(content);
  if (dataJson.schema_version !== 2 || !Array.isArray(dataJson.results)) {
    throw new Error(`挖掘结果格式无效：${jsonPath}`);
  }
  const qrCodeDataUrl = PROJECT_QR_DATA_URL;
  const reviewPath = path.join(process.cwd(), 'data', 'quality', 'manual_review.json');
  const reviewPayload = fs.existsSync(reviewPath)
    ? JSON.parse(fs.readFileSync(reviewPath, 'utf8'))
    : { reviewed_count: 0, passed_count: 0 };

  const allItems = [];
  const uniqueWordsSet = new Set();

  for (const item of dataJson.results) {
    allItems.push({
        id: allItems.length,
        doc: `《${item.work_title}》`,
        work: item.work_title,
        author: item.author,
        dynasty: item.dynasty,
        stage: item.school_stage,
        grade: item.grade,
        semester: item.semester,
        textbookLocation: item.textbook_location,
        tier: item.familiarity_tier,
        familiarityScore: item.familiarity_score,
        textSourceUrl: item.text_source_url,
        orig: item.pun_sentence.replace(`【${item.replaced_word}】`, item.original_text),
        pun: item.pun_sentence,
        oText: item.original_text,
        kw: item.replaced_word,
        pyO: item.pinyin_orig,
        pyT: item.pinyin_target,
        sameTone: item.is_same_tone,
        modernScore: item.modern_score,
        qualityScore: item.quality_score,
        source: item.modern_source,
        category: item.category,
        curated: item.curated,
        wordCount: item.word_count,
        contextDiversity: item.context_diversity,
        zipf: item.zipf
      });
    uniqueWordsSet.add(item.replaced_word);
  }

  const jsonEmbedded = JSON.stringify(allItems);
  const pinyinCollator = new Intl.Collator('zh-CN-u-co-pinyin');
  const wordsList = Array.from(uniqueWordsSet).sort((a, b) => pinyinCollator.compare(a, b));
  const sameToneWordsList = Array.from(new Set(
    allItems.filter(item => item.sameTone).map(item => item.kw)
  )).sort((a, b) => pinyinCollator.compare(a, b));
  const wordsEmbedded = JSON.stringify(wordsList);
  const sameToneWordsEmbedded = JSON.stringify(sameToneWordsList);
  const qrCodeEmbedded = JSON.stringify(qrCodeDataUrl);
  const projectUrlEmbedded = JSON.stringify(PROJECT_URL);
  const totalWorkCount = dataJson.corpus_summary.total_works;
  const reviewRate = reviewPayload.reviewed_count
    ? Math.round(reviewPayload.passed_count / reviewPayload.reviewed_count * 100)
    : 0;
  const reviewCount = reviewPayload.reviewed_count || 0;

  const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>古籍谐音梗追踪器</title>
  <script
    defer
    src="https://cloud.umami.is/script.js"
    data-website-id="e01c9f78-4607-4e60-b01c-77c8190b12b4"
    data-domains="holynova.github.io"
    data-exclude-search="true"
    data-exclude-hash="true"
  ></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@700;800&family=Noto+Serif+SC:wght@700;900&display=swap" rel="stylesheet">
  <style>
    :root {
      color-scheme: light;
      --paper: #fff4dd;
      --ink: #26201a;
      --ink-2: #5c5347;
      --ink-3: #877b6b;
      --accent: #ff5c2b;
      --sun: #ffd84d;
      --rose: #ffb9cc;
      --sky: #a5dcff;
      --card: #fffdf7;
      --border: 2px solid var(--ink);
      --shadow: 4px 4px 0 var(--ink);
      --shadow-sm: 3px 3px 0 var(--ink);
      --radius: 14px;
      --font-display: "Baloo 2", "Arial Rounded MT Bold", "Noto Serif SC", serif;
      --font-body: system-ui, -apple-system, "Segoe UI", sans-serif;
      --font-mono: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { background: var(--paper); color: var(--ink); font-family: var(--font-body); line-height: 1.55; }
    .mono { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
    .page { max-width: 880px; margin: 0 auto; padding: 0 24px 72px; }

    .masthead { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 34px 0 16px; border-bottom: 1px solid rgba(38,32,26,0.15); margin-bottom: 32px; }
    .masthead-brand { display: flex; align-items: center; gap: 14px; }
    .masthead-avatar { width: 52px; height: 52px; border-radius: 50%; border: var(--border); box-shadow: var(--shadow-sm); background: var(--sun); display: flex; align-items: center; justify-content: center; font-size: 26px; transform: rotate(-4deg); }
    .masthead-title { font-family: var(--font-display); font-size: clamp(24px, 4.5vw, 34px); font-weight: 800; line-height: 1.05; }
    .masthead-tagline { font-size: 13px; font-style: italic; color: var(--ink-2); margin-top: 2px; }
    
    .github-link-btn { display: inline-flex; align-items: center; gap: 8px; background: var(--card); border: var(--border); border-radius: 10px; padding: 8px 14px; font-family: var(--font-display); font-size: 13px; font-weight: 800; color: var(--ink); text-decoration: none; box-shadow: var(--shadow-sm); transition: all 0.15s ease; white-space: nowrap; }
    .github-link-btn:hover { background: var(--sun); transform: translate(-1px, -1px); box-shadow: var(--shadow); }
    .github-link-btn:active { transform: translate(1px, 1px); box-shadow: none; }

    .hero-explainer { max-width: 58ch; color: var(--ink-2); font-size: 17px; margin-bottom: 24px; }
    .hero-card { background: var(--card); background-image: radial-gradient(rgba(38, 32, 26, 0.12) 1.5px, transparent 1.5px); background-size: 18px 18px; border: var(--border); border-radius: var(--radius); box-shadow: 6px 6px 0 var(--ink); padding: 26px 30px 30px; transform: rotate(-0.4deg); margin-bottom: 32px; }
    .hero-label { font-family: var(--font-mono); font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink-2); margin-bottom: 14px; display: block; }
    .hero-figure { display: inline-block; font-family: 'Noto Serif SC', serif; font-weight: 900; font-size: clamp(24px, 4.5vw, 40px); color: var(--ink); background: var(--sun); padding: 4px 18px 8px; border-radius: 12px; border: var(--border); box-shadow: var(--shadow-sm); transform: rotate(-1.2deg); }
    .hero-sub { margin-top: 16px; font-family: var(--font-mono); font-size: 13px; color: var(--ink-3); }

    .stat-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin-bottom: 40px; }
    .stat-tile { border: var(--border); border-radius: var(--radius); box-shadow: var(--shadow); padding: 14px 18px 16px; }
    .stat-tile--sun { background: var(--sun); transform: rotate(-1deg); }
    .stat-tile--rose { background: var(--rose); transform: rotate(0.8deg); }
    .stat-tile--sky { background: var(--sky); transform: rotate(-0.6deg); }
    .stat-tile dt { font-family: var(--font-mono); font-size: 11px; text-transform: uppercase; opacity: 0.8; margin-bottom: 4px; }
    .stat-tile dd { font-family: var(--font-display); font-size: 32px; font-weight: 800; }

    .word-cloud-card { background: var(--card); border: var(--border); border-radius: var(--radius); box-shadow: var(--shadow); padding: 24px 28px; margin-bottom: 36px; }
    .word-cloud-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; border-bottom: 1.5px dashed rgba(38,32,26,0.2); padding-bottom: 12px; }
    .word-cloud-title { font-family: var(--font-display); font-size: 20px; font-weight: 800; display: flex; align-items: center; gap: 8px; }
    .word-cloud-sub { font-family: var(--font-mono); font-size: 12px; color: var(--ink-3); }
    .word-tags-container { display: flex; flex-wrap: wrap; gap: 8px; max-height: 220px; overflow-y: auto; padding: 4px; }
    .word-tags-container::-webkit-scrollbar { width: 6px; }
    .word-tags-container::-webkit-scrollbar-thumb { background: var(--ink-3); border-radius: 4px; }
    .word-tag-sticker { background: var(--paper); border: 1.5px solid var(--ink); padding: 3px 10px; border-radius: 8px; font-family: var(--font-display); font-size: 13px; font-weight: 700; color: var(--ink); cursor: pointer; box-shadow: 2px 2px 0 var(--ink); transition: all 0.15s ease; user-select: none; }
    .word-tag-sticker:hover { background: var(--sun); transform: translate(-1px, -1px); box-shadow: 3px 3px 0 var(--ink); }
    .word-tag-sticker:active { transform: translate(1px, 1px); box-shadow: 1px 1px 0 var(--ink); }

    .filter-card { background: var(--card); border: var(--border); border-radius: var(--radius); box-shadow: var(--shadow-sm); padding: 20px; margin-bottom: 32px; }
    .search-input { width: 100%; background: var(--paper); border: var(--border); border-radius: 10px; padding: 12px 16px; font-size: 15px; outline: none; margin-bottom: 14px; }
    .filter-group { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-top: 12px; }
    .filter-group:first-of-type { margin-top: 0; }
    .filter-label { min-width: 68px; font-family: var(--font-mono); font-size: 12px; color: var(--ink-3); }
    .category-pills { display: flex; gap: 8px; flex-wrap: wrap; }
    .pill-btn { background: var(--paper); border: var(--border); color: var(--ink); padding: 6px 14px; border-radius: 999px; font-family: var(--font-display); font-size: 13px; font-weight: 700; cursor: pointer; box-shadow: 2px 2px 0 var(--ink); }
    .pill-btn.active { background: var(--accent); color: #fff; transform: translate(2px, 2px); box-shadow: 0 0 0 var(--ink); }
    .pill-count { margin-left: 3px; font-family: var(--font-mono); font-size: 10px; font-weight: 700; opacity: 0.72; white-space: nowrap; }
    .pill-btn.active .pill-count { opacity: 0.92; }
    .filter-note { margin: 14px 0 0 78px; font-family: var(--font-mono); font-size: 11px; color: var(--ink-3); }

    .section-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 18px; }
    .section-head h2 { font-family: var(--font-display); font-size: 24px; font-weight: 800; }
    .section-sub { font-family: var(--font-mono); font-size: 13px; color: var(--ink-3); }

    .log-list { display: flex; flex-direction: column; gap: 20px; }
    .log-card { background: var(--card); border: var(--border); border-radius: var(--radius); box-shadow: var(--shadow); padding: 22px 26px; }
    .log-meta { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .log-meta-main { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .doc-badge { font-family: var(--font-mono); font-size: 12px; font-weight: 700; background: var(--sky); border: 1.5px solid var(--ink); padding: 2px 10px; border-radius: 999px; box-shadow: 2px 2px 0 var(--ink); }
    .tier-badge { font-family: var(--font-mono); font-size: 10px; font-weight: 800; padding: 2px 7px; border: 1.5px solid var(--ink); border-radius: 6px; background: var(--sun); }
    .tier-badge--b { background: var(--rose); }
    .work-byline { color: var(--ink-3); font-family: var(--font-mono); font-size: 12px; margin: -4px 0 10px; }
    .type-badge { font-family: var(--font-mono); font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 6px; border: 1.5px solid var(--ink); }
    .type-badge--same { background: var(--sun); }
    .type-badge--diff { background: var(--paper); }

    .orig-text { font-size: 14px; color: var(--ink-2); margin-bottom: 6px; }
    .pun-text { font-family: 'Noto Serif SC', serif; font-size: 20px; font-weight: 900; color: var(--ink); margin-bottom: 16px; line-height: 1.4; }
    .pun-sticker { background: var(--sun); border: 1.5px solid var(--ink); padding: 0 8px; border-radius: 6px; box-shadow: 2px 2px 0 var(--ink); display: inline-block; margin: 0 2px; }

    .mono-breakdown { font-family: var(--font-mono); font-size: 12px; background: var(--paper); border: var(--border); border-radius: 10px; padding: 10px 14px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
    .result-actions { display: flex; align-items: center; gap: 8px; flex: 0 0 auto; }
    .btn-action { min-height: 40px; background: var(--card); color: var(--ink); border: var(--border); border-radius: 8px; padding: 7px 12px; font-family: var(--font-display); font-size: 12px; font-weight: 800; cursor: pointer; box-shadow: 2px 2px 0 var(--ink); transition: transform 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease; touch-action: manipulation; white-space: nowrap; }
    .btn-action--share { background: var(--sun); }
    .btn-action:active { transform: translate(2px, 2px); box-shadow: none; }
    .btn-action:focus-visible, .share-close:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }

    .pagination { display: flex; justify-content: center; align-items: center; gap: 16px; margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(38,32,26,0.15); }
    .page-btn { background: var(--card); border: var(--border); padding: 8px 18px; border-radius: 10px; font-family: var(--font-display); font-weight: 800; font-size: 14px; cursor: pointer; box-shadow: 3px 3px 0 var(--ink); transition: all 0.15s ease; }
    .page-btn:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; transform: none; }
    .page-btn:not(:disabled):active { transform: translate(2px, 2px); box-shadow: 0 0 0 var(--ink); }
    .page-info { font-family: var(--font-mono); font-size: 14px; font-weight: 700; color: var(--ink-2); }

    .share-modal[hidden] { display: none; }
    .share-modal { position: fixed; inset: 0; z-index: 900; display: grid; place-items: center; padding: max(18px, env(safe-area-inset-top)) 18px max(18px, env(safe-area-inset-bottom)); }
    .share-backdrop { position: absolute; inset: 0; background: rgba(38, 32, 26, 0.72); }
    .share-dialog { position: relative; width: min(100%, 440px); max-height: calc(100dvh - 36px); overflow: auto; overscroll-behavior: contain; background: var(--card); border: var(--border); border-radius: 18px; box-shadow: 8px 8px 0 var(--ink); padding: 18px; }
    .share-dialog-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; margin-bottom: 14px; }
    .share-dialog-title { font-family: var(--font-display); font-size: 22px; font-weight: 800; line-height: 1.1; }
    .share-dialog-sub { margin-top: 3px; font-family: var(--font-mono); font-size: 11px; color: var(--ink-3); }
    .share-close { width: 40px; height: 40px; flex: 0 0 40px; display: grid; place-items: center; background: var(--paper); color: var(--ink); border: var(--border); border-radius: 50%; box-shadow: 2px 2px 0 var(--ink); font-size: 22px; line-height: 1; cursor: pointer; touch-action: manipulation; }
    .share-stage { position: relative; aspect-ratio: 3 / 4; display: grid; place-items: center; overflow: hidden; background: var(--paper); border: var(--border); border-radius: 12px; box-shadow: var(--shadow-sm); }
    .share-preview { display: block; width: 100%; height: 100%; object-fit: contain; }
    .share-loading { font-family: var(--font-mono); font-size: 12px; color: var(--ink-3); }
    .share-dialog-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 16px; }
    .share-dialog-actions .btn-action { min-height: 46px; display: flex; align-items: center; justify-content: center; font-size: 14px; text-decoration: none; }
    .share-save { background: var(--accent); color: #fff; }
    .share-save[aria-disabled="true"] { opacity: 0.45; pointer-events: none; box-shadow: none; }
    .share-note { margin-top: 10px; color: var(--ink-3); font-size: 12px; text-align: center; }
    body.modal-open { overflow: hidden; }

    .toast { position: fixed; bottom: 24px; right: 24px; background: var(--ink); color: var(--paper); border: var(--border); box-shadow: var(--shadow); padding: 10px 20px; border-radius: 10px; font-family: var(--font-display); font-weight: 800; font-size: 14px; transform: translateY(100px); opacity: 0; transition: transform 0.25s ease, opacity 0.25s ease; z-index: 1000; }
    .toast.show { transform: translateY(0); opacity: 1; }

    @media (hover: hover) {
      .btn-action:hover { background: var(--rose); transform: translate(-1px, -1px); box-shadow: 3px 3px 0 var(--ink); }
      .btn-action--share:hover { background: var(--sky); }
    }

    @media (max-width: 600px) {
      .page { padding: 0 16px 56px; }
      .masthead { align-items: flex-start; padding-top: 22px; margin-bottom: 24px; }
      .masthead-avatar { width: 44px; height: 44px; font-size: 22px; }
      .masthead-tagline { max-width: 24ch; }
      .github-link-btn { padding: 8px 10px; }
      .github-link-btn span { display: none; }
      .hero-card, .log-card { padding: 20px; }
      .stat-row { grid-template-columns: 1fr; gap: 12px; }
      .word-cloud-card { padding: 20px; }
      .word-cloud-header, .section-head { align-items: flex-start; flex-direction: column; gap: 6px; }
      .filter-group { align-items: flex-start; flex-direction: column; }
      .filter-note { margin-left: 0; }
      .mono-breakdown { align-items: stretch; flex-direction: column; }
      .result-actions { width: 100%; }
      .result-actions .btn-action { flex: 1; }
      .share-dialog { padding: 15px; }
    }

    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { scroll-behavior: auto !important; animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
    }
  </style>
</head>
<body>

<div class="page">
  <header class="masthead">
    <div class="masthead-brand">
      <div class="masthead-avatar">🎯</div>
      <div>
        <h1 class="masthead-title">古籍谐音梗追踪器</h1>
        <p class="masthead-tagline">从课本与熟知古籍中寻找现代汉语谐音表达 &middot; 点击词语即可筛选</p>
      </div>
    </div>
    <a href="https://github.com/holynova/xieyin" target="_blank" class="github-link-btn">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
      <span>项目源码</span>
    </a>
  </header>

  <main>
    <section class="hero">
      <p class="hero-explainer">
        合并小学、初中、高中课本经典与原版熟知古籍找谐音。默认展示<strong>全部经典</strong>的<strong>同音同调</strong>结果，也可以按来源层级与学习阶段筛选。
      </p>

      <div class="hero-card">
        <span class="hero-label">典籍反差梗示范</span>
        <span class="hero-figure">【得到】者多助，失道者寡助。</span>
        <p class="hero-sub">《得道多助失道寡助》「得道」(dé dào) ── 现代常用词「得到」(dé dào)</p>
      </div>

      <dl class="stat-row">
        <div class="stat-tile stat-tile--sun">
          <dt>合并经典来源</dt>
          <dd class="mono">${totalWorkCount} 篇/段</dd>
        </div>
        <div class="stat-tile stat-tile--rose">
          <dt>人工抽查通过率</dt>
          <dd class="mono">${reviewRate}%</dd>
        </div>
        <div class="stat-tile stat-tile--sky">
          <dt>分层抽查样本</dt>
          <dd class="mono">${reviewCount} 条</dd>
        </div>
      </dl>
    </section>

    <section class="word-cloud-card">
      <div class="word-cloud-header">
        <div class="word-cloud-title">
          <span>📦 候选现代词</span>
        </div>
        <span class="word-cloud-sub">词频、语境覆盖度与人工审核后的候选词（点击可过滤）</span>
      </div>
      <div class="word-tags-container" id="wordTagsContainer"></div>
    </section>

    <section class="filter-card">
      <input type="text" class="search-input" id="searchInput" placeholder="搜索现代词、原词、篇名、作者或课本年级...">
      <div class="filter-group">
        <span class="filter-label">匹配方式</span>
        <div class="category-pills" id="tonePills">
          <button class="pill-btn active" data-tone="same">同音同调 <span class="pill-count" data-tone-count="same"></span></button>
          <button class="pill-btn" data-tone="all">包含异调 <span class="pill-count" data-tone-count="all"></span></button>
        </div>
      </div>
      <div class="filter-group">
        <span class="filter-label">内容范围</span>
        <div class="category-pills" id="scopePills">
          <button class="pill-btn active" data-scope="ALL">全部 <span class="pill-count" data-scope-count="ALL"></span></button>
          <button class="pill-btn" data-scope="A">课本 <span class="pill-count" data-scope-count="A"></span></button>
          <button class="pill-btn" data-scope="小学">小学 <span class="pill-count" data-scope-count="小学"></span></button>
          <button class="pill-btn" data-scope="初中">初中 <span class="pill-count" data-scope-count="初中"></span></button>
          <button class="pill-btn" data-scope="高中">高中 <span class="pill-count" data-scope-count="高中"></span></button>
          <button class="pill-btn" data-scope="B">课外经典 <span class="pill-count" data-scope-count="B"></span></button>
        </div>
      </div>
      <p class="filter-note">搜索匹配词条与篇目信息，不扫描整句上下文。数字为匹配结果条数，“全部”已合并重复内容。</p>
    </section>

    <div class="section-head">
      <h2>经典谐音结果</h2>
      <span class="section-sub" id="resultSummary">正在加载数据...</span>
    </div>

    <div class="log-list" id="punList"></div>

    <div class="pagination">
      <button class="page-btn" id="prevBtn">&larr; 上一页</button>
      <span class="page-info" id="pageInfo">第 1 / 1 页</span>
      <button class="page-btn" id="nextBtn">下一页 &rarr;</button>
    </div>
  </main>
</div>

<div class="toast" id="toast">梗句已成功复制！</div>

<div class="share-modal" id="shareModal" hidden>
  <div class="share-backdrop" data-share-close></div>
  <section class="share-dialog" role="dialog" aria-modal="true" aria-labelledby="shareDialogTitle">
    <header class="share-dialog-head">
      <div>
        <h2 class="share-dialog-title" id="shareDialogTitle">分享这条谐音梗</h2>
        <p class="share-dialog-sub">1080 × 1440 PNG · 适合手机查看</p>
      </div>
      <button class="share-close" type="button" aria-label="关闭分享卡片" data-share-close>&times;</button>
    </header>
    <div class="share-stage">
      <p class="share-loading" id="shareLoading">正在排版卡片...</p>
      <img class="share-preview" id="sharePreview" width="1080" height="1440" alt="当前谐音匹配的分享卡片预览" hidden>
    </div>
    <div class="share-dialog-actions">
      <a class="btn-action share-save" id="saveShareBtn" aria-disabled="true">保存图片</a>
      <button class="btn-action" id="systemShareBtn" type="button" hidden>系统分享</button>
    </div>
    <p class="share-note">图片已包含项目二维码，也可长按预览图保存</p>
  </section>
</div>

<script>
  const RAW_DATA = ${jsonEmbedded};
  const PROJECT_URL = ${projectUrlEmbedded};
  const QR_CODE_DATA_URL = ${qrCodeEmbedded};
  const SEARCH_FIELDS = ${JSON.stringify(SEARCH_FIELDS)};
  const WORDS_BY_TONE = {
    same: ${sameToneWordsEmbedded},
    all: ${wordsEmbedded}
  };
  const PINYIN_COLLATOR = new Intl.Collator('zh-CN-u-co-pinyin');

  let currentPage = 1;
  const pageSize = 15;
  let activeScope = 'ALL';
  let toneMode = 'same';
  let searchQuery = '';

  const punList = document.getElementById('punList');
  const searchInput = document.getElementById('searchInput');
  const scopePills = document.getElementById('scopePills');
  const tonePills = document.getElementById('tonePills');
  const toast = document.getElementById('toast');
  const pageInfo = document.getElementById('pageInfo');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const resultSummary = document.getElementById('resultSummary');
  const wordTagsContainer = document.getElementById('wordTagsContainer');
  const shareModal = document.getElementById('shareModal');
  const shareDialog = shareModal.querySelector('.share-dialog');
  const sharePreview = document.getElementById('sharePreview');
  const shareLoading = document.getElementById('shareLoading');
  const saveShareBtn = document.getElementById('saveShareBtn');
  const systemShareBtn = document.getElementById('systemShareBtn');
  let activeShareDataUrl = '';
  let activeDownloadUrl = '';
  let activeShareItem = null;
  let lastFocusedElement = null;

  function matchesScope(item, scope = activeScope) {
    if (scope === 'ALL') return true;
    if (scope === 'A' || scope === 'B') return item.tier === scope;
    return item.tier === 'A' && item.stage === scope;
  }

  function matchesSearch(item) {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const haystack = SEARCH_FIELDS.map(field => item[field] || '').join(' ').toLowerCase();
    return haystack.includes(q);
  }

  function filteredResults(tone = toneMode, scope = activeScope) {
    const matches = RAW_DATA.filter(item => {
      const matchTone = tone === 'all' || item.sameTone;
      return matchTone && matchesScope(item, scope) && matchesSearch(item);
    });
    if (scope !== 'ALL') return matches;
    const seen = new Set();
    return matches.filter(item => {
      const key = item.pun + '\u0000' + item.kw;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function updateFilterCounts() {
    tonePills.querySelectorAll('[data-tone-count]').forEach(element => {
      element.textContent = filteredResults(element.dataset.toneCount, activeScope).length.toLocaleString('zh-CN') + '条';
    });
    scopePills.querySelectorAll('[data-scope-count]').forEach(element => {
      element.textContent = filteredResults(toneMode, element.dataset.scopeCount).length.toLocaleString('zh-CN') + '条';
    });
  }

  function renderWordCloud() {
    const visibleWords = Array.from(new Set(RAW_DATA.filter(item => {
      const matchTone = toneMode === 'all' || item.sameTone;
      return matchTone && matchesScope(item);
    }).map(item => item.kw))).sort((a, b) => PINYIN_COLLATOR.compare(a, b));
    wordTagsContainer.innerHTML = visibleWords.map(word => {
      return \`<span class="word-tag-sticker" onclick="selectWord('\${word}')">\${word}</span>\`;
    }).join('');
  }

  function getFilteredData() {
    return filteredResults();
  }

  function selectWord(word) {
    searchInput.value = word;
    searchQuery = word;
    currentPage = 1;
    render();
    window.scrollTo({ top: 580, behavior: 'smooth' });
  }

  function render() {
    const filtered = getFilteredData();
    updateFilterCounts();

    const totalPages = Math.ceil(filtered.length / pageSize) || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    pageInfo.textContent = \`第 \${currentPage} / \${totalPages} 页 (共 \${filtered.length} 条梗)\`;
    resultSummary.textContent = \`共 \${filtered.length} 条 · 显示 \${filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} - \${Math.min(currentPage * pageSize, filtered.length)}\`;

    prevBtn.disabled = (currentPage <= 1);
    nextBtn.disabled = (currentPage >= totalPages);

    const start = (currentPage - 1) * pageSize;
    const pageItems = filtered.slice(start, start + pageSize);

    if (pageItems.length === 0) {
      punList.innerHTML = \`<div style="text-align:center; padding: 50px; color: var(--ink-3); font-family: var(--font-mono);">未搜索到符合条件的典籍谐音梗数据</div>\`;
      return;
    }

    punList.innerHTML = pageItems.map(item => {
      const formattedPun = item.pun.replace(\`【\${item.kw}】\`, \`<span class="pun-sticker">\${item.kw}</span>\`);
      const matchBadgeClass = item.sameTone ? 'type-badge--same' : 'type-badge--diff';
      const matchText = item.sameTone ? '全同音同调' : '全同音异调';

      return \`
        <div class="log-card">
          <div class="log-meta">
            <div class="log-meta-main">
              <span class="doc-badge">\${item.doc}</span>
              <span class="tier-badge \${item.tier === 'B' ? 'tier-badge--b' : ''}">\${item.tier}级</span>
            </div>
            <span class="type-badge \${matchBadgeClass}">\${matchText}</span>
          </div>
          <div class="work-byline">\${item.stage} · \${item.textbookLocation} · \${item.dynasty ? item.dynasty + ' · ' : ''}\${item.author}</div>

          <div class="orig-text">原文：\${item.orig}</div>
          <div class="pun-text">\${formattedPun}</div>

          <div class="mono-breakdown">
            <div>
              切片 <strong>\${item.oText}</strong> (\${item.pyO}) ──▶ 现代词 <strong>\${item.kw}</strong> (\${item.pyT})<br>
              现代词来源：\${item.source} · 现代度 \${item.modernScore}/100\${item.curated ? ' · 人工审核' : ''}
            </div>
            <div class="result-actions">
              <button class="btn-action" type="button" onclick="copyText(\${JSON.stringify(item.pun.replace(/【|】/g, ''))})">复制</button>
              <button class="btn-action btn-action--share" type="button" onclick="openShareCard(\${item.id})">生成分享卡</button>
            </div>
          </div>
        </div>
      \`;
    }).join('');
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 2000);
  }

  function copyText(text) {
    navigator.clipboard.writeText(text).then(() => showToast('梗句已复制'));
  }

  function roundedRect(ctx, x, y, width, height, radius, fill, stroke, lineWidth = 1) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    }
  }

  function buildPunLines(ctx, item, maxWidth) {
    const plainText = item.pun.replace(/【|】/g, '');
    const targetIndex = plainText.indexOf(item.kw);
    const tokens = [];
    Array.from(plainText.slice(0, targetIndex)).forEach(text => tokens.push({ text, highlight: false }));
    tokens.push({ text: item.kw, highlight: true });
    Array.from(plainText.slice(targetIndex + item.kw.length)).forEach(text => tokens.push({ text, highlight: false }));

    const lines = [];
    let line = [];
    let lineWidth = 0;
    for (const token of tokens) {
      const textWidth = ctx.measureText(token.text).width;
      const width = textWidth + (token.highlight ? 52 : 0);
      if (line.length && lineWidth + width > maxWidth) {
        lines.push({ tokens: line, width: lineWidth });
        line = [];
        lineWidth = 0;
      }
      line.push({ ...token, textWidth, width });
      lineWidth += width;
    }
    if (line.length) lines.push({ tokens: line, width: lineWidth });
    return lines;
  }

  function drawPunLines(ctx, item, centerX, startY, maxWidth, lineHeight, fontSize) {
    const lines = buildPunLines(ctx, item, maxWidth);
    lines.forEach((line, lineIndex) => {
      let x = centerX - line.width / 2;
      const baseline = startY + lineIndex * lineHeight;
      line.tokens.forEach(token => {
        if (token.highlight) {
          const highlightTop = baseline - fontSize * 0.9;
          const highlightHeight = fontSize * 1.18;
          const boxX = x + 14;
          const boxWidth = token.textWidth + 24;
          roundedRect(ctx, boxX + 6, highlightTop + 7, boxWidth, highlightHeight, 14, '#26201a');
          roundedRect(ctx, boxX, highlightTop, boxWidth, highlightHeight, 14, '#ffd84d', '#26201a', 4);
          ctx.fillStyle = '#26201a';
          ctx.fillText(token.text, boxX + 12, baseline);
        } else {
          ctx.fillStyle = '#26201a';
          ctx.fillText(token.text, x, baseline);
        }
        x += token.width;
      });
    });
    return lines.length;
  }

  function setFittedFont(ctx, text, maxWidth, maxSize, minSize, weight, family) {
    let size = maxSize;
    do {
      ctx.font = \`\${weight} \${size}px \${family}\`;
      if (ctx.measureText(text).width <= maxWidth) break;
      size -= 2;
    } while (size > minSize);
    return size;
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });
  }

  function drawTargetMark(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.08);
    ctx.fillStyle = '#ffd84d';
    ctx.strokeStyle = '#26201a';
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(0, 0, 48, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 29, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fillStyle = '#ff5c2b'; ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  function excerptAround(text, needle, maxLength = 58) {
    if (text.length <= maxLength) return text;
    const index = Math.max(0, text.indexOf(needle));
    const start = Math.max(0, Math.min(index - 18, text.length - maxLength));
    const end = Math.min(text.length, start + maxLength);
    return \`\${start > 0 ? '…' : ''}\${text.slice(start, end)}\${end < text.length ? '…' : ''}\`;
  }

  async function renderShareCard(item) {
    await document.fonts.ready;
    const plainPun = item.pun.replace(/【|】/g, '');
    const sharePunPlain = excerptAround(plainPun, item.kw);
    const cardItem = {
      ...item,
      pun: sharePunPlain.replace(item.kw, \`【\${item.kw}】\`)
    };
    const qrImage = await loadImage(QR_CODE_DATA_URL);
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1440;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#fff4dd';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(38, 32, 26, 0.10)';
    for (let y = 18; y < canvas.height; y += 34) {
      for (let x = 18; x < canvas.width; x += 34) {
        ctx.beginPath();
        ctx.arc(x, y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    roundedRect(ctx, 72, 72, 936, 1308, 34, '#26201a');
    roundedRect(ctx, 58, 58, 936, 1308, 34, '#fffdf7', '#26201a', 6);

    drawTargetMark(ctx, 138, 146);
    ctx.fillStyle = '#26201a';
    ctx.font = '800 50px "Baloo 2", "Noto Serif SC", serif';
    ctx.textAlign = 'left';
    ctx.fillText('古籍谐音梗追踪器', 214, 143);
    ctx.fillStyle = '#877b6b';
    ctx.font = '24px ui-monospace, "SF Mono", monospace';
    ctx.fillText('古人认真说，今人换个意思听', 216, 182);

    ctx.strokeStyle = 'rgba(38, 32, 26, 0.20)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(102, 236);
    ctx.lineTo(938, 236);
    ctx.stroke();

    roundedRect(ctx, 102, 274, 142, 50, 25, '#a5dcff', '#26201a', 4);
    ctx.fillStyle = '#26201a';
    ctx.font = '800 21px ui-monospace, "SF Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(\`\${item.stage} · \${item.tier}级\`, 173, 307);

    const workLine = item.doc.replace(/全本|全集|全篇精选/g, '');
    ctx.textAlign = 'left';
    setFittedFont(ctx, workLine, 664, 30, 18, 800, '"Noto Serif SC", "Songti SC", serif');
    ctx.fillStyle = '#26201a';
    ctx.fillText(workLine, 270, 307);
    ctx.fillStyle = '#877b6b';
    ctx.font = '22px ui-monospace, "SF Mono", monospace';
    ctx.fillText(\`\${item.textbookLocation} · \${item.author}\`, 270, 350);

    roundedRect(ctx, 116, 412, 836, 520, 28, '#26201a');
    roundedRect(ctx, 102, 398, 836, 520, 28, '#fff4dd', '#26201a', 6);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ff5c2b';
    ctx.font = '800 27px "Baloo 2", "Noto Serif SC", serif';
    ctx.fillText('换个说法，意思变了', 142, 466);

    const plainPunLength = cardItem.pun.replace(/【|】/g, '').length;
    const punFontSize = plainPunLength > 48 ? 44 : plainPunLength > 34 ? 50 : plainPunLength > 22 ? 58 : 68;
    ctx.font = \`900 \${punFontSize}px "Noto Serif SC", "Songti SC", serif\`;
    ctx.textAlign = 'left';
    const punLines = buildPunLines(ctx, cardItem, 720);
    const punLineHeight = punFontSize + 34;
    const punBlockHeight = (punLines.length - 1) * punLineHeight;
    const punStartY = 682 - punBlockHeight / 2;
    drawPunLines(ctx, cardItem, 520, punStartY, 720, punLineHeight, punFontSize);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#877b6b';
    ctx.font = '22px ui-monospace, "SF Mono", monospace';
    ctx.fillText(item.sameTone ? '全同音同调' : '全同音异调', 520, 870);

    roundedRect(ctx, 102, 978, 836, 146, 20, '#fff4dd', '#26201a', 4);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#877b6b';
    ctx.font = '700 21px ui-monospace, "SF Mono", monospace';
    ctx.fillText('原来的词', 144, 1024);
    ctx.fillText('现代词', 650, 1024);
    ctx.fillStyle = '#26201a';
    setFittedFont(ctx, item.oText, 250, 40, 26, 900, '"Noto Serif SC", "Songti SC", serif');
    ctx.fillText(item.oText, 144, 1082);
    ctx.fillStyle = '#ff5c2b';
    ctx.font = '800 38px "Baloo 2", "Noto Serif SC", serif';
    ctx.fillText('→', 500, 1080);
    ctx.fillStyle = '#26201a';
    setFittedFont(ctx, item.kw, 250, 40, 26, 900, '"Noto Serif SC", "Songti SC", serif');
    ctx.fillText(item.kw, 650, 1082);

    ctx.strokeStyle = 'rgba(38, 32, 26, 0.22)';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 10]);
    ctx.beginPath(); ctx.moveTo(102, 1174); ctx.lineTo(938, 1174); ctx.stroke();
    ctx.setLineDash([]);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#26201a';
    ctx.font = '800 32px "Baloo 2", "Noto Serif SC", serif';
    ctx.fillText('扫码，继续在课本里找梗', 112, 1245);
    ctx.fillStyle = '#877b6b';
    ctx.font = '20px ui-monospace, "SF Mono", monospace';
    ctx.fillText('holynova.github.io/xieyin/', 112, 1293);
    roundedRect(ctx, 790, 1198, 146, 146, 14, '#fffdf7', '#26201a', 4);
    ctx.drawImage(qrImage, 798, 1206, 130, 130);

    return canvas.toDataURL('image/png');
  }

  async function openShareCard(itemId) {
    const item = RAW_DATA.find(candidate => candidate.id === itemId);
    if (!item) return;
    lastFocusedElement = document.activeElement;
    activeShareItem = item;
    activeShareDataUrl = '';
    sharePreview.hidden = true;
    shareDialog.scrollTop = 0;
    shareLoading.textContent = '正在排版卡片...';
    shareLoading.hidden = false;
    if (activeDownloadUrl) URL.revokeObjectURL(activeDownloadUrl);
    activeDownloadUrl = '';
    saveShareBtn.removeAttribute('href');
    saveShareBtn.removeAttribute('download');
    saveShareBtn.setAttribute('aria-disabled', 'true');
    shareModal.hidden = false;
    document.body.classList.add('modal-open');
    shareModal.querySelector('.share-close').focus();

    try {
      activeShareDataUrl = await renderShareCard(item);
      sharePreview.src = activeShareDataUrl;
      sharePreview.hidden = false;
      shareLoading.hidden = true;
      const file = dataUrlToFile(activeShareDataUrl, shareFileName());
      activeDownloadUrl = URL.createObjectURL(file);
      saveShareBtn.href = activeDownloadUrl;
      saveShareBtn.download = file.name;
      saveShareBtn.setAttribute('aria-disabled', 'false');
    } catch (error) {
      console.error(error);
      shareLoading.textContent = '卡片生成失败，请刷新后重试';
    }
  }

  function closeShareCard() {
    shareModal.hidden = true;
    document.body.classList.remove('modal-open');
    if (lastFocusedElement) lastFocusedElement.focus();
  }

  function shareFileName() {
    const word = activeShareItem ? activeShareItem.kw : '谐音梗';
    return \`古籍谐音梗-\${word}.png\`;
  }

  function dataUrlToFile(dataUrl, fileName) {
    const [meta, body] = dataUrl.split(',');
    const mime = meta.match(/data:(.*?);/)[1];
    const bytes = atob(body);
    const buffer = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) buffer[i] = bytes.charCodeAt(i);
    return new File([buffer], fileName, { type: mime });
  }

  saveShareBtn.addEventListener('click', event => {
    if (!activeDownloadUrl) {
      event.preventDefault();
      return;
    }
    showToast('分享卡片已保存');
  });

  const supportsFileShare = (() => {
    if (!navigator.share || !navigator.canShare || typeof File === 'undefined') return false;
    try {
      return navigator.canShare({ files: [new File(['x'], 'x.png', { type: 'image/png' })] });
    } catch (_) {
      return false;
    }
  })();

  if (supportsFileShare) systemShareBtn.hidden = false;
  systemShareBtn.addEventListener('click', async () => {
    if (!activeShareDataUrl || !supportsFileShare) return;
    try {
      const file = dataUrlToFile(activeShareDataUrl, shareFileName());
      await navigator.share({ title: '古籍谐音梗', text: activeShareItem.pun.replace(/【|】/g, ''), files: [file] });
    } catch (error) {
      if (error.name !== 'AbortError') showToast('系统分享未完成');
    }
  });

  shareModal.querySelectorAll('[data-share-close]').forEach(element => element.addEventListener('click', closeShareCard));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !shareModal.hidden) closeShareCard();
  });

  prevBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      render();
      window.scrollTo({ top: 580, behavior: 'smooth' });
    }
  });

  nextBtn.addEventListener('click', () => {
    const filtered = getFilteredData();
    const totalPages = Math.ceil(filtered.length / pageSize) || 1;
    if (currentPage < totalPages) {
      currentPage++;
      render();
      window.scrollTo({ top: 580, behavior: 'smooth' });
    }
  });

  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    currentPage = 1;
    render();
  });

  scopePills.addEventListener('click', (e) => {
    const button = e.target.closest('.pill-btn');
    if (button && scopePills.contains(button)) {
      scopePills.querySelectorAll('.pill-btn').forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      activeScope = button.getAttribute('data-scope');
      currentPage = 1;
      renderWordCloud();
      render();
    }
  });

  tonePills.addEventListener('click', (e) => {
    const button = e.target.closest('.pill-btn');
    if (button && tonePills.contains(button)) {
      tonePills.querySelectorAll('.pill-btn').forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      toneMode = button.getAttribute('data-tone');
      currentPage = 1;
      renderWordCloud();
      render();
    }
  });

  renderWordCloud();
  render();
</script>
</body>
</html>
`;

  const distDir = path.dirname(outputHtmlPath);
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  fs.writeFileSync(outputHtmlPath, htmlContent, 'utf-8');
  console.log(`[Builder JS] 🎉 成功构建 HTML 前端页面: ${outputHtmlPath}！`);

  if (copyToRoot) {
    fs.writeFileSync(path.join(process.cwd(), 'index.html'), htmlContent, 'utf-8');
    console.log('[Builder JS] 已同步更新根目录 index.html！');
  }
}

module.exports = buildHtml;
module.exports.matchesSearchRecord = matchesSearchRecord;
module.exports.SEARCH_FIELDS = SEARCH_FIELDS;

if (require.main === module) {
  buildHtml();
}
