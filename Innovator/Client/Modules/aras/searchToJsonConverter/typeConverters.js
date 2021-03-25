import intl from '../../core/intl';

// difference between 00:00 and 23:59 in one day
const oneDayTimeDifference = 86399000;

function convertNumber(dataType, propData) {
	if (propData.value === '' || isNaN(propData.value)) {
		return;
	}
	if (
		dataType === 'ubigint' &&
		(+propData.value < 0 || propData.value.includes('.'))
	) {
		return;
	}
	if (dataType === 'integer' && propData.value.includes('.')) {
		return;
	}

	if (['is not null', 'is null', '!='].includes(propData.condition)) {
		return;
	}
	if (propData.condition === '=') {
		return propData.value;
	}
	return propData.condition + propData.value;
}

function convertBoolean(propData) {
	if (
		(propData.value !== '0' && propData.value !== '1') ||
		propData.condition !== '='
	) {
		return;
	}
	return propData.value;
}

function convertDate(propData) {
	if (!['=', 'between', '<', '>', '<=', '>='].includes(propData.condition)) {
		return;
	}
	if (propData.condition === 'between') {
		const value = propData.value;
		const splittedDates = value.split('and').map((value) => value.trim());
		if (splittedDates.length !== 2) {
			return;
		}
		const date1 = intl.date.parse(splittedDates[0]);
		const date2 = intl.date.parse(splittedDates[1]);
		if (!date1 || !date2) {
			return;
		}
		if (date2 - date1 !== oneDayTimeDifference) {
			return;
		}
		return intl.date.format(date1, 'shortDate');
	}
	if (!intl.date.parse(propData.value)) {
		return;
	}
	if (propData.condition === '=') {
		return propData.value;
	}

	return propData.condition + propData.value;
}

export default {
	convertNumber,
	convertDate,
	convertBoolean
};
