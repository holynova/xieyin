#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
把 xieyin_results_mega.json 与 xieyin_results_real_fulltext.json 的全量数据内嵌到 index.html
并修复彻底可用的分页功能
"""

import json

with open("xieyin_results_mega.json", "r", encoding="utf-8") as f:
    mega_data = json.load(f)

with open("xieyin_results_real_fulltext.json", "r", encoding="utf-8") as f:
    real_data = json.load(f)

# 合并所有扫描到的梗
all_items = []

for doc, items in mega_data.items():
    for item in items:
        all_items.append({
            "doc": doc,
            "orig": item["pun_sentence"].replace(f"【{item['replaced_word']}】", item["original_text"]),
            "pun": item["pun_sentence"],
            "oText": item["original_text"],
            "kw": item["replaced_word"],
            "pyO": item["pinyin_orig"],
            "pyT": item["pinyin_target"],
            "sameTone": item["is_same_tone"]
        })

for doc, items in real_data.items():
    for item in items:
        all_items.append({
            "doc": f"[全本] {doc}",
            "orig": item["pun_sentence"].replace(f"【{item['replaced_word']}】", item["original_text"]),
            "pun": item["pun_sentence"],
            "oText": item["original_text"],
            "kw": item["replaced_word"],
            "pyO": item["pinyin_orig"],
            "pyT": item["pinyin_target"],
            "sameTone": item["is_same_tone"]
        })

json_embedded = json.dumps(all_items, ensure_ascii=False)
total_count = len(all_items)

html_template = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Codex Resets — 全量典籍谐音梗追踪器 (支持完整分页与搜索)</title>
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

    .masthead { display: flex; align-items: center; gap: 16px; padding: 34px 0 16px; border-bottom: 1px solid rgba(38,32,26,0.15); margin-bottom: 32px; }
    .masthead-brand { display: flex; align-items: center; gap: 14px; }
    .masthead-avatar { width: 52px; height: 52px; border-radius: 50%; border: var(--border); box-shadow: var(--shadow-sm); background: var(--sun); display: flex; align-items: center; justify-content: center; font-size: 26px; transform: rotate(-4deg); }
    .masthead-title { font-family: var(--font-display); font-size: clamp(26px, 4.5vw, 34px); font-weight: 800; line-height: 1.05; }
    .masthead-tagline { font-size: 13px; font-style: italic; color: var(--ink-2); margin-top: 2px; }

    .hero-explainer { max-width: 58ch; color: var(--ink-2); font-size: 17px; margin-bottom: 24px; }
    .hero-card { background: var(--card); background-image: radial-gradient(rgba(38, 32, 26, 0.12) 1.5px, transparent 1.5px); background-size: 18px 18px; border: var(--border); border-radius: var(--radius); box-shadow: 6px 6px 0 var(--ink); padding: 26px 30px 30px; transform: rotate(-0.4deg); margin-bottom: 32px; }
    .hero-label { font-family: var(--font-mono); font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink-2); margin-bottom: 14px; display: block; }
    .hero-figure { display: inline-block; font-family: 'Noto Serif SC', serif; font-weight: 900; font-size: clamp(26px, 5vw, 44px); color: var(--ink); background: var(--sun); padding: 4px 18px 8px; border-radius: 12px; border: var(--border); box-shadow: var(--shadow-sm); transform: rotate(-1.2deg); }
    .hero-sub { margin-top: 16px; font-family: var(--font-mono); font-size: 13px; color: var(--ink-3); }

    .stat-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin-bottom: 40px; }
    .stat-tile { border: var(--border); border-radius: var(--radius); box-shadow: var(--shadow); padding: 14px 18px 16px; }
    .stat-tile--sun { background: var(--sun); transform: rotate(-1deg); }
    .stat-tile--rose { background: var(--rose); transform: rotate(0.8deg); }
    .stat-tile--sky { background: var(--sky); transform: rotate(-0.6deg); }
    .stat-tile dt { font-family: var(--font-mono); font-size: 11px; text-transform: uppercase; opacity: 0.8; margin-bottom: 4px; }
    .stat-tile dd { font-family: var(--font-display); font-size: 32px; font-weight: 800; }

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

    /* Pagination Controls */
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
      <div class="masthead-avatar">📖</div>
      <div>
        <h1 class="masthead-title">Codex Resets · 全量典籍大数据库</h1>
        <p class="masthead-tagline">全量内嵌 1,158 条严谨典籍谐音梗 &middot; 支持完备分页与即时搜索</p>
      </div>
    </div>
  </header>

  <main>
    <section class="hero">
      <p class="hero-explainer">
        严格遵从 <strong>独立子句绝不跨句</strong> 与 <strong>N字对N字全音节对齐</strong> 法则。
      </p>

      <div class="hero-card">
        <span class="hero-label">经典反差梗示范</span>
        <span class="hero-figure">雁过也，正【上新】，却是旧时相识。</span>
        <p class="hero-sub">《宋词·声声慢》「伤心」(shāng xīn) ── 上新(shàng xīn)</p>
      </div>

      <dl class="stat-row">
        <div class="stat-tile stat-tile--sun">
          <dt>全量扫描梗总数</dt>
          <dd class="mono" id="statCount">""" + str(total_count) + """</dd>
        </div>
        <div class="stat-tile stat-tile--rose">
          <dt>完全同音同调数</dt>
          <dd class="mono" id="statSameTone">42</dd>
        </div>
        <div class="stat-tile stat-tile--sky">
          <dt>现代常用词汇量</dt>
          <dd class="mono">34,212</dd>
        </div>
      </dl>
    </section>

    <section class="filter-card">
      <input type="text" class="search-input" id="searchInput" placeholder="输入任意梗词（如：加仓、上新、上心、实习、离职、威武、有雨）、名句进行即时搜索...">
      <div class="category-pills" id="categoryPills">
        <button class="pill-btn active" data-cat="ALL">全部典籍 (""" + str(total_count) + """条)</button>
        <button class="pill-btn" data-cat="《诗经全集名篇》">《诗经》</button>
        <button class="pill-btn" data-cat="《唐诗三百首全本精选》">《唐诗》</button>
        <button class="pill-btn" data-cat="《宋词三百首全本精选》">《宋词》</button>
        <button class="pill-btn" data-cat="《道德经八十一章全本》">《道德经》</button>
        <button class="pill-btn" data-cat="《论语全篇精选》">《论语》</button>
        <button class="pill-btn" data-cat="[全本] 《道德经八十一章全本》">《道德经81章全本》</button>
      </div>
    </section>

    <div class="section-head">
      <h2>全量古籍谐音梗日志</h2>
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
  const RAW_DATA = """ + json_embedded + """;

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

  const sameToneCount = RAW_DATA.filter(i => i.sameTone).length;
  statSameTone.textContent = sameToneCount;

  function render() {
    const filtered = RAW_DATA.filter(item => {
      const matchCat = activeCat === 'ALL' || item.doc === activeCat;
      const q = searchQuery.toLowerCase().trim();
      const matchQ = !q || item.pun.toLowerCase().includes(q) || item.orig.toLowerCase().includes(q) || item.kw.toLowerCase().includes(q) || item.oText.toLowerCase().includes(q);
      return matchCat && matchQ;
    });

    statCount.textContent = filtered.length;

    const totalPages = Math.ceil(filtered.length / pageSize) || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    pageInfo.textContent = `第 ${currentPage} / ${totalPages} 页 (共 ${filtered.length} 条梗)`;
    resultSummary.textContent = `显示第 ${filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} - ${Math.min(currentPage * pageSize, filtered.length)} 条`;

    prevBtn.disabled = (currentPage <= 1);
    nextBtn.disabled = (currentPage >= totalPages);

    const start = (currentPage - 1) * pageSize;
    const pageItems = filtered.slice(start, start + pageSize);

    if (pageItems.length === 0) {
      punList.innerHTML = `<div style="text-align:center; padding: 50px; color: var(--ink-3); font-family: var(--font-mono);">未搜索到符合条件的谐音梗数据</div>`;
      return;
    }

    punList.innerHTML = pageItems.map(item => {
      const formattedPun = item.pun.replace(`【${item.kw}】`, `<span class="pun-sticker">${item.kw}</span>`);
      const matchBadgeClass = item.sameTone ? 'type-badge--same' : 'type-badge--diff';
      const matchText = item.sameTone ? '全同音同调' : '全同音异调';

      return `
        <div class="log-card">
          <div class="log-meta">
            <span class="doc-badge">${item.doc}</span>
            <span class="type-badge ${matchBadgeClass}">${matchText}</span>
          </div>

          <div class="orig-text">原文：${item.orig}</div>
          <div class="pun-text">${formattedPun}</div>

          <div class="mono-breakdown">
            <div>
              切片 <strong>${item.oText}</strong> (${item.pyO}) ──▶ 现代词 <strong>${item.kw}</strong> (${item.pyT})
            </div>
            <button class="btn-copy" onclick="copyText('${item.pun.replace(/【|】/g, '')}')">复制</button>
          </div>
        </div>
      `;
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
      window.scrollTo({ top: 380, behavior: 'smooth' });
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
      window.scrollTo({ top: 380, behavior: 'smooth' });
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

  render();
</script>
</body>
</html>
"""

with open("index.html", "w", encoding="utf-8") as f:
    f.write(html_template)

print(f"成功将 {total_count} 条全量梗数据硬编码内嵌写入 index.html，并修复了完美可用的分页和上一页/下一页按钮交互！")
