/**
 * 前端 HTML 构建器 (src/builder.js - Node.js JavaScript 版)
 * 职责：读取 dist/xieyin_results.json，生成离线单文件 HTML 网页
 * 特性：在 Masthead 中加入 GitHub Repo 链接按钮
 */

const fs = require('fs');
const path = require('path');

function buildHtml(
  jsonPath = path.join(process.cwd(), 'dist', 'xieyin_results.json'),
  outputHtmlPath = path.join(process.cwd(), 'dist', 'index.html'),
  copyToRoot = true
) {
  console.log(`[Builder JS] 读取挖掘成果 JSON: ${jsonPath} ...`);
  const content = fs.readFileSync(jsonPath, 'utf-8');
  const dataJson = JSON.parse(content);

  const allItems = [];
  const uniqueWordsSet = new Set();

  for (const [doc, items] of Object.entries(dataJson)) {
    for (const item of items) {
      allItems.push({
        doc: doc,
        orig: item.pun_sentence.replace(`【${item.replaced_word}】`, item.original_text),
        pun: item.pun_sentence,
        oText: item.original_text,
        kw: item.replaced_word,
        pyO: item.pinyin_orig,
        pyT: item.pinyin_target,
        sameTone: item.is_same_tone
      });
      uniqueWordsSet.add(item.replaced_word);
    }
  }

  const jsonEmbedded = JSON.stringify(allItems);
  const wordsList = Array.from(uniqueWordsSet);
  const wordsEmbedded = JSON.stringify(wordsList);
  const totalCount = allItems.length;
  const uniqueWordCount = wordsList.length;
  const sameToneCount = allItems.filter(i => i.sameTone).length;

  const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Codex Resets — 古籍典籍谐音梗追踪器</title>
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
    .category-pills { display: flex; gap: 8px; flex-wrap: wrap; }
    .pill-btn { background: var(--paper); border: var(--border); color: var(--ink); padding: 6px 14px; border-radius: 999px; font-family: var(--font-display); font-size: 13px; font-weight: 700; cursor: pointer; box-shadow: 2px 2px 0 var(--ink); }
    .pill-btn.active { background: var(--accent); color: #fff; transform: translate(2px, 2px); box-shadow: 0 0 0 var(--ink); }

    .section-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 18px; }
    .section-head h2 { font-family: var(--font-display); font-size: 24px; font-weight: 800; }
    .section-sub { font-family: var(--font-mono); font-size: 13px; color: var(--ink-3); }

    .log-list { display: flex; flex-direction: column; gap: 20px; }
    .log-card { background: var(--card); border: var(--border); border-radius: var(--radius); box-shadow: var(--shadow); padding: 22px 26px; }
    .log-meta { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .doc-badge { font-family: var(--font-mono); font-size: 12px; font-weight: 700; background: var(--sky); border: 1.5px solid var(--ink); padding: 2px 10px; border-radius: 999px; box-shadow: 2px 2px 0 var(--ink); }
    .type-badge { font-family: var(--font-mono); font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 6px; border: 1.5px solid var(--ink); }
    .type-badge--same { background: var(--sun); }
    .type-badge--diff { background: var(--paper); }

    .orig-text { font-size: 14px; color: var(--ink-2); margin-bottom: 6px; }
    .pun-text { font-family: 'Noto Serif SC', serif; font-size: 20px; font-weight: 900; color: var(--ink); margin-bottom: 16px; line-height: 1.4; }
    .pun-sticker { background: var(--sun); border: 1.5px solid var(--ink); padding: 0 8px; border-radius: 6px; box-shadow: 2px 2px 0 var(--ink); display: inline-block; margin: 0 2px; }

    .mono-breakdown { font-family: var(--font-mono); font-size: 12px; background: var(--paper); border: var(--border); border-radius: 10px; padding: 10px 14px; display: flex; align-items: center; justify-content: space-between; }
    .btn-copy { background: var(--card); border: var(--border); border-radius: 6px; padding: 3px 10px; font-family: var(--font-display); font-size: 12px; font-weight: 700; cursor: pointer; box-shadow: 2px 2px 0 var(--ink); }

    .pagination { display: flex; justify-content: center; align-items: center; gap: 16px; margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(38,32,26,0.15); }
    .page-btn { background: var(--card); border: var(--border); padding: 8px 18px; border-radius: 10px; font-family: var(--font-display); font-weight: 800; font-size: 14px; cursor: pointer; box-shadow: 3px 3px 0 var(--ink); transition: all 0.15s ease; }
    .page-btn:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; transform: none; }
    .page-btn:not(:disabled):active { transform: translate(2px, 2px); box-shadow: 0 0 0 var(--ink); }
    .page-info { font-family: var(--font-mono); font-size: 14px; font-weight: 700; color: var(--ink-2); }

    .toast { position: fixed; bottom: 24px; right: 24px; background: var(--ink); color: var(--paper); border: var(--border); box-shadow: var(--shadow); padding: 10px 20px; border-radius: 10px; font-family: var(--font-display); font-weight: 800; font-size: 14px; transform: translateY(100px); opacity: 0; transition: all 0.25s ease; z-index: 1000; }
    .toast.show { transform: translateY(0); opacity: 1; }
  </style>
</head>
<body>

<div class="page">
  <header class="masthead">
    <div class="masthead-brand">
      <div class="masthead-avatar">🎯</div>
      <div>
        <h1 class="masthead-title">Codex Resets · 古籍典籍谐音梗追踪器</h1>
        <p class="masthead-tagline">涵盖明星/电影/流行歌曲/地气现代词 &middot; 点击词汇标签即时过滤</p>
      </div>
    </div>
    <a href="https://github.com/holynova/xieyin" target="_blank" class="github-link-btn">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
      <span>GitHub Repo</span>
    </a>
  </header>

  <main>
    <section class="hero">
      <p class="hero-explainer">
        严守 <strong>不跨标点断句</strong> 与 <strong>N字对N字全音节对齐法则</strong>。
      </p>

      <div class="hero-card">
        <span class="hero-label">典籍反差梗示范</span>
        <span class="hero-figure">落霞与【鼓舞】齐飞，秋水共长天一色。</span>
        <p class="hero-sub">《滕王阁序》「孤鹜」(gū wù) ── 现代高频词《鼓舞》(gǔ wǔ)</p>
      </div>

      <dl class="stat-row">
        <div class="stat-tile stat-tile--sun">
          <dt>扫描发现总梗数</dt>
          <dd class="mono" id="statCount">${totalCount}</dd>
        </div>
        <div class="stat-tile stat-tile--rose">
          <dt>发现真现代词</dt>
          <dd class="mono">${uniqueWordCount} 个</dd>
        </div>
        <div class="stat-tile stat-tile--sky">
          <dt>完全同音同调梗</dt>
          <dd class="mono" id="statSameTone">${sameToneCount}</dd>
        </div>
      </dl>
    </section>

    <section class="word-cloud-card">
      <div class="word-cloud-header">
        <div class="word-cloud-title">
          <span>📦 扫描发现的全量现代词汇展示墙</span>
        </div>
        <span class="word-cloud-sub">共匹配到 ${uniqueWordCount} 个真现代词汇（点击可直接搜索过滤）</span>
      </div>
      <div class="word-tags-container" id="wordTagsContainer"></div>
    </section>

    <section class="filter-card">
      <input type="text" class="search-input" id="searchInput" placeholder="搜索任意现代词（如：晴天、加仓、同事、实习、离职、指导）、古籍...">
      <div class="category-pills" id="categoryPills">
        <button class="pill-btn active" data-cat="ALL">全部典籍 (${totalCount}条)</button>
        <button class="pill-btn" data-cat="《唐诗名篇全本》">《唐诗名篇》</button>
        <button class="pill-btn" data-cat="《宋词名篇全本》">《宋词名篇》</button>
        <button class="pill-btn" data-cat="《历代名篇辞赋》">《名篇辞赋》</button>
        <button class="pill-btn" data-cat="《道德经八十一章全本》">《道德经》</button>
        <button class="pill-btn" data-cat="《诗经全集名篇》">《诗经全集》</button>
        <button class="pill-btn" data-cat="《论语全篇精选》">《论语全篇》</button>
      </div>
    </section>

    <div class="section-head">
      <h2>典籍谐音梗日志列表</h2>
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

<script>
  const RAW_DATA = ${jsonEmbedded};
  const WORDS_LIST = ${wordsEmbedded};

  let currentPage = 1;
  const pageSize = 15;
  let activeCat = 'ALL';
  let searchQuery = '';

  const punList = document.getElementById('punList');
  const searchInput = document.getElementById('searchInput');
  const categoryPills = document.getElementById('categoryPills');
  const statCount = document.getElementById('statCount');
  const statSameTone = document.getElementById('statSameTone');
  const toast = document.getElementById('toast');
  const pageInfo = document.getElementById('pageInfo');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const resultSummary = document.getElementById('resultSummary');
  const wordTagsContainer = document.getElementById('wordTagsContainer');

  function renderWordCloud() {
    wordTagsContainer.innerHTML = WORDS_LIST.map(word => {
      return \`<span class="word-tag-sticker" onclick="selectWord('\${word}')">\${word}</span>\`;
    }).join('');
  }

  function selectWord(word) {
    searchInput.value = word;
    searchQuery = word;
    currentPage = 1;
    render();
    window.scrollTo({ top: 580, behavior: 'smooth' });
  }

  function render() {
    const filtered = RAW_DATA.filter(item => {
      const matchCat = activeCat === 'ALL' || item.doc === activeCat;
      const q = searchQuery.toLowerCase().trim();
      const matchQ = !q || item.pun.toLowerCase().includes(q) || item.orig.toLowerCase().includes(q) || item.kw.toLowerCase().includes(q) || item.oText.toLowerCase().includes(q);
      return matchCat && matchQ;
    });

    statCount.textContent = filtered.length;
    statSameTone.textContent = filtered.filter(i => i.sameTone).length;

    const totalPages = Math.ceil(filtered.length / pageSize) || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    pageInfo.textContent = \`第 \${currentPage} / \${totalPages} 页 (共 \${filtered.length} 条梗)\`;
    resultSummary.textContent = \`显示第 \${filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} - \${Math.min(currentPage * pageSize, filtered.length)} 条\`;

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
            <span class="doc-badge">\${item.doc}</span>
            <span class="type-badge \${matchBadgeClass}">\${matchText}</span>
          </div>

          <div class="orig-text">原文：\${item.orig}</div>
          <div class="pun-text">\${formattedPun}</div>

          <div class="mono-breakdown">
            <div>
              切片 <strong>\${item.oText}</strong> (\${item.pyO}) ──▶ 现代词 <strong>\${item.kw}</strong> (\${item.pyT})
            </div>
            <button class="btn-copy" onclick="copyText('\${item.pun.replace(/【|】/g, '')}')">复制</button>
          </div>
        </div>
      \`;
    }).join('');
  }

  function copyText(text) {
    navigator.clipboard.writeText(text).then(() => {
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2000);
    });
  }

  prevBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      render();
      window.scrollTo({ top: 580, behavior: 'smooth' });
    }
  });

  nextBtn.addEventListener('click', () => {
    const filtered = RAW_DATA.filter(item => {
      const matchCat = activeCat === 'ALL' || item.doc === activeCat;
      const q = searchQuery.toLowerCase().trim();
      return matchCat && (!q || item.pun.toLowerCase().includes(q) || item.orig.toLowerCase().includes(q) || item.kw.toLowerCase().includes(q));
    });
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

  categoryPills.addEventListener('click', (e) => {
    if (e.target.classList.contains('pill-btn')) {
      document.querySelectorAll('.pill-btn').forEach(btn => btn.classList.remove('active'));
      e.target.classList.add('active');
      activeCat = e.target.getAttribute('data-cat');
      currentPage = 1;
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

if (require.main === module) {
  buildHtml();
}
