// AI图片生成提示词配置文件

// 天干的具体元素描述
export const tianGanDescriptions = {
  '甲': '森林之木，如参天大树，茂密森林，象征生机与成长',
  '乙': '花草之木，如娇艳花朵，柔美草木，象征温柔与美丽',
  '丙': '太阳之火，如烈日当空，光芒万丈，象征光明与热情',
  '丁': '烛光之火，如温暖烛光，柔和光芒，象征智慧与温暖',
  '戊': '城墙之土，如坚固城墙，厚重稳固，象征承载与保护',
  '己': '田园之土，如肥沃田园，丰收土地，象征孕育与富足',
  '庚': '刀斧之金，如锋利刀斧，坚韧金属，象征坚强与果断',
  '辛': '首饰之金，如精美首饰，珍贵珠宝，象征精致与珍贵',
  '壬': '江河之水，如奔流江河，浩瀚水流，象征智慧与包容',
  '癸': '雨露之水，如细雨润物，甘露滋养，象征温润与慈爱'
};

// 生成天干融合图片的提示词
export function generateImagePrompt(tianGans) {
  // 1) 组装名称与描述
  const tianGanNames = tianGans.map(t => `${t.pillar}(${t.tianGan})`).join('、');
  const descriptions = tianGans.map(t => `${t.pillar}${t.tianGan}: ${tianGanDescriptions[t.tianGan] || t.tianGan}`).join('\n');

  // 2) 允许/禁止元素集合（确保只出现被允许的元素，避免“山/水/太阳”等默认素材误入）
  const stemToElement = {
    '甲': '森林之木',
    '乙': '花草之木',
    '丙': '太阳之火',
    '丁': '烛光之火',
    '戊': '城墙之土',
    '己': '田园之土',
    '庚': '刀斧之金',
    '辛': '首饰之金',
    '壬': '江河之水',
    '癸': '雨露之水'
  };
  const allElements = Object.values(stemToElement);
  const selectedStems = tianGans.map(t => t.tianGan);
  const allowedElements = Array.from(new Set(selectedStems.map(s => stemToElement[s]).filter(Boolean)));
  const bannedElements = allElements.filter(e => !allowedElements.includes(e));

  // 3) 主次权重（突出“日柱”为主元素，如果存在）
  const day = tianGans.find(t => t.pillar === '日柱');
  const mainElement = day ? (stemToElement[day.tianGan] || '') : (allowedElements[0] || '');
  const secondaryElements = allowedElements.filter(e => e !== mainElement);

  // 4) 单主题场景（当四柱同一天干时）
  const allSame = selectedStems.length === 4 && selectedStems.every(s => s === selectedStems[0]);

  // 5) 生成提示词
  return `请创作一张融合中国传统美学的方形艺术作品，体现以下四个天干的能量融合：

${descriptions}

艺术与构图要求：
1. 画幅：方形 1024x1024，一幅完整作品，禁止四宫格或拼贴。
2. 风格：中国水墨审美，可融合现代构图，留白得当，画面和谐统一，严禁插入中文文字、水印、Logo。
3. 允许出现的核心元素（只允许以下主题入画）：${allowedElements.join('、') || '（无）'}。
4. 禁止出现的元素（如非允许元素请绝对不要绘制）：${bannedElements.join('、') || '（无）'}；此外，若不在允许清单中，避免山峦、湖海、太阳、月亮、云朵、人物、动物、亭台楼阁等通用素材。
5. 视觉重点：${mainElement ? `以“${mainElement}”为主视觉焦点，` : ''}${secondaryElements.length ? `辅以“${secondaryElements.join('”、“')}”的细节点缀，` : ''}整体层次清晰，主题鲜明。
6. 构图建议（任选其一或综合）：
   - 单主体构图：中心主体承载主题，背景极简、留白突出主旨。
   - 对角动势：主元素位于画面对角动线，辅元素分布于相邻象限，保持平衡。
   - 前后景层次：主元素清晰、对比强；辅元素柔和、虚化处理，仅作氛围。
7. 色彩：以传统国画色系为基调，整体克制统一；仅在允许元素主题上做针对性的色彩强调（例如“太阳之火”可用暖金橙辉光，“江河之水”以墨青蓝表现流动感）。
8. ${allSame ? '本次四柱天干完全相同，请做“单主题”创作：只表现该主题，严禁出现其他主题元素。' : '不同主题之间必须自然过渡、语义一致，但不可彼此冲突或喧宾夺主。'}

请严格按照“只出现允许元素、禁止未列元素”的原则完成创作，并输出最终成品图。`;
}

// 可选：其他风格的提示词模板
export const alternativeStyles = {
  // 现代抽象风格
  modern: (tianGans) => {
    const tianGanNames = tianGans.map(t => `${t.pillar}(${t.tianGan})`).join('、');
    const descriptions = tianGans.map(t => `${t.pillar}${t.tianGan}: ${tianGanDescriptions[t.tianGan] || t.tianGan}`).join('\n');
    
    return `请创作一张现代抽象艺术作品，体现以下四个天干的能量融合：

${descriptions}

艺术要求：
1. 风格：现代抽象艺术，色彩丰富，线条流畅
2. 构图：方形1024x1024，动态平衡，富有律动感
3. 色彩：基于具体元素特征，森林绿、花朵彩、太阳金、烛光橙、城墙灰、田园棕、刀斧银、首饰金、江河蓝、雨露青
4. 形式：抽象几何形状与有机流线的结合
5. 意境：现代美学与东方哲学的融合

请生成一张体现${tianGanNames}能量的现代抽象艺术作品。`;
  },

  // 极简风格
  minimalist: (tianGans) => {
    const tianGanNames = tianGans.map(t => `${t.pillar}(${t.tianGan})`).join('、');
    const descriptions = tianGans.map(t => `${t.pillar}${t.tianGan}: ${tianGanDescriptions[t.tianGan] || t.tianGan}`).join('\n');
    
    return `请创作一张极简主义风格的艺术作品，体现以下四个天干的能量融合：

${descriptions}

艺术要求：
1. 风格：极简主义，简洁纯净，留白丰富
2. 构图：方形1024x1024，平衡对称，重点突出
3. 色彩：单色或双色系，强调对比与和谐
4. 元素：简化的符号和线条，蕴含深意
5. 意境：静谧深远，一即一切的东方美学

请生成一张体现${tianGanNames}能量的极简艺术作品。`;
  }
};
