#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
严谨古代文献“谐音梗”自动挖掘程序
满足条件：
1. 原古文切片字数 N 与 替换现代词字数 N 严格相等（N >= 2 或 N >= 1，但必须逐字音节对齐）
2. 每一个字对应的拼音（无声调）必须逐字完全相同！
"""

import sys
from pypinyin import pinyin, Style, lazy_pinyin

# ANSI 颜色
C_BOLD = "\033[1m"
C_CYAN = "\033[96m"
C_GREEN = "\033[92m"
C_YELLOW = "\033[93m"
C_RED = "\033[91m"
C_MAGENTA = "\033[95m"
C_END = "\033[0m"

# 经典文献语料库
LITERATURE_CORPUS = {
    "《三字经》": [
        "人之初，性本善。性相近，习相远。",
        "苟不教，性乃迁。教之道，贵以专。",
        "昔孟母，择邻处。子不学，断机杼。",
        "养不教，父之过。教不严，师之惰。",
        "子不学，非所宜。幼不学，老何为。",
        "玉不琢，不成器。人不学，不知义。",
        "勤有功，戏无益。戒之哉，宜勉力。"
    ],
    "《千字文》": [
        "天地玄黄，宇宙洪荒。日月盈仄，辰宿列张。",
        "寒来暑往，秋收冬藏。闰余成岁，律吕调阳。",
        "墨悲丝染，诗赞羔羊。景行维贤，克念作圣。",
        "尺璧非宝，寸阴是竞。资父事君，曰严与敬。"
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
        "工欲善其事，必先利其器。"
    ],
    "《道德经》": [
        "道可道，非常道。名可名，非常名。",
        "无名天地之始；有名万物之母。",
        "上善若水。水善利万物而不争。",
        "知人者智，自知者明。",
        "大音希声，大象无形。",
        "千里之行，始于足下。"
    ],
    "《经典诗词名句》": [
        "商女不知亡国恨，隔江犹唱后庭花。",
        "少壮不努力，老大徒伤悲。",
        "姑苏城外寒山寺，夜半钟声到客船。",
        "安能摧眉折腰事权贵，使我不得开心颜！",
        "借问酒家何处有？牧童遥指杏花村。",
        "春风又绿江南岸，明月何时照我还？",
        "人生得意须尽欢，莫使金樽空对月。",
        "天生我材必有用，千金散尽还复来。",
        "劝君更尽一杯酒，西出阳关无故人。",
        "床前明月光，疑是地上霜。"
    ]
}

# 丰富现代词库（涵盖双字词、三字词、四字词）
MODERN_DICTIONARY = [
    # 双字词
    "支出", "支付", "退款", "下单", "尾款", "首付", "买单", "充值", "包邮", "拼团",
    "网购", "打折", "优惠", "立减", "理财", "退货", "利息", "发票", "消费", "借贷",
    "发财", "月光", "打款", "提现", "刷卡", "搞钱", "加班", "下班", "摸鱼", "内卷",
    "打工", "实习", "调休", "请假", "离职", "周报", "开会", "项目", "破产", "跳槽",
    "背锅", "团建", "涨薪", "扣钱", "绩效", "破防", "绝绝", "吃货", "干饭", "烤肉",
    "奶茶", "白干", "没门", "免谈", "退票", "敷衍", "真香", "反转", "躺平", "摆烂",
    "社恐", "社牛", "吃瓜", "吐槽", "点赞", "关注", "转发", "挂科", "补考", "开黑",
    "卡牌", "卧室", "资源", "烧砖", "奴隶", "劳大", "网购", "下文", "退货", "富贵",
    "网费", "租金", "定金", "补费", "首付", "车贷", "房贷", "首单", "满减", "立折",
    "吃包", "买包", "包餐", "淘货", "吃土", "摸盘", "开盘", "涨停", "跌停", "平仓",
    "加仓", "满仓", "做空", "空单", "多单", "牛市", "熊市", "割肉", "跑路", "解套",
    "解封", "核酸", "绿码", "打卡", "考勤", "日报", "周报", "月报", "季报", "年报",
    "复盘", "对齐", "赋能", "抓手", "闭环", "沉淀", "打法", "抓手", "落地", "爆款",
    "流量", "带货", "直播", "主播", "刷赞", "爬虫", "极客", "黑客", "安卓", "苹果",

    # 三字词 & 四字词
    "打工人", "程序员", "产品狗", "尾款人", "单身狗", "吃瓜人", "摸鱼侠", "退款单",
    "拼优惠", "立减券", "全场折", "买一送", "免运费", "包运费", "满减券", "双十一",
    "６１８", "开黑组", "吃鸡队", "绝绝子", "YYDS", "不讲理", "真香定律", "降维打击"
]


class StrictXieyinEngine:
    def __init__(self, dict_words):
        self.word_items = []
        for word in dict_words:
            # 清理非汉字
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

    def find_puns(self, sentence, min_len=2, max_len=4):
        """
        在单句中提取 N 字短语，寻找字数完全相同且每个字的拼音(无声调)完全相同的现代词
        """
        chars = [ch for ch in sentence if '\u4e00' <= ch <= '\u9fa5']
        char_indices = [i for i, ch in enumerate(sentence) if '\u4e00' <= ch <= '\u9fa5']
        
        n = len(chars)
        matches = []

        for length in range(min_len, max_len + 1):
            for i in range(n - length + 1):
                sub_chars = "".join(chars[i:i + length])
                sub_p_full = lazy_pinyin(sub_chars, style=Style.TONE)
                sub_p_norm = lazy_pinyin(sub_chars, style=Style.NORMAL)

                for item in self.word_items:
                    # 规则 1：字数必须完全一致！
                    if item["length"] != length:
                        continue
                    
                    # 规则 2：文字不能完全一样
                    if sub_chars == item["word"]:
                        continue

                    # 规则 3：每一个字的拼音(无声调)必须完全相等！
                    is_exact_pinyin_match = True
                    for k in range(length):
                        if sub_p_norm[k] != item["pinyin_norm"][k]:
                            is_exact_pinyin_match = False
                            break
                    
                    if is_exact_pinyin_match:
                        # 检查声调是否完全相同
                        is_same_tone = (sub_p_full == item["pinyin_full"])
                        match_desc = "全同音同声调" if is_same_tone else "全同音异声调"

                        start_idx = char_indices[i]
                        end_idx = char_indices[i + length - 1] + 1
                        pun_sent = sentence[:start_idx] + f"【{item['word']}】" + sentence[end_idx:]

                        matches.append({
                            "original_text": sub_chars,
                            "replaced_word": item["word"],
                            "length": length,
                            "match_type": match_desc,
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
    engine = StrictXieyinEngine(MODERN_DICTIONARY)
    
    print(f"\n{C_BOLD}{C_CYAN}======================================================================{C_END}")
    print(f"{C_BOLD}{C_YELLOW}        🎯 严谨版“字数与拼音逐字完全对齐”古代文献谐音梗挖掘 🎯{C_END}")
    print(f"{C_BOLD}{C_CYAN}======================================================================{C_END}\n")

    total_count = 0
    for doc_name, sentences in LITERATURE_CORPUS.items():
        print(f"{C_BOLD}{C_MAGENTA}📖 {doc_name}{C_END}")
        print("─" * 70)
        doc_count = 0
        for sent in sentences:
            puns = engine.find_puns(sent, min_len=2, max_len=4)
            if puns:
                for p in puns:
                    doc_count += 1
                    total_count += 1
                    print(f"  {C_GREEN}原 句：{C_END}{sent}")
                    print(f"  {C_RED}梗 句：{C_END}{C_BOLD}{p['pun_sentence']}{C_END}")
                    print(f"  {C_YELLOW}对 齐：{C_END}原文「{p['original_text']}」({p['pinyin_orig']}) ──[{p['length']}字对{p['length']}字]──> 现代词「{p['replaced_word']}」({p['pinyin_target']}) | {p['match_type']}")
                    print("  " + "·" * 65)
        if doc_count == 0:
            print("  （本篇在严格字数拼音对齐规则下未发现匹配）")
        print()

    print(f"{C_BOLD}{C_CYAN}======================================================================{C_END}")
    print(f"{C_BOLD}{C_GREEN}✨ 挖掘完成！共扫描 {len(LITERATURE_CORPUS)} 篇典籍，发现 {total_count} 个严格多字全拼音对齐谐音梗！{C_END}")
    print(f"{C_BOLD}{C_CYAN}======================================================================{C_END}\n")


if __name__ == "__main__":
    main()
