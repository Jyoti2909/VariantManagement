import getFirstDayOfWeek from './locales';

let currentLocale = '';
// ISO date without  time zone in local or UTC time zone (true if local)
const isParseISODateTimenonUTC = new Date('2016-01-01T00:00').getHours() === 0;
const isParseISODatenonUTC = new Date('2016-01-01').getHours() === 0;
// regexp for checking iso format of date.
// e.g. 1997-07-16T19:20:30.45Z, 1997, 1997-07, 1997-07-16, 1997T19:20:30, 1997-07T19:20:30.45+00:00,
// 1997-07-16T19:20:30Z, 1997-07-16T19:20+01:00, 1997-07-16T19:20:30+00:00 etc
const isoRegex = /^\d{4}(-\d{2}){0,2}([T]\d{2}:\d{2}((:\d{2})|(:\d{2}\.\d{0,3}))?([Z]|([+-]\d{2}:?\d{2})?)?)?$/;
// IE and EDGE added Left-to-Right marker (unicode 8206) before each punctuation characters and words .
// https://connect.microsoft.com/IE/feedback/details/863366/ie11-javascript-date-tolocaletimestring-length-incorrect
let isLTRMarkers = false;
const intlSettings = {
	longDate: {
		timeZone: 'UTC',
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	},
	shortDate: {
		timeZone: 'UTC',
		year: 'numeric',
		month: 'numeric',
		day: 'numeric'
	},
	longTime: {
		timeZone: 'UTC',
		hour: 'numeric',
		minute: 'numeric',
		second: 'numeric'
	},
	shortTime: {
		timeZone: 'UTC',
		hour: 'numeric',
		minute: 'numeric'
	}
};
const numberMultipliers = {
	f: 'e-15',
	p: 'e-12',
	n: 'e-9',
	u: 'e-6',
	m: 'e-3',
	k: 'e3',
	K: 'e3',
	M: 'e6',
	G: 'e9',
	T: 'e12',
	P: 'e15'
};
const weekLength = 7;

intlSettings.longDateTime = Object.assign(
	{},
	intlSettings.longDate,
	intlSettings.longTime
);
intlSettings.shortDateTime = Object.assign(
	{},
	intlSettings.shortDate,
	intlSettings.longTime
);

let intlNumberFormatter;
let defaultNumberFormatter;
const intlDateFormatters = {};

const dateHelper = {
	padNumber(number) {
		if (number < 10) {
			return '0' + number;
		}
		return number;
	},

	getTimefromParts(dateParts) {
		const types = ['day', 'hour', 'minute'];
		const dateObjParts = dateParts.reduce((res, { type, value }) => {
			if (types.includes(type)) {
				if (type === 'hour' && value === '24') {
					value = 0;
				}
				res[type] = value;
			}
			return res;
		}, {});
		return types.map((type) => dateObjParts[type]);
	},

	getDifference(utc, loc) {
		const [utcDay, utcHour, utcMin] = utc;
		const [locDay, locHour, locMin] = loc;
		let day = utcDay - locDay;
		const hour = utcHour - locHour;
		const min = utcMin - locMin;
		if (day > 1) {
			day = -1;
		} else if (day < -1) {
			day = 1;
		}
		return 60 * (24 * day + hour) + min;
	},
	calculateFirstWeekOffset(year) {
		const firstDayOfWeek = intl.date.firstDayOfWeek();
		const firstWeekDateISO = intl.date.toIS0Format(new Date(year, 0, 1));
		const firstWeekDate = intl.date.parse(firstWeekDateISO);
		const firstWeekOffset =
			(weekLength + firstWeekDate.getDay() - firstDayOfWeek) % weekLength;

		return firstWeekOffset;
	}
};

const intl = {
	get locale() {
		return currentLocale;
	},

	set locale(locale) {
		if (currentLocale === locale) {
			return;
		}
		currentLocale = locale;
		isLTRMarkers =
			new Intl.DateTimeFormat(currentLocale)
				.format(Date.now())
				.indexOf('\u200E') !== -1;
		Object.keys(intlSettings).forEach(function (format) {
			intlDateFormatters[format] = new Intl.DateTimeFormat(
				locale,
				intlSettings[format]
			);
		});
		intlNumberFormatter = new Intl.NumberFormat(locale, {
			useGrouping: false,
			maximumFractionDigits: 20
		});
		defaultNumberFormatter = new Intl.NumberFormat('en-US', {
			useGrouping: false,
			maximumFractionDigits: 20
		});
	},

	date: {
		parse(strDate) {
			if (!strDate) {
				return NaN;
			}
			strDate = strDate.trim();
			if (isoRegex.test(strDate)) {
				let result = new Date(strDate);
				const isDateTime = strDate.indexOf('T') !== -1;
				if (
					(!isParseISODateTimenonUTC && isDateTime) ||
					(!isParseISODatenonUTC && !isDateTime)
				) {
					if (!/([Z]|([+-]\d{2}:?\d{2}))$/.test(strDate)) {
						result = new Date(
							result.valueOf() + result.getTimezoneOffset() * 60 * 1000
						);
					}
				}
				return result;
			}
			return NaN;
		},

		toIS0Format(date) {
			return (
				date.getFullYear() +
				'-' +
				dateHelper.padNumber(date.getMonth() + 1) +
				'-' +
				dateHelper.padNumber(date.getDate()) +
				'T' +
				dateHelper.padNumber(date.getHours()) +
				':' +
				dateHelper.padNumber(date.getMinutes()) +
				':' +
				dateHelper.padNumber(date.getSeconds())
			);
		},

		format(date, format) {
			date = Date.UTC(
				date.getFullYear(),
				date.getMonth(),
				date.getDate(),
				date.getHours(),
				date.getMinutes(),
				date.getSeconds(),
				date.getMilliseconds()
			);
			format = intlSettings[format] ? format : 'longDateTime';
			let rez = intlDateFormatters[format].format(date);
			if (isLTRMarkers) {
				rez = rez.replace(/[\u200E\u200F]/g, '');
			}
			return rez;
		},

		timeZoneOffset(timezoneName, date = new Date()) {
			const shortDateTime = { ...intlSettings.shortDateTime, hour12: false };
			const utcFormater = new Intl.DateTimeFormat('en-US', shortDateTime);
			const specificFormater = new Intl.DateTimeFormat('en-US', {
				...shortDateTime,
				timeZone: timezoneName
			});
			return Math.ceil(
				dateHelper.getDifference(
					dateHelper.getTimefromParts(utcFormater.formatToParts(date)),
					dateHelper.getTimefromParts(specificFormater.formatToParts(date))
				)
			);
		},
		daysInYear(year) {
			const isLeapYear =
				(year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
			const daysInYear = isLeapYear ? 366 : 365;

			return daysInYear;
		},
		firstDayOfWeek() {
			const firstWeekDay = getFirstDayOfWeek(currentLocale);

			return firstWeekDay;
		},
		totalWeeksInYear(year) {
			const weekOffset = dateHelper.calculateFirstWeekOffset(year);
			const weekOffsetNext = dateHelper.calculateFirstWeekOffset(year + 1);
			const daysInYear = this.daysInYear(year);
			const numberOfWeeks =
				(daysInYear + weekOffset - weekOffsetNext) / weekLength;

			return numberOfWeeks;
		},
		week(date) {
			const dateISO = intl.date.toIS0Format(date);
			date = intl.date.parse(dateISO);
			const year = date.getFullYear();
			const firstWeekDateISO = intl.date.toIS0Format(new Date(year, 0, 1));
			const firstWeekDate = intl.date.parse(firstWeekDateISO);
			const weekOffset = dateHelper.calculateFirstWeekOffset(year);
			const dayInMilliseconds = 864e5;
			const dayOfYear =
				Math.round(
					(date.valueOf() - firstWeekDate.valueOf()) / dayInMilliseconds
				) + 1;
			let week = Math.floor((dayOfYear + weekOffset - 1) / weekLength) + 1;
			const weeksInYear = this.totalWeeksInYear(year);
			week = week > weeksInYear ? week - weeksInYear : week;

			return week;
		},
		isHour12() {
			const options = intlDateFormatters.shortTime.resolvedOptions();

			return options.hour12;
		}
	},

	number: {
		parseInt(numberStr) {
			const value = parseInt(numberStr, 10);
			return Number.isInteger(value) && Number(numberStr) === value
				? value
				: NaN;
		},

		parseFloat(numberStr, maximumIntegerDigits) {
			numberStr =
				typeof numberStr === 'string' ? numberStr.replace(',', '.') : numberStr;
			const abbreviation = numberStr.length && numberStr[numberStr.length - 1];
			const multiplier = abbreviation && numberMultipliers[abbreviation];
			if (multiplier) {
				numberStr = numberStr.slice(0, -1) + multiplier;
			}
			const number = parseFloat(numberStr);
			if (isFinite(number) && Number(numberStr) === number) {
				if (
					maximumIntegerDigits > 0 &&
					this.toString(Math.abs(parseInt(numberStr))).length >
						maximumIntegerDigits
				) {
					return NaN;
				}
				return number;
			}
			return NaN;
		},

		toString(number) {
			return number === '' ? number : defaultNumberFormatter.format(number);
		},

		format(number, options) {
			if (options) {
				return number.toLocaleString(
					intl.locale,
					Object.assign({ useGrouping: false }, options)
				);
			}
			return intlNumberFormatter.format(number);
		}
	}
};
// set defaul locale
intl.locale = 'en-US';
export default intl;
