// @flow

function updateQuery(setState: Function, prop: string): Function {
	return (value: string): void => {
		setState((state) => {
			if (prop === 'type' && value === 'Current') {
				state.query = { ...state.query, date: null, type: value };
			} else {
				state.query = { ...state.query, [prop]: value };
			}
		});
	};
}

export default (setState: Function): Object => {
	return {
		updateQueryDate: updateQuery(setState, 'date'),
		updateQueryType: updateQuery(setState, 'type')
	};
};
