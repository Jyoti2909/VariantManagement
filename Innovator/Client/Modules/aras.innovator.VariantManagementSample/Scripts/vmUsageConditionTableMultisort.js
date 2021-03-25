(function (root, factory) {
	root.multisort = factory();

}(this, function () {

	const _mapArray = function (items, cb) {
		const mappedItems = [];
		if (Array.isArray(items)) {
			{
				for (let i = 0; i < items.length; i++) {
					let mapped = cb(items[i]);
					mappedItems.push(mapped);
				}
			}
			return mappedItems;
		}
	}

	const _evaluateItems = function (input, evaluators) {
		for (let i = 0, len = input.length; i < len; i++) {
			let item = input[i];
			input[i] = {
				item: item,
				values: _mapArray(evaluators, function (evaluator) { return evaluator.func(item) })
			}
		}
	}

	const _revertItems = function (input) {
		for (let i = 0, len = input.length; i < len; i++) {
			input[i] = input[i].item;
		}
	}

	const _makeEvaluator = function (input) {
		return _makeStringEvaluator(input);
	};

	const _makeStringEvaluator = function (input) {
		let invert;
		if (input[0] === "!" || input[0] === "~") {
			input = input.slice(1);
			invert = true;
		}
		
		if (input[0] === ".") {
			input = input.slice(1);
		}

		if (input[input.length - 1] === "?") {
			input = input.slice(0, -1);
			return {
				func: function (item) { return _nestedProperty(item, input) != null },
				invert: invert
			}
		} else {
			return {
				func: function (item) { return _nestedProperty(item, input) },
				invert: invert
			}
		}
	};

	const _nestedProperty = function (obj, path) {
		if (path === "") return obj;
		path = path.split(".")
		let current = obj;
		while (path.length) {
			let nextKey = path.shift()
			let args;
			if (/[^\(\r\n]*\([^\(\r\n]*\)$/.test(nextKey)) {
				let indexOfOpenParenthesis = nextKey.indexOf("(");
				args = JSON.parse("[" + nextKey.slice(indexOfOpenParenthesis + 1, -1) + "]");
				nextKey = nextKey.slice(0, indexOfOpenParenthesis);
			}

			if (args) {
				current = current[nextKey].apply(current, args);
			} else {
				current = current[nextKey];
			}
			if (current == null) return null;
		}
		return current;
	};

	return function (toSort, sortings) {
		if (arguments[1] == null) {
			var partialApplication = true;
			sortings = toSort;
		}

		if (!Array.isArray(sortings)) {
			sortings = [sortings];
		}

		var evaluators = _mapArray(sortings, _makeEvaluator);

		if (partialApplication) {
			var sortFunction = function (toSort) {
				return module.exports(toSort, sortings);
			};

			sortFunction.comparator = function (a, b) {
				for (var i = 0; i < evaluators.length; i++) {
					var evaluator = evaluators[i];
					var invert = evaluator.invert;
					var aValue = evaluator.func(a);
					var bValue = evaluator.func(b);

					if (aValue > bValue) {
						return invert ? -1 : 1;
					} else if (bValue > aValue) {
						return invert ? 1 : -1;
					}
				}
				return 0;
			}
			return sortFunction;
		}

		_evaluateItems(toSort, evaluators);

		toSort.sort(function (a, b) {
			var aValues = a.values;
			var bValues = b.values;
			for (var i = 0, len = evaluators.length; i < len; i++) {
				var invert = evaluators[i].invert;
				var aValue = aValues[i];
				var bValue = bValues[i];

				if (aValue > bValue) {
					return invert ? -1 : 1;
				} else if (bValue > aValue) {
					return invert ? 1 : -1;
				}
			}
			return 0;
		});

		_revertItems(toSort);
		return toSort;
	};

}));