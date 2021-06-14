/* $Id$ */

export const SECOND = 1000;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

const TimeFormats = [
    [60, "seconds", 1],
    [60 * 2, "1 minute ago", "1 minute from now"],
    [60 * 60, "minutes", 60],
    [60 * 60 * 2, "1 hour ago", "1 hour from now"],
    [60 * 60 * 24, "hours", 60 * 60],
    [60 * 60 * 24 * 2, "Yesterday", "Tomorrow"],
    [60 * 60 * 24 * 6, "days", 60 * 60 * 24],
    [60 * 60 * 24 * 7, "Last week", "Next week"],
    [60 * 60 * 24 * 7 * 1.9, "week", 60 * 60 * 24 * 7],
    [60 * 60 * 24 * 7 * 3.9, "weeks", 60 * 60 * 24 * 7],
    [60 * 60 * 24 * 7 * 4, "Last month", "Next month"],
    [60 * 60 * 24 * 7 * 4 * 1.9, "month", 60 * 60 * 24 * 7 * 4],
    [60 * 60 * 24 * 7 * 4 * 11.9, "months", 60 * 60 * 24 * 7 * 4],
    [60 * 60 * 24 * 7 * 4 * 12, "Last year", "Next year"],
    [60 * 60 * 24 * 7 * 4 * 12 * 1.9, "year", 60 * 60 * 24 * 7 * 4 * 12],
    [60 * 60 * 24 * 7 * 4 * 12 * 100, "years", 60 * 60 * 24 * 7 * 4 * 12]
];

export const months = {
    short: [
        "JAN",
        "FEB",
        "MAR",
        "APR",
        "MAY",
        "JUN",
        "JUL",
        "AUG",
        "SEP",
        "OCT",
        "NOV",
        "DEC"
    ],
    long: [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
    ]
};

const dateFormat = "dd/MM/yyyy";

const userTimeZoneOffset = 0;

const appendZeroBefore = value => `${value < 10 ? "0" : ""}${value}`;

const IS_ASC_CHAR_PRESENT_REGEX = /\^\[(.*?)\]\^/;

/* Browser timezone offset in Miliseconds */
const BROWSER_TZ_OFFSET = new Date().getTimezoneOffset() * -60 * 1000;

/* To replace the result as array of ascII chars to avoid regex matching issue */
const replace = (string, regex, replaceText = "") => {
    replaceText = replaceText.toString();
    const encodedReplaceText = replaceText.split("").map(char => char.charCodeAt());
    return string.replace(regex, `^[${encodedReplaceText}]^`);
};

/* To decode the array of ascII chars to string */
const decode = (text) => {
    const isMatched = text.match(IS_ASC_CHAR_PRESENT_REGEX);
    if (isMatched) {
        const matchedText = isMatched[0];
        const convertedText = isMatched[1].split(",")
            .map(charCode => String.fromCharCode(parseInt(charCode))).join("");
        return decode(text.replace(matchedText, convertedText));
    }
    return text;
};

export const DateTimeUtil = class DateTimeUtil extends FrameworkDateTimeUtil {
    /**
     * Transform UTC timestamp to a timestamp based on user timezone.
     * @param timeInMillis UTC timestamp in Milliseconds.
     * @returns Timestamp based on User timezone.
     */
    static computeUserTimezoneMS(timeInMillis) {
        /* In order to get date and time in User Timezone format irrespective of browser timezone,
        calculate difference between user timzone offset and browser timezone offset and
        add it to UTC time, the resulting timestamp is based on the User timzone. If passed in
        Date constructor, will give date, day, time in User timezone. */
        return parseInt(timeInMillis) + (userTimeZoneOffset - BROWSER_TZ_OFFSET);
    }

    static convertBrowserTZtoUserTZ(time) {
        return parseInt(time) + BROWSER_TZ_OFFSET - userTimeZoneOffset;
    }

    static replaceValues(dateObj, format, includeTime) {
        const year = dateObj.getFullYear();
        const month = dateObj.getMonth();
        const date = dateObj.getDate();

        let result = format.trim();

        result = replace(result, /yyyy|YYYY/g, year);
        result = replace(result, /yy|YY/g, (`${year}`).substring(2, 4));

        result = replace(result, /dd|DD/g, appendZeroBefore(date));
        result = replace(result, /d|D/g, date);

        result = replace(result, "MMMM", months.long[month]);
        result = replace(result, "MMM", months.short[month]);
        result = replace(result, /MM|M/g, appendZeroBefore(month + 1));

        const hours = dateObj.getHours();
        const minutes = dateObj.getMinutes();
        const seconds = dateObj.getSeconds();

        if (includeTime && result.indexOf("HH") === -1) {
            result += " HH:mm:ss a";
        }

        result = replace(result, /HH|hh/g, appendZeroBefore(hours % 12 || 12));
        result = replace(result, /mm/g, appendZeroBefore(minutes));
        result = replace(result, /ss/g, appendZeroBefore(seconds));
        result = replace(result, /[a|A]$/, hours >= 12 ? "PM" : "AM");

        return decode(result);
    }

    static checkForValidTime(timeInMillis) {
        const value = parseInt(timeInMillis);
        return !(isNaN(value) || value === 0);
    }

    /* Converts time in millis to date format without any timezone conversions */
    static convertTimeToDate(convertedTimeInMillis, format = dateFormat, includeTime) {
        const dateObj = new Date(convertedTimeInMillis);
        return this.replaceValues(dateObj, format, includeTime);
    }

    /* Converts UTC timestamp to user"s date format */
    static convertLongToDateFormat(timeInMillis = "", format = dateFormat) {
        if (!this.checkForValidTime(timeInMillis)) {
            return "";
        }

        return this.convertTimeToDate(this.computeUserTimezoneMS(timeInMillis), format, false);
    }

    /* Converts timestamp to user timezone timestamp and to user"s date format with time */
    static convertLongToDateFormatWithTime(timeInMillis = "", format = dateFormat) {
        if (!this.checkForValidTime(timeInMillis)) {
            return "-";
        }

        return this.convertTimeToDate(this.computeUserTimezoneMS(timeInMillis), format, true);
    }

    /* Converts current browser time to user"s timezone and return result in
        user"s date format with time
    */
    static getCurrentDate(format = dateFormat, includeTime = false) {
        return this.convertTimeToDate(this.getUserCurrentTime(), format, includeTime);
    }

    static getCurrentDateWithTime(format = dateFormat, includeTime = true) {
        return this.getCurrentDate(format, includeTime);
    }

    /**
        Method which returns time period as 1 minute ago, 2 months ago ...
    */
    static getContextualTime(timeInMillis = "") {
        if (!this.checkForValidTime(timeInMillis)) {
            return "";
        }

        /* No need for user time conversion, since both are UTC timestamps. */
        let seconds = Math.round((Date.now() - Number(timeInMillis)) / 1000);

        if (seconds === 0 || (seconds > 0 && seconds <= 60)) return "Just now";

        let timeStr = "ago";
        let choice = 1;
        if (seconds < 0) {
            seconds = Math.abs(seconds);
            timeStr = "from now";
            choice = 2;
        }
        const resultTimeFormat = TimeFormats.find(format => seconds <= format[0]);

        if (typeof resultTimeFormat[2] === "string") {
            return resultTimeFormat[choice];
        }
        return `${Math.floor(seconds / resultTimeFormat[2])} ${resultTimeFormat[1]} ${timeStr}`;
    }

    static getDateAfterSpecificDays(days = 0) {
        const date = new Date();
        date.setDate(date.getDate() + days);
        return date;
    }

    static getDateBeforeSpecificDays(days = 0) {
        const date = new Date();
        date.setDate(date.getDate() - days);
        return date;
    }

    static getTimeAfterSpecificDays(days = 0, inUserTZ = true) {
        const todayTime = inUserTZ ? DateTimeUtil.computeUserTimezoneMS(Date.now()) : Date.now();
        const today = new Date(todayTime);

        const todayEndTime = new Date(
            today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59
        ).getTime();
        const futureTime = todayEndTime + (days * 24 * 60 * 60 * 1000);
        return futureTime;
    }

    static getTimeBeforeSpecificDays(days = 0, inUserTZ = true) {
        const today = inUserTZ
            ? new Date(this.computeUserTimezoneMS(new Date().getTime())) : new Date();
        const todayStartTime = new Date(
            today.getFullYear(), today.getMonth(), today.getDate(), 0, 0
        ).getTime();
        const pastTime = todayStartTime - (days * 24 * 60 * 60 * 1000);
        return pastTime;
    }

    static getDiffInDays(toDate, fromDate = new Date()) {
        const timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
        return Math.ceil(timeDiff / (1000 * 3600 * 24));
    }

    static getDiffInDaysFromTime(toTimeInMillis, fromDate = new Date()) {
        const toDate = new Date(this.computeUserTimezoneMS(toTimeInMillis));
        const timeDiff = toDate.getTime() - fromDate.getTime();
        return Math.ceil(timeDiff / (1000 * 3600 * 24));
    }

    static getDateByDateFormat(dateObj, format = dateFormat) {
        return this.replaceValues(dateObj, format);
    }

    static getUserCurrentTime() {
        return Date.now() - BROWSER_TZ_OFFSET + userTimeZoneOffset;
    }

    static getDurationSentence(hours, minutes, seconds) {
        let result = "";
        if (hours >= 24) {
            const days = parseInt(hours / 24);
            hours %= 24;
            result += `${days} ${days > 1 ? "days" : "day"}`;
        }

        if (hours > 0) {
            result += ` ${hours} ${hours > 1 ? "hours" : "hour"}`;
        }

        if (minutes > 0) {
            result += ` ${minutes} ${minutes > 1 ? "minutes" : "minute"}`;
        }

        if (seconds > 0) {
            result += ` ${seconds} ${seconds > 1 ? "seconds" : "second"}`;
        }

        return result || "-";
    }

    /**
     * Returns duration between two long time values in the form of Hours minutes seconds
     *
     * @static
     * @param {any} from
     * @param {any} to
     * @returns
     */
    static getDuration(from, to) {
        const dt1 = new Date(from);
        const dt2 = new Date(to);
        const diff = (dt2.getTime() - dt1.getTime()) / 1000;
        const d = Math.abs(Math.round(diff));

        const h = Math.floor(d / 3600);
        const m = Math.floor(d % 3600 / 60);
        const s = Math.floor(d % 3600 % 60);

        const hDisplay = h > 0 ? h + (h === 1 ? ` hour ` : ` hours, `) : "";
        const mDisplay = m > 0 ? m + (m === 1 ? ` minute ` : ` minutes, `) : "";
        const sDisplay = s > 0 ? s + (s === 1 ? ` second ` : ` seconds `) : "";

        return hDisplay + mDisplay + sDisplay;
    }
};
