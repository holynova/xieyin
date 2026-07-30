/**
 * Homophonic matching engine.
 *
 * Rules:
 * 1. Never create a window across punctuation or paragraph boundaries.
 * 2. Match N Han characters against N Han characters.
 * 3. Resolve polyphonic characters from the complete clause, then slice the
 *    resolved pinyin arrays. Never re-pronounce an isolated 2–4 character span.
 */

const { pinyin, customPinyin } = require('pinyin-pro');

const HAN_RE = /\p{Script=Han}/u;
const BOUNDARY_RE = /[，,。．.;；:：?？!！、…—–\-\n\r\t“”‘’「」『』《》〈〉（）()【】\[\]{}]/u;
const PINYIN_OPTIONS = { type: 'array', toneSandhi: false, segmentit: 2 };

class HomophonicEngine {
  constructor(dictionaryWords, options = {}) {
    this.pinyinMap = new Map();
    if (options.pinyinOverrides && Object.keys(options.pinyinOverrides).length) {
      customPinyin(options.pinyinOverrides, { polyphonic: 'replace' });
    }

    const uniqueWords = Array.from(new Set(dictionaryWords));
    for (const rawWord of uniqueWords) {
      const cleanWord = rawWord.trim();
      if (!cleanWord) continue;
      const pFull = this._toPinyin(cleanWord, 'symbol').join(' ');
      const pNormKey = this._toPinyin(cleanWord, 'none').join(' ');
      const item = {
        word: cleanWord,
        length: Array.from(cleanWord).length,
        pinyinFull: pFull,
        pinyinNormKey: pNormKey
      };
      if (!this.pinyinMap.has(pNormKey)) this.pinyinMap.set(pNormKey, []);
      this.pinyinMap.get(pNormKey).push(item);
    }
  }

  _toPinyin(text, toneType) {
    return pinyin(text, { ...PINYIN_OPTIONS, toneType });
  }

  _splitIntoSubsentences(text) {
    const result = [];
    let chars = [];
    let indices = [];

    const flush = () => {
      if (chars.length) result.push({ subText: chars.join(''), indices });
      chars = [];
      indices = [];
    };

    let codeUnitOffset = 0;
    for (const character of text) {
      if (BOUNDARY_RE.test(character)) {
        flush();
      } else if (HAN_RE.test(character)) {
        chars.push(character);
        indices.push(codeUnitOffset);
      }
      codeUnitOffset += character.length;
    }
    flush();
    return result;
  }

  findPuns(fullSentence, minLen = 2, maxLen = 4) {
    const matches = [];
    const subSents = this._splitIntoSubsentences(fullSentence);

    for (const sub of subSents) {
      const chars = sub.subText;
      const indices = sub.indices;
      const n = Array.from(chars).length;
      const contextFull = this._toPinyin(chars, 'symbol');
      const contextNorm = this._toPinyin(chars, 'none');
      if (contextFull.length !== n || contextNorm.length !== n) {
        throw new Error(`拼音与汉字未对齐：${chars}`);
      }

      for (let length = minLen; length <= maxLen; length++) {
        if (length > n) continue;
        for (let i = 0; i <= n - length; i++) {
          const subChars = Array.from(chars).slice(i, i + length).join('');
          const subPFull = contextFull.slice(i, i + length).join(' ');
          const subPNormKey = contextNorm.slice(i, i + length).join(' ');
          const candidateItems = this.pinyinMap.get(subPNormKey) || [];

          for (const item of candidateItems) {
            if (subChars === item.word) continue;
            const isSameTone = subPFull === item.pinyinFull;
            const startIdx = indices[i];
            const endIdx = indices[i + length - 1] + 1;
            matches.push({
              original_text: subChars,
              replaced_word: item.word,
              length,
              match_type: isSameTone ? '全同音同调' : '全同音异声调',
              is_same_tone: isSameTone,
              pun_sentence: `${fullSentence.slice(0, startIdx)}【${item.word}】${fullSentence.slice(endIdx)}`,
              pinyin_orig: subPFull,
              pinyin_target: item.pinyinFull
            });
          }
        }
      }
    }

    const seen = new Set();
    return matches.filter(match => {
      const key = `${match.pun_sentence}_${match.replaced_word}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}

module.exports = HomophonicEngine;
module.exports.BOUNDARY_RE = BOUNDARY_RE;
