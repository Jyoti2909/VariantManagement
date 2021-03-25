import CuiLayout from './CuiLayout';
import {
	getLocalChangesForItemTypes,
	syncLocalChangesWithGrid
} from '../gridCuiLayoutConnectors';

export default class SearchDialogCuiLayout extends CuiLayout {
	initialState = {
		query: {},
		itemTypeQuery: {}
	};

	mapStateToProps(state) {
		const { itemTypeName, polyItemType } = this.options;
		const itemTypesToBeWatched = polyItemType
			? aras.getMorphaeList(polyItemType).map(({ name }) => name)
			: [itemTypeName];

		return getLocalChangesForItemTypes(itemTypesToBeWatched, state);
	}

	updateLayout(prevProps) {
		syncLocalChangesWithGrid(
			prevProps.localChanges,
			this.props.localChanges,
			this.grid
		);
	}
}
