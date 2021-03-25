define([
	'dojo/_base/declare',
	'dojo/aspect',
	'dojo/dom-construct',
	'dojo/_base/unload',
	'dijit/layout/BorderContainer',
	'dijit/form/TimeTextBox',
	'dijit/form/RadioButton',
	'dijit/form/Button',
	'./CalendarLite',
	'dojo/date/locale'
], function (
	declare,
	aspect,
	Dom,
	Unload,
	BorderContainer,
	TimeTextBox,
	RadioButton,
	Button,
	CalendarLite,
	DateLocal
) {
	return declare('Aras.Client.Controls.Experimental.Calendar', null, {
		format: "yyyy-MM-dd'T'HH:mm:ss",
		showTime: null,
		date: null,
		selectCorporateTimeZone: null,
		corporateToLocalOffset: null,
		aras: null,

		constructor: function (args) {
			var self = this;
			this.aras = args.aras;
			var nowMoment = new Date();
			var todayLbl = this.aras
				.getResource('', 'datedialog.today')
				.replace(/\{0\}/, '');
			var tempTime = DateLocal.format(nowMoment, {
				selector: 'date',
				datePattern: this.format
			});
			var todayButton = new Button({
				innerHTML:
					'<div style="text-overflow:ellipsis;overflow: hidden; width:210px">' +
					todayLbl +
					tempTime +
					'</div>',
				title: tempTime,
				style: 'margin:5px 0 0 0'
			});
			var timeRadioButton;
			var timeTextBox;
			var intervalID;

			var changeTime = function () {
				nowMoment.setUTCSeconds(nowMoment.getUTCSeconds() + 1);
				todayButton.set(
					'innerHTML',
					'<div style="text-overflow:ellipsis;overflow: hidden;width: 210px">' +
						todayLbl +
						DateLocal.format(nowMoment, {
							selector: 'date',
							datePattern: self.format
						}) +
						'</div>'
				);
			};

			var clearIntervalID = function () {
				clearInterval(intervalID);
			};

			if (args.format) {
				this.format = args.format.replace(/tt/g, 'a').replace(/dddd/g, 'EEEE');
			}
			this.showTime = args.showTime;
			if (args.date) {
				this.date = DateLocal.parse(args.date, {
					datePattern: this.format,
					selector: 'date'
				});
				if (!this.date) {
					this.date = DateLocal.parse(args.date, {
						datePattern: "yyyy-MM-dd'T'HH:mm:ss",
						selector: 'date'
					});
				}
			} else {
				this.date = args.date;
			}
			this.selectCorporateTimeZone = args.selectCorporateTimeZone;
			this.corporateToLocalOffset = args.corporateToLocalOffset;

			if (undefined === this.showTime) {
				this.showTime = true;
			}
			if (this.corporateToLocalOffset === undefined && this.aras) {
				this.corporateToLocalOffset = this.aras.getCorporateToLocalOffset();
			}
			if (this.selectCorporateTimeZone === undefined) {
				this.selectCorporateTimeZone = this.corporateToLocalOffset
					? true
					: false;
			}

			borderCalendar = new BorderContainer({ style: 'padding: 0px' });
			if (this.selectCorporateTimeZone) {
				nowMoment.setUTCMinutes(
					nowMoment.getUTCMinutes() + this.corporateToLocalOffset
				);
			}

			var calendar = new CalendarLite({
				value: this.date,
				onWeekNumber: args.onWeekNumber
			});
			borderCalendar.addChild(calendar);
			aspect.after(
				calendar,
				'onChange',
				function (date) {
					if (timeRadioButton.checked) {
						if (!timeTextBox.isValid()) {
							this.set('value', '');
							return;
						}
						var dateTime = timeTextBox.getValue();
						date.setHours(dateTime.getHours());
						date.setMinutes(dateTime.getMinutes());
						date.setSeconds(dateTime.getSeconds());
					}
					closeWindow(
						DateLocal.format(date, {
							selector: 'date',
							datePattern: self.format
						})
					);
				},
				true
			);

			borderCalendar.addChild(todayButton);
			aspect.after(todayButton, 'onClick', function () {
				closeWindow(
					DateLocal.format(nowMoment, {
						selector: 'date',
						datePattern: self.format
					})
				);
			});

			var clearLabel = this.aras.getResource('', 'common.clear');
			var clearButton = new Button({
				innerHTML: '[ ]',
				title: clearLabel,
				style: 'margin:5px 0 0 5px'
			});
			borderCalendar.addChild(clearButton);
			aspect.after(clearButton, 'onClick', function () {
				closeWindow('');
			});

			if (this.showTime) {
				var reg = /.*[h,H,k,K,m,s].*/;
				var time = reg.test(this.format);
				Dom.create(
					'label',
					{ innerHTML: this.aras.getResource('', 'datedialog.time') },
					borderCalendar.domNode
				);
				borderCalendar.addChild(
					new RadioButton({
						checked: !time,
						value: 'None',
						name: 'time',
						onClick: function () {
							timeTextBox.setDisabled(true);
						}
					})
				);
				Dom.create(
					'label',
					{ innerHTML: this.aras.getResource('', 'datedialog.time_none') },
					borderCalendar.domNode
				);
				timeRadioButton = new RadioButton({
					checked: time,
					disabled: !time,
					value: 'timeInput',
					name: 'time',
					onClick: function () {
						timeTextBox.setDisabled(false);
					}
				});
				borderCalendar.addChild(timeRadioButton);
				timeTextBox = new TimeTextBox({
					value: nowMoment,
					style: 'margin: 5px',
					constraints: { timePattern: 'HH:mm:ss' }
				});
				timeTextBox.setDisabled(!time);
				borderCalendar.addChild(timeTextBox);
				Dom.create('br', {}, borderCalendar.domNode);

				if (time) {
					intervalID = setInterval(changeTime, 1000);
					Unload.addOnUnload(clearIntervalID);
				}
			}

			Dom.create(
				'label',
				{ innerHTML: this.aras.getResource('', 'datedialog.time_zone') },
				borderCalendar.domNode
			);
			borderCalendar.addChild(
				new RadioButton({
					checked: this.selectCorporateTimeZone,
					disabled: !this.selectCorporateTimeZone,
					value: 'Corporate',
					name: 'timeZone'
				})
			);
			Dom.create(
				'label',
				{ innerHTML: this.aras.getResource('', 'datedialog.corporate') },
				borderCalendar.domNode
			);
			borderCalendar.addChild(
				new RadioButton({
					checked: !this.selectCorporateTimeZone,
					disabled: this.selectCorporateTimeZone,
					value: 'Local',
					name: 'timeZone'
				})
			);
			Dom.create(
				'label',
				{ innerHTML: this.aras.getResource('', 'datedialog.local') + '  ' },
				borderCalendar.domNode
			);

			document.body.appendChild(borderCalendar.domNode);
		}
	});
});
