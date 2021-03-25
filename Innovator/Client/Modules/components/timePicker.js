import FilterList from './filterList';
import intl from '../core/intl';
import getResource from '../core/resources';

const dropdownMaxHeight = 210;
const hours = 24;
const midnightISO = '00:00:00';
const padNumber = (number) => {
	if (number < 10) {
		return '0' + number;
	}
	return number;
};
const splitToParts = (str, delimiter) => {
	const index = str.indexOf(delimiter);
	const firstPart = str.substring(0, index);
	const secondPart = str.substring(index + 1);

	return [firstPart, secondPart];
};

export default class TimePicker extends FilterList {
	connectedCallback() {
		super.connectedCallback();
		this.setAttribute('mode', 'field-a');
		this.value = midnightISO;
	}

	initialize() {
		super.initialize();
		const list = this._createHours();
		this.setState({ list, validation: true });
		const timePicker = this;
		this.state = {
			...this.state,
			set value(isoTime) {
				if (!isoTime) {
					return;
				}

				const time = timePicker._formatTime(isoTime);
				timePicker.setState({ label: time });
			}
		};
	}

	_createHours() {
		const list = Array.from(new Array(hours), (item, hour) => {
			hour = padNumber(hour);
			const isoTime = `${hour}:00:00`;
			const time = this._formatTime(isoTime);

			return { label: time, value: isoTime };
		});

		return list;
	}

	_getInputTemplate() {
		const input = super._getInputTemplate();
		const baseOnChange = input.events.onchange;

		input.events = {
			...input.events,
			onchange: (e) => {
				baseOnChange.call(this, e);
				let isoTime = '';
				if (!this.state.invalid && e instanceof CustomEvent) {
					isoTime = this._convertTimeToISO(this.state.label);
				}

				this.value = isoTime;
			}
		};
		return input;
	}

	_getDropdownHeight() {
		const itemHeight = this._getItemHeight();
		const totalHeight = this.state.count * itemHeight;

		return Math.min(totalHeight, dropdownMaxHeight);
	}

	_formatTime(isoTime) {
		const [hours, minutes, seconds] = isoTime.split(':');
		const currentDate = new Date();
		const year = currentDate.getFullYear();
		const month = currentDate.getMonth();
		const date = currentDate.getDate();
		const dateISO = intl.date.toIS0Format(
			new Date(year, month, date, hours, minutes, seconds)
		);
		const dateParsed = intl.date.parse(dateISO);
		const time = intl.date.format(dateParsed, 'longTime');

		return time;
	}

	set value(isoTime) {
		this.setAttribute('value', isoTime ?? midnightISO);
	}

	get value() {
		return this.getAttribute('value');
	}

	_validateHours(hours, isTwelveHourFormat) {
		const isTwentyFourHour = hours >= 0 && hours < 24;
		const isTwelveHour = hours > 0 && hours <= 12;
		const isValid = isTwelveHourFormat ? isTwelveHour : isTwentyFourHour;

		return isValid;
	}

	_validateMinutesAndSeconds(value) {
		const isValid = value >= 0 && value < 60;

		return isValid;
	}

	_validateTimePostfix(timePostfix) {
		timePostfix = timePostfix.toLowerCase();

		return timePostfix === 'am' || timePostfix === 'pm';
	}

	_convertTimeToISO(time) {
		const isTwelveHourFormat = intl.date.isHour12();
		time = time.toLowerCase();
		time = this._parseTime(time, isTwelveHourFormat);
		let hours = +time.hours;
		let minutes = +time.minutes;
		let seconds = +time.seconds;
		if (isTwelveHourFormat) {
			const timePostfix = time.timePostfix;
			if (timePostfix === 'pm' && hours < 12) {
				hours += 12;
			} else if (timePostfix === 'am' && hours === 12) {
				hours = 0;
			}
		}

		hours = padNumber(hours);
		minutes = padNumber(minutes);
		seconds = padNumber(seconds);

		return `${hours}:${minutes}:${seconds}`;
	}

	_getTimeDelimiters() {
		const options = {
			timeZone: 'UTC',
			hour: 'numeric',
			minute: 'numeric',
			second: 'numeric'
		};
		const parts = new Intl.DateTimeFormat(intl.locale, options).formatToParts();
		const delimiters = parts
			.filter((item) => item.type === 'literal')
			.map((item) => item.value);

		return delimiters;
	}

	_parseTime(time, isTwelveHourFormat) {
		const timeDelimiters = this._getTimeDelimiters();
		let splitted = splitToParts(time, timeDelimiters[0]);
		const hours = splitted[0];
		splitted = splitToParts(splitted[1], timeDelimiters[1]);
		const minutes = splitted[0];
		const result = {
			hours,
			minutes
		};
		let seconds = splitted[1];

		if (isTwelveHourFormat) {
			splitted = splitToParts(splitted[1], timeDelimiters[2]);
			seconds = splitted[0];
			const timePostfix = splitted[1];
			result.timePostfix = timePostfix;
		}

		result.seconds = seconds;

		return result;
	}

	inputValidate() {
		return true;
	}

	validate() {
		let inputValue = this._getCurrentInputValue();
		if (!inputValue) {
			this.value = midnightISO;
			inputValue = this.state.label;
		}

		const isTwelveHourFormat = intl.date.isHour12();
		const time = this._parseTime(inputValue, isTwelveHourFormat);
		const hours = time.hours;
		const minutes = time.minutes;
		const seconds = time.seconds;
		const isInvalid = [hours, minutes, seconds].some((timePart) => {
			return !timePart || timePart.startsWith(' ') || timePart.endsWith(' ');
		});
		if (isInvalid) {
			return false;
		}

		const isValidHours = this._validateHours(+hours, isTwelveHourFormat);
		if (!isValidHours) {
			return false;
		}

		const isValidMinutes = this._validateMinutesAndSeconds(+minutes);
		if (!isValidMinutes) {
			return false;
		}

		if (isTwelveHourFormat) {
			const timePostfix = time.timePostfix;
			const isValidTimePostfix = this._validateTimePostfix(timePostfix);
			if (!isValidTimePostfix) {
				return false;
			}
		}

		const isValidSeconds = this._validateMinutesAndSeconds(+seconds);
		if (!isValidSeconds) {
			return false;
		}

		return true;
	}

	getTemplate() {
		const wrapper = super.getTemplate();
		if (wrapper.attrs) {
			const invalidMessage = getResource('time_picker.invalid_message');
			wrapper.attrs['data-tooltip'] = invalidMessage;
		}

		return wrapper;
	}
}
