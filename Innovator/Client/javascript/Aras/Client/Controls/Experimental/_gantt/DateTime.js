/*jslint plusplus: true*/
/*global define*/
define(['dojo/i18n'], function (i18n) {
	'use strict';
	var DateTime = {
		DateTimeNull: new Date(1, 1, 1, 0, 0, 0, 0)
	};

	DateTime.Date = {
		today: function () {
			var date = new Date();
			date.setHours(0, 0, 0, 0);
			return date;
		},
		Months: i18n.getLocalization('dojo.cldr', 'gregorian')[
			'months-standAlone-wide'
		],
		DayOfWeek: {
			Monday: 1,
			Tuesday: 2,
			Wednesday: 3,
			Thursday: 4,
			Friday: 5,
			Saturday: 6,
			Sunday: 0
		},
		addDays: function (inputDate, increment) {
			var date = new Date(inputDate),
				milliSeconds = date.getTime(),
				// 7200000 - count of ms in a 2 hours
				timeZoneOffsetMaxDiff = 7200000; // for fix problems with daylight savings
			// 86400000 - count of ms in a day
			milliSeconds =
				milliSeconds + increment * 86400000 + timeZoneOffsetMaxDiff;
			date.setTime(milliSeconds);
			date.setHours(0, 0, 0, 0);
			return date;
		},
		addMonths: function (inputDate, increment) {
			var date = new Date(inputDate);
			date.setMonth(date.getMonth() + increment);
			return date;
		},
		addYears: function (inputDate, increment) {
			var date = new Date(inputDate);
			date.setFullYear(date.getFullYear() + increment);
			return date;
		},
		totalDays: function (milliseconds) {
			return milliseconds / 86400000;
		},
		parse: function (str, format) {
			var date = new Date(),
				parts;
			date.setTime(Date.parse(str));
			switch (format) {
				case 'MM/DD/YYYY':
					parts = format.split('/');
					date.setFullYear(
						parseInt(parts[2], 10),
						parseInt(parts[0], 10) - 1,
						parseInt(parts[1], 10)
					);
					break;
				case 'DD/MM/YYYY':
					parts = format.split('/');
					date.setFullYear(
						parseInt(parts[2], 10),
						parseInt(parts[1], 10) - 1,
						parseInt(parts[0], 10)
					);
					break;
				case 'YYYY-MM-DD':
					parts = format.split('-');
					date.setFullYear(
						parseInt(parts[0], 10),
						parseInt(parts[1], 10) - 1,
						parseInt(parts[1], 10)
					);
					break;
				case 'DD-MM-YYYY':
					parts = format.split('-');
					date.setFullYear(
						parseInt(parts[2], 10),
						parseInt(parts[1], 10) - 1,
						parseInt(parts[0], 10)
					);
					break;
			}
			return date;
		}
	};

	return DateTime;
});
