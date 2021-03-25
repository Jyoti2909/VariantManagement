define([
	'dojo/_base/declare',
	'dojo/_base/array',
	'dijit/CalendarLite',
	'dojo/cldr/supplemental',
	'dojo/date/locale',
	'dojo/text!./templates/Calendar.html'
], function (declare, array, CalendarLite, cldrSupplemental, local, template) {
	return declare(
		'Aras.Client.Controls.Experimental.CalendarLite',
		CalendarLite,
		{
			constructor: function (args) {
				var onWeekNumber = args.onWeekNumber === false ? false : true;
				if (args.value) {
					this.currentFocus = args.value.toString();
				} else {
					args.value = this.currentFocus;
				}
				if (onWeekNumber) {
					this.templateString = template;
					this.weekTemplateString =
						'<tr class="dijitReset dijitCalendarWeekTemplate" role="row"><td class="dijitReset" role="gridcell">' +
						'<span class="dijitCalendarDateLabel" data-dojo-attach-point="weekLabels" style="color: gray;"></span></td>${d}${d}${d}${d}${d}${d}${d}</tr>';
				}
			},

			buildRendering: function () {
				this.weekLabels = [];
				this.inherited(arguments);
			},

			_populateGrid: function () {
				var month = new this.dateClassObj(this.currentFocus);
				month.setDate(1);
				var firstDay = month.getDay();
				var daysInMonth = this.dateModule.getDaysInMonth(month);
				var daysInPreviousMonth = this.dateModule.getDaysInMonth(
					this.dateModule.add(month, 'month', -1)
				);
				var dayOffset = cldrSupplemental.getFirstDayOfWeek(this.lang);
				if (dayOffset > firstDay) {
					dayOffset -= 7;
				}

				const firstDayOfYear = new this.dateClassObj(this.currentFocus);
				firstDayOfYear.setMonth(0);
				firstDayOfYear.setDate(1);
				let weeksOffset = 0;
				if (dojo.locale === 'de-de') {
					weeksOffset = 1;
				} else {
					weeksOffset = !firstDayOfYear.getDay() ? 0 : 1;
				}

				array.forEach(
					this.weekLabels,
					function (template, idx) {
						var i = idx * 7 + dayOffset;
						var date = new this.dateClassObj(month);
						var number;
						var adj = 0;

						if (i < firstDay) {
							number = daysInPreviousMonth - firstDay + i + 1;
							adj = -1;
						} else if (i >= firstDay + daysInMonth) {
							number = i - firstDay - daysInMonth + 1;
							adj = 1;
						} else {
							number = i - firstDay + 1;
						}

						if (adj) {
							date = this.dateModule.add(date, 'month', adj);
						}

						date.setDate(number);

						let text = (
							+local.format(date, { selector: 'date', datePattern: 'w' }) +
							weeksOffset
						).toString();

						if (month.getMonth() === 0 && idx === 0) {
							text = 1;
						}

						this._setText(this.weekLabels[idx], text);
					},
					this
				);

				this.inherited(arguments);
			}
		}
	);
});
