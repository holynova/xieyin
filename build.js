/**
 * 统一一键构建流水线脚本 (build.js - Node.js JavaScript 版)
 * 支持运行：
 *   node build.js
 *   npm run build
 */

const prepareData = require('./src/prepareData');
const minePuns = require('./src/miner');
const buildHtml = require('./src/builder');

function main() {
  console.log("======================================================================");
  console.log("🚀 开始运行古籍谐音梗自动化构建流水线...");
  console.log("======================================================================\n");

  // 1. 数据准备阶段
  console.log("【步骤 1/3】准备典籍与词库数据...");
  prepareData();

  // 2. 逻辑挖掘阶段 (导出 JSON)
  console.log("\n【步骤 2/3】运行 Node.js 典籍谐音梗挖掘引擎导出 JSON 数据...");
  const jsonPath = minePuns();

  // 3. 前端构建阶段 (导出 HTML)
  console.log("\n【步骤 3/3】读取 JSON 构建静态 HTML 前端页面...");
  buildHtml(jsonPath);

  console.log("\n======================================================================");
  console.log("✨ Node.js 一键构建完全成功！产物已部署至 dist/ 与根目录 index.html！");
  console.log("======================================================================");
}

main();
