import { adaptRelationshipGridHeader } from './adaptGridHeader';
import itemTypeGridPlugin from './itemTypeGridPlugin';

const relatedItemTypeGridPlugin = {
	...itemTypeGridPlugin,

	events: [
		{
			type: 'dblclick',
			element: 'cell',
			name: 'onRowDblClick',
			method(payload) {
				const [, rowId] = payload.data;

				if (window.isEditMode) {
					return;
				}

				if (
					window.computeCorrectControlState('show_item') &&
					window.showRelatedItemById(rowId)
				) {
					return;
				}

				if (window.computeCorrectControlState('show_relationship')) {
					window.showRelationshipById(rowId);
				}
			}
		},
		...itemTypeGridPlugin.events.filter((event) => event.type !== 'dblclick')
	],

	async initGridHeader() {
		this.gridHeaderInfo = await this.adaptHeader();
		const { columnsOrder, headMap, indexHead, orderBy } = this.gridHeaderInfo;
		this.grid.head = headMap;
		this.grid.settings.indexHead = indexHead;
		this.grid.settings._orderBy = orderBy;
		this.options.gridWrapper.grid_Experimental.order = columnsOrder;
	},

	checkEditAvailability(result, headId, rowId) {
		const { head } = this.grid;
		const { gridWrapper } = this.options;

		if (head.get(headId, 'dataType') === 'file') {
			return this.getFileEditAvailability(rowId, headId);
		}

		const legacyCanEditResult = gridWrapper.canEdit_Experimental(rowId, headId);
		const editableCellProperty = head.get(headId, 'editable') === true;

		return legacyCanEditResult && editableCellProperty;
	},

	adaptHeader: async function () {
		const {
			itemTypeId,
			userPreferences,
			relatedItemTypeId,
			gridView
		} = this.options;
		const gridHeaderInfo = await adaptRelationshipGridHeader(
			itemTypeId,
			userPreferences,
			relatedItemTypeId,
			gridView
		);
		return gridHeaderInfo;
	},

	setDefaultFrozenColumns() {
		this.defaultFrozenColumns = this.options.relatedItemTypeId ? 1 : 0;
	},

	getRowClasses: function (result, rowId) {
		return this.grid.rows.get(rowId, '@aras.action') === 'delete'
			? 'aras-grid-row_deleted'
			: '';
	},

	isPropertyRestricted(itemId, headId, rowId) {
		const { head, rows } = this.grid;
		const propertyName = head.get(headId, 'name') || headId;
		const linkProperty = head.get(headId, 'linkProperty');
		let isRestricted = rows.get(itemId, `${propertyName}@aras.restricted`);

		if (!rows.has(itemId) && linkProperty) {
			isRestricted = rows.get(rowId, `${linkProperty}@aras.restricted`);
		}

		return isRestricted;
	},

	customStyles: {
		relatedCellStyles: {
			'border-color': '#cccccc',
			'border-left': 0,
			'border-right': 0,
			'border-bottom-width': 0
		},
		preservingRowStyles: {
			'background-color': 'transparent'
		}
	},
	getCustomStyles(headId, itemId, rowStyles) {
		const { head } = this.grid;
		const propertyName = head.get(headId, 'name') || headId;
		const linkProperty = head.get(headId, 'linkProperty');
		const state = this.options.getStateOfLayout();
		const isEditState = state.editableItems.has(itemId);

		let cellStyles = {};
		if (!linkProperty || (linkProperty && isEditState)) {
			cellStyles = { ... this.customStyles.preservingRowStyles };
		} else {
			cellStyles = { ... this.customStyles.relatedCellStyles };
		}

		return Object.assign(cellStyles, rowStyles.get(propertyName) || {});
	},

	getMetadataHeadList(headInfo, type) {
		const { metadata } = this.gridHeaderInfo;
		let list = metadata.headLists[headInfo.dataSource] || [];
		if (type === 'classification') {
			const linkProperty = headInfo.linkProperty;
			list = metadata.classStructure.get(
				linkProperty
					? metadata.linkItemTypeName[linkProperty]
					: metadata.itemTypeName
			);
		}
		return list;
	},

	getFileEditAvailability(rowId, headId) {
		const { head } = this.grid;
		const { gridWrapper, getStateOfLayout } = this.options;

		const isEditableGrid = gridWrapper.isEditable();
		const layoutState = getStateOfLayout();
		const isEditableCell = layoutState.editableItems.has(rowId);
		const linkProperty = head.get(headId, 'linkProperty');

		return isEditableGrid && (isEditableCell || !linkProperty);
	},

	getRowDataId(rowId, headId) {
		const linkProperty = this.grid.head.get(headId, 'linkProperty');
		return linkProperty ? this.grid.rows.get(rowId, linkProperty) : rowId;
	}
};

export default relatedItemTypeGridPlugin;
