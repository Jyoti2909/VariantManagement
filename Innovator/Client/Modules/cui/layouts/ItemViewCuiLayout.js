import CuiLayout from './CuiLayout';
import itemCuiLayoutActions from './ItemCuiLayoutActions';
import ignoreUpdateItemTypes from '../ignoreUpdateItemTypes';

export default class ItemViewCuiLayout extends CuiLayout {
	actions = itemCuiLayoutActions(this.setState.bind(this));

	async init() {
		this.initialState = {
			itemId: this.options.itemId,
			itemTypeName: this.options.itemTypeName
		};

		await super.init();
	}

	mapStateToProps(state) {
		const { itemTypeName, itemId } = this.state;

		return {
			contextItem: state.localChanges[itemTypeName]?.[itemId]
		};
	}

	shouldLayoutUpdate(prevProps, prevState) {
		return (
			super.shouldLayoutUpdate(prevProps, prevState) &&
			prevProps.contextItem !== this.props.contextItem &&
			!ignoreUpdateItemTypes.includes(this.options.itemTypeName)
		);
	}

	updateLayout(prevProps) {
		const currentItemType = aras.getItemTypeForClient(
			this.options.itemTypeName,
			'name'
		).node;
		const isRelationshipType =
			aras.getItemProperty(currentItemType, 'is_relationship') === '1';

		const sourceId = window.fromRelationships;
		let itemFromCache = null;

		if (!isRelationshipType && sourceId && aras.itemsCache.hasItem(sourceId)) {
			const sourceItem = aras.itemsCache.getItem(sourceId);
			itemFromCache = sourceItem.selectSingleNode(
				`Relationships/Item/related_id/Item[@id="${window.item.id}"]`
			);
		}

		if (!itemFromCache) {
			itemFromCache = aras.itemsCache.getItem(window.item.id);
		}

		if (!itemFromCache && isRelationshipType) {
			const sourceItemFromCache = aras.itemsCache.getItem(
				sourceId || aras.getItemProperty(window.item, 'source_id')
			);
			const relationshipItemXpath = `Relationships/Item[@id="${window.item.id}"]`;
			itemFromCache = sourceItemFromCache.selectSingleNode(
				relationshipItemXpath
			);
		}

		if (!itemFromCache) {
			// this changes was made for case when new item attaches to relationship.
			// new item as related node is not cloned when this item is attached to relationship,
			// because user can add item to multiple relationships if we will clone new item in this case,
			// and after saving one source item with new related item that is used in multiple places,
			// we will get problems with updating and saving other source items that have new item as related node
			itemFromCache = window.item;
		}

		const skipInitControls =
			this.props.contextItem &&
			Object.keys(this.props.contextItem).length !== 0;

		window.setItem(itemFromCache);

		if (!isRelationshipType && !aras.isNew(itemFromCache)) {
			if (!prevProps.contextItem && this.props.contextItem) {
				window.setEditMode();
				return;
			}
			if (prevProps.contextItem && !this.props.contextItem) {
				window.setViewMode();
				return;
			}
		}

		const formFrame = document.getElementById('instance');

		aras.uiPopulateFormWithItemEx(
			formFrame.contentWindow.document.forms.MainDataForm,
			itemFromCache,
			currentItemType,
			undefined,
			{
				skipInitControls
			}
		);
	}

	destroy() {
		super.destroy();
		if (window.ignorePageCloseHooks) {
			return;
		}

		const contextItemConfigId = aras.getItemProperty(
			window.item,
			'config_id',
			window.item.id
		);
		aras.getMainWindow().sessionStorage.removeItem(contextItemConfigId);
	}
}
