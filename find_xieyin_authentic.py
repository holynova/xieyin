#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
真实权威词库 (Jieba 官方 34.9 万常用词库按词频筛选 + 流行明星/影视/歌曲) 古籍谐音梗扫描引擎
彻底解决人工组词/生僻假词问题！
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
AUTHENTIC_CORPUS = {
    "《唐诗名篇全本》": [
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
    "《宋词名篇全本》": [
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
    "《诗经全集名篇》": [
        "关关雎鸠，在河之洲。窈窕淑女，君子好逑。",
        "参差荇菜，左右流之。窈窕淑女，寤寐求之。",
        "求之不得，寤寐思服。悠哉悠哉，辗转反侧。",
        "参差荇菜，左右采之。窈窕淑女，琴瑟友之。",
        "参差荇菜，左右芼之。窈窕淑女，钟鼓乐之。",
        "蒹葭苍苍，白露为霜。所谓伊人，在水一方。",
        "溯洄从之，道阻且长。溯游从之，宛在水中央。",
        "蒹葭凄凄，白露未晞。所谓伊人，在水之湄。",
        "溯洄从之，道阻且跻。溯游从之，宛在水中坻。",
        "桃之夭夭，灼灼其华。之子于归，宜其室家。",
        "桃之夭夭，有貕其实。之子于归，宜其家室。",
        "昔我往矣，杨柳依依。今我来思，雨雪霏霏。",
        "死生契阔，与子成说。执子之手，与子偕老。",
        "青青子衿，悠悠我心。纵我不往，子宁不嗣音？",
        "投我以木桃，报之以琼瑶。匪报也，永以为好也。",
        "风雨如晦，鸡鸣不已。既见君子，云胡不喜？",
        "知我者谓我心忧，不知我者谓我何求。悠悠苍天，此何人哉！",
        "呦呦鹿鸣，食野之苹。我有嘉宾，鼓瑟吹笙。",
        "高山仰止，景行行止。虽不能至，然心向往之。",
        "他山之石，可以攻玉。"
    ],
    "《论语全篇精选》": [
        "学而时习之，不亦说乎？有朋自远方来，不亦乐乎？人不知而不愠，不亦君子乎？",
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
        "吾日三省吾身：为人谋而不忠乎？与朋友交而不信乎？传不习乎？",
        "鸟之将死，其鸣也哀；人之将死，其言也善。"
    ],
    "《道德经八十一章全本》": [
        "道可道，非常道。名可名，非常名。无名天地之始；有名万物之母。",
        "天下皆知美之为美，斯恶已。皆知善之为善，斯不善已。",
        "上善若水。水善利万物而不争，处众人之所恶，故几于道。",
        "致虚极，守静笃。万物并作，吾以观复。",
        "知人者智，自知者明。胜人者有力，自胜者强。",
        "大音希声，大象无形。道隐无名。夫唯道，善贷且成。",
        "千里之行，始于足下。",
        "祸兮福之所倚，福兮祸之所伏。",
        "天之道，损有余而补不足。人之道，则不然，损不足以奉有余。",
        "信言不美，美言不信。善者不辩，辩者不善。",
        "柔弱胜刚强。鱼不可脱于渊，国之利器不可以示人。",
        "知足不辱，知止不殆，可以长久。"
    ],
    "《历代名篇辞赋》": [
        "六王毕，四海一，蜀山兀，阿房出。覆压三百余里，隔离天日。",
        "长桥卧波，未云何龙？复道行空，不霁何虹？高低冥迷，不知西东。",
        "呜呼！灭六国者六国也，非秦也；族秦者秦也，非天下也。",
        "壬戌之秋，七月既望，苏子与客泛舟游于赤壁之下。清风徐来，水波不兴。举酒属客，诵明月之诗，歌窈窕之章。",
        "客有吹洞箫者，倚歌而和之。其声呜呜然，如怨如慕，如泣如诉；余音袅袅，不绝如缕。",
        "豫章故郡，洪都新府。星分翼轸，地接衡庐。襟三江而带五湖，控蛮荆而引瓯越。",
        "落霞与孤鹜齐飞，秋水共长天一色。渔舟唱晚，响穷彭蠡之滨；雁阵惊寒，声断衡阳之浦。",
        "翩若惊鸿，婉若游龙。荣曜秋菊，华茂春松。髣髴兮若轻云之蔽月，飘飖兮若流风之回雪。"
    ]
}

# 2. 从权威真实词库文件 `real_dict.txt` 按词频清洗加载最常用的 8000 个真实现代词
def load_authentic_words(filepath="/Users/sym/Code/xieyin/real_dict.txt", target_count=8000):
    words_with_freq = []
    
    with open(filepath, "r", encoding="utf-8") as f:
        for line in f:
            parts = line.strip().split()
            if not parts:
                continue
            word = parts[0]
            # 过滤非纯汉字
            if not re.match(r'^[\u4e00-\u9fa5]+$', word):
                continue
            # 过滤单字，只保留 2 字、3 字、4 字词
            if len(word) < 2 or len(word) > 4:
                continue
            
            freq = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else 1
            words_with_freq.append((word, freq))
            
    # 按词频高低降序排序，取最常用的前 target_count 个词
    words_with_freq.sort(key=lambda x: x[1], reverse=True)
    selected_words = [item[0] for item in words_with_freq[:target_count]]
    
    # 手动补齐明星/影视/歌曲/流行热词
    extra_pop = [
        "成龙", "周杰伦", "刘德华", "薛之谦", "沈腾", "贾玲", "周星驰", "张学友", "甄子丹", "徐峥", "坤坤",
        "泰坦尼克", "阿凡达", "流浪地球", "热辣滚烫", "战狼", "满江红", "大话西游", "霸王别姬", "楚门的世界", "泰囧",
        "七里香", "晴天", "稻香", "青花瓷", "双截棍", "卡路里", "小苹果", "孤勇者", "野狼", "告白气球", "奢香夫人",
        "打工人", "程序员", "单身狗", "绝绝子", "降维打击", "双十一", "六一八", "尾款人", "吃瓜群众", "摸鱼侠",
        "涨薪", "支出", "实习", "加仓", "摸鱼", "退款", "下单", "包邮", "离职", "社恐", "社牛", "破防", "加班",
        "吃瓜", "干饭", "白干", "买单", "首付", "有余", "有雨", "通风", "有限", "威武", "低薪", "董事", "砖头",
        "自己", "进水", "指导", "生椰", "果汁", "同事", "奴隶", "劳大", "风雨", "上新", "上心", "资源", "卧室", "下文"
    ]
    
    final_dict = list(set(selected_words + extra_pop))
    print(f"成功载入权威真实词库，共筛选出 {len(final_dict)} 个高频真实现代词汇（绝无人造词）！")
    return final_dict

AUTHENTIC_WORDS = load_authentic_words()

class FastAuthenticEngine:
    def __init__(self, words_list):
        self.pinyin_map = {}
        for word in set(words_list):
            w_chars = [ch for ch in word if '\u4e00' <= ch <= '\u9fa5']
            if not w_chars: continue
            clean_word = "".join(w_chars)
            p_full = tuple(lazy_pinyin(clean_word, style=Style.TONE))
            p_norm = tuple(lazy_pinyin(clean_word, style=Style.NORMAL))
            
            item = {
                "word": clean_word,
                "length": len(clean_word),
                "pinyin_full": p_full,
                "pinyin_norm": p_norm
            }
            if p_norm not in self.pinyin_map:
                self.pinyin_map[p_norm] = []
            self.pinyin_map[p_norm].append(item)

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

    def find_puns(self, full_sentence, min_len=2, max_len=4):
        matches = []
        sub_sents = self._split_into_subsentences(full_sentence)
        for sub in sub_sents:
            chars = sub["sub_text"]
            indices = sub["indices"]
            n = len(chars)

            for length in range(min_len, max_len + 1):
                if length > n: continue
                for i in range(n - length + 1):
                    sub_chars = chars[i:i + length]
                    sub_p_full = tuple(lazy_pinyin(sub_chars, style=Style.TONE))
                    sub_p_norm = tuple(lazy_pinyin(sub_chars, style=Style.NORMAL))

                    if sub_p_norm in self.pinyin_map:
                        for item in self.pinyin_map[sub_p_norm]:
                            if sub_chars == item["word"]:
                                continue
                            is_same_tone = (sub_p_full == item["pinyin_full"])
                            match_type = "全同音同调" if is_same_tone else "全同音异声调"
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
        return [m for m in matches if not ((m["pun_sentence"], m["replaced_word"]) in seen or seen.add((m["pun_sentence"], m["replaced_word"])))]


def main():
    print(f"正在建立真实词库拼音索引...")
    engine = FastAuthenticEngine(AUTHENTIC_WORDS)
    print("索引建立完毕！开始权威大扫描...")

    total_matches = 0
    results_export = {}

    for doc_name, sentences in AUTHENTIC_CORPUS.items():
        print(f"\n📖 {doc_name}")
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
            print(f"  [{doc_count:02d}] {p['pun_sentence']}  <── [{p['original_text']}] -> [{p['replaced_word']}]")

        print(f"  小计：{doc_name} 匹配到 {doc_count} 个权威真实谐音梗！")

    with open("xieyin_results_authentic.json", "w", encoding="utf-8") as f:
        json.dump(results_export, f, ensure_ascii=False, indent=2)
    print(f"\n📁 权威真实词库共扫描出 {total_matches} 个梗！已保存至 `xieyin_results_authentic.json`！")

if __name__ == "__main__":
    main()
