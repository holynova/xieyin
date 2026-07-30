#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
核心算法引擎模块 (src/engine.py)
规则：
1. 绝对不跨标点符号断句切片。
2. N字严格替换N字（无声调拼音逐字完全相同）。
"""

import re
from pypinyin import Style, lazy_pinyin


class HomophonicEngine:
    def __init__(self, dictionary_words):
        self.pinyin_map = {}
        for word in set(dictionary_words):
            clean_word = word.strip()
            if not clean_word:
                continue
            p_full = tuple(lazy_pinyin(clean_word, style=Style.TONE))
            p_norm = tuple(lazy_pinyin(clean_word, style=Style.NORMAL))

            item = {
                "word": clean_word,
                "length": len(clean_word),
                "pinyin_full": p_full,
                "pinyin_norm": p_norm,
            }
            if p_norm not in self.pinyin_map:
                self.pinyin_map[p_norm] = []
            self.pinyin_map[p_norm].append(item)

    def _split_into_subsentences(self, text):
        sub_parts = re.split(r"([，。；？！、\n\r\t“”《》兮])", text)
        result = []
        curr_offset = 0
        for part in sub_parts:
            if not part or re.search(r"[，。；？！、\n\r\t“”《》兮]", part):
                curr_offset += len(part)
                continue
            chars = [ch for ch in part if "\u4e00" <= ch <= "\u9fa5"]
            indices = [
                curr_offset + idx
                for idx, ch in enumerate(part)
                if "\u4e00" <= ch <= "\u9fa5"
            ]
            if chars:
                result.append({"sub_text": "".join(chars), "indices": indices})
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
                if length > n:
                    continue
                for i in range(n - length + 1):
                    sub_chars = chars[i : i + length]
                    sub_p_full = tuple(lazy_pinyin(sub_chars, style=Style.TONE))
                    sub_p_norm = tuple(
                        lazy_pinyin(sub_chars, style=Style.NORMAL)
                    )

                    if sub_p_norm in self.pinyin_map:
                        for item in self.pinyin_map[sub_p_norm]:
                            if sub_chars == item["word"]:
                                continue
                            is_same_tone = sub_p_full == item["pinyin_full"]
                            match_type = (
                                "全同音同调" if is_same_tone else "全同音异声调"
                            )
                            start_idx = indices[i]
                            end_idx = indices[i + length - 1] + 1
                            pun_sent = (
                                full_sentence[:start_idx]
                                + f"【{item['word']}】"
                                + full_sentence[end_idx:]
                            )

                            matches.append(
                                {
                                    "original_text": sub_chars,
                                    "replaced_word": item["word"],
                                    "length": length,
                                    "match_type": match_type,
                                    "is_same_tone": is_same_tone,
                                    "pun_sentence": pun_sent,
                                    "pinyin_orig": " ".join(sub_p_full),
                                    "pinyin_target": " ".join(
                                        item["pinyin_full"]
                                    ),
                                }
                            )
        seen = set()
        return [
            m
            for m in matches
            if not (
                (m["pun_sentence"], m["replaced_word"]) in seen
                or seen.add((m["pun_sentence"], m["replaced_word"]))
            )
        ]
