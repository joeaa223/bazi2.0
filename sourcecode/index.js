
import { LunarHour, EightChar } from "tyme4ts";
import { buildBazi } from "./lib/bazi.js";
import { getSolarTime, formatSolarTime } from "./lib/date.js";
import { getChineseCalendar } from "./lib/chineseCalendar.js";

export { getChineseCalendar };

export async function getBaziDetail({ lunarDatetime, solarDatetime, gender, eightCharProviderSect }) {
    // Only one of lunarDatetime or solarDatetime must be provided
    if ((lunarDatetime && solarDatetime) || (!lunarDatetime && !solarDatetime)) {
        throw new Error('You must provide either lunarDatetime or solarDatetime, but not both.');
    }
    let lunarHour;
    if (lunarDatetime) {
        const date = new Date(lunarDatetime);
        if (isNaN(date.getTime())) throw new Error('Invalid lunarDatetime');
        lunarHour = LunarHour.fromYmdHms(
            date.getFullYear(),
            date.getMonth() + 1,
            date.getDate(),
            date.getHours(),
            date.getMinutes(),
            date.getSeconds()
        );
    } else {
        lunarHour = getSolarTime(solarDatetime).getLunarHour();
    }
    return buildBazi({ lunarHour, gender, eightCharProviderSect });
}

export async function getSolarTimes({ bazi }) {
    const [year, month, day, hour] = bazi.split(' ');
    const solarTimes = new EightChar(year, month, day, hour).getSolarTimes(1700, new Date().getFullYear());
    const result = solarTimes.map((time) => formatSolarTime(time));
    return result;
}
