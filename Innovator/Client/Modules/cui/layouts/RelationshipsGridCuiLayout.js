import CuiLayout from './CuiLayout';
import {
	getLocalChangesForItemTypes,
	syncLocalChangesWithGrid
} from '../gridCuiLayoutConnectors';
import gridCuiLayoutActions from './GridCuiLayoutActions';
import itemTypeMetadata from '../../metadata/itemType';

export default class RelationshipsGridCuiLayout extends CuiLayout {
	#storageHandler;
	initialState = {
		query: {},
		itemTypeQuery: {},
		editableItems: new Set()
	};
	actions = gridCuiLayoutActions(this.setState.bind(this));

	async init() {
		const { relatedTypeName, relationshipTypeName } = this.options;
		const sourceItemConfigId = aras.getItemProperty(
			window.item,
			'config_id',
			window.item.id
		);
		const storageValue = JSON.parse(
			sessionStorage.getItem(sourceItemConfigId) || '{}'
		);
		this.initialState.editableItems = new Set(
			storageValue[relationshipTypeName]
		);
		this.options.sourceItemConfigId = sourceItemConfigId;

		this.#storageHandler = (event) => {
			const { storageArea, key, newValue } = event;
			if (storageArea !== sessionStorage || key !== sourceItemConfigId) {
				return;
			}

			const storageNewValue = JSON.parse(newValue) || {};
			this.state.editableItems = new Set(storageNewValue[relationshipTypeName]);
		};
		window.addEventListener('storage', this.#storageHandler);

		const relatedItemType = await itemTypeMetadata.getItemType(relatedTypeName);

		if (relatedItemType) {
			this.options.relatedTypes = itemTypeMetadata.isPolymorphic(
				relatedItemType
			)
				? itemTypeMetadata
						.getMorphaeList(relatedItemType)
						.map(({ name }) => name)
				: [relatedTypeName];
		}

		await super.init();
	}

	destroy() {
		super.destroy();
		window.removeEventListener('storage', this.#storageHandler);
	}

	mapStateToProps(state) {
		if (!this.grid) {
			return;
		}

		const { relationshipTypeName, relatedTypes } = this.options;

		return getLocalChangesForItemTypes(
			relatedTypes
				? [relationshipTypeName].concat(relatedTypes)
				: [relationshipTypeName],
			state
		);
	}

	shouldLayoutUpdate(prevProps, prevState) {
		if (!this.grid) {
			return false;
		}

		const { relatedTypes } = this.options;

		if (relatedTypes) {
			const editableItemIdWithoutChanges = Array.from(
				this.state.editableItems
			).find((id) => {
				return !relatedTypes.some((itemType) => {
					const itemTypeLocalChanges = this.props.localChanges[itemType];
					return itemTypeLocalChanges && itemTypeLocalChanges[id];
				});
			});
			if (editableItemIdWithoutChanges) {
				this.actions.deleteItemFromEditMode(editableItemIdWithoutChanges);
				return false;
			}
		}

		return super.shouldLayoutUpdate(prevProps, prevState);
	}

	updateLayout(prevProps, prevState) {
		if (!this.grid) {
			return;
		}

		if (prevState.editableItems !== this.state.editableItems) {
			this._updateSessionStorage(this.state);
		}

		syncLocalChangesWithGrid(
			prevProps.localChanges,
			this.props.localChanges,
			this.grid,
			{ relatedTypeName: this.options.relatedTypeName }
		);
	}

	_updateSessionStorage(state) {
		const { relationshipTypeName, sourceItemConfigId } = this.options;
		const storageValue = JSON.parse(
			sessionStorage.getItem(sourceItemConfigId) || '{}'
		);
		storageValue[relationshipTypeName] = Array.from(state.editableItems);

		sessionStorage.setItem(sourceItemConfigId, JSON.stringify(storageValue));
	}
}
