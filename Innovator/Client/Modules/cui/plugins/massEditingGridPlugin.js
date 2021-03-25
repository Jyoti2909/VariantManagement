import gridFormatters from '../../components/grid/formatters';
import dialogs from './dialogs';

const icons = {
	error: '../images/Error.svg'
};

ArasModules.SvgManager.enqueue(Object.values(icons));

const typesUseDialogsForEditing = ['color', 'text', 'image', 'formatted text'];

const massEditingGridPlugin = {
	init() {
		window.Grid.formatters.extend(this.formatters);
		this.grid.view.defaultSettings.editable = true;
	},
	events: [
		{
			type: 'applyEdit',
			name: 'applyEdit',
			method(payload) {
				const [eventData] = payload.data;
				const { headId, rowId, value } = eventData.detail;
				this.applyEdit(headId, rowId, value);
			}
		},
		{
			type: 'dblclick',
			element: 'cell',
			name: 'onRowDblClick',
			method(payload) {
				const [, rowId] = payload.data;

				const isEditState = this.grid.rows.get(rowId, '@aras.isEditState');
				if (isEditState === '1') {
					payload.break();
				}
			}
		}
	],

	formatters: {
		massEditErrorImg: (headId, rowId, value, grid, metadata) => {
			const errorText = grid.rows.get(rowId, '_error') ?? '';
			return {
				...gridFormatters.img(headId, rowId, icons.error, grid),
				attrs: { title: errorText }
			};
		}
	},
	applyEdit(headId, rowId, value) {
		if (headId === 'input_row') {
			return;
		}

		const dataType = this.grid.head.get(headId, 'dataType');
		const propName = this.grid.head.get(headId, 'name') || headId;
		const itemNode = aras.getFromCache(rowId);
		const itemType = aras.getItemTypeForClient(window.itemTypeName);

		if (dataType === 'md5') {
			value = aras.calcMD5(value);
		}
		if (dataType === 'boolean') {
			value = value ? '1' : '0';
		}

		aras.setItemProperty(itemNode, propName, value, undefined, itemType.node);
		itemNode.setAttribute('action', 'update');
	},
	getCellType(result, headId, itemId, value, type, rowId) {
		const isError = this.grid.rows.get(rowId, '_error');

		if (headId === 'L' && isError) {
			return 'massEditErrorImg';
		}

		return result;
	},

	checkEditAvailability(result, headId, rowId) {
		if (!result) {
			return false;
		}

		const { head, rows } = this.grid;
		const { gridWrapper } = this.options;

		if (head.get(headId, 'dataType') === 'file') {
			return result;
		}

		const isRelationshipType = gridWrapper._itemType.is_relationship === '1';
		if (isRelationshipType) {
			return false;
		}

		const hasEditState = rows.get(rowId, '@aras.isEditState') === '1';
		const isItemLockedByCurrentUser =
			rows.get(rowId, 'locked_by_id') === aras.getCurrentUserID();

		const canEditCell = isItemLockedByCurrentUser && hasEditState;

		if (!canEditCell) {
			return false;
		}

		const propertyDataType = head.get(headId, 'dataType');
		if (propertyDataType === 'sequence') {
			return false;
		}

		const propertyName = head.get(headId, 'name');
		const previousValue = rows.get(rowId, propertyName);
		if (typesUseDialogsForEditing.includes(propertyDataType)) {
			dialogs[propertyDataType](headId, rowId, previousValue, gridWrapper);
			return false;
		}

		const editableCellProperty = head.get(headId, 'editable') === true;
		return editableCellProperty;
	},

	getCellMetadata(result, headId, itemId, type) {
		const { head, rows, settings } = this.grid;
		const { gridWrapper } = this.options;
		return {
			...result,
			editorClickHandler: () => {
				const rowId = settings.focusedCell.rowId;
				gridWrapper._grid.cancelEdit();
				if (rowId === 'inputrow') {
					gridWrapper.onInputHelperShow_Experimental(
						rowId,
						head.get(headId, 'layoutIndex')
					);
				} else {
					const propertyDataType = head.get(headId, 'dataType');
					const propertyName = head.get(headId, 'name');
					const previousValue = rows.get(rowId, propertyName);

					dialogs[propertyDataType](headId, rowId, previousValue, gridWrapper);
				}
			}
		};
	}
};

export default massEditingGridPlugin;
