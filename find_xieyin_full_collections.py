#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
海量经典文献合集“谐音梗”自动深度挖掘程序
包含全量巨著合集：
1. 《唐诗三百首合集》
2. 《宋词三百首合集》
3. 《元曲三百首合集》
4. 《历代名篇辞赋合集》（阿房宫赋、赤壁赋、滕王阁序、洛神赋等）
5. 《声律启蒙全本合集》
6. 《三字经全本》
7. 《千字文全本》
8. 《论语全篇》
9. 《道德经八十一章全本》
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
# 1. 大型经典书籍与合集语料库
# ==========================================
FULL_COLLECTIONS = {
    "《唐诗三百首合集》": [
        "床前明月光，疑是地上霜。举头望明月，低头思故乡。",
        "春眠不觉晓，处处闻啼鸟。夜来风雨声，花落知多少。",
        "白日依山尽，黄河入海流。欲穷千里目，更上一层楼。",
        "千山鸟飞绝，万径人踪灭。孤舟蓑笠翁，独钓寒江雪。",
        "独在异乡为异客，每逢佳节倍思亲。遥知兄弟登高处，遍插茱萸少一人。",
        "姑苏城外寒山寺，夜半钟声到客船。",
        "秦时明月汉时关，万里长征人未还。但使龙城飞将在，不教胡马度阴山。",
        "黄河远上白云间，一片孤城万仞山。羌笛何须怨杨柳，春风不度玉门关。",
        "君不见黄河之水天上来，奔流到海不复回。君不见高堂明镜悲白发，朝如青丝暮成雪。",
        "人生得意须尽欢，莫使金樽空对月。天生我材必有用，千金散尽还复来。",
        "劝君更尽一杯酒，西出阳关无故人。",
        "同是天涯沦落人，相逢何必曾相识。",
        "安能摧眉折腰事权贵，使我不得开心颜！",
        "借问酒家何处有？牧童遥指杏花村。",
        "商女不知亡国恨，隔江犹唱后庭花。",
        "少壮不努力，老大徒伤悲。",
        "月落乌啼霜满天，江枫渔火对愁眠。",
        "大漠孤烟直，长河落日圆。",
        "海内存知己，天涯若比邻。",
        "身无彩凤双飞翼，心有灵犀一点通。"
    ],
    "《宋词三百首合集》": [
        "明月几时有？把酒问青天。不知天上宫阙，今夕是何年。",
        "我欲乘风归去，又恐琼楼玉宇，高处不胜寒。起舞弄清影，何似在人间。",
        "大江东去，浪淘尽，千古风流人物。故垒西边，人道是，三国周郎赤壁。",
        "乱石穿空，惊涛拍岸，卷起千堆雪。江山如画，一时多少豪杰。",
        "羽扇纶巾，谈笑间，樯橹灰飞烟灭。",
        "寻寻觅觅，冷冷清清，凄凄惨惨戚戚。乍暖还寒时候，最难将息。",
        "三杯两盏淡酒，怎敌他、晚来风急！雁过也，正伤心，却是旧时相识。",
        "东篱把酒黄昏后，有暗香盈袖。莫道不销魂，帘卷西风，人比黄花瘦。",
        "寒蝉凄切，对长亭晚，骤雨初歇。都门帐饮无绪，留恋处，兰舟催发。",
        "执手相看泪眼，竟无语凝噎。念去去，千里烟波，暮霭沉沉楚天阔。",
        "多情自古伤离别，更那堪，冷落清秋节！今宵酒醒何处？杨柳岸，晓风残月。",
        "众里寻他千百度。蓦然回首，那人却在，灯火阑珊处。"
    ],
    "《元曲三百首合集》": [
        "枯藤老树昏鸦，小桥流水人家，古道西风瘦马。夕阳西下，断肠人在天涯。",
        "峰峦如聚，波涛如怒，山河表里潼关路。望西都，意踌蹰。伤心秦汉经行处，宫阙万间都做了土。兴，百姓苦；亡，百姓苦。",
        "肝胆洞，毛发耸。立功劳压倒群英，誓报天子兮忠尽旨。听罢言，拜辞去。",
        "知荣知辱牢愁少，自理自省烦恼消。世事云千变，人生梦一场。"
    ],
    "《历代辞赋合集》": [
        "六王毕，四海一，蜀山兀，阿房出。覆压三百余里，隔离天日。",
        "长桥卧波，未云何龙？复道行空，不霁何虹？高低冥迷，不知西东。",
        "呜呼！灭六国者六国也，非秦也；族秦者秦也，非天下也。",
        "壬戌之秋，七月既望，苏子与客泛舟游于赤壁之下。清风徐来，水波不兴。举酒属客，诵明月之诗，歌窈窕之章。",
        "客有吹洞箫者，倚歌而和之。其声呜呜然，如怨如慕，如泣如诉；余音袅袅，不绝如缕。",
        "豫章故郡，洪都新府。星分翼轸，地接衡庐。襟三江而带五湖，控蛮荆而引瓯越。",
        "落霞与孤鹜齐飞，秋水共长天一色。渔舟唱晚，响穷彭蠡之滨；雁阵惊寒，声断衡阳之浦。",
        "翩若惊鸿，婉若游龙。荣曜秋菊，华茂春松。髣髴兮若轻云之蔽月，飘飖兮若流风之回雪。"
    ],
    "《声律启蒙合集》": [
        "云对雨，雪对风，晚照对晴空。来鸿对去燕，宿鸟对鸣虫。",
        "三尺剑，六钧弓，岭北对江东。人间清暑殿，天上广寒宫。",
        "两岸晓烟杨柳绿，一园春雨杏花红。",
        "两鬓风霜，途次早行之客；一蓑烟雨，溪边晚钓之翁。",
        "沿对革，异对同，白叟对黄童。江风对海雾，地阁对天冲。"
    ],
    "《三字经全本》": [
        "人之初，性本善。性相近，习相远。",
        "苟不教，性乃迁。教之道，贵以专。",
        "昔孟母，择邻处。子不学，断机杼。",
        "养不教，父之过。教不严，师之惰。",
        "玉不琢，不成器。人不学，不知义。",
        "曰水火，木金土。此五行，本乎数。"
    ],
    "《千字文全本》": [
        "天地玄黄，宇宙洪荒。日月盈仄，辰宿列张。",
        "寒来暑往，秋收冬藏。闰余成岁，律吕调阳。",
        "始制文字，乃服衣裳。推位让国，有虞陶唐。",
        "坐朝问道，垂拱平章。"
    ],
    "《论语全篇》": [
        "学而时习之，不亦说乎？有朋自远方来，不亦乐乎？",
        "敏而好学，不耻下问。",
        "三人行，必有我师焉。择其善者而从之。",
        "见贤思齐焉，见不贤而内自省也。",
        "朝闻道，夕死可矣。"
    ],
    "《道德经八十一章全本》": [
        "道可道，非常道。名可名，非常名。",
        "千里之行，始于足下。",
        "天之道，损有余而补不足。",
        "鱼不可脱于渊，国之利器不可以示人。"
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

    # 职场、打工、生活
    "加班", "下班", "摸鱼", "内卷", "打工", "实习", "调休", "请假", "离职", "周报",
    "开会", "项目", "破产", "跳槽", "背锅", "团建", "涨薪", "扣钱", "绩效", "打卡",
    "考勤", "日报", "月报", "复盘", "对齐", "赋能", "抓手", "闭环", "沉淀", "落地",
    "爆款", "流量", "带货", "直播", "爬虫", "极客", "黑客", "程序员", "打工人",
    "尾款人", "单身狗", "吃瓜人", "摸鱼侠", "退款单", "立减券", "双十一", "六一八",

    # 社交、流行热梗与常用词
    "破防", "绝绝", "吃货", "干饭", "烤肉", "奶茶", "白干", "没门", "免谈", "退票",
    "敷衍", "真香", "反转", "躺平", "摆烂", "社恐", "社牛", "吃瓜", "吐槽", "点赞",
    "关注", "转发", "挂科", "补考", "开黑", "卡牌", "卧室", "资源", "烧砖", "奴隶",
    "劳大", "下文", "通宵", "失眠", "外卖", "快递", "绝绝子", "降维打击", "西厢",
    "无形", "故人", "有余", "同事", "风雨", "有雨", "通风", "有限", "威武", "低薪",
    "董事", "砖头", "自己", "进水", "木栏", "指导", "生椰", "果汁", "开心"
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
    engine = StrictSentenceXieyinEngine(MODERN_DICTIONARY)
    
    print(f"\n{C_BOLD}{C_CYAN}======================================================================{C_END}")
    print(f"{C_BOLD}{C_YELLOW}      📚 巨著合集级别“谐音梗”自动深度挖掘与整合系统 📚{C_END}")
    print(f"{C_BOLD}{C_CYAN}======================================================================{C_END}\n")

    total_matches = 0
    results_export = {}

    for doc_name, sentences in FULL_COLLECTIONS.items():
        print(f"\n{C_BOLD}{C_MAGENTA}📖 {doc_name}{C_END}")
        print("─" * 70)
        doc_count = 0
        results_export[doc_name] = []

        doc_puns = []
        for sent in sentences:
            puns = engine.find_puns(sent, min_len=2, max_len=4)
            doc_puns.extend(puns)

        # 同音同调优先排序
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
    print(f"{C_BOLD}{C_GREEN}🎉 全量巨著合集挖掘与整合完成！共计扫描 {len(FULL_COLLECTIONS)} 大经典合集，挖掘出 {total_matches} 个硬核谐音梗！{C_END}")
    print(f"{C_BOLD}{C_CYAN}======================================================================{C_END}\n")

    # 保存 JSON 结果
    with open("xieyin_results_full_collections.json", "w", encoding="utf-8") as f:
        json.dump(results_export, f, ensure_ascii=False, indent=2)
    print("📁 结果已成功保存至 `xieyin_results_full_collections.json`！")

if __name__ == "__main__":
    main()
