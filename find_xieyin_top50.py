#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
海量现代词库全量匹配算法（确保各大文献尽可能输出最多前 50 个严格硬核谐音梗）
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

# 典籍语料
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
        "首孝悌，次见闻。知某数，识某文。",
        "一而十，十而百。百而千，千而万。",
        "三才者，天地人。三光者，日月星。",
        "三纲者，君臣义。父子亲，夫妇顺。",
        "曰春夏，曰秋冬。此四时，运不穷。",
        "曰南北，曰西东。此四方，应乎中。",
        "曰水火，木金土。此五行，本乎数。",
        "稻粱菽，麦黍稷。此六谷，人所食。",
        "马牛羊，鸡犬豕。此六畜，人所饲。",
        "曰喜怒，曰哀惧。爱恶欲，七情具。",
        "匏土革，木石金。丝与竹，乃八音。",
        "高曾祖，父而身。身而子，子而孙。",
        "自子孙，至曾玄。乃九族，人之伦。",
        "父子恩，夫妇从。兄则友，弟则恭。",
        "长幼序，友与朋。君则敬，臣则忠。",
        "此十义，人所同。当顺叙，勿违背。",
        "勤有功，戏无益。戒之哉，宜勉力。",
        "夏有禹，商有汤。周文武，称三王。",
        "秦始皇，平六国。楚汉争，高祖兴。"
    ],
    "《千字文》": [
        "天地玄黄，宇宙洪荒。日月盈仄，辰宿列张。",
        "寒来暑往，秋收冬藏。闰余成岁，律吕调阳。",
        "云腾致雨，露结为霜。金生丽水，玉出昆冈。",
        "剑号巨阙，珠称夜光。果珍李柰，菜重芥姜。",
        "海咸河淡，鳞潜羽翔。龙师火帝，鸟官人皇。",
        "始制文字，乃服衣裳。推位让国，有虞陶唐。",
        "吊民伐罪，周发殷汤。坐朝问道，垂拱平章。",
        "爱育黎首，臣伏戎羌。遐迩一体，率宾归王。",
        "鸣凤在竹，白驹食场。化被草木，赖及万方。",
        "盖此身发，四大五常。恭惟鞠养，岂敢毁伤。",
        "女慕贞洁，男效才良。知过必改，得能莫忘。",
        "罔谈彼短，靡恃己长。信使可覆，器欲难量。",
        "墨悲丝染，诗赞羔羊。景行维贤，克念作圣。",
        "德建名立，形端表正。空谷传声，虚堂习听。",
        "祸因恶积，福缘善庆。尺璧非宝，寸阴是竞。",
        "资父事君，曰严与敬。孝当竭力，忠则尽命。",
        "临深履薄，夙兴温凊。似兰斯馨，如松之盛。",
        "川流不息，渊澄取映。容止若思，言辞安定。",
        "笃初诚美，慎终宜令。荣业所基，籍甚无竟。",
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
        "岁寒，然后知松柏之后凋也。",
        "朝闻道，夕死可矣。",
        "见贤思齐焉，见不贤而内自省也。",
        "君子欲讷于言而敏于行。",
        "质胜文则野，文胜质则史。彬彬有礼，然后君子。",
        "知者乐水，仁者乐山。知者动，仁者静。知者乐，仁者寿。",
        "吾日三省吾身：为人谋而不忠乎？与朋友交而不信乎？传不习乎？",
        "鸟之将死，其鸣也哀；人之将死，其言也善。",
        "君子成人之美，不成人之恶。小人反是。"
    ],
    "《道德经》": [
        "道可道，非常道。名可名，非常名。",
        "无名天地之始；有名万物之母。",
        "天下皆知美之为美，斯恶已。皆知善之为善，斯不善已。",
        "上善若水。水善利万物而不争，处众人之所恶，故几于道。",
        "致虚极，守静笃。万物并作，吾以观复。",
        "知人者智，自知者明。胜人者有力，自胜者强。",
        "大音希声，大象无形。",
        "千里之行，始于足下。",
        "祸兮福之所倚，福兮祸之所伏。",
        "天之道，损有余而补不足。人之道，则不然，损不足以奉有余。",
        "信言不美，美言不信。善者不辩，辩者不善。",
        "柔弱胜刚强。鱼不可脱于渊，国之利器不可以示人。"
    ],
    "《经典古诗词精选》": [
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
        "春眠不觉晓，处处闻啼鸟。夜来风雨声，花落知多少。",
        "同是天涯沦落人，相逢何必曾相识。",
        "桃花潭水深千尺，不及汪伦送我情。",
        "两岸猿声啼不住，轻舟已过万重山。",
        "独在异乡为异客，每逢佳节倍思亲。",
        "海内存知己，天涯若比邻。",
        "身无彩凤双飞翼，心有灵犀一点通。",
        "月落乌啼霜满天，江枫渔火对愁眠。",
        "大漠孤烟直，长河落日圆。",
        "采菊东篱下，悠然见南山。"
    ]
}

# 超大现代常用高频词汇表
MODERN_WORDS_LARGE = [
    # 职场与打工
    "加班", "下班", "摸鱼", "内卷", "打工", "实习", "调休", "请假", "离职", "周报",
    "开会", "项目", "破产", "跳槽", "背锅", "团建", "涨薪", "扣钱", "绩效", "打卡",
    "考勤", "日报", "月报", "复盘", "对齐", "赋能", "抓手", "闭环", "沉淀", "落地",
    "爆款", "流量", "带货", "直播", "爬虫", "极客", "黑客", "程序员", "打工人",
    "尾款人", "单身狗", "吃瓜人", "摸鱼侠", "退款单", "立减券", "双十一", "六一八",
    "加薪", "提成", "年终", "奖金", "薪水", "工资", "调薪", "降薪", "裁员", "辞退",
    "解聘", "入职", "面经", "面试", "岗位", "背调", "试用", "转正", "调岗", "离岗",
    "领导", "同事", "部门", "主管", "经理", "总监", "老板", "组长", "专员", "助理",

    # 财务、消费、网购
    "支出", "支付", "退款", "下单", "尾款", "首付", "买单", "充值", "包邮", "拼团",
    "网购", "打折", "优惠", "立减", "理财", "退货", "利息", "发票", "消费", "借贷",
    "发财", "月光", "打款", "提现", "刷卡", "搞钱", "定金", "车贷", "房贷", "首单",
    "满减", "淘货", "吃土", "涨停", "跌停", "平仓", "加仓", "做空", "割肉", "跑路",
    "解套", "富贵", "网费", "租金", "免单", "卡包", "积分", "抵扣", "返现", "返利",
    "现金", "金条", "理赔", "投保", "保费", "垫付", "账单", "报销", "预付", "欠款",
    "买包", "包餐", "首富", "富翁", "高利", "放贷", "现钱", "定钱",

    # 日常、社交、流行热梗
    "破防", "绝绝", "吃货", "干饭", "烤肉", "奶茶", "白干", "没门", "免谈", "退票",
    "敷衍", "真香", "反转", "躺平", "摆烂", "社恐", "社牛", "吃瓜", "吐槽", "点赞",
    "关注", "转发", "挂科", "补考", "开黑", "卡牌", "卧室", "资源", "烧砖", "奴隶",
    "劳大", "下文", "通宵", "失眠", "外卖", "快递", "绝绝子", "降维打击", "西厢",
    "无形", "故人", "有余", "风雨", "打游戏", "扫码", "微信", "微博", "抖音",
    "快手", "小红书", "贴吧", "B站", "网游", "手游", "充值卡", "盲盒", "手办",
    "吃鸡", "夜宵", "烧烤", "小龙虾", "冰淇淋", "咖啡", "美式", "拿铁", "生椰",
    "可乐", "果汁",

    # 高频现代常用词
    "指导", "意见", "建议", "方法", "方案", "方向", "方式", "经验", "能力", "效率",
    "成绩", "选择", "改变", "未来", "目标", "计划", "行动", "结果", "过程", "影响",
    "关系", "合作", "竞争", "交流", "沟通", "理解", "支持", "信任", "配合", "协助",
    "安排", "处理", "解决", "落实", "管理", "控制", "学习", "思考", "总结", "提升",
    "突破", "创新", "优化", "改善", "调整", "坚持", "安心", "安全", "放心", "开心",
    "快乐", "幸福", "轻松", "自在", "方便", "快捷", "高效", "优质", "稳定", "需求",
    "场景", "体验", "功能", "系统", "软件", "硬件", "数据", "网络", "设备", "产品"
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
        """按标点符号划分成独立子句，绝不跨句切片"""
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
    engine = StrictSentenceXieyinEngine(MODERN_WORDS_LARGE)
    
    print(f"\n{C_BOLD}{C_CYAN}======================================================================{C_END}")
    print(f"{C_BOLD}{C_YELLOW}    🎯 每部文献输出前 50 个高品质严谨谐音梗结果 🎯{C_END}")
    print(f"{C_BOLD}{C_CYAN}======================================================================{C_END}\n")

    total_matches = 0
    results_export = {}

    for doc_name, sentences in LITERATURE_CORPUS.items():
        print(f"\n{C_BOLD}{C_MAGENTA}📖 {doc_name}{C_END}")
        print("─" * 70)
        doc_count = 0
        results_export[doc_name] = []

        doc_puns = []
        for sent in sentences:
            puns = engine.find_puns(sent, min_len=2, max_len=4)
            doc_puns.extend(puns)

        # 优先同音同调，再同音异调
        sorted_doc_puns = sorted(doc_puns, key=lambda x: (not x['is_same_tone'], x['length']))

        top_50 = sorted_doc_puns[:50]

        for p in top_50:
            doc_count += 1
            total_matches += 1
            results_export[doc_name].append(p)
            
            tone_tag = f"{C_GREEN}[同音同声调]{C_END}" if p['is_same_tone'] else f"{C_YELLOW}[同音异声调]{C_END}"
            
            print(f"  {C_CYAN}[{doc_count:02d}]{C_END} {p['pun_sentence']}")
            print(f"       拆解: 原文「{p['original_text']}」({p['pinyin_orig']}) ──[{p['length']}字对{p['length']}字]──> 现代词「{p['replaced_word']}」({p['pinyin_target']}) {tone_tag}")

        if doc_count == 0:
            print("  （此篇在独立子句断句规则下未搜寻到匹配）")
        else:
            print(f"\n  {C_GREEN}小计：{doc_name} 共输出了前 {doc_count} 个精选谐音梗！{C_END}")

    print(f"\n{C_BOLD}{C_CYAN}======================================================================{C_END}")
    print(f"{C_BOLD}{C_GREEN}🎉 挖掘与汇总完成！全文献共计挖掘出 {total_matches} 个高品质谐音梗！{C_END}")
    print(f"{C_BOLD}{C_CYAN}======================================================================{C_END}\n")

    with open("xieyin_results_top50.json", "w", encoding="utf-8") as f:
        json.dump(results_export, f, ensure_ascii=False, indent=2)
    print("📁 结果已成功保存至 `xieyin_results_top50.json` 文件！")

if __name__ == "__main__":
    main()
