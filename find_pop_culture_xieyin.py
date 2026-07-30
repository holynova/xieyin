#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
精简通俗词库 + 明星/电影/流行歌曲/多字流行词 古籍谐音梗匹配引擎
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

# 1. 经典古籍名篇全库
POP_CORPUS = {
    "《唐诗名篇》": [
        "床前明月光，疑是地上霜。举头望明月，低头思故乡。",
        "春眠不觉晓，处处闻啼鸟。夜来风雨声，花落知多少。",
        "白日依山尽，黄河入海流。欲穷千里目，更上一层楼。",
        "千山鸟飞绝，万径人踪灭。孤舟蓑笠翁，独钓寒江雪。",
        "同是天涯沦落人，相逢何必曾相识。",
        "少壮不努力，老大徒伤悲。",
        "月落乌啼霜满天，江枫渔火对愁眠。",
        "劝君更尽一杯酒，西出阳关无故人。",
        "商女不知亡国恨，隔江犹唱后庭花。",
        "借问酒家何处有？牧童遥指杏花村。"
    ],
    "《宋词名篇》": [
        "明月几时有？把酒问青天。不知天上宫阙，今夕是何年。",
        "大江东去，浪淘尽，千古风流人物。",
        "寻寻觅觅，冷冷清清，凄凄惨惨戚戚。",
        "众里寻他千百度。蓦然回首，那人却在，灯火阑珊处。",
        "三杯两盏淡酒，怎敌他、晚来风急！雁过也，正伤心，却是旧时相识。",
        "多情自古伤离别，更那堪，冷落清秋节！"
    ],
    "《诗经名篇》": [
        "关关雎鸠，在河之洲。窈窕淑女，君子好逑。",
        "蒹葭苍苍，白露为霜。所谓伊人，在水一方。",
        "桃之夭夭，灼灼其华。之子于归，宜其室家。",
        "昔我往矣，杨柳依依。今我来思，雨雪霏霏。",
        "死生契阔，与子成说。执子之手，与子偕老。",
        "青青子衿，悠悠我心。",
        "呦呦鹿鸣，食野之苹。我有嘉宾，鼓瑟吹笙。"
    ],
    "《论语全篇》": [
        "学而时习之，不亦说乎？有朋自远方来，不亦乐乎？",
        "敏而好学，不耻下问。",
        "三人行，必有我师焉。择其善者而从之。",
        "见贤思齐焉，见不贤而内自省也。",
        "朝闻道，夕死可矣。",
        "知之者不如好之者，好之者不如乐之者。",
        "吾日三省吾身：为人谋而不忠乎？与朋友交而不信乎？传不习乎？"
    ],
    "《道德经全本》": [
        "道可道，非常道。名可名，非常名。",
        "上善若水。水善利万物而不争。",
        "知人者智，自知者明。胜人者有力，自胜者强。",
        "千里之行，始于足下。",
        "天之道，损有余而补不足。",
        "鱼不可脱于渊，国之利器不可以示人。"
    ],
    "《历代名篇辞赋》": [
        "壬戌之秋，七月既望，苏子与客泛舟游于赤壁之下。清风徐来，水波不兴。",
        "落霞与孤鹜齐飞，秋水共长天一色。渔舟唱晚，响穷彭蠡之滨。",
        "翩若惊鸿，婉若游龙。荣曜秋菊，华茂春松。"
    ]
}

# 2. 精简通俗词库：涵盖【明星名称】、【热门电影/电视剧】、【流行歌曲】与【热门多字词】
POP_CULTURE_WORDS = [
    # 🌟 明星 / 名人名称
    {"word": "成龙", "cat": "明星"},
    {"word": "周杰伦", "cat": "明星"},
    {"word": "刘德华", "cat": "明星"},
    {"word": "薛之谦", "cat": "明星"},
    {"word": "沈腾", "cat": "明星"},
    {"word": "贾玲", "cat": "明星"},
    {"word": "周星驰", "cat": "明星"},
    {"word": "张学友", "cat": "明星"},
    {"word": "甄子丹", "cat": "明星"},
    {"word": "徐峥", "cat": "明星"},
    {"word": "坤坤", "cat": "明星"},

    # 🎬 热门电影 / 电视剧名称
    {"word": "泰坦尼克", "cat": "电影/影视"},
    {"word": "阿凡达", "cat": "电影/影视"},
    {"word": "流浪地球", "cat": "电影/影视"},
    {"word": "热辣滚烫", "cat": "电影/影视"},
    {"word": "战狼", "cat": "电影/影视"},
    {"word": "满江红", "cat": "电影/影视"},
    {"word": "大话西游", "cat": "电影/影视"},
    {"word": "霸王别姬", "cat": "电影/影视"},
    {"word": "楚门的世界", "cat": "电影/影视"},
    {"word": "泰囧", "cat": "电影/影视"},

    # 🎵 流行歌曲 / 金曲名称
    {"word": "七里香", "cat": "流行歌曲"},
    {"word": "晴天", "cat": "流行歌曲"},
    {"word": "稻香", "cat": "流行歌曲"},
    {"word": "青花瓷", "cat": "流行歌曲"},
    {"word": "双截棍", "cat": "流行歌曲"},
    {"word": "卡路里", "cat": "流行歌曲"},
    {"word": "小苹果", "cat": "流行歌曲"},
    {"word": "孤勇者", "cat": "流行歌曲"},
    {"word": "野狼", "cat": "流行歌曲"},
    {"word": "告白气球", "cat": "流行歌曲"},
    {"word": "奢香夫人", "cat": "流行歌曲"},

    # 🔥 热门多字流行词 / 打工网购热词
    {"word": "打工人", "cat": "流行词"},
    {"word": "程序员", "cat": "流行词"},
    {"word": "单身狗", "cat": "流行词"},
    {"word": "绝绝子", "cat": "流行词"},
    {"word": "降维打击", "cat": "流行词"},
    {"word": "双十一", "cat": "流行词"},
    {"word": "六一八", "cat": "流行词"},
    {"word": "尾款人", "cat": "流行词"},
    {"word": "吃瓜群众", "cat": "流行词"},
    {"word": "摸鱼侠", "cat": "流行词"},

    # 💰 地气精选现代词 (二字/三字)
    {"word": "涨薪", "cat": "打工/生活"},
    {"word": "支出", "cat": "打工/生活"},
    {"word": "实习", "cat": "打工/生活"},
    {"word": "加仓", "cat": "打工/生活"},
    {"word": "摸鱼", "cat": "打工/生活"},
    {"word": "退款", "cat": "打工/生活"},
    {"word": "下单", "cat": "打工/生活"},
    {"word": "包邮", "cat": "打工/生活"},
    {"word": "离职", "cat": "打工/生活"},
    {"word": "社恐", "cat": "打工/生活"},
    {"word": "社牛", "cat": "打工/生活"},
    {"word": "破防", "cat": "打工/生活"},
    {"word": "加班", "cat": "打工/生活"},
    {"word": "吃瓜", "cat": "打工/生活"},
    {"word": "干饭", "cat": "打工/生活"},
    {"word": "白干", "cat": "打工/生活"},
    {"word": "买单", "cat": "打工/生活"},
    {"word": "首付", "cat": "打工/生活"},
    {"word": "有余", "cat": "打工/生活"},
    {"word": "有雨", "cat": "打工/生活"},
    {"word": "通风", "cat": "打工/生活"},
    {"word": "有限", "cat": "打工/生活"},
    {"word": "威武", "cat": "打工/生活"},
    {"word": "低薪", "cat": "打工/生活"},
    {"word": "董事", "cat": "打工/生活"},
    {"word": "砖头", "cat": "打工/生活"},
    {"word": "自己", "cat": "打工/生活"},
    {"word": "进水", "cat": "打工/生活"},
    {"word": "指导", "cat": "打工/生活"},
    {"word": "生椰", "cat": "打工/生活"},
    {"word": "果汁", "cat": "打工/生活"},
    {"word": "同事", "cat": "打工/生活"},
    {"word": "奴隶", "cat": "打工/生活"},
    {"word": "劳大", "cat": "打工/生活"},
    {"word": "风雨", "cat": "打工/生活"},
    {"word": "上新", "cat": "打工/生活"},
    {"word": "上心", "cat": "打工/生活"},
    {"word": "资源", "cat": "打工/生活"},
    {"word": "卧室", "cat": "打工/生活"},
    {"word": "下文", "cat": "打工/生活"}
]


class PopCultureEngine:
    def __init__(self, pop_words):
        self.word_items = []
        for item in pop_words:
            word = item["word"]
            cat = item["cat"]
            w_chars = [ch for ch in word if '\u4e00' <= ch <= '\u9fa5']
            if not w_chars: continue
            clean_word = "".join(w_chars)
            p_full = lazy_pinyin(clean_word, style=Style.TONE)
            p_norm = lazy_pinyin(clean_word, style=Style.NORMAL)
            self.word_items.append({
                "word": clean_word,
                "cat": cat,
                "length": len(clean_word),
                "pinyin_full": p_full,
                "pinyin_norm": p_norm
            })

    def _split_into_subsentences(self, text):
        sub_parts = re.split(r'([，。；？！、\n\r\t“”《》兮])', text)
        result = []
        curr_offset = 0
        for part in sub_parts:
            if not part or re.search(r'[，。；？！、\n\r\t“”《》兮]', part):
                curr_offset += len(part)
                continue
            chars = [ch for ch in part if '\u4e00' <= ch <= '\u9fa5']
            indices = [curr_offset + idx for idx, ch in enumerate(part) if '\u4e00' <= ch <= '\u9fa5']
            if chars:
                result.append({"sub_text": "".join(chars), "indices": indices})
            curr_offset += len(part)
        return result

    def find_puns(self, full_sentence):
        matches = []
        sub_sents = self._split_into_subsentences(full_sentence)
        for sub in sub_sents:
            chars = sub["sub_text"]
            indices = sub["indices"]
            n = len(chars)

            for item in self.word_items:
                length = item["length"]
                if length > n:
                    continue

                for i in range(n - length + 1):
                    sub_chars = chars[i:i + length]
                    sub_p_full = lazy_pinyin(sub_chars, style=Style.TONE)
                    sub_p_norm = lazy_pinyin(sub_chars, style=Style.NORMAL)

                    if sub_chars == item["word"]:
                        continue

                    if all(sub_p_norm[k] == item["pinyin_norm"][k] for k in range(length)):
                        is_same_tone = (sub_p_full == item["pinyin_full"])
                        match_type = "全同音同调" if is_same_tone else "全同音异声调"
                        start_idx = indices[i]
                        end_idx = indices[i + length - 1] + 1
                        pun_sent = full_sentence[:start_idx] + f"【{item['word']}】" + full_sentence[end_idx:]
                        
                        matches.append({
                            "original_text": sub_chars,
                            "replaced_word": item["word"],
                            "word_category": item["cat"],
                            "length": length,
                            "match_type": match_type,
                            "is_same_tone": is_same_tone,
                            "pun_sentence": pun_sent,
                            "pinyin_orig": " ".join(sub_p_full),
                            "pinyin_target": " ".join(item["pinyin_full"])
                        })
        seen = set()
        return [m for m in matches if not ((m["pun_sentence"], m["replaced_word"]) in seen or seen.add((m["pun_sentence"], m["replaced_word"])))]


def main():
    engine = PopCultureEngine(POP_CULTURE_WORDS)
    
    print(f"\n{C_BOLD}{C_CYAN}======================================================================{C_END}")
    print(f"{C_BOLD}{C_YELLOW} 🎬 明星/电影/流行歌曲/多字流行词 古籍谐音梗爆笑匹配引擎 🎬{C_END}")
    print(f"{C_BOLD}{C_CYAN}======================================================================{C_END}\n")

    total_matches = 0
    results_export = {}

    for doc_name, sentences in POP_CORPUS.items():
        print(f"\n{C_BOLD}{C_MAGENTA}📖 {doc_name}{C_END}")
        print("─" * 70)
        doc_count = 0
        results_export[doc_name] = []

        doc_puns = []
        for sent in sentences:
            puns = engine.find_puns(sent)
            doc_puns.extend(puns)

        sorted_doc_puns = sorted(doc_puns, key=lambda x: (not x['is_same_tone'], -x['length']))

        for p in sorted_doc_puns:
            doc_count += 1
            total_matches += 1
            results_export[doc_name].append(p)
            tone_tag = f"{C_GREEN}[同音同声调]{C_END}" if p['is_same_tone'] else f"{C_YELLOW}[同音异声调]{C_END}"
            cat_tag = f"{C_MAGENTA}[{p['word_category']}]{C_END}"
            print(f"  {C_CYAN}[{doc_count:02d}]{C_END} {p['pun_sentence']}  {cat_tag}")
            print(f"       拆解: 原文「{p['original_text']}」({p['pinyin_orig']}) ──[{p['length']}字对{p['length']}字]──> 「{p['replaced_word']}」({p['pinyin_target']}) {tone_tag}")

        print(f"  {C_GREEN}小计：{doc_name} 匹配到 {doc_count} 个经典幽默谐音梗！{C_END}")

    with open("xieyin_results_pop.json", "w", encoding="utf-8") as f:
        json.dump(results_export, f, ensure_ascii=False, indent=2)
    print(f"\n📁 结果已成功保存至 `xieyin_results_pop.json`！")

if __name__ == "__main__":
    main()
