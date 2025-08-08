/**
 * Formats BaZi data into a consistent JSON structure for use across components
 */
export async function formatBaziData(baziData, req) {
  try {
    // Extract basic data
    const Pillars = baziData.八字 || '';
    const zodiac = baziData.生肖 || '';
    const yearPillarInfo = baziData.年柱 || {};
    const monthPillarInfo = baziData.月柱 || {};
    const dayPillarInfo = baziData.日柱 || {};
    const hourPillarInfo = baziData.时柱 || {};
    const dayunInfo = baziData.大运 || {};
    const gender = baziData.性别 || '未知';
    let bornYear = 0;
    let dayPillarDetailedInfo = null;

    // Get separate pillars
    const [yearPillar, monthPillar, dayPillar, hourPillar] = Pillars.split(' ');

    // Extract birth year and calculate age
    if (baziData.阳历) {
      const match = baziData.阳历.match(/(\d{4})年/);
      if (match) bornYear = parseInt(match[1]);
    } else {
      bornYear = new Date().getFullYear() - 30; // Fallback, default as 30 year old
    }

    // Get current Da Yun
    let currentYear = 2025;
    let age = currentYear - bornYear;
    let currentDaYun = null;

    if (dayunInfo && dayunInfo.大运) {
      for (let infos of dayunInfo.大运) {
        if (infos.开始年份 <= currentYear && infos.结束年份 >= currentYear) {
          currentDaYun = infos;
          break;
        }
      }
      if (!currentDaYun && dayunInfo.大运.length > 0) {
        currentDaYun = dayunInfo.大运[0];
      }
    } else {
      currentDaYun = { 天干十神: "未知", 地支十神: "未知" };
    }

    // Get dayPillarDetailedInfo from API if req is available
    if (req && dayPillar) {
      try {
        const response = await fetch(`${req.protocol}://${req.get('host')}/getDayPillarDetailedInfo`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dayPillar })
        });
        
        if (response.ok) {
          const data = await response.json();
          dayPillarDetailedInfo = data.dayPillarDetailedInfo;
        }
      } catch (err) {
        console.warn("Could not fetch dayPillarDetailedInfo:", err.message);
        // Continue without it - it's optional
      }
    }

    // Format the data as a JSON string with the same structure used in bazi-report.js
    return {
      formattedData: {
        age,
        gender,
        yearPillar,
        monthPillar,
        dayPillar,
        hourPillar,
        zodiac,
        yearPillarInfo,
        monthPillarInfo,
        dayPillarInfo,
        hourPillarInfo,
        currentDaYun,
        dayPillarDetailedInfo
      },
      // Also return a JSON string format for direct insertion into prompts
      formattedString: `{
        "age": ${age},
        "gender": "${gender}",
        "yearPillar": "${yearPillar || ''}",
        "monthPillar": "${monthPillar || ''}",
        "dayPillar": "${dayPillar || ''}",
        "hourPillar": "${hourPillar || ''}",
        "zodiac": "${zodiac || ''}",
        "yearPillarInfo": {
          "HeavenlyStem": {
            "HeavenlyStem": "${yearPillarInfo?.天干?.天干 || ''}",
            "Element": "${yearPillarInfo?.天干?.五行 || ''}",
            "YinYang": "${yearPillarInfo?.天干?.阴阳 || ''}",
            "TenGod": "${yearPillarInfo?.天干?.十神 || ''}"
          },
          "EarthlyBranch": {
            "EarthlyBranch": "${yearPillarInfo?.地支?.地支 || ''}",
            "Element": "${yearPillarInfo?.地支?.五行 || ''}",
            "YinYang": "${yearPillarInfo?.地支?.阴阳 || ''}",
            "HiddenStem": {
              "HeavenlyStem": "${yearPillarInfo?.地支?.藏干?.主气?.天干 || ''}",
              "TenGod": "${yearPillarInfo?.地支?.藏干?.主气?.十神 || ''}",
            }
          }
        },
        "monthPillarInfo": {
          "HeavenlyStem": {
            "HeavenlyStem": "${monthPillarInfo?.天干?.天干 || ''}",
            "Element": "${monthPillarInfo?.天干?.五行 || ''}",
            "YinYang": "${monthPillarInfo?.天干?.阴阳 || ''}",
            "TenGod": "${monthPillarInfo?.天干?.十神 || ''}",
          },
          "EarthlyBranch": {
            "EarthlyBranch": "${monthPillarInfo?.地支?.地支 || ''}",
            "Element": "${monthPillarInfo?.地支?.五行 || ''}",
            "YinYang": "${monthPillarInfo?.地支?.阴阳 || ''}",
            "HiddenStem": {
              "HeavenlyStem": "${monthPillarInfo?.地支?.藏干?.主气?.天干 || ''}",
              "TenGod": "${monthPillarInfo?.地支?.藏干?.主气?.十神 || ''}"
            }
          }
        },
        "dayPillarInfo": {
          "HeavenlyStem": {
            "HeavenlyStem": "${dayPillarInfo?.天干?.天干 || ''}",
            "Element": "${dayPillarInfo?.天干?.五行 || ''}",
            "YinYang": "${dayPillarInfo?.天干?.阴阳 || ''}"
          },
          "EarthlyBranch": {
            "EarthlyBranch": "${dayPillarInfo?.地支?.地支 || ''}",
            "Element": "${dayPillarInfo?.地支?.五行 || ''}",
            "YinYang": "${dayPillarInfo?.地支?.阴阳 || ''}",
            "HiddenStem": {
              "HeavenlyStem": "${dayPillarInfo?.地支?.藏干?.主气?.天干 || ''}",
              "TenGod": "${dayPillarInfo?.地支?.藏干?.主气?.十神 || ''}"
            }
          }
        },
        "hourPillarInfo": {
          "HeavenlyStem": {
            "HeavenlyStem": "${hourPillarInfo?.天干?.天干 || ''}",
            "Element": "${hourPillarInfo?.天干?.五行 || ''}",
            "YinYang": "${hourPillarInfo?.天干?.阴阳 || ''}",
            "TenGod": "${hourPillarInfo?.天干?.十神 || ''}"
          },
          "EarthlyBranch": {
            "EarthlyBranch": "${hourPillarInfo?.地支?.地支 || ''}",
            "Element": "${hourPillarInfo?.地支?.五行 || ''}",
            "YinYang": "${hourPillarInfo?.地支?.阴阳 || ''}",
            "HiddenStem": {
              "HeavenlyStem": "${hourPillarInfo?.地支?.藏干?.主气?.天干 || ''}",
              "TenGod": "${hourPillarInfo?.地支?.藏干?.主气?.十神 || ''}"
            }
          }
        },
        "CurrentDaYun": {
          "HeavenlyStemTenGods": "${currentDaYun?.天干十神 || ''}",
          "EarthlyBranchTenGods": "${Array.isArray(currentDaYun?.地支十神) ? currentDaYun.地支十神.join(', ') : currentDaYun?.地支十神 || ''}"
        }
      }
      
      This is the detailed information about the Day Pillar:
      ${dayPillarDetailedInfo || ''}`
    };
  } catch (error) {
    console.error("Error formatting BaZi data:", error);
    return {
      formattedData: null,
      formattedString: "{}"
    };
  }
}