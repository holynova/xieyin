#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
严谨版古代文献“谐音梗”挖掘程序（深度优选高频梗版）
修复点：
1. 严格遵循标点符号断句：只在独立的子句内部匹配，绝对不跨标点拼接！
2. 彻底清除生僻词：精选当代极具反差感的高频生活/职场/消费/流行词（如 支出、涨薪、实习、摸鱼、离职、下单 等）。
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

# ==========================================
# 1. 扩充经典古代文献语料库
# ==========================================
LITERATURE_CORPUS = {
    "《三字经》": [
        "人之初，性本善。性相近，习相远。",
        "苟不教，性乃迁。教之道，贵以专。",
        "昔孟母，择邻处。子不学，断机杼。",
        "窦燕山，有义方。教五子，名俱扬。",
        "养不教，父之过。教不严，师之惰。",
        "子不学，非所宜。幼不学，老何为。",
        "玉不琢，不成器。人不学，不知义。",
        "为人子，方少时。亲师友，习礼仪。",
        "香九龄，能温席。孝于亲，所当执。",
        "融四岁，能让梨。弟于长，宜先知。",
        "勤有功，戏无益。戒之哉，宜勉力。"
    ],
    "《千字文》": [
        "天地玄黄，宇宙洪荒。日月盈仄，辰宿列张。",
        "寒来暑往，秋收冬藏。闰余成岁，律吕调阳。",
        "始制文字，乃服衣裳。推位让国，有虞陶唐。",
        "吊民伐罪，周发殷汤。坐朝问道，垂拱平章。",
        "知过必改，得能莫忘。罔谈彼短，靡恃己长。",
        "信使可覆，器欲难量。墨悲丝染，诗赞羔羊。",
        "尺璧非宝，寸阴是竞。资父事君，曰严与敬。",
        "学优登仕，摄职从政。存以甘棠，去而益咏。"
    ],
    "《论语》": [
        "学而时习之，不亦说乎？有朋自远方来，不亦乐乎？",
        "人不知而不愠，不亦君子乎？",
        "温故而知新，可以为师矣。",
        "学而不思则罔，思而不学则殆。",
        "知之者不如好之者，好之者不如乐之者。",
        "敏而好学，不耻下问。",
        "三人行，必有我师焉。择其善者而从之，其不善者而改之。",
        "逝者如斯夫，不舍昼夜。",
        "君子坦荡荡，小人长戚戚。",
        "己所不欲，勿施于人。",
        "工欲善其事，必先利其器。",
        "朝闻道，夕死可矣。",
        "吾日三省吾身：为人谋而不忠乎？与朋友交而不信乎？传不习乎？",
        "鸟之将死，其鸣也哀；人之将死，其言也善。"
    ],
    "《道德经》": [
        "道可道，非常道。名可名，非常名。",
        "无名天地之始；有名万物之母。",
        "上善若水。水善利万物而不争。",
        "知人者智，自知者明。胜人者有力，自胜者强。",
        "大音希声，大象无形。",
        "千里之行，始于足下。",
        "祸兮福之所倚，福兮祸之所伏。"
    ],
    "《经典古诗词》": [
        "商女不知亡国恨，隔江犹唱后庭花。",
        "少壮不努力，老大徒伤悲。",
        "姑苏城外寒山寺，夜半钟声到客船。",
        "安能摧眉折腰事权贵，使我不得开心颜！",
        "借问酒家何处有？牧童遥指杏花村。",
        "春风又绿江南岸，明月何时照我还？",
        "人生得意须尽欢，莫使金樽空对月。",
        "天生我材必有用，千金散尽还复来。",
        "劝君更尽一杯酒，西出阳关无故人。",
        "床前明月光，疑是地上霜。举头望明月，低头思故乡。",
        "同是天涯沦落人，相逢何必曾相识。",
        "两岸猿声啼不住，轻舟已过万重山。",
        "独在异乡为异客，每逢佳节倍思亲。",
        "海内存知己，天涯若比邻。",
        "月落乌啼霜满天，江枫渔火对愁眠。"
    ]
}

# ==========================================
# 2. 精选接地气、反差感强的现代高频梗词库
# ==========================================
MODERN_HIGH_FREQUENCY_WORDS = [
    # 财务、网购、消费
    "支出", "支付", "退款", "下单", "尾款", "首付", "买单", "充值", "包邮", "拼团",
    "网购", "打折", "优惠", "立减", "理财", "退货", "利息", "发票", "消费", "借贷",
    "发财", "月光", "打款", "提现", "刷卡", "搞钱", "定金", "车贷", "房贷", "首单",
    "满减", "淘货", "吃土", "涨停", "跌停", "平仓", "加仓", "做空", "割肉", "跑路",
    "解套", "富贵", "网费", "租金",

    # 职场、打工、办公
    "加班", "下班", "摸鱼", "内卷", "打工", "实习", "调休", "请假", "离职", "周报",
    "开会", "项目", "破产", "跳槽", "背锅", "团建", "涨薪", "扣钱", "绩效", "打卡",
    "考勤", "日报", "月报", "复盘", "对齐", "赋能", "抓手", "闭环", "沉淀", "落地",
    "爆款", "流量", "带货", "直播", "爬虫", "极客", "黑客", "程序员", "打工人",
    "尾款人", "单身狗", "吃瓜人", "摸鱼侠", "退款单", "立减券", "双十一", "六一八",

    # 生活、社交、流行热梗
    "破防", "绝绝", "吃货", "干饭", "烤肉", "奶茶", "白干", "没门", "免谈", "退票",
    "敷衍", "真香", "反转", "躺平", "摆烂", "社恐", "社牛", "吃瓜", "吐槽", "点赞",
    "关注", "转发", "挂科", "补考", "开黑", "卡牌", "卧室", "资源", "烧砖", "奴隶",
    "劳大", "下文", "通宵", "失眠", "外卖", "快递", "绝绝子", "降维打击", "西厢",
    "无形", "故人", "有余", "同事", "风雨", "下单"
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
        """按标点符号硬切断句，切片绝不能跨标点"""
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
                        # 1. 字数绝对相同
                        if item["length"] != length:
                            continue
                        
                        # 2. 汉字不能相同
                        if sub_chars == item["word"]:
                            continue

                        # 3. 逐字无声调拼音 100% 对齐
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

        # 去重
        seen = set()
        unique = []
        for m in matches:
            k = (m["pun_sentence"], m["replaced_word"])
            if k not in seen:
                seen.add(k)
                unique.append(m)

        return unique


def main():
    engine = StrictSentenceXieyinEngine(MODERN_HIGH_FREQUENCY_WORDS)
    
    print(f"\n{C_BOLD}{C_CYAN}======================================================================{C_END}")
    print(f"{C_BOLD}{C_YELLOW}    🎯 修复版“严格子句断句 + 现代高频梗”古代文献谐音梗结果 🎯{C_END}")
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
            print("  （此篇在严格子句断句与高频词规则下无匹配）")

    print(f"\n{C_BOLD}{C_CYAN}======================================================================{C_END}")
    print(f"{C_BOLD}{C_GREEN}🎉 挖掘完成！共扫描 {len(LITERATURE_CORPUS)} 部典籍，成功匹配出 {total_matches} 个高品质硬核谐音梗！{C_END}")
    print(f"{C_BOLD}{C_CYAN}======================================================================{C_END}\n")

    # 保存 JSON 结果
    with open("xieyin_results.json", "w", encoding="utf-8") as f:
        json.dump(results_export, f, ensure_ascii=False, indent=2)
    print("📁 结果已更新导出至 `xieyin_results.json`！")

if __name__ == "__main__":
    main()
