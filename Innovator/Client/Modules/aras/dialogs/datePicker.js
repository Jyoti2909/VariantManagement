import Dialog from '../../core/Dialog';
import getResource from '../../core/resources';
import SvgManager from '../../core/SvgManager';
import { createButton } from '../../components/dialogCommonApi';
import intl from '../../core/intl';

const rangeOperations = ['=', '<', '>', '<=', '>='];
const datePickerClass = 'aras-dialog-date-picker';
const selectClass = 'aras-select';
const icons = {
	clock: '../images/Clock.svg'
};
SvgManager.enqueue(Object.values(icons));

export default (options = {}) => {
	const title = getResource('date_picker.title');
	const dialog = new Dialog('html', { classList: datePickerClass, title });
	render(dialog, options);
	dialog.show();

	const { left: leftPos, top: topPos } = options;
	if (leftPos && topPos) {
		dialog.move(leftPos, topPos);
	}

	return dialog.promise;
};

const createSelectNode = (values, cssClass) => {
	const classList = cssClass ? `${selectClass} ${cssClass}` : selectClass;

	return HyperHTMLElement.hyper`
		<span class="${classList}">
			<span class="aras-select__container">
				<select class="${datePickerClass}__select">
					${values.map((v) => `<option value="${v}">${v}</option>`)}
				</select>
				<span class="aras-select__button"></span>
			</span>
		</span>
	`;
};

const render = (dialog, { withTime = false, withRange = false }) => {
	const buttonOptions = { disabled: true };
	const resetButton = createButton(
		getResource('common.reset'),
		'aras-button_b',
		null,
		buttonOptions
	);
	const applyButton = createButton(
		getResource('common.apply'),
		'aras-button_primary-light',
		null,
		buttonOptions
	);
	const rangePicker = withRange ? createRangePicker() : null;
	const timePicker = withTime ? createTimePicker() : null;
	HyperHTMLElement.hyper(dialog.contentNode)`
		${rangePicker}
		<aras-calendar />
		${timePicker}
		<div class="aras-buttons-bar aras-buttons-bar_right">
			${resetButton}${applyButton}
		</div>
	`;
};

const createRangePicker = () => {
	const rangeNames = [
		getResource('date_picker.date'),
		getResource('date_picker.date_range')
	];
	const rangeNamesNode = createSelectNode(
		rangeNames,
		`${datePickerClass}__range-type`
	);
	const rangeOperationsNode = createSelectNode(
		rangeOperations,
		`${datePickerClass}__range-operation`
	);
	const rangePicker = HyperHTMLElement.hyper`
		<div class="${datePickerClass}__range">
			${rangeNamesNode}${rangeOperationsNode}
		</div>`;

	return rangePicker;
};

const createTimePicker = () => {
	const timeIcon = SvgManager.createHyperHTMLNode(icons.clock, {
		class: 'aras-button__icon'
	});
	const timePickerFilterList = HyperHTMLElement.hyper`
		<aras-time-picker class="${datePickerClass}__time-picker" />`;
	const timeButton = HyperHTMLElement.hyper`
		<button 
			class="aras-button ${datePickerClass}__time-button"
			onclick="${() => setCurrentTime(timePickerFilterList)}"
		>
			${timeIcon}
		</button>`;
	const timePicker = HyperHTMLElement.hyper`
		<div class="${datePickerClass}__time">
			${timeButton}
			${timePickerFilterList}
		</div>`;

	return timePicker;
};

const setCurrentTime = (timePickerFilterList) => {
	const date = new Date();
	const isoDate = intl.date.toIS0Format(date);
	const [, isoTime] = isoDate.split('T');
	timePickerFilterList.value = isoTime;
};
