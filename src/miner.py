#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
典籍谐音梗挖掘器 (src/miner.py)
职责：纯粹的逻辑计算与梗查找，将分析出来的典籍梗保存导出为 dist/xieyin_results.json
"""

import json
import os
import re
from engine import HomophonicEngine


def load_all_dictionaries(dict_dir="data/dictionaries"):
    words_set = set()

    for fname in os.listdir(dict_dir):
        fpath = os.path.join(dict_dir, fname)
        if not os.path.isfile(fpath):
            continue
        with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
            for line in f:
                parts = line.strip().split()
                if not parts:
                    continue
                word = parts[0]
                if re.match(r"^[\u4e00-\u9fa5]{2,4}$", word):
                    words_set.add(word)

    pop_culture = [
        "成龙",
        "周杰伦",
        "刘德华",
        "薛之谦",
        "沈腾",
        "贾玲",
        "周星驰",
        "张学友",
        "甄子丹",
        "徐峥",
        "坤坤",
        "泰坦尼克",
        "阿凡达",
        "流浪地球",
        "热辣滚烫",
        "战狼",
        "满江红",
        "大话西游",
        "霸王别姬",
        "楚门的世界",
        "泰囧",
        "七里香",
        "晴天",
        "稻香",
        "青花瓷",
        "双截棍",
        "卡路里",
        "小苹果",
        "孤勇者",
        "野狼",
        "告白气球",
        "奢香夫人",
        "打工人",
        "程序员",
        "单身狗",
        "绝绝子",
        "降维打击",
        "双十一",
        "六一八",
        "尾款人",
        "吃瓜群众",
        "摸鱼侠",
        "涨薪",
        "支出",
        "实习",
        "加仓",
        "摸鱼",
        "退款",
        "下单",
        "包邮",
        "离职",
        "社恐",
        "社牛",
        "破防",
        "加班",
        "吃瓜",
        "干饭",
        "白干",
        "买单",
        "首付",
        "有余",
        "有雨",
        "通风",
        "有限",
        "威武",
        "低薪",
        "董事",
        "砖头",
    ]
    for w in pop_culture:
        words_set.add(w)

    final_words = list(words_set)
    print(f"[Miner] 已加载权威开源词库，共包含 {len(final_words)} 个常用词汇！")
    return final_words


def load_all_corpus(corpus_dir="data/corpus"):
    corpus_map = {}
    for fname in sorted(os.listdir(corpus_dir)):
        if not fname.endswith(".json"):
            continue
        fpath = os.path.join(corpus_dir, fname)
        with open(fpath, "r", encoding="utf-8") as f:
            data = json.load(f)
            book_name = data.get("book_name", fname)
            sentences = data.get("sentences", [])
            corpus_map[book_name] = sentences
    print(f"[Miner] 已加载 {len(corpus_map)} 本古典书籍名篇库！")
    return corpus_map


def mine_puns(output_path="dist/xieyin_results.json"):
    words = load_all_dictionaries()
    corpus = load_all_corpus()

    print("[Miner] 初始化谐音匹配引擎...")
    engine = HomophonicEngine(words)

    print("[Miner] 开始在典籍全库中深度挖掘谐音梗...")
    total_count = 0
    results_export = {}

    for book_name, sentences in corpus.items():
        results_export[book_name] = []
        book_puns = []
        for sent in sentences:
            puns = engine.find_puns(sent)
            book_puns.extend(puns)

        sorted_puns = sorted(
            book_puns, key=lambda x: (not x["is_same_tone"], -x["length"])
        )
        results_export[book_name] = sorted_puns
        total_count += len(sorted_puns)
        print(f"  - {book_name}: 挖掘到 {len(sorted_puns)} 条梗！")

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results_export, f, ensure_ascii=False, indent=2)

    print(
        f"[Miner] 🎉 成功挖掘出 {total_count} 条典籍梗，已保存至 `{output_path}`！"
    )
    return output_path


if __name__ == "__main__":
    mine_puns()
