#!/usr/bin/env python3
"""Build the project's scored modern-Chinese lexicon.

The generated JSON retains attribution and license metadata. Install the
scoring dependency with `python3 -m pip install wordfreq jieba`, then run:

    python3 scripts/build_modern_lexicon.py

An already-downloaded SUBTLEX-CH zip can be supplied with `--subtlex-zip`.
"""

from __future__ import annotations

import argparse
import csv
import importlib.metadata
import io
import json
import math
import re
import tempfile
import urllib.request
import zipfile
from pathlib import Path

try:
    from wordfreq import zipf_frequency
except ImportError as exc:  # pragma: no cover - exercised by the CLI error path
    raise SystemExit(
        "缺少构建依赖：请先运行 `python3 -m pip install wordfreq jieba`"
    ) from exc


SUBTLEX_URL = (
    "https://www.ugent.be/plone_portal/pp/experimentele-psychologie/"
    "en/research/documents/subtlexch/subtlexch131210.zip"
)
DEFAULT_IDIOM_PATH = Path("data/dictionaries/THUOCL_chengyu.txt")
PURE_HAN = re.compile(r"^[\u4e00-\u9fff]{2,4}$")

# Focus on words that can carry a punchline. Function words, numbers and
# proper nouns are deliberately excluded from the automatic pool.
ALLOWED_POS = {"n", "v", "a", "d", "vn", "an", "ad", "b", "z"}
MIN_WORD_COUNT = 40
MIN_CONTEXT_DIVERSITY = 20
MIN_ZIPF = 3.2
COMMON_IDIOM_LIMIT = 500

# Explicit regression guard for low-frequency domain terms and historical
# names that previously leaked into the UI.
EXCLUDED_WORDS = {
    "脂习", "封谞", "姬奭", "死股", "梨丸", "豫尔", "粿汁", "羊柳",
    "素烩", "杏汁", "纳仁", "喝螺", "计网", "视向", "锁步", "时隙",
    "右值", "王禔", "刘彘", "冘豫", "蛜蝛", "茹藘", "蕠藘",
}

# Fresh slang and recognizable pop-culture references need editorial review;
# corpus frequency alone cannot identify them reliably.
CURATED_TERMS = {
    "晴天": "流行文化", "七里香": "流行文化", "稻香": "流行文化",
    "青花瓷": "流行文化", "双截棍": "流行文化", "卡路里": "流行文化",
    "小苹果": "流行文化", "孤勇者": "流行文化", "阿凡达": "流行文化",
    "泰坦尼克": "流行文化", "流浪地球": "流行文化", "热辣滚烫": "流行文化",
    "战狼": "流行文化", "满江红": "流行文化", "大话西游": "流行文化",
    "霸王别姬": "流行文化", "周杰伦": "流行文化", "刘德华": "流行文化",
    "周星驰": "流行文化", "张学友": "流行文化", "成龙": "流行文化",
    "沈腾": "流行文化", "贾玲": "流行文化", "徐峥": "流行文化",
    "快递": "网络生活", "加班": "网络生活", "买单": "网络生活",
    "首付": "网络生活", "退款": "网络生活", "下单": "网络生活",
    "包邮": "网络生活", "破防": "网络生活", "摸鱼": "网络生活",
    "吃瓜": "网络生活", "干饭": "网络生活", "社恐": "网络生活",
    "社牛": "网络生活", "涨薪": "网络生活", "上新": "网络生活",
    "上心": "网络生活", "点赞": "网络生活", "关注": "网络生活",
    "转发": "网络生活", "投币": "网络生活", "弹幕": "网络生活",
    "高能": "网络生活", "划水": "网络生活", "内卷": "网络生活",
    "躺平": "网络生活", "打工人": "网络生活", "程序员": "网络生活",
    "单身狗": "网络生活", "绝绝子": "网络生活", "双十一": "网络生活",
    "六一八": "网络生活", "尾款人": "网络生活", "摸鱼侠": "网络生活",
    "生椰": "网络生活", "加仓": "网络生活", "涨停": "网络生活",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="生成带现代度评分的中文词库")
    parser.add_argument("--subtlex-zip", type=Path, help="本地 SUBTLEX-CH zip")
    parser.add_argument(
        "--idiom-path",
        type=Path,
        default=DEFAULT_IDIOM_PATH,
        help="THUOCL 高频成语词表",
    )
    parser.add_argument(
        "--idiom-limit",
        type=int,
        default=COMMON_IDIOM_LIMIT,
        help="按 THUOCL 频次选取的常用成语数量",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("data/dictionaries/modern_lexicon.json"),
    )
    return parser.parse_args()


def load_subtlex(zip_path: Path | None) -> list[dict[str, str]]:
    if zip_path is None:
        with tempfile.NamedTemporaryFile(suffix=".zip") as temp_file:
            urllib.request.urlretrieve(SUBTLEX_URL, temp_file.name)
            return read_subtlex_zip(Path(temp_file.name))
    return read_subtlex_zip(zip_path)


def read_subtlex_zip(zip_path: Path) -> list[dict[str, str]]:
    with zipfile.ZipFile(zip_path) as archive:
        filename = next(name for name in archive.namelist() if name.endswith(".utf8"))
        text = archive.read(filename).decode("utf-8-sig")
    return list(csv.DictReader(io.StringIO(text), delimiter="\t"))


def modern_score(word_count: int, context_diversity: int, zipf: float) -> int:
    count_component = min(1.0, math.log10(word_count + 1) / 4.0)
    diversity_component = min(1.0, math.log10(context_diversity + 1) / 3.5)
    zipf_component = min(1.0, max(0.0, (zipf - 2.0) / 3.5))
    return round(100 * (0.35 * count_component + 0.35 * diversity_component + 0.30 * zipf_component))


def load_common_idioms(path: Path, limit: int) -> list[tuple[str, int]]:
    if limit < 0:
        raise ValueError("成语数量不能为负数")
    if not path.exists():
        raise FileNotFoundError(f"缺少 THUOCL 成语词表：{path}")

    frequencies: dict[str, int] = {}
    for line_number, raw_line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        parts = raw_line.split()
        if len(parts) != 2 or not parts[1].isdigit():
            raise ValueError(f"THUOCL 成语词表第 {line_number} 行格式无效")
        word, frequency_text = parts
        if not PURE_HAN.fullmatch(word) or len(word) != 4:
            continue
        frequencies[word] = max(frequencies.get(word, 0), int(frequency_text))

    return sorted(frequencies.items(), key=lambda item: (-item[1], item[0]))[:limit]


def idiom_modern_score(rank: int, total: int) -> int:
    if total <= 1:
        return 92
    return round(92 - 8 * (rank - 1) / (total - 1))


def build_records(
    rows: list[dict[str, str]],
    common_idioms: list[tuple[str, int]] | None = None,
) -> list[dict[str, object]]:
    subtlex_by_word = {row["Word"]: row for row in rows}
    records: dict[str, dict[str, object]] = {}

    for row in rows:
        word = row["Word"]
        if not PURE_HAN.fullmatch(word) or word in EXCLUDED_WORDS:
            continue

        word_count = int(row["WCount"])
        context_diversity = int(row["W-CD"])
        pos = row["Dominant.PoS"]
        zipf = round(zipf_frequency(word, "zh"), 2)
        if (
            pos not in ALLOWED_POS
            or word_count < MIN_WORD_COUNT
            or context_diversity < MIN_CONTEXT_DIVERSITY
            or zipf < MIN_ZIPF
        ):
            continue

        records[word] = {
            "word": word,
            "source": "SUBTLEX-CH+wordfreq",
            "category": "通用现代词",
            "pos": pos,
            "word_count": word_count,
            "context_diversity": context_diversity,
            "zipf": zipf,
            "modern_score": modern_score(word_count, context_diversity, zipf),
            "curated": False,
        }

    idioms = common_idioms or []
    for rank, (word, idiom_frequency) in enumerate(idioms, 1):
        if word in EXCLUDED_WORDS:
            continue
        row = subtlex_by_word.get(word)
        word_count = int(row["WCount"]) if row else 0
        context_diversity = int(row["W-CD"]) if row else 0
        zipf = round(zipf_frequency(word, "zh"), 2)
        records[word] = {
            "word": word,
            "source": "THUOCL高频成语+SUBTLEX-CH" if row else "THUOCL高频成语",
            "category": "常用成语",
            "pos": row["Dominant.PoS"] if row else "idiom",
            "word_count": word_count,
            "context_diversity": context_diversity,
            "zipf": zipf,
            "modern_score": max(
                idiom_modern_score(rank, len(idioms)),
                modern_score(word_count, context_diversity, zipf),
            ),
            "curated": False,
            "idiom_frequency": idiom_frequency,
            "idiom_rank": rank,
        }

    for word, category in CURATED_TERMS.items():
        if not PURE_HAN.fullmatch(word) or word in EXCLUDED_WORDS:
            continue
        row = subtlex_by_word.get(word)
        word_count = int(row["WCount"]) if row else 0
        context_diversity = int(row["W-CD"]) if row else 0
        zipf = round(zipf_frequency(word, "zh"), 2)
        records[word] = {
            "word": word,
            "source": "人工白名单" if row is None else "人工白名单+SUBTLEX-CH",
            "category": category,
            "pos": row["Dominant.PoS"] if row else "editorial",
            "word_count": word_count,
            "context_diversity": context_diversity,
            "zipf": zipf,
            "modern_score": max(88, modern_score(word_count, context_diversity, zipf)),
            "curated": True,
        }

    return sorted(
        records.values(),
        key=lambda item: (-int(item["modern_score"]), str(item["word"])),
    )


def main() -> None:
    args = parse_args()
    common_idioms = load_common_idioms(args.idiom_path, args.idiom_limit)
    records = build_records(load_subtlex(args.subtlex_zip), common_idioms)
    payload = {
        "schema_version": 1,
        "data_license": "CC BY-SA 4.0 compatible derived data; retain this metadata",
        "generator": {
            "script": "scripts/build_modern_lexicon.py",
            "wordfreq_version": importlib.metadata.version("wordfreq"),
            "subtlex_snapshot": "2010-12-13",
        },
        "criteria": {
            "length": "2-4 个纯汉字",
            "allowed_pos": sorted(ALLOWED_POS),
            "min_word_count": MIN_WORD_COUNT,
            "min_context_diversity": MIN_CONTEXT_DIVERSITY,
            "min_zipf": MIN_ZIPF,
            "proper_nouns": "自动排除；仅允许人工白名单加入",
            "common_idioms": {
                "source": "THUOCL_chengyu.txt",
                "selection": "按语料频次降序，仅取高频前段",
                "limit": args.idiom_limit,
                "selected": len(common_idioms),
            },
        },
        "attribution": [
            {
                "name": "SUBTLEX-CH",
                "citation": "Cai, Q. & Brysbaert, M. (2010), PLOS ONE 5(6): e10729",
                "url": "https://www.ugent.be/pp/experimentele-psychologie/en/research/documents/subtlexch",
            },
            {
                "name": "wordfreq",
                "citation": "Robyn Speer (2022), wordfreq v3.0",
                "url": "https://github.com/rspeer/wordfreq",
            },
            {
                "name": "THUOCL 成语词表",
                "citation": "Tsinghua University Natural Language Processing Lab, THU Open Chinese Lexicon",
                "url": "https://github.com/thunlp/THUOCL",
                "license": "MIT",
            },
        ],
        "record_count": len(records),
        "words": records,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")
    print(f"生成 {len(records)} 个现代词：{args.output}")


if __name__ == "__main__":
    main()
