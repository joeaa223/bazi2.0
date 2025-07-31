import { today, getSolarTime } from "./date.js";
/**
 *
 * @param date Solar time string in ISO format.
 */
export function getChineseCalendar(date) {
    var _a, _b;
    if (!date) {
        date = today();
    }
    const solarTime = getSolarTime(date);
    const lunarHour = solarTime.getLunarHour();
    const eightChar = lunarHour.getEightChar();
    const lunarDay = lunarHour.getLunarDay();
    const twentyStar = lunarDay.getTwentyEightStar();
    const daySixtyCycle = lunarDay.getSixtyCycle();
    const dayHeavenStem = daySixtyCycle.getHeavenStem();
    const dayEarthBranch = daySixtyCycle.getEarthBranch();
    return {
        公历: solarTime.toString().split(' ').shift() + ' 星期' + solarTime.getSolarDay().getWeek(),
        农历: lunarDay.toString(),
        干支: eightChar.toString().split(' ').slice(0, 3).join(' '),
        生肖: eightChar.getYear().getEarthBranch().getZodiac().toString(),
        纳音: eightChar.getDay().getSound().toString(),
        农历节日: ((_a = lunarDay.getFestival()) === null || _a === void 0 ? void 0 : _a.toString()) || undefined,
        公历节日: ((_b = solarTime.getSolarDay().getFestival()) === null || _b === void 0 ? void 0 : _b.toString()) || undefined,
        节气: solarTime.getSolarDay().getTerm().toString(),
        二十八宿: twentyStar.toString() + twentyStar.getSevenStar() + twentyStar.getAnimal() + twentyStar.getLuck(),
        彭祖百忌: daySixtyCycle.getPengZu().toString(),
        喜神方位: dayHeavenStem.getJoyDirection().toString(),
        阳贵神方位: dayHeavenStem.getYangDirection().toString(),
        阴贵神方位: dayHeavenStem.getYinDirection().toString(),
        福神方位: dayHeavenStem.getMascotDirection().toString(),
        财神方位: dayHeavenStem.getWealthDirection().toString(),
        冲煞: `冲${dayEarthBranch.getOpposite().getZodiac()}(${dayEarthBranch.getOpposite()})煞${dayEarthBranch.getOminous()}`,
        宜: lunarDay.getRecommends().toString(),
        忌: lunarDay.getAvoids().toString(),
    };
}
