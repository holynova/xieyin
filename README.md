# Codex Resets 古籍谐音梗追踪器

基于 **Codex-Resets (Sticker-Sheet Neo-Brutalism)** 视觉设计系统的古籍典籍谐音梗挖掘与离线展示系统。

---

## 🏗️ 项目架构设计 (Project Architecture)

项目采用了高内聚、低耦合的模块化设计，将 **数据定义 (data)**、**核心算法与流程 (src)**、**产物输出 (dist)** 完全分离：

```text
xieyin/
├── data/                               # 1. 数据源目录 (Data Layer)
│   ├── dictionaries/                   #    - 现代汉语常用词库 & 清华 THUOCL 网络热词
│   │   ├── high_freq.txt               #      · 34.9 万通用常用词
│   │   ├── THUOCL_IT.txt               #      · 清华网络热词
│   │   ├── THUOCL_food.txt             #      · 美食餐饮词
│   │   └── THUOCL_caijing.txt          #      · 财经金融词
│   └── corpus/                         #    - 古典名篇文本 JSON 库
│       ├── tang_shi.json               #      · 唐诗名篇
│       ├── song_ci.json                #      · 宋词名篇
│       ├── shi_jing.json               #      · 诗经全集名篇
│       ├── lun_yu.json                 #      · 论语全篇精选
│       ├── dao_de_jing.json            #      · 道德经八十一章全本
│       └── ci_fu.json                  #      · 历代名篇辞赋
│
├── src/                                # 2. 源代码模块 (Logic & Pipeline Layer)
│   ├── engine.py                       #    - 核心硬核谐音算法 (不跨标点断句 + N对N完全对齐)
│   ├── miner.py                        #    - 阶段 1: 纯逻辑典籍梗挖掘器 (输出 dist/xieyin_results.json)
│   ├── builder.py                      #    - 阶段 2: 纯前端 HTML 页面生成器 (输出 dist/index.html)
│   └── prepare_data.py                 #    - 辅助数据准备工具
│
├── dist/                               # 3. 构建产物目录 (Output / Artifacts)
│   ├── xieyin_results.json             #    - 挖掘导出的全量谐音梗 JSON 结果
│   └── index.html                      #    - 构建生成的离线单文件 HTML 前端页面
│
├── build.py                            # 4. 统一一键构建流水线 (One-Click Build Script)
├── design.md                           # 5. Neo-Brutalism 设计规范文档
├── CHANGELOG.md                        # 6. 版本变更日志
├── VERSION                             # 7. 当前版本号
└── README.md                           # 8. 项目说明文档
```

---

## ⚡ 核心匹配规则 (Core Rules)

1. **绝对不跨标点断句**：
   - 使用正则 `re.split(r'([，。；？！、\n\r\t“”《》兮])', text)` 子句切割，严禁将跨标点符号的字硬切组合。
2. **N字严格替换N字**：
   - 2字替代2字，3字替代3字，4字替代4字，拼音声母与韵母逐字完全匹配。
3. **100% 权威网络开源词库**：
   - 完全依赖清华大学 THUOCL 开源网络词库与 Jieba 34.9 万高频真实词库，绝无人工拼凑假词。

---

## 🚀 一键构建与运行 (Build & Run)

### 1. 运行一键构建流水线

```bash
python build.py
```

流水线会自动依次完成：
1. 准备/校验 `data/` 目录中的词库与典籍；
2. 执行 `src/miner.py` 挖掘，输出 `dist/xieyin_results.json`；
3. 执行 `src/builder.py` 构建，生成 `dist/index.html` 并同步更新至根目录 `index.html`。

### 2. 预览网页

在本地启动静态服务器或直接打开 `index.html` / `dist/index.html`：

```bash
python3 -m http.server 8080
```

然后在浏览器中访问 [http://localhost:8080](http://localhost:8080) 即可！
