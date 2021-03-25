// @flow

function updateTabs(setState: Function, type: string): Function {
	return (newTabs: Array<string>): void => {
		setState((state: Object): void => {
			state.splitScreen[type] = [...newTabs];
		});
	};
}

export default (setState: Function): Object => {
	return {
		updateDockedTabs: updateTabs(setState, 'dockTabs'),
		updateUndockedTabs: updateTabs(setState, 'mainTabs'),
		navigationPanel: {
			updateVisibility: (newState: Boolean): Function => {
				setState((state: Object) => {
					state.navigationPanel.isVisible = newState;
				});
			}
		}
	};
};
