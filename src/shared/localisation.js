/** Home Assistant-aware locale, timezone and unit formatting. */
const localeShared = globalThis.__HA_COMPONENT_LIBRARY_SHARED__ ??= {};

const localeOf = (hass) => {
  const locale = hass?.locale?.language || navigator.language || "en-AU";
  return locale === "en" ? "en-AU" : locale;
};
const timeZoneOf = (hass) => hass?.config?.time_zone || undefined;
const numberFormat = (hass, value, options = {}) => {
  const number = Number(value);
  return Number.isFinite(number)
    ? new Intl.NumberFormat(localeOf(hass), options).format(number)
    : "—";
};
const formatPower = (hass, value, options = {}) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  const absolute = options.absolute ? Math.abs(number) : number;
  if (Math.abs(absolute) >= 1000) {
    return `${numberFormat(hass, absolute / 1000, { maximumFractionDigits: 1 })} kW`;
  }
  return `${numberFormat(hass, Math.round(absolute), { maximumFractionDigits: 0 })} W`;
};
const formatEnergy = (hass, value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  return `${numberFormat(hass, number, { maximumFractionDigits: Math.abs(number) < 1 ? 2 : 1 })} kWh`;
};
const formatDate = (hass, value, options) => new Intl.DateTimeFormat(
  localeOf(hass), { timeZone: timeZoneOf(hass), ...options },
).format(new Date(value));
const formatCalendarDay = (hass, value, options = {}) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
  if (!match) return "—";
  return formatDate(hass, Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12), {
    timeZone: "UTC", ...options,
  });
};
const calendarDayRange = (hass, value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
  if (!match) return null;
  const year = Number(match[1]), month = Number(match[2]) - 1, day = Number(match[3]);
  const zone = timeZoneOf(hass);
  if (!zone) {
    const start = new Date(year, month, day).getTime();
    return { start, end: new Date(year, month, day + 1).getTime() };
  }
  const formatter = new Intl.DateTimeFormat("en-AU", {
    timeZone: zone,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  });
  const instantFor = (targetYear, targetMonth, targetDay) => {
    const target = Date.UTC(targetYear, targetMonth, targetDay);
    let instant = target;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const parts = Object.fromEntries(formatter.formatToParts(new Date(instant)).map((part) => [part.type, part.value]));
      const represented = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute), Number(parts.second));
      instant += target - represented;
    }
    return instant;
  };
  return {
    start: instantFor(year, month, day),
    end: instantFor(year, month, day + 1),
  };
};
const formatTime = (hass, value, options = {}) => formatDate(hass, value, {
  hour: "numeric", minute: "2-digit", ...options,
});

Object.assign(localeShared, {
  calendarDayRange,
  formatDate,
  formatCalendarDay,
  formatEnergy,
  formatPower,
  formatTime,
  localeOf,
  numberFormat,
  timeZoneOf,
});
