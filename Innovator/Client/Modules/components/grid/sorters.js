import intl from '../../core/intl';

const compareValues = (valueA, valueB, reverse) => {
	const isUndefinedA = valueA === null || valueA === undefined;
	const isUndefinedB = valueB === null || valueB === undefined;
	if (isUndefinedA && isUndefinedB) {
		return 0;
	} else if (isUndefinedA) {
		return reverse ? 1 : -1;
	} else if (isUndefinedB) {
		return reverse ? -1 : 1;
	}

	if (valueA < valueB) {
		return reverse ? 1 : -1;
	}
	if (valueA > valueB) {
		return reverse ? -1 : 1;
	}
	return 0;
};

const getDefaultSorter = (valuesMap) => {
	return (rowA, rowB, reverse) =>
		compareValues(valuesMap.get(rowA), valuesMap.get(rowB), reverse);
};

const sorters = {
	extend: function (additionalSorters) {
		Object.assign(this, additionalSorters);
	},
	defaultSorter(headId, valuesMap, metadata, grid) {
		return getDefaultSorter(valuesMap);
	}
};

const sortUbigintLikeValues = function (headId, valuesMap, metadata, grid) {
	const convertedValuesMap = new Map();
	valuesMap.forEach((value, rowId) => {
		convertedValuesMap.set(rowId, value ? bigInt(value) : null);
	});

	return (rowA, rowB, reverse) => {
		const valueA = convertedValuesMap.get(rowA);
		const valueB = convertedValuesMap.get(rowB);

		if (valueA && valueB) {
			const result = valueA.compare(valueB);
			if (result !== 0) {
				return reverse ? -1 * result : result;
			}
			return 0;
		}

		return compareValues(valueA, valueB, reverse);
	};
};

const dataTypeSorters = {
	ubigint: sortUbigintLikeValues,
	global_version: sortUbigintLikeValues,
	date(headId, valuesMap, metadata, grid) {
		const convertedValuesMap = new Map();
		valuesMap.forEach((value, rowId) => {
			convertedValuesMap.set(
				rowId,
				value ? intl.date.parse(value).getTime() : null
			);
		});

		return getDefaultSorter(convertedValuesMap);
	},
	decimal(headId, valuesMap, metadata, grid) {
		const convertedValuesMap = new Map();
		valuesMap.forEach((value, rowId) => {
			convertedValuesMap.set(rowId, value ? parseFloat(value) : null);
		});

		return getDefaultSorter(convertedValuesMap);
	},
	item(headId, valuesMap, metadata, grid) {
		const convertedValuesMap = new Map();
		valuesMap.forEach((value, rowId) => {
			let itemKeyedName = value;
			const propertyName = grid._head.get(headId).name;
			if (propertyName) {
				itemKeyedName = grid._rows.get(
					rowId,
					`${propertyName}@aras.keyed_name`
				);
			}

			convertedValuesMap.set(rowId, itemKeyedName);
		});

		return getDefaultSorter(convertedValuesMap);
	}
};

sorters.extend(dataTypeSorters);

const getSorter = function (dataType) {
	return sorters[dataType] || sorters.defaultSorter;
};
const extend = sorters.extend.bind(sorters);

export { getSorter, extend };
