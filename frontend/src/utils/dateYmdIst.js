const IST_OFFSET_MINUTES = 330; // IST = UTC + 05:30 (no DST)
const IST_OFFSET_MS = IST_OFFSET_MINUTES * 60 * 1000;

const YMD_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const pad2 = (value) => String(value).padStart(2, "0");

export const formatYmd = (year, month, day) => `${year}-${pad2(month)}-${pad2(day)}`;

const getDaysInMonth = (year, month1Based) =>
  new Date(Date.UTC(year, month1Based, 0)).getUTCDate();

export const parseYmd = (ymd) => {
  if (!YMD_REGEX.test(ymd)) return null;
  const [year, month, day] = ymd.split("-").map(Number);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  if (month < 1 || month > 12) return null;
  const dim = getDaysInMonth(year, month);
  if (day < 1 || day > dim) return null;
  return { year, month, day };
};

export const addDaysYmd = (ymd, daysToAdd) => {
  const parsed = parseYmd(ymd);
  if (!parsed) return null;
  const dateUtc = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day));
  dateUtc.setUTCDate(dateUtc.getUTCDate() + Number(daysToAdd || 0));
  return formatYmd(dateUtc.getUTCFullYear(), dateUtc.getUTCMonth() + 1, dateUtc.getUTCDate());
};

export const addMonthsYmd = (ymd, monthsToAdd) => {
  const parsed = parseYmd(ymd);
  if (!parsed) return null;

  const add = Number(monthsToAdd || 0);
  if (!Number.isFinite(add)) return null;

  let targetYear = parsed.year;
  let targetMonth = parsed.month + add; // 1-based

  while (targetMonth > 12) {
    targetMonth -= 12;
    targetYear += 1;
  }
  while (targetMonth < 1) {
    targetMonth += 12;
    targetYear -= 1;
  }

  const dim = getDaysInMonth(targetYear, targetMonth);
  const targetDay = Math.min(parsed.day, dim);

  return formatYmd(targetYear, targetMonth, targetDay);
};

export const getTodayIstYmd = () => {
  const istNow = new Date(Date.now() + IST_OFFSET_MS);
  return formatYmd(istNow.getUTCFullYear(), istNow.getUTCMonth() + 1, istNow.getUTCDate());
};

export const getTomorrowIstYmd = () => addDaysYmd(getTodayIstYmd(), 1) || "";

export const isValidDeliveryDate = (ymd) => {
  const parsed = parseYmd(ymd);
  if (!parsed) return false;
  const min = getTomorrowIstYmd();
  if (!min) return false;
  return ymd >= min;
};

export const formatYmdToEnIn = (ymd) => {
  const parsed = parseYmd(ymd);
  if (!parsed) return "";
  return `${pad2(parsed.day)}/${pad2(parsed.month)}/${parsed.year}`;
};

