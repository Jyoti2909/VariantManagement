/* global dojo */
(function () {
	const _formatCharMappingArray = [
		// http://cldr.unicode.org/translation/date-time-patterns
		{ key: 'z', value: 'Z' },
		{ key: 'F', value: 's' },
		{ key: 'K', value: 'vz' },
		{ key: 'g', value: 'G' },
		{ key: 'tt', value: 'a' },
		{ key: 't', value: 'a' },
		{ key: 'dddd', value: 'EEEE' },
		{ key: 'ddd', value: 'EEE' }
	];
	class DateTimeFormatInfo {
		constructor(locale = 'en-us') {
			this.locale = locale;
			this.localeBundle = this._dateLocale._getGregorianBundle(this.locale);

			this.ShortDatePattern = this.localeBundle['dateFormat-short'];
			this.LongDatePattern = this.localeBundle['dateFormat-long'];
			this.ShortTimePattern = this.localeBundle['timeFormat-short'];
			this.LongTimePattern = this.localeBundle['timeFormat-long'];
			this.FullDateTimePattern = this.LongDatePattern.concat(
				' ',
				this.LongTimePattern
			);
			this.UniversalSortableDateTimePattern = 'yyyy-MM-ddTHH:mm:ssZ';
			this.ISOPattern = /yyyy-MM-ddTHH:mm:ss(\.SSS)?/;
			this.cacheOlsonTzName = {};
		}

		get _dateLocale() {
			return dojo.require('dojo.date.locale');
		}

		/**
		 * @param winTzName Name of windows time zone
		 * @returns {*} Olson time zone name by windows time zone
		 */
		getOlsonTimeZoneName(winTzName) {
			if (this.cacheOlsonTzName[winTzName]) {
				return this.cacheOlsonTzName[winTzName];
			}

			const url = new URL(aras.getBaseURL() + '/TimeZone/GetOlsonTimeZoneName');
			url.searchParams.set('windowsTimeZoneName', winTzName);
			const xmlHttp = new XMLHttpRequest();

			xmlHttp.open('GET', url, false);
			xmlHttp.send();

			if (xmlHttp.status !== 200) {
				aras.AlertError('Could not found timeZone: ' + winTzName);
				return;
			}

			this.cacheOlsonTzName[winTzName] = xmlHttp.responseText;
			return this.cacheOlsonTzName[winTzName];
		}

		/**
		 * @param date Date with respect to which is calculated offset
		 * @param winTzName Name of windows time zone
		 * @returns {*} Time zone offset using olson time zone database
		 */
		getTimeZoneOffset(date, winTzName) {
			// Get olson time zone name by windows time zone name
			const olsonTzName = this.getOlsonTimeZoneName(winTzName);
			return ArasModules.intl.date.timeZoneOffset(olsonTzName, date) * -1;
		}

		_convertToCLDRDateFormat(pattern) {
			let index = 0;
			let mappingItem;

			for (index; index < _formatCharMappingArray.length; index += 1) {
				mappingItem = _formatCharMappingArray[index];
				pattern = pattern.replace(mappingItem.key, mappingItem.value);
			}
			return pattern;
		}
		/**
		 * @return {number}  offset between time zones
		 */
		OffsetBetweenTimeZones(date, tzname1, tzname2) {
			tzname1 = tzname1 || 'UTC';
			tzname2 = tzname2 || 'UTC';
			return Math.round(
				this.getTimeZoneOffset(date, tzname1) -
					this.getTimeZoneOffset(date, tzname2)
			);
		}

		HasTimeZone(tzname) {
			if (!tzname || tzname.trim().length === 0) {
				return true;
			}
			try {
				this.getTimeZoneOffset(new Date(), tzname);
				return true;
			} catch (ex) {
				return false;
			}
		}

		Parse(dateStr, datePattern, locale) {
			const fromISOStr = ArasModules.intl.date.parse(dateStr);
			if (!isNaN(fromISOStr)) {
				return fromISOStr;
			}
			const options = {};

			if (datePattern) {
				const selector = this.getSelector(datePattern);
				if (selector !== null) {
					options.selector = selector;
				}
				options.datePattern = this._convertToCLDRDateFormat(datePattern);
			}
			options.locale = locale || this.locale;
			return this._dateLocale.parse(dateStr, options);
		}

		Format(date, datePattern, locale) {
			const options = {};
			if (datePattern) {
				options.selector = this.getSelector(datePattern);
				options.datePattern = this._convertToCLDRDateFormat(datePattern);
			}
			options.locale = locale || this.locale;
			if (this.ISOPattern.test(datePattern)) {
				return ArasModules.intl.date.toIS0Format(date);
			}
			return this._dateLocale.format(date, options);
		}

		// computes selecter from datePattern (see http://dojotoolkit.org/reference-guide/dojo/date/locale/format.html#dojo-date-locale-format)
		getSelector(datePattern) {
			const timeReg = /[hHmstfF]/;
			const dateReg = /[Mdy]/;
			const isTime = timeReg.test(datePattern);
			const isDate = dateReg.test(datePattern);
			return (isTime && isDate) || (!isTime && !isDate)
				? 'date'
				: isTime
				? 'time'
				: 'date';
		}

		toISOString(dateObject, { selector = '', milliseconds = false } = {}) {
			const toISOformat = ArasModules.intl.date.toIS0Format;

			if (selector === 'time') {
				const splittedTime = toISOformat(dateObject).split('T')[1];

				if (milliseconds) {
					const getMilliseconds = ('00' + dateObject.getMilliseconds()).slice(
						-3
					);
					return `T${splittedTime}.${getMilliseconds}`;
				} else {
					return `T${splittedTime}`;
				}
			}

			if (selector === 'date') {
				return toISOformat(dateObject).split('T')[0];
			}

			if (milliseconds) {
				const getMilliseconds = `00${dateObject.getMilliseconds()}`.slice(-3);
				return `${toISOformat(dateObject)}.${getMilliseconds}`;
			}

			return toISOformat(dateObject);
		}
	}
	window.DateTimeFormatInfo = DateTimeFormatInfo;
})();
