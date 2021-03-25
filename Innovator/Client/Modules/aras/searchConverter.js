(function (externalParent) {
	const operatorToConditionMap = {
		'>=': 'ge',
		'<=': 'le',
		'>': 'gt',
		'<': 'lt'
	};
	const typesWithRangeSupport = [
		'float',
		'decimal',
		'integer',
		'ubigint',
		'global_version',
		'date'
	];

	const normalizeDate = function (rawDate, condition) {
		const neutralDate = aras.convertToNeutral(
			rawDate,
			'date',
			aras.getDotNetDatePattern('short_date_time')
		);

		const dateParts = neutralDate.split('T');
		const isInputDateInvalid =
			neutralDate === '' || (neutralDate === rawDate && dateParts.length !== 2);
		if (isInputDateInvalid) {
			return null;
		}

		const date = dateParts[0];
		const isEndOfDay = ['le', 'gt'].includes(condition);
		const time = isEndOfDay ? '23:59:59' : '00:00:00';

		return `${date}T${time}`;
	};

	const normalizeFloatDecimal = function (value) {
		const numberToString = window.ArasModules.intl.number.toString;
		const parseFloat = window.ArasModules.intl.number.parseFloat;

		const numberValue = parseFloat(value);
		const stringValue = isNaN(numberValue)
			? value
			: numberToString(numberValue);
		return stringValue;
	};

	const generateJsonNode = function (criteria, condition, type) {
		let value = criteria;
		if (type === 'decimal' || type === 'float') {
			value = normalizeFloatDecimal(criteria);
		} else if (type === 'date') {
			if (condition === 'between') {
				const startOfDay = normalizeDate(criteria, 'ge');
				const endOfDay = normalizeDate(criteria, 'le');
				if (!startOfDay || !endOfDay) {
					return null;
				}

				value = `${startOfDay} and ${endOfDay}`;
			} else {
				value = normalizeDate(criteria, condition);
			}
		}

		if (value === null) {
			return null;
		}

		return {
			'@attrs': {
				condition: condition
			},
			'@value': value
		};
	};

	const parseQueryWithRange = function (criterias, propName, type) {
		const result = {};

		for (const criteria of criterias) {
			result[propName] = result[propName] || [];
			const criteriaParts = criteria.split(/(\.{3}|>=|<=|>|<)/);
			let rangeCriteria;
			if (criteriaParts.length !== 3) {
				const condition = type === 'date' ? 'between' : 'eq';
				result[propName].push(generateJsonNode(criteria, condition, type));
			} else if (criteriaParts[0].length === 0) {
				const operator = criteriaParts[1];
				const condition = operatorToConditionMap[operator];

				result[propName].push(
					generateJsonNode(criteriaParts[2], condition, type)
				);
			} else if (criteriaParts[1] === '...') {
				result.AND = result.AND || [];
				rangeCriteria = {};
				rangeCriteria[propName] = [
					generateJsonNode(criteriaParts[0], 'ge', type),
					generateJsonNode(criteriaParts[2], 'le', type)
				];
				result.AND.push(rangeCriteria);
			}

			const criteriaToValidate = rangeCriteria || result;
			const hasInvalidCriteria = criteriaToValidate[propName].some(
				(criteria) => criteria === null
			);
			if (hasInvalidCriteria) {
				return null;
			}
		}

		return result;
	};

	const splitByOrCondition = function (criteria) {
		const criterias = [''];
		for (let i = 0; i < criteria.length; i++) {
			const currentSymbol = criteria[i];

			if (currentSymbol === '\\' && !criteria[i + 1]) {
				return null;
			}

			if (currentSymbol === '\\') {
				criterias[criterias.length - 1] += criteria[i + 1];
				i++;
			} else if (currentSymbol === '|') {
				criterias.push('');
			} else {
				criterias[criterias.length - 1] += currentSymbol;
			}
		}

		return criterias;
	};

	const simpleToAml = function (
		criteria,
		propName,
		{ type = 'string', condition = 'eq' } = {}
	) {
		const criterias = splitByOrCondition(criteria);
		if (criterias === null || criterias.includes('')) {
			return null;
		}
		let jsonForParse;
		if (typesWithRangeSupport.includes(type)) {
			jsonForParse = parseQueryWithRange(criterias, propName, type);
		} else {
			jsonForParse = criterias.reduce(function (acc, criteria) {
				acc[propName] = acc[propName] || [];
				acc[propName].push(generateJsonNode(criteria, condition, type));
				return acc;
			}, {});
		}

		if (jsonForParse === null) {
			return null;
		}

		if (criterias.length > 1) {
			jsonForParse = {
				OR: jsonForParse
			};
		}
		if (propName === 'current_state') {
			const nameProp = Object.assign(
				{},
				jsonForParse.OR
					? { OR: { name: jsonForParse.OR.current_state } }
					: { name: jsonForParse.current_state }
			);
			const labelProp = Object.assign(
				{},
				jsonForParse.OR
					? { OR: { label: jsonForParse.OR.current_state } }
					: { label: jsonForParse.current_state }
			);
			jsonForParse = {
				OR: {
					...labelProp,
					AND: {
						label: { '@attrs': { condition: 'is null' }, '@value': null },
						...nameProp
					}
				}
			};
		}

		return window.ArasModules.jsonToXml(jsonForParse);
	};

	const convertFromNeutral = function (neutralDate) {
		const format = aras.getDotNetDatePattern('short_date');

		return aras.convertFromNeutral(neutralDate, 'date', format);
	};

	const convertDatesFromNeutral = function (criteria) {
		const criterias = splitByOrCondition(criteria);

		return criterias
			.map((criteria) => {
				const criteriaParts = criteria.split(/(\.{3}|>=|<=|>|<|\sand\s)/);

				if (criteriaParts[0].length === 0) {
					const operator = criteriaParts[1];
					const date = criteriaParts[2];

					return operator + convertFromNeutral(date);
				} else if (criteriaParts[1] === '...') {
					const firstDateOfRange = criteriaParts[0];
					const lastDateOfRange = criteriaParts[2];

					return (
						convertFromNeutral(firstDateOfRange) +
						'...' +
						convertFromNeutral(lastDateOfRange)
					);
				}

				const date = criteriaParts[0];
				return convertFromNeutral(date);
			})
			.join('|');
	};

	const searchConverter = {
		simpleToAml,
		convertDatesFromNeutral
	};
	externalParent = Object.assign(externalParent, {
		searchConverter: searchConverter
	});
	window.ArasCore = window.ArasCore || externalParent;
})(window.ArasCore || {});
