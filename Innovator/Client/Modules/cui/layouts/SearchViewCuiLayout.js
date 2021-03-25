import CuiLayout from './CuiLayout';
import {
	getLocalChangesForItemTypes,
	syncLocalChangesWithGrid
} from '../gridCuiLayoutConnectors';
import setupSearchViewActions from './SearchViewCuiLayoutActions';
import gridCuiLayoutActions from './GridCuiLayoutActions';
import itemTypeMetadata from '../../metadata/itemType';

export default class SearchViewCuiLayout extends CuiLayout {
	initialState = {
		query: {
			date: null,
			type: 'Current'
		},
		itemTypeQuery: {},
		editableItems: []
	};
	actions = gridCuiLayoutActions(this.setState.bind(this));

	async init() {
		const { itemTypeName } = this.options;
		const itemType = await itemTypeMetadata.getItemType(itemTypeName);
		this.options.actions = setupSearchViewActions(this.setState.bind(this));
		this.options.itemTypesToBeWatched = itemTypeMetadata.isPolymorphic(itemType)
			? itemTypeMetadata.getMorphaeList(itemType).map(({ name }) => name)
			: [itemTypeName];

		await super.init();
	}

	mapStateToProps(state) {
		const { itemTypeName, itemTypesToBeWatched } = this.options;

		if (itemTypeName === 'InBasket Task') {
			return;
		}

		return getLocalChangesForItemTypes(itemTypesToBeWatched, state);
	}

	updateLayout(prevProps) {
		const { itemTypeName } = this.options;
		if (itemTypeName === 'InBasket Task') {
			return;
		}

		syncLocalChangesWithGrid(
			prevProps.localChanges,
			this.props.localChanges,
			this.grid
		);
	}
}
