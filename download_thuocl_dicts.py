#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
从清华大学 THUOCL 官方 GitHub 下载真实网络热词、名人、财经、美食等权威开源词库
"""

import urllib.request
import os

FILES = [
    "THUOCL_IT.txt",
    "THUOCL_caijing.txt",
    "THUOCL_food.txt",
    "THUOCL_lishimingren.txt",
    "THUOCL_chengyu.txt"
]

os.makedirs("/Users/sym/Code/xieyin/thuocl_data", exist_ok=True)

for fname in FILES:
    url = f"https://raw.githubusercontent.com/thunlp/THUOCL/master/data/{fname}"
    dest = os.path.join("/Users/sym/Code/xieyin/thuocl_data", fname)
    print(f"正在下载: {fname} ...")
    try:
        urllib.request.urlretrieve(url, dest)
        print(f"成功保存 {fname}！")
    except Exception as e:
        print(f"下载 {fname} 失败: {e}")

