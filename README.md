# Codex Resets 古籍谐音梗追踪器 (Node.js JavaScript 版)

基于 **Node.js** 与 **Codex-Resets (Sticker-Sheet Neo-Brutalism)** 视觉系统的古籍典籍谐音梗挖掘与离线展示系统。

---

## 🏗️ 项目 JavaScript 架构设计 (Project Architecture)

项目整体已纯粹用 **JavaScript (Node.js)** 重构，保持职责明确的 3 层解耦架构：

```text
xieyin/
├── package.json                        # Node.js 项目配置文件与依赖 (pinyin-pro)
├── data/                               # 1. 独立数据源目录 (Data Layer)
│   ├── dictionaries/                   #    - 高频常用词库 & 清华 THUOCL 网络热词
│   └── corpus/                         #    - 古典名篇文本 JSON 库
│       ├── tang_shi.json               #      · 唐诗名篇
│       ├── song_ci.json                #      · 宋词名篇
│       ├── shi_jing.json               #      · 诗经全集名篇
│       ├── lun_yu.json                 #      · 论语全篇精选
│       ├── dao_de_jing.json            #      · 道德经八十一章全本
│       └── ci_fu.json                  #      · 历代名篇辞赋
│
├── src/                                # 2. JavaScript 源码模块 (Source Code)
│   ├── engine.js                       #    - JS 版核心算法 (不跨标点断句 + N对N完全对齐)
│   ├── miner.js                        #    - 阶段 1: 纯逻辑典籍梗挖掘器 (输出 dist/xieyin_results.json)
│   ├── builder.js                      #    - 阶段 2: 纯前端 HTML 页面构建器 (输出 dist/index.html)
│   └── prepareData.js                  #    - 典籍数据检查与准备
│
├── dist/                               # 3. 构建产物目录 (Build Output)
│   ├── xieyin_results.json             #    - 挖掘导出的全量谐音梗 JSON 结果
│   └── index.html                      #    - 构建生成的离线单文件 HTML 前端页面
│
├── build.js                            # 4. JavaScript 统一一键构建流水线 (node build.js)
├── design.md                           # 5. Neo-Brutalism 设计规范文档
├── CHANGELOG.md                        # 6. 版本变更日志
├── VERSION                             # 7. 当前版本号
└── README.md                           # 8. 项目说明文档
```

---

## ⚡ JavaScript 核心算法规则 (Core Engine Rules)

1. **绝对不跨标点断句**：
   - 使用 JavaScript 正则 `text.split(/([，。；？！、\n\r\t“”《》兮])/)` 进行切片，严禁跨标点截取字串。
2. **N字严格替换N字**：
   - 使用 Node.js 权威拼音库 `pinyin-pro` 提取音节，做到 $N$ 字替换 $N$ 字（声母与韵母逐字完全匹配）。
3. **100% 权威网络开源词库**：
   - 依赖清华大学 THUOCL 开源网络词库与 Jieba 34.9 万高频常用词库，绝无人工拼凑假词。

---

## 🚀 Node.js 一键构建与运行 (Build & Run)

### 1. 安装依赖

```bash
npm install
```

### 2. 运行 JavaScript 一键构建流水线

```bash
npm run build
# 或者
node build.js
```

构建流水线会自动完成：
1. 准备/校验 `data/` 目录中的词库与典籍；
2. 执行 `src/miner.js` 挖掘，输出 `dist/xieyin_results.json`；
3. 执行 `src/builder.js` 构建，生成 `dist/index.html` 并同步更新至根目录 `index.html`。

### 3. 预览网页

在本地启动静态服务器或直接打开 `index.html` / `dist/index.html`：

```bash
npx serve .
# 或者
python3 -m http.server 8080
```

访问 [http://localhost:8080](http://localhost:8080) 即可预览！
