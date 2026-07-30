/**
 * 核心算法引擎模块 (src/engine.js)
 * 规则：
 * 1. 绝不跨标点符号断句切片。
 * 2. N字严格替换N字（无声调拼音逐字完全相同）。
 */

const { pinyin } = require('pinyin-pro');

class HomophonicEngine {
  constructor(dictionaryWords) {
    this.pinyinMap = new Map();

    const uniqueWords = Array.from(new Set(dictionaryWords));
    for (const rawWord of uniqueWords) {
      const cleanWord = rawWord.trim();
      if (!cleanWord) continue;

      // 使用 pinyin-pro 获取带声调与无声调拼音数组
      const pFull = pinyin(cleanWord, { toneType: 'symbol', type: 'array' }).join(' ');
      const pNormKey = pinyin(cleanWord, { toneType: 'none', type: 'array' }).join(' ');

      const item = {
        word: cleanWord,
        length: cleanWord.length,
        pinyinFull: pFull,
        pinyinNormKey: pNormKey
      };

      if (!this.pinyinMap.has(pNormKey)) {
        this.pinyinMap.set(pNormKey, []);
      }
      this.pinyinMap.get(pNormKey).push(item);
    }
  }

  _splitIntoSubsentences(text) {
    // 依据标点符号切割子句
    const parts = text.split(/([，。；？！、\n\r\t“”《》兮])/);
    const result = [];
    let currOffset = 0;

    for (const part of parts) {
      if (!part || /[，。；？！、\n\r\t“”《》兮]/.test(part)) {
        currOffset += part ? part.length : 0;
        continue;
      }

      const chars = [];
      const indices = [];

      for (let i = 0; i < part.length; i++) {
        const ch = part[i];
        if (/[\u4e00-\u9fa5]/.test(ch)) {
          chars.push(ch);
          indices.push(currOffset + i);
        }
      }

      if (chars.length > 0) {
        result.append
          ? result.append({ subText: chars.join(''), indices })
          : result.push({ subText: chars.join(''), indices });
      }

      currOffset += part.length;
    }

    return result;
  }

  findPuns(fullSentence, minLen = 2, maxLen = 4) {
    const matches = [];
    const subSents = this._splitIntoSubsentences(fullSentence);

    for (const sub of subSents) {
      const chars = sub.subText;
      const indices = sub.indices;
      const n = chars.length;

      for (let length = minLen; length <= maxLen; length++) {
        if (length > n) continue;

        for (let i = 0; i <= n - length; i++) {
          const subChars = chars.slice(i, i + length);
          const subPFull = pinyin(subChars, { toneType: 'symbol', type: 'array' }).join(' ');
          const subPNormKey = pinyin(subChars, { toneType: 'none', type: 'array' }).join(' ');

          if (this.pinyinMap.has(subPNormKey)) {
            const candidateItems = this.pinyinMap.get(subPNormKey);

            for (const item of candidateItems) {
              if (subChars === item.word) continue;

              const isSameTone = (subPFull === item.pinyinFull);
              const matchType = isSameTone ? '全同音同调' : '全同音异声调';
              const startIdx = indices[i];
              const endIdx = indices[i + length - 1] + 1;

              const punSent = fullSentence.slice(0, startIdx) + `【${item.word}】` + fullSentence.slice(endIdx);

              matches.push({
                original_text: subChars,
                replaced_word: item.word,
                length: length,
                match_type: matchType,
                is_same_tone: isSameTone,
                pun_sentence: punSent,
                pinyin_orig: subPFull,
                pinyin_target: item.pinyinFull
              });
            }
          }
        }
      }
    }

    // 去重逻辑
    const seen = new Set();
    const uniqueMatches = [];
    for (const m of matches) {
      const key = `${m.pun_sentence}_${m.replaced_word}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueMatches.push(m);
      }
    }

    return uniqueMatches;
  }
}

module.exports = HomophonicEngine;
