#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
海量拓展古代典籍“谐音梗”挖掘程序（引入庄子、陋室铭、孙子兵法、三国演义、增广贤文等）
"""

import sys
import json
import re
from pypinyin import pinyin, Style, lazy_pinyin

# ANSI 颜色
C_BOLD = "\033[1m"
C_CYAN = "\033[96m"
C_GREEN = "\033[92m"
C_YELLOW = "\033[93m"
C_RED = "\033[91m"
C_MAGENTA = "\033[95m"
C_END = "\033[0m"

# 扩展典籍语料库
LITERATURE_CORPUS = {
    "《三字经》": [
        "人之初，性本善。性相近，习相远。",
        "苟不教，性乃迁。教之道，贵以专。",
        "养不教，父之过。教不严，师之惰。",
        "玉不琢，不成器。人不学，不知义。",
        "曰水火，木金土。此五行，本乎数。"
    ],
    "《千字文》": [
        "始制文字，乃服衣裳。推位让国，有虞陶唐。",
        "坐朝问道，垂拱平章。"
    ],
    "《论语》": [
        "学而时习之，不亦说乎？有朋自远方来，不亦乐乎？",
        "敏而好学，不耻下问。",
        "三人行，必有我师焉。择其善者而从之。",
        "见贤思齐焉，见不贤而内自省也。"
    ],
    "《道德经》": [
        "千里之行，始于足下。",
        "天之道，损有余而补不足。",
        "鱼不可脱于渊，国之利器不可以示人。"
    ],
    "《庄子·逍遥游》": [
        "北冥有鱼，其名为鲲。",
        "大鹏一日同风起，扶摇直上九万里。",
        "水之积也不厚，则其负大舟也无力。"
    ],
    "《陋室铭》": [
        "山不在高，有仙则名；水不在深，有龙则灵。",
        "斯是陋室，惟吾德馨。",
        "苔痕上阶绿，草色入帘青。"
    ],
    "《孙子兵法》": [
        "兵者，国之大事，死生之地，存亡之道。",
        "知己知彼，百战不殆。",
        "攻其不备，出其不意。"
    ],
    "《三国演义·开篇词》": [
        "滚滚长江东逝水，浪花淘尽英雄。",
        "是非成败转头空，青山依旧在，几度夕阳红。",
        "古今多少事，都付笑谈中。"
    ],
    "《增广贤文》": [
        "近水楼台先得月，向阳花木易为春。",
        "路遥知马力，日久见人心。",
        "画虎画皮难画骨，知人知面不知心。"
    ],
    "《经典古诗词》": [
        "同是天涯沦落人，相逢何必曾相识。",
        "少壮不努力，老大徒伤悲。",
        "月落乌啼霜满天，江枫渔火对愁眠。"
    ]
}

# 扩展现代词库
MODERN_WORDS = [
    "支出", "西厢", "指导", "无形", "有余", "实习", "资源", "下文", "卧室", "离职",
    "果汁", "奴隶", "劳大", "同事", "风雨", "生椰", "有雨", "通风", "有限", "威武",
    "低薪", "董事", "砖头", "自己", "进水", "木栏", "涨薪", "摸鱼", "下单", "退款"
]


class StrictSentenceXieyinEngine:
    def __init__(self, words_list):
        self.word_items = []
        for word in set(words_list):
            w_chars = [ch for ch in word if '\u4e00' <= ch <= '\u9fa5']
            if not w_chars:
                continue
            clean_word = "".join(w_chars)
            
            p_full = lazy_pinyin(clean_word, style=Style.TONE)
            p_norm = lazy_pinyin(clean_word, style=Style.NORMAL)
            
            self.word_items.append({
                "word": clean_word,
                "length": len(clean_word),
                "pinyin_full": p_full,
                "pinyin_norm": p_norm,
            })

    def _split_into_subsentences(self, text):
        sub_parts = re.split(r'([，。；？！、\n\r\t“”《》])', text)
        result = []
        curr_offset = 0
        
        for part in sub_parts:
            if not part:
                continue
            if re.search(r'[，。；？！、\n\r\t“”《》]', part):
                curr_offset += len(part)
                continue
            
            chars = []
            indices = []
            for idx, ch in enumerate(part):
                if '\u4e00' <= ch <= '\u9fa5':
                    chars.append(ch)
                    indices.append(curr_offset + idx)
            
            if chars:
                result.append({
                    "sub_text": "".join(chars),
                    "indices": indices
                })
            curr_offset += len(part)
            
        return result

    def find_puns(self, full_sentence, min_len=2, max_len=4):
        matches = []
        sub_sents = self._split_into_subsentences(full_sentence)

        for sub in sub_sents:
            chars = sub["sub_text"]
            indices = sub["indices"]
            n = len(chars)

            for length in range(min_len, max_len + 1):
                for i in range(n - length + 1):
                    sub_chars = chars[i:i + length]
                    sub_p_full = lazy_pinyin(sub_chars, style=Style.TONE)
                    sub_p_norm = lazy_pinyin(sub_chars, style=Style.NORMAL)

                    for item in self.word_items:
                        if item["length"] != length:
                            continue
                        if sub_chars == item["word"]:
                            continue

                        is_match = True
                        for k in range(length):
                            if sub_p_norm[k] != item["pinyin_norm"][k]:
                                is_match = False
                                break
                        
                        if is_match:
                            is_same_tone = (sub_p_full == item["pinyin_full"])
                            match_type = "全同音同声调" if is_same_tone else "全同音异声调"

                            start_idx = indices[i]
                            end_idx = indices[i + length - 1] + 1
                            pun_sent = full_sentence[:start_idx] + f"【{item['word']}】" + full_sentence[end_idx:]

                            matches.append({
                                "original_text": sub_chars,
                                "replaced_word": item["word"],
                                "length": length,
                                "match_type": match_type,
                                "is_same_tone": is_same_tone,
                                "pun_sentence": pun_sent,
                                "pinyin_orig": " ".join(sub_p_full),
                                "pinyin_target": " ".join(item["pinyin_full"])
                            })

        seen = set()
        unique = []
        for m in matches:
            k = (m["pun_sentence"], m["replaced_word"])
            if k not in seen:
                seen.add(k)
                unique.append(m)

        return unique


def main():
    engine = StrictSentenceXieyinEngine(MODERN_WORDS)
    
    print(f"\n{C_BOLD}{C_CYAN}======================================================================{C_END}")
    print(f"{C_BOLD}{C_YELLOW}     🏛️ 拓展古代名著典籍“谐音梗”挖掘报告 🏛️{C_END}")
    print(f"{C_BOLD}{C_CYAN}======================================================================{C_END}\n")

    total_matches = 0
    results_export = {}

    for doc_name, sentences in LITERATURE_CORPUS.items():
        print(f"\n{C_BOLD}{C_MAGENTA}📖 {doc_name}{C_END}")
        print("─" * 70)
        doc_count = 0
        results_export[doc_name] = []

        for sent in sentences:
            puns = engine.find_puns(sent, min_len=2, max_len=4)
            if puns:
                for p in puns:
                    doc_count += 1
                    total_matches += 1
                    results_export[doc_name].append(p)
                    
                    tone_tag = f"{C_GREEN}[同音同声调]{C_END}" if p['is_same_tone'] else f"{C_YELLOW}[同音异声调]{C_END}"
                    
                    print(f"  {C_CYAN}【原 句】{C_END} {sent}")
                    print(f"  {C_RED}【梗 句】{C_END} {C_BOLD}{p['pun_sentence']}{C_END}")
                    print(f"  {C_YELLOW}【拆 解】{C_END} 原文「{p['original_text']}」({p['pinyin_orig']}) ──[{p['length']}字对{p['length']}字]──> 现代词「{p['replaced_word']}」({p['pinyin_target']}) {tone_tag}")
                    print("  " + "·" * 65)

        if doc_count == 0:
            print("  （本典籍暂未扫描出新的符合规则谐音梗）")

    print(f"\n{C_BOLD}{C_CYAN}======================================================================{C_END}")
    print(f"{C_BOLD}{C_GREEN}🎉 扩展扫描完成！共在 {len(LITERATURE_CORPUS)} 部经典中挖掘出 {total_matches} 个硬核谐音梗！{C_END}")
    print(f"{C_BOLD}{C_CYAN}======================================================================{C_END}\n")

    with open("xieyin_expanded.json", "w", encoding="utf-8") as f:
        json.dump(results_export, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    main()
