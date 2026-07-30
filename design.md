# Codex Resets (https://codex-resets.com/) 真实设计规范 (Design System)

本规范精准提取自 **Codex Resets** 的官方源码样式（Visual Thesis: **Sticker-Sheet Neo-Brutalism**）。

---

## 🎨 一、 核心视觉语言与材质 (Visual Identity)

1. **暖奶油纸基色彩 (Warm Cream Paper)**：
   - 全局背景为暖调奶油米色（`#fff4dd`），文字采用复古深墨棕黑（`#26201a`）。
2. **粗轮廓线与硬偏移阴影 (Thick Outlines & Hard Offset Shadows)**：
   - **边框 (Border)**：`2px solid #26201a`（2像素纯硬黑线）。
   - **投影 (Shadow)**：`4px 4px 0 #26201a`（物理 4px 4px 无模糊黑色偏移硬投影）。
3. **贴纸卡片与微妙倾斜 (Pastel Sticker Cards with Slight Rotation)**：
   - 卡片带有微微随机倾斜角度（`-0.4deg` / `0.8deg` / `-1.2deg`），营造轻松幽默的贴纸效果（Sticker-sheet feel）。
   - 核心数字/梗词带有鲜明暖黄色手贴底纹（`#ffd84d`）。
4. **物理按压反馈 (Physical Depress Feedback)**：
   - 按钮在点击/激活时下沉：`transform: translate(3px, 3px); box-shadow: 0 0 0 #26201a;`。

---

## 🎨 二、 官方精准色彩系统 (Color Tokens)

```css
:root {
  --paper: #fff4dd;        /* 全局暖纸背景 */
  --ink: #26201a;          /* 深度墨黑字与边框 */
  --ink-2: #5c5347;        /* 次级文本 */
  --ink-3: #877b6b;        /* 辅助/日期文本 */

  --accent: #ff5c2b;       /* 鲜热橙 (主按钮/高亮) */
  --sun: #ffd84d;          /* 太阳金黄 (核心焦点底纹/磁贴) */
  --rose: #ffb9cc;         /* 玫瑰暖粉 (流行梗词/标签) */
  --sky: #a5dcff;          /* 晴空天蓝 (典籍分类/链接) */
  --card: #fffdf7;         /* 卡片背景米白 */

  --border: 2px solid var(--ink);
  --shadow: 4px 4px 0 var(--ink);
  --shadow-sm: 3px 3px 0 var(--ink);
  --radius: 14px;

  --font-display: "Baloo 2", "Arial Rounded MT Bold", "Noto Serif SC", serif;
  --font-body: system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-mono: ui-monospace, "SF Mono", "Cascadia Code", Menlo, Consolas, monospace;
}
```

---

## 📐 三、 页面架构与组件规约

### 1. Masthead (顶栏)
- 左侧为带 2px 粗黑边边框与 3px 阴影的圆形 Avatar，带倾斜悬浮旋转效果（`transform: rotate(-4deg)`）。
- 主标题：`font-size: 32px; font-weight: 800;` 加上圆润的粗体 Display 字体。
- 右侧包含药丸型 Telegram / 订阅样式的硬阴影按钮。

### 2. Hero Box (核心大面板)
- 纸质微点背景：`background-image: radial-gradient(rgba(38, 32, 26, 0.1) 1.5px, transparent 1.5px);`。
- 大号数字/梗句带有倾斜金黄贴纸色（`background: var(--sun); transform: rotate(-1.2deg);`）。

### 3. Stat Row (3 三彩硬阴影磁贴)
- 并排 3 个倾斜度不同的色彩 Tile：
  - `.stat-tile--sun` (黄色 `#ffd84d`)
  - `.stat-tile--rose` (粉色 `#ffb9cc`)
  - `.stat-tile--sky` (天蓝 `#a5dcff`)
- Hover 时消除倾斜升起：`transform: rotate(0deg) translateY(-3px)`。

### 4. Pun Card List (谐音梗贴纸卡片列表)
- 每个卡片均带有 `2px solid #26201a` + `4px 4px 0 #26201a` 边框投影。
- 匹配成功的代换词采用 **Sun 暖黄贴纸底纹**。
- 音韵分析块（Phonetic alignment）采用 Mono 等宽字体。
