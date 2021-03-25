// @flow

export default (setState: Function): Object => {
	return {
		addItemToEditMode: (idItem: String): void => {
			setState((state: Object) => {
				state.editableItems.add(idItem);
			});
		},
		deleteItemFromEditMode: (idItem: String): void => {
			setState((state: Object) => {
				state.editableItems.delete(idItem);
			});
		}
	};
};
