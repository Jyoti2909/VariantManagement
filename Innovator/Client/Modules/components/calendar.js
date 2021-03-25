import calendarCSS from '../../styles/less/components/calendar.less';
import intl from '../core/intl';

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(calendarCSS);
const calendarClass = 'aras-calendar';
const switchButtonClass = 'aras-button aras-button_d';
const arrowClass = 'aras-icon-arrow';
const gridItemClass = `${calendarClass}__grid-item`;
const secondaryItemClass = `${gridItemClass}_secondary`;
const weekLength = 7;
const weeksNumber = 6;
const monthsInYear = 12;
const yearsInDecade = 10;
const MODES = ['days', 'months', 'years'];

export default class Calendar extends HyperHTMLElement {
	static get observedAttributes() {
		return ['value', 'mode'];
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (name === 'value') {
			const currentDate = this._getDate(1, this.state.offsetMonth);
			let offset = 0;
			if (newValue) {
				const targetDate = intl.date.parse(newValue);
				offset = this._calculateMonthsOffset(currentDate, targetDate);
			}
			this.setState({
				value: newValue,
				offsetMonth: this.state.offsetMonth + offset
			});
		} else if (name === 'mode' && MODES.includes(newValue)) {
			this.setState({ mode: newValue });
		}
	}

	created() {
		this.classList.add(calendarClass);
		this.attachShadow({ mode: 'open' });
		this.shadowRoot.adoptedStyleSheets = [stylesheet];
		this.setState({
			offsetMonth: this._getDate().getMonth(),
			value: this.value || null,
			mode: this.mode || 'days'
		});
	}

	render() {
		const isDateMode = this.state.mode === 'days';
		const formatOptions = isDateMode ? { month: 'long' } : {};
		const title = this._getButtonModeTitle(formatOptions);
		const switchButtonIconRef = (
			<svg style="display: none;">
				<symbol id="svg-calendarselect" viewBox="0 0 48 48">
					<g fill="#555">
						<path d="M36 34h-4v-4h4zM30 34h-4v-4h4zM36 28h-4v-4h4zM30 28h-4v-4h4zM36 22h-4v-4h4zM30 22h-4v-4h4zM24 22h-4v-4h4zM18 22h-4v-4h4zM36 16H14v-4h22zM12 26v2h6l-6 6v2h2l6-6v6h2V26z" />
					</g>
				</symbol>
			</svg>
		);
		const switchButtonIconNode = (
			<svg class={'aras-button__icon'}>
				<use xlinkHref="#svg-calendarselect"></use>
			</svg>
		);
		const switchModeButton = (
			<button
				className={`${switchButtonClass} ${calendarClass}__switch_mode`}
				onclick={() => this._switchMode()}
			>
				<span className="aras-button__text">{title}</span>
				{switchButtonIconRef}
				{this.state.mode === 'years' ? null : switchButtonIconNode}
			</button>
		);
		const switchNode = (
			<div className={`${calendarClass}__switch`}>
				{switchModeButton}
				<button
					className={`${switchButtonClass} ${calendarClass}__switch_prev ${arrowClass} ${arrowClass}_left`}
					onclick={() => this._prevButtonClick()}
				/>
				<button
					className={`${switchButtonClass} ${calendarClass}__switch_next ${arrowClass} ${arrowClass}_right`}
					onclick={() => this._nextButtonClick()}
				/>
			</div>
		);
		const gridItems = this._getGridItems();
		const gridClass = `${calendarClass}__grid`;
		const daysModifier = isDateMode ? ` ${gridClass}_days` : '';
		const className = `${gridClass}${daysModifier}`;
		const grid = (
			<div className={className} onclick={(e) => this._selectDate(e)}>
				{gridItems}
			</div>
		);
		const root = (
			<Fragment>
				{switchNode}
				{grid}
			</Fragment>
		);
		Inferno.render(root, this.shadowRoot);
	}

	_calculateDates() {
		const daysOfWeek = this._getLocaleDaysOfWeek();
		const datesOfPreviousMonth = this._getDatesOfPreviousMonth();
		const datesOfCurrentMonth = this._getDatesOfCurrentMonth();
		const datesOfNextMonth = this._getDatesOfNextMonth(
			datesOfPreviousMonth.length,
			datesOfCurrentMonth.length
		);
		const datesWithWeeks = this._getDatesWithWeeks(
			datesOfPreviousMonth,
			datesOfCurrentMonth,
			datesOfNextMonth
		);

		return [{ value: '#', disabled: true }, ...daysOfWeek, ...datesWithWeeks];
	}

	_calculateGridData() {
		if (this.state.mode === 'days') {
			return this._calculateDates();
		}
		return this._calculateMonthsYears();
	}

	_calculateMonthsOffset(date1, date2) {
		let months;
		months = (date2.getFullYear() - date1.getFullYear()) * 12;
		months -= date1.getMonth();
		months += date2.getMonth();
		return months;
	}

	_calculateMonthsYears() {
		const {
			currentDate,
			currentYear,
			currentTimeStamp
		} = this._getCurrentDateObject();
		const items = [];
		const isMonthsMode = this.state.mode === 'months';
		const itemsCount = isMonthsMode ? monthsInYear : yearsInDecade;
		const dateYear = this._getDate(1, this.state.offsetMonth).getFullYear();
		const decade = Math.trunc(dateYear / 10);
		const selectedDate = this.value ? intl.date.parse(this.value) : null;
		const selectedYear = selectedDate ? selectedDate.getFullYear() : null;
		const selectedOffset = selectedDate
			? this._calculateMonthsOffset(currentDate, selectedDate)
			: null;
		for (let data = 0; data < itemsCount; data++) {
			const targetYear = decade * 10 + data;
			const targetMonth = this._getMonthByValue(data);
			const date = new Date(currentYear, targetMonth, currentDate.getDate());
			const dateOffset = this._calculateMonthsOffset(currentDate, date);
			const targetTimeStamp = date.getTime();
			const isCurrent = isMonthsMode
				? targetTimeStamp === currentTimeStamp
				: currentYear === targetYear;
			const targetDate = new Date(currentYear, targetMonth, 1);
			const value = isMonthsMode
				? this._format(targetDate, { month: 'short' })
				: targetYear;
			let isSelected = null;
			if (selectedDate) {
				isSelected = isMonthsMode
					? dateOffset === selectedOffset
					: selectedYear === targetYear;
			}
			items.push({
				data: isMonthsMode ? data : targetYear,
				value,
				isCurrent,
				isSelected
			});
		}

		return items;
	}

	_createRange(start, end) {
		return Array.from(
			new Array(end - start + 1),
			(item, index) => start + index
		);
	}

	_format(date, options) {
		date = Date.UTC(
			date.getFullYear(),
			date.getMonth(),
			date.getDate(),
			date.getHours(),
			date.getMinutes(),
			date.getSeconds(),
			date.getMilliseconds()
		);
		options = {
			...options,
			timeZone: 'UTC'
		};
		const result = new Intl.DateTimeFormat(intl.locale, options).format(date);

		return result;
	}

	_getButtonModeTitle(additionalFormat = {}) {
		const formatOptions = { year: 'numeric', ...additionalFormat };
		const date = this._getDate(1, this.state.offsetMonth);

		if (this.state.mode === 'years') {
			const year = date.getFullYear();
			const decade = Math.trunc(year / 10);
			const firstDate = new Date(`${decade}0`, 0, 1);
			const firstYear = this._format(firstDate, { year: 'numeric' });
			const lastDate = new Date(`${decade}9`, 0, 1);
			const lastYear = this._format(lastDate, { year: 'numeric' });
			return `${firstYear} - ${lastYear}`;
		}

		return this._format(date, formatOptions);
	}

	_getCurrentDateObject() {
		const currentDate = this._getDate();
		const currentYear = currentDate.getFullYear();
		const currentTimeStamp = currentDate.getTime();

		return {
			currentDate,
			currentYear,
			currentTimeStamp
		};
	}

	_getDate(day, month) {
		const currentDate = new Date();
		const year = currentDate.getFullYear();
		month = month ?? currentDate.getMonth();
		day = day ?? currentDate.getDate();
		const newDate = new Date(year, month, day, 0, 0, 0);
		const iso = intl.date.toIS0Format(newDate);

		return intl.date.parse(iso);
	}

	_getDatesOfCurrentMonth() {
		const { currentYear, currentTimeStamp } = this._getCurrentDateObject();
		const firstDateOfMonth = 1;
		const lastDateOfMonth = this._getLastDateOfMonth(this.state.offsetMonth);
		const datesOfCurrentMonth = this._createRange(
			firstDateOfMonth,
			lastDateOfMonth
		).map((date) => {
			const dateValue = new Date(currentYear, this.state.offsetMonth, date);
			const isCurrent = currentTimeStamp === dateValue.getTime();
			const iso = intl.date.toIS0Format(dateValue);
			const isSelected = this.state.value && iso === this.state.value;
			return {
				isCurrent,
				isSelected,
				value: date
			};
		});

		return datesOfCurrentMonth;
	}

	_getDatesOfNextMonth(datesOfCurrentMonthLength, datesOfPreviousMonthLength) {
		const firstDateOfMonth = 1;
		const daysCount = weeksNumber * weekLength;
		const listedDaysCount =
			datesOfCurrentMonthLength + datesOfPreviousMonthLength;
		const restOfNextDates = daysCount - listedDaysCount;
		const datesOfNextMonth = this._createRange(
			firstDateOfMonth,
			restOfNextDates
		).map((date) => ({ value: date, notInMonth: true, monthOffset: 1 }));

		return datesOfNextMonth;
	}

	_getDatesOfPreviousMonth() {
		const firstDayOfWeek = intl.date.firstDayOfWeek();
		const currentDate = this._getDate(1, this.state.offsetMonth);
		let restOfPreviousDates = currentDate.getDay() - firstDayOfWeek;
		restOfPreviousDates =
			restOfPreviousDates < 0
				? weekLength + restOfPreviousDates
				: restOfPreviousDates;
		const lastOfPreviousDates = this._getLastDateOfMonth(
			this.state.offsetMonth - 1
		);
		const datesOfPreviousMonth = this._createRange(
			lastOfPreviousDates - restOfPreviousDates + 1,
			lastOfPreviousDates
		).map((date) => ({ value: date, notInMonth: true, monthOffset: -1 }));

		return datesOfPreviousMonth;
	}

	_getDatesWithWeeks(
		datesOfPreviousMonth,
		datesOfCurrentMonth,
		datesOfNextMonth
	) {
		const isWeek = true;
		const disabled = true;
		const firstDateOfMonth = this._getDate(1, this.state.offsetMonth);
		const firstWeekOfMonth = intl.date.week(firstDateOfMonth);
		const datesWithWeeks = [
			...datesOfPreviousMonth,
			...datesOfCurrentMonth,
			...datesOfNextMonth
		].reduce(
			(arr, date, index) => {
				if (index > 0 && index % weekLength === 0) {
					const month = date.notInMonth
						? this.state.offsetMonth + 1
						: this.state.offsetMonth;
					const currentDate = this._getDate(date.value, month);
					const week = intl.date.week(currentDate);
					arr.push({
						value: week,
						isWeek,
						disabled
					});
				}

				arr.push(date);

				return arr;
			},
			[
				{
					value: firstWeekOfMonth,
					isWeek,
					disabled
				}
			]
		);

		return datesWithWeeks;
	}

	_getGridItems() {
		const isDateMode = this.state.mode === 'days';
		const monthClass = !isDateMode ? ` ${secondaryItemClass}` : '';
		const gridData = this._calculateGridData();

		return gridData.map((item) => {
			const {
				value,
				notInMonth,
				isCurrent,
				isSelected,
				isWeek,
				disabled,
				data,
				monthOffset = null
			} = item;
			const notInMonthClass = notInMonth
				? ` ${gridItemClass}_not-in-month`
				: '';
			const weekClass = isWeek ? ` ${gridItemClass}_week` : '';
			const disabledClass = disabled ? ` ${gridItemClass}_disabled` : '';
			const isCurrentClass = isCurrent ? ` ${gridItemClass}_current` : '';
			const isSelectedClass = isSelected ? ` ${gridItemClass}_selected` : '';
			const className = `${gridItemClass}${notInMonthClass}${isCurrentClass}${weekClass}${disabledClass}${monthClass}${isSelectedClass}`;
			const tabIndex = disabled ? null : '-1';
			const dataValue = !isDateMode ? data : value;
			return (
				<div
					className={className}
					tabIndex={tabIndex}
					data-value={dataValue}
					data-offset={monthOffset}
				>
					{value}
				</div>
			);
		});
	}

	_getLastDateOfMonth(month) {
		const date = this._getDate(0, month + 1);

		return date.getDate();
	}

	_getLocaleDaysOfWeek() {
		const formatOptions = { weekday: 'narrow' };
		const { currentDate, currentYear } = this._getCurrentDateObject();
		const currentMonth = currentDate.getMonth();

		const firstDayOfWeek = intl.date.firstDayOfWeek();
		const firstDateOfWeek =
			currentDate.getDate() - currentDate.getDay() + firstDayOfWeek;
		const datesOfWeek = this._createRange(
			firstDateOfWeek,
			firstDateOfWeek + weekLength - 1
		);

		return datesOfWeek.map((date) => {
			const day = this._format(
				new Date(currentYear, currentMonth, date),
				formatOptions
			);

			return {
				value: day,
				disabled: true
			};
		});
	}

	_getMonthByValue(value) {
		const { currentYear } = this._getCurrentDateObject();
		const date = new Date(currentYear, this.state.offsetMonth, 1);
		const currentMonth = date.getMonth();
		const deltaMonth = value - currentMonth;

		return this.state.offsetMonth + deltaMonth;
	}

	_getMonthForTargetYear(targetYear) {
		const currentDate = this._getDate(1, this.state.offsetMonth);
		const currentYear = currentDate.getFullYear();
		const deltaMonth = (targetYear - currentYear) * 12;
		return this.state.offsetMonth + deltaMonth;
	}

	_getOffset() {
		let offset = monthsInYear;
		switch (this.state.mode) {
			case 'days':
				offset = 1;
				break;
			case 'years':
				offset *= yearsInDecade;
		}
		return offset;
	}

	_nextButtonClick() {
		const month = this.state.offsetMonth;
		const offset = this._getOffset();
		this.setState({ offsetMonth: month + offset });
	}

	_prevButtonClick() {
		const month = this.state.offsetMonth;
		const offset = this._getOffset();
		this.setState({ offsetMonth: month - offset });
	}

	_selectDate(e) {
		const { currentYear } = this._getCurrentDateObject();
		const target = e.target.closest(`.${gridItemClass}`);

		if (!target) {
			return;
		}

		const value = target.dataset.value;
		if (this.state.mode === 'days') {
			const { offset = 0 } = target.dataset;
			const selectedDate = new Date(
				currentYear,
				this.state.offsetMonth + +offset,
				value
			);
			const isoDate = intl.date.toIS0Format(selectedDate);
			this.value = isoDate;
			const event = new CustomEvent('change', {
				detail: {
					value: isoDate
				}
			});
			this.dispatchEvent(event);
		} else {
			const isMonthsMode = this.state.mode === 'months';
			const newOffset = isMonthsMode
				? this._getMonthByValue(value)
				: this._getMonthForTargetYear(value);
			const newMode = isMonthsMode ? 'days' : 'months';
			this.setState({ mode: newMode, offsetMonth: newOffset });
		}
	}

	_switchMode() {
		const currentMode = this.state.mode;
		const targetMode = currentMode === 'days' ? 'months' : 'years';
		this.setState({ mode: targetMode });
	}
}
