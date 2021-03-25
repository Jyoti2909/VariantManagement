import getResource from '../../core/resources';

const onAfterDialog = (headId, rowId, value, grid) => {
	const focusedCell = {
		headId,
		rowId
	};
	if (!value && value !== '') {
		grid.settings.focusedCell = focusedCell;
		return;
	}

	const propName = grid.head.get(headId, 'name') || headId;
	grid.dispatchEvent(
		new CustomEvent('applyEdit', {
			detail: {
				headId,
				rowId,
				value,
				propName,
				dataId: rowId
			}
		})
	);

	grid.settings.focusedCell = focusedCell;
};

const createHandledDialog = (showDialogFunction) => {
	const runDialogImplementation = async (
		headId,
		rowId,
		oldValue,
		gridWrapper
	) => {
		const result = await showDialogFunction(
			headId,
			rowId,
			oldValue,
			gridWrapper
		);
		onAfterDialog(headId, rowId, result, gridWrapper._grid);
	};

	return runDialogImplementation;
};

const dialogs = {
	color: createHandledDialog((headId, rowId, oldValue, gridWrapper) => {
		return ArasModules.Dialog.show('iframe', {
			aras,
			oldColor: oldValue,
			type: 'Color'
		}).promise;
	}),

	text: createHandledDialog((headId, rowId, oldValue, gridWrapper) => {
		return ArasModules.Dialog.show('iframe', {
			aras,
			isEditMode: true,
			content: oldValue || '',
			type: 'Text'
		}).promise;
	}),

	image: createHandledDialog(async (headId, rowId, oldValue, gridWrapper) => {
		const result = await ArasModules.Dialog.show('iframe', {
			aras,
			image: oldValue || '',
			type: 'ImageBrowser'
		}).promise;

		return result === 'set_nothing' ? '' : result;
	}),

	'formatted text': createHandledDialog(
		(headId, rowId, oldValue, gridWrapper) => {
			return ArasModules.Dialog.show('iframe', {
				aras,
				sHTML: oldValue || '',
				title: getResource('htmleditor.inn_formatted_text_editor'),
				type: 'HTMLEditorDialog'
			}).promise;
		}
	),

	date: createHandledDialog(async (headId, rowId, oldValue, gridWrapper) => {
		const gridComponent = gridWrapper._grid;

		const columnNumber = gridComponent.head.get(headId, 'layoutIndex');
		const inputCell = gridWrapper.cells(rowId, columnNumber);
		const format = aras.getDotNetDatePattern(
			gridComponent.head.get(headId, 'pattern')
		);

		const params = {
			format,
			aras,
			type: 'Date',
			date: aras.convertFromNeutral(oldValue, 'date', format)
		};

		const elementCoordinates = aras.uiGetElementCoordinates(
			inputCell.cellNod_Experimental
		);
		const dateDialog = ArasModules.Dialog.show('iframe', params);
		dateDialog.move(
			elementCoordinates.left - elementCoordinates.screenLeft,
			elementCoordinates.top - elementCoordinates.screenTop
		);

		const result = await dateDialog.promise;

		return result === undefined
			? undefined
			: aras.convertToNeutral(result, 'date', format);
	}),

	item: createHandledDialog(async (headId, rowId, oldValue, gridWrapper) => {
		const gridComponent = gridWrapper._grid;

		const dataSourceId = gridComponent.head.get(headId, 'dataSource');
		if (!dataSourceId) {
			return;
		}

		const dataSourceItemTypeName = aras.getItemTypeName(dataSourceId);
		if (!dataSourceItemTypeName) {
			return;
		}

		const params = {
			aras,
			itemtypeName: dataSourceItemTypeName,
			type: 'SearchDialog'
		};

		const result = await ArasModules.MaximazableDialog.show('iframe', params)
			.promise;

		let newItem = null;
		if (result.itemID) {
			newItem = result.item.cloneNode(false);
			newItem.setAttribute('action', 'skip');
			newItem.setAttribute('keyed_name', result.keyed_name);
		}

		return newItem || '';
	}),

	classification: createHandledDialog(
		(headId, rowId, oldValue, gridWrapper) => {
			const gridComponent = gridWrapper._grid;
			const itemTypeNode = gridWrapper._itemType;

			return ArasModules.Dialog.show('iframe', {
				aras,
				title: gridComponent.head.get(headId, 'label'),
				isEditMode: true,
				class_structure: itemTypeNode.class_structure,
				dialogType: 'classification',
				itemTypeName: itemTypeNode.name,
				selectLeafOnly: true,
				isRootClassSelectForbidden: true,
				dialogWidth: 600,
				dialogHeight: 700,
				resizable: true,
				content: 'ClassStructureDialog.html',
				expandClassPath: oldValue
			}).promise;
		}
	),

	ml_string: createHandledDialog(
		async (headId, rowId, oldValue, gridWrapper) => {
			const gridComponent = gridWrapper._grid;
			const propertyName = gridComponent.head.get(headId, 'name');
			const result = window.currQryItem.getResult();
			const itemNode =
				aras.getFromCache(rowId) ||
				result.selectSingleNode(`Item[@id="${rowId}"]`);

			const translations = await aras.getItemPropertyTranslations(
				itemNode,
				propertyName
			);
			const updatedTranslations = await window.ArasCore.Dialogs.multiLingual(
				translations,
				{
					readOnly: false
				}
			);
			const isUpdated = aras.setItemPropertyTranslations(
				itemNode,
				propertyName,
				updatedTranslations
			);
			if (!isUpdated) {
				return;
			}

			return aras.getItemProperty(itemNode, propertyName);
		}
	)
};

export default dialogs;
