#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
参考 gushi_namer (https://holynova.github.io/gushi_namer/) 权威书籍合集：
涵盖：
1. 《诗经》
2. 《楚辞》
3. 《唐诗三百首》
4. 《宋词三百首》
5. 《乐府诗集》
6. 《古诗十九首》
7. 《周易》
8. 《尚书》
9. 《礼记·大学·中庸》
10. 《庄子》
11. 《论语》
12. 《孟子》
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

# 参考 gushi_namer 的 12 大权威典籍合集语料
GUSHI_NAMER_COLLECTIONS = {
    "《诗经》合集": [
        "关关雎鸠，在河之洲。窈窕淑女，君子好逑。",
        "参差荇菜，左右流之。窈窕淑女，寤寐求之。",
        "蒹葭苍苍，白露为霜。所谓伊人，在水一方。",
        "桃之夭夭，灼灼其华。之子于归，宜其室家。",
        "昔我往矣，杨柳依依。今我来思，雨雪霏霏。",
        "死生契阔，与子成说。执子之手，与子偕老。",
        "青青子衿，悠悠我心。纵我不往，子宁不嗣音？",
        "投我以木桃，报之以琼瑶。匪报也，永以为好也。",
        "风雨如晦，鸡鸣不已。既见君子，云胡不喜？"
    ],
    "《楚辞》合集": [
        "路漫漫其修远兮，吾将上下而求索。",
        "长太息以掩涕兮，哀民生之多艰。",
        "亦余心之所善兮，虽九死其犹未悔。",
        "日月忽其不淹兮，春与秋其代序。",
        "朝饮木兰之坠露兮，夕餐秋菊之落英。",
        "帝子降兮北渚，目眇眇兮愁予。袅袅兮秋风，洞庭波兮木叶下。",
        "悲莫悲兮生别离，乐莫乐兮新相知。",
        "风飒飒兮木萧萧，思公子兮徒离忧。"
    ],
    "《唐诗三百首》合集": [
        "床前明月光，疑是地上霜。举头望明月，低头思故乡。",
        "春眠不觉晓，处处闻啼鸟。夜来风雨声，花落知多少。",
        "白日依山尽，黄河入海流。欲穷千里目，更上一层楼。",
        "千山鸟飞绝，万径人踪灭。孤舟蓑笠翁，独钓寒江雪。",
        "独在异乡为异客，每逢佳节倍思亲。",
        "姑苏城外寒山寺，夜半钟声到客船。",
        "人生得意须尽欢，莫使金樽空对月。天生我材必有用，千金散尽还复来。",
        "劝君更尽一杯酒，西出阳关无故人。",
        "同是天涯沦落人，相逢何必曾相识。",
        "安能摧眉折腰事权贵，使我不得开心颜！",
        "借问酒家何处有？牧童遥指杏花村。",
        "少壮不努力，老大徒伤悲。",
        "月落乌啼霜满天，江枫渔火对愁眠。"
    ],
    "《宋词三百首》合集": [
        "明月几时有？把酒问青天。不知天上宫阙，今夕是何年。",
        "我欲乘风归去，又恐琼楼玉宇，高处不胜寒。",
        "大江东去，浪淘尽，千古风流人物。",
        "乱石穿空，惊涛拍岸，卷起千堆雪。江山如画，一时多少豪杰。",
        "寻寻觅觅，冷冷清清，凄凄惨惨戚戚。",
        "东篱把酒黄昏后，有暗香盈袖。莫道不销魂，帘卷西风，人比黄花瘦。",
        "寒蝉凄切，对长亭晚，骤雨初歇。",
        "众里寻他千百度。蓦然回首，那人却在，灯火阑珊处。"
    ],
    "《乐府诗集》合集": [
        "江南可采莲，莲叶何田田。鱼戏莲叶间。",
        "青青陵上柏，磊磊涧中石。人生天地间，忽如远行客。",
        "行行重行行，与君生别离。相去万余里，各在天一涯。",
        "涉江采芙蓉，兰泽多芳草。采之欲遗谁？所思在远道。"
    ],
    "《古诗十九首》合集": [
        "庭中有奇树，绿叶发华滋。攀条折其荣，将以遗所思。",
        "迢迢牵牛星，皎皎河汉女。纤纤擢素手，札札弄机杼。",
        "盈盈一水间，脉脉不得语。"
    ],
    "《周易》合集": [
        "天行健，君子以自强不息。",
        "地势坤，君子以厚德载物。",
        "潜龙勿用，阳在下也。见龙在田，德施普也。",
        "云行雨施，品物流形。",
        "同声相应，同气相求。水流湿，火就燥。",
        "积善之家，必有余庆；积不善之家，必有余殃。"
    ],
    "《尚书》合集": [
        "满招损，谦受益，时乃天道。",
        "人心惟危，道心惟微，惟精惟一，允执厥中。",
        "克明俊德，以亲九族。九族既睦，平章百姓。"
    ],
    "《礼记·大学·中庸》合集": [
        "大学之道，在明明德，在亲民，在止于至善。",
        "知止而后有定，定而后能静，静而后能安，安而后能虑，虑而后能得。",
        "天命之谓性，率性之谓道，修道之谓教。",
        "博学之，审问之，慎思之，明辨之，笃行之。",
        "玉不琢，不成器；人不学，不知道。"
    ],
    "《庄子》合集": [
        "北冥有鱼，其名为鲲。",
        "大鹏一日同风起，扶摇直上九万里。",
        "水之积也不厚，则其负大舟也无力。",
        "吾生也有涯，而知也无涯。以有涯随无涯，殆已！",
        "泉涸，鱼相与处于陆，相呴以湿，相濡以沫，不如相忘于江湖。"
    ],
    "《论语》合集": [
        "学而时习之，不亦说乎？有朋自远方来，不亦乐乎？",
        "敏而好学，不耻下问。",
        "三人行，必有我师焉。择其善者而从之。",
        "见贤思齐焉，见不贤而内自省也。",
        "朝闻道，夕死可矣。",
        "岁寒，然后知松柏之后凋也。"
    ],
    "《孟子》合集": [
        "天时不如地利，地利不如人和。",
        "生于忧患，而死于安乐。",
        "富贵不能淫，贫贱不能移，威武不能屈。",
        "老吾老，以及人之老；幼吾幼，以及人之幼。",
        "穷则独善其身，达则兼善天下。"
    ]
}

# 2. 地道、通俗、现代高频词库
MODERN_DICTIONARY = [
    # 财务、消费、网购
    "支出", "支付", "退款", "下单", "尾款", "首付", "买单", "充值", "包邮", "拼团",
    "网购", "打折", "优惠", "立减", "理财", "退货", "利息", "发票", "消费", "借贷",
    "发财", "月光", "打款", "提现", "刷卡", "搞钱", "定金", "车贷", "房贷", "首单",
    "满减", "淘货", "吃土", "涨停", "跌停", "平仓", "加仓", "做空", "割肉", "跑路",
    "解套", "富贵", "网费", "租金", "免单", "卡包", "积分", "抵扣", "返现", "返利",
    "有余", "有雨", "通风", "有限", "威武", "低薪", "董事", "砖头", "自己", "进水",

    # 职场、打工、生活
    "加班", "下班", "摸鱼", "内卷", "打工", "实习", "调休", "请假", "离职", "周报",
    "开会", "项目", "破产", "跳槽", "背锅", "团建", "涨薪", "扣钱", "绩效", "打卡",
    "考勤", "日报", "月报", "复盘", "对齐", "赋能", "抓手", "闭环", "沉淀", "落地",
    "爆款", "流量", "带货", "直播", "爬虫", "极客", "黑客", "程序员", "打工人",
    "尾款人", "单身狗", "吃瓜人", "摸鱼侠", "退款单", "立减券", "双十一", "六一八",

    # 社交与日常高频词
    "破防", "绝绝", "吃货", "干饭", "烤肉", "奶茶", "白干", "没门", "免谈", "退票",
    "敷衍", "真香", "反转", "躺平", "摆烂", "社恐", "社牛", "吃瓜", "吐槽", "点赞",
    "关注", "转发", "挂科", "补考", "开黑", "卡牌", "卧室", "资源", "烧砖", "奴隶",
    "劳大", "下文", "通宵", "失眠", "外卖", "快递", "绝绝子", "降维打击", "西厢",
    "无形", "故人", "风雨", "木栏", "指导", "生椰", "果汁", "开心", "不息"
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
        sub_parts = re.split(r'([，。；？！、\n\r\t“”《》兮])', text)
        result = []
        curr_offset = 0
        
        for part in sub_parts:
            if not part:
                continue
            if re.search(r'[，。；？！、\n\r\t“”《》兮]', part):
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
    engine = StrictSentenceXieyinEngine(MODERN_DICTIONARY)
    
    print(f"\n{C_BOLD}{C_CYAN}======================================================================{C_END}")
    print(f"{C_BOLD}{C_YELLOW}   🏛️ 参考 gushi_namer 的 12 大权威典籍合集谐音梗挖掘报告 🏛️{C_END}")
    print(f"{C_BOLD}{C_CYAN}======================================================================{C_END}\n")

    total_matches = 0
    results_export = {}

    for doc_name, sentences in GUSHI_NAMER_COLLECTIONS.items():
        print(f"\n{C_BOLD}{C_MAGENTA}📖 {doc_name}{C_END}")
        print("─" * 70)
        doc_count = 0
        results_export[doc_name] = []

        doc_puns = []
        for sent in sentences:
            puns = engine.find_puns(sent, min_len=2, max_len=4)
            doc_puns.extend(puns)

        sorted_doc_puns = sorted(doc_puns, key=lambda x: (not x['is_same_tone'], x['length']))

        for p in sorted_doc_puns:
            doc_count += 1
            total_matches += 1
            results_export[doc_name].append(p)
            
            tone_tag = f"{C_GREEN}[同音同声调]{C_END}" if p['is_same_tone'] else f"{C_YELLOW}[同音异声调]{C_END}"
            
            print(f"  {C_CYAN}[{doc_count:02d}]{C_END} {p['pun_sentence']}")
            print(f"       拆解: 原文「{p['original_text']}」({p['pinyin_orig']}) ──[{p['length']}字对{p['length']}字]──> 现代词「{p['replaced_word']}」({p['pinyin_target']}) {tone_tag}")
            print("  " + "·" * 65)

        if doc_count == 0:
            print("  （此合集在独立子句规则下未搜寻到匹配）")
        else:
            print(f"  {C_GREEN}小计：{doc_name} 成功挖掘出 {doc_count} 个经典合集谐音梗！{C_END}")

    print(f"\n{C_BOLD}{C_CYAN}======================================================================{C_END}")
    print(f"{C_BOLD}{C_GREEN}🎉 gushi_namer 12大权威典籍合集挖掘完成！共挖掘出 {total_matches} 个硬核谐音梗！{C_END}")
    print(f"{C_BOLD}{C_CYAN}======================================================================{C_END}\n")

    with open("xieyin_results_gushi_namer.json", "w", encoding="utf-8") as f:
        json.dump(results_export, f, ensure_ascii=False, indent=2)
    print("📁 结果已成功保存至 `xieyin_results_gushi_namer.json`！")

if __name__ == "__main__":
    main()
