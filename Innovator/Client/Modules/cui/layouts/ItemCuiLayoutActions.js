// @flow

export default (setState: Function): Object => {
	return {
		updateItemId: (id: String): void => {
			setState((state: Object) => {
				state.itemId = id;
			});
		}
	};
};
