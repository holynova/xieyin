#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
一键构建流水线脚本 (build.py)
自动依次运行：
1. 数据提取 (src/prepare_data.py)
2. 典籍梗挖掘并生成 JSON 数据 (src/miner.py -> dist/xieyin_results.json)
3. 网页构建并生成 HTML 页面 (src/builder.py -> dist/index.html & index.html)
"""

import os
import sys

# 引入 src 路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))

from builder import build_html
from miner import mine_puns


def main():
    print(
        "======================================================================"
    )
    print("🚀 开始运行 Codex Resets 古籍谐音梗自动化构建流水线...")
    print(
        "======================================================================\n"
    )

    # 1. 运行准备数据
    print("【步骤 1/3】准备典籍与词库数据...")
    os.system(f"{sys.executable} src/prepare_data.py")

    # 2. 运行梗挖掘导出 JSON
    print("\n【步骤 2/3】运行典籍谐音梗挖掘引擎导出 JSON 数据...")
    json_path = mine_puns("dist/xieyin_results.json")

    # 3. 运行 HTML 构建
    print("\n【步骤 3/3】根据 JSON 数据生成静态 HTML 前端页面...")
    build_html(json_path=json_path, output_html_path="dist/index.html")

    print(
        "\n======================================================================"
    )
    print("✨ 一键构建完全成功！产物已部署至 dist/ 与根目录 index.html！")
    print(
        "======================================================================"
    )


if __name__ == "__main__":
    main()
