// (c) Copyright by Aras Corporation, 2006-2007.

/*
This file contains logic common for all search grids (grid + searchbar)
*/

var grid = null;
var isMainGrid = false; //this flag is used because behavior is not completely identical
var soapController = null; //controller to manage async soap requests
//------------------------

function whenGetResponse(result) {
	soapController = null;

	var faultCode = result.getFaultCode();

	notifyCuiLayout('SearchStateChange');

	if (parseInt(faultCode) !== 0) {
		aras.AlertError(result);
		return;
	} else if (
		faultCode === '0' &&
		currQryItem.getPage() !== '1' &&
		ArasModules.utils.hashFromString(currQryItem.getCriteriesString()) ===
			currentSearchMode.getCacheItem('criteriesHash')
	) {
		const currentPage = Math.max(currentSearchMode.getPageNumber() - 1, 1);
		currentSearchMode.setPageNumber(currentPage);
		const isAppend =
			aras.getPreferenceItemProperty(
				'Core_GlobalLayout',
				null,
				'core_append_items'
			) === 'true';
		const itemsCount = currQryItem
			.getResultDOM()
			.selectNodes('/' + SoapConstants.EnvelopeBodyXPath + '/Result/Item')
			.length;
		pagination.totalResults = isAppend
			? itemsCount
			: pagination.pageSize * pagination.currentPageNumber;

		showPermissionsLimitedNotificationIfNeed();
		setupGrid(false);
		return;
	}

	currQryItem.setResponse(result);
	const itemsCount = currQryItem
		.getResultDOM()
		.selectNodes('/' + SoapConstants.EnvelopeBodyXPath + '/Result/Item').length;
	pagination.itemsCount = itemsCount;

	setupPageNumber();
	setupGrid(false);

	const isNoCountMode = searchContainer._isNoCountModeForCurrentItemType();
	if (!isNoCountMode) {
		pagination.totalResults = currentSearchMode.getCacheItem('itemmax');
		const itemsWithNoAccessCount = currentSearchMode.getCacheItem(
			'itemsWithNoAccessCount'
		);
		if (itemsWithNoAccessCount > 0) {
			showPermissionsLimitedNotification();
		}
		return;
	}

	if (itemsCount === 0 && isNoCountMode) {
		pagination.totalResults = 0;
	}

	showPermissionsLimitedNotificationIfNeed();
}

async function showPermissionsLimitedNotificationIfNeed() {
	await pagination.render();

	if (pagination.totalResults === -1) {
		return;
	}

	const itemsWithNoAccessCount = currentSearchMode.getCacheItem(
		'itemsWithNoAccessCount'
	);
	if (itemsWithNoAccessCount > 0) {
		showPermissionsLimitedNotification();
		return;
	}

	await pagination.getTotalResults();
}

function notifyCuiLayout(eventType) {
	if (window.layout) {
		window.layout.observer.notify(eventType);
	}
}

function doSearch_internal() {
	stopSearch(false);

	if (promiseCountResult) {
		promiseCountResult.abort();
		promiseCountResult = null;
	}

	soapController = new SoapController(whenGetResponse);
	currQryItem.execute(undefined, soapController);

	notifyCuiLayout('SearchStateChange');
}

onunload = function onunload_handler() {
	stopSearch(false);
};

function stopSearch(refresh) {
	if (refresh === undefined) {
		refresh = true;
	}

	if (!soapController || !soapController.stop) {
		return;
	}
	soapController.markInvalid();
	soapController.stop();
	soapController = null;

	if (refresh && window.grid.getRowCount() > 0) {
		if (grid._grid) {
			const localChanges = window.layout.props.localChanges;
			const rowChanges = localChanges[grid._itemType.name] || {};
			const gridComponent = grid._grid;
			const linkProperty = gridComponent.settings.indexHead.reduce(
				(acc, headId) => {
					if (acc) {
						return acc;
					}
					return gridComponent.head.get(headId, 'linkProperty');
				},
				null
			);
			const indexRows = gridComponent.settings.indexRows;
			gridComponent.settings.indexRows = indexRows.filter((rowId) => {
				const hasRowBeenChanged =
					rowChanges[rowId] && Object.keys(rowChanges[rowId]).length > 0;
				if (hasRowBeenChanged) {
					return true;
				}
				if (!linkProperty) {
					return false;
				}
				const relatedItemId = gridComponent.rows.get(rowId, linkProperty);
				const relatedItemTypeName = gridComponent.rows.get(
					relatedItemId,
					'id@aras.type'
				);
				const relatedItemsChanges = localChanges[relatedItemTypeName] || {};
				const hasRelatedItemBeenChanged =
					relatedItemsChanges[relatedItemId] &&
					Object.keys(relatedItemsChanges[relatedItemId]).length > 0;
				return hasRelatedItemBeenChanged;
			});
			grid._grid.render();
		} else {
			const rows = window.grid.items_Experimental.getAllId();
			rows.forEach((rowId) => {
				const relationshipChangesXPath = `./Relationships/Item[(@isTemp="1" or @isDirty="1") and @id="${rowId}"]`;
				const relatedChangesXPath = `./Relationships/Item[@id="${rowId}"]/related_id/Item[@isTemp="1" or @isDirty="1"]`;
				const isChanged = window.item.selectSingleNode(
					`${relationshipChangesXPath}|${relatedChangesXPath}`
				);
				if (!isChanged) {
					grid.deleteRow(rowId);
				}
			});
		}
	}

	notifyCuiLayout('SearchStateChange');
}

function InputHelperDialogResultHandler(col, val) {
	if (val || '' === val) {
		grid.inputRow.set(col, 'value', val);
		currQryItem.setPage(1);
		if (grid._grid) {
			const indexHead = grid._grid.settings.indexHead;
			grid._grid.dom.dispatchEvent(
				new CustomEvent('focusCell', {
					detail: {
						indexRow: 'searchRow',
						indexHead: indexHead.indexOf(grid.getColumnName(col))
					}
				})
			);
		}
	}
}

function showInputHelperDialog(rowId, col) {
	var prop = null;
	if (searchContainer && searchContainer.getPropertyDefinitionByColumnIndex) {
		prop = searchContainer.getPropertyDefinitionByColumnIndex(col);
	} else {
		var colName = grid.getColumnName(col);
		var propName = colName.substr(0, colName.length - 2);

		for (var i = 0; i < visiblePropNds.length; i++) {
			prop = visiblePropNds[i];
			if (aras.getItemProperty(prop, 'name') === propName) {
				break;
			}
		}
	}

	var aWindow = TopWindowHelper.getMostTopWindowWithAras(window);
	aWindow = aWindow.main || aWindow;
	var realPropDef = aras.getRealPropertyForForeignProperty(prop);
	var propName = aras.getItemProperty(prop, 'name');
	var propDT =
		propName === 'current_state'
			? 'string'
			: aras.getItemProperty(realPropDef, 'data_type');
	var val = null;
	var inputCell = grid.cells('input_row', col);
	var params;
	if (propDT === 'date') {
		var format = null;

		if (currentSearchMode && currentSearchMode.name === 'Simple') {
			format = aras.getDotNetDatePattern('short_date');
		} else {
			format = aras.getItemProperty(prop, 'pattern');
			format = aras.getDotNetDatePattern(format);
		}

		params = {
			format: format,
			aras: aras,
			type: 'Date'
		};

		var wndRect = aras.uiGetElementCoordinates(inputCell.cellNod_Experimental);
		var dateDialog = aWindow.ArasModules.Dialog.show('iframe', params);
		dateDialog.move(
			wndRect.left - wndRect.screenLeft,
			wndRect.top - wndRect.screenTop
		);
		dateDialog.promise.then(function (newDate) {
			var val;
			if (newDate) {
				val = aras.convertToNeutral(newDate, 'date', format);
			} else if (newDate === '') {
				val = '';
			}
			InputHelperDialogResultHandler(col, val);
			inputCell.cellNod_Experimental.querySelector('input').focus();
		});
	} else if (propDT === 'image') {
		params = {
			aras: aras,
			image: grid.inputRow.get(col, 'value'),
			type: 'ImageBrowser'
		};
		aWindow.ArasModules.Dialog.show('iframe', params).promise.then(function (
			res
		) {
			val = 'set_nothing' === res ? '' : res;
			InputHelperDialogResultHandler(col, val);
		});
	} else if (propDT === 'text') {
		params = {
			isEditMode: true,
			content: grid.inputRow.get(col, 'value'),
			aras: aras,
			type: 'Text'
		};
		aWindow.ArasModules.Dialog.show('iframe', params).promise.then(function (
			val
		) {
			InputHelperDialogResultHandler(col, val);
		});
	} else if (propDT === 'formatted text') {
		params = {
			aras: aras,
			sHTML: grid.inputRow.get(col, 'value'),
			title: aras.getResource('', 'htmleditor.inn_formatted_text_editor'),
			type: 'HTMLEditorDialog'
		};
		aWindow.ArasModules.Dialog.show('iframe', params).promise.then(function (
			val
		) {
			InputHelperDialogResultHandler(col, val);
		});
	} else if (propDT === 'color') {
		var oldColor = grid.inputRow.get(col, 'value');
		params = {
			oldColor: oldColor,
			aras: aras,
			type: 'Color'
		};
		aWindow.ArasModules.Dialog.show('iframe', params).promise.then(function (
			val
		) {
			InputHelperDialogResultHandler(col, val);
		});
	} else if (propDT === 'item') {
		var propDS = aras.getItemProperty(prop, 'data_source');
		if (!propDS) {
			return;
		}

		var itName = aras.getItemTypeName(propDS);
		if (!itName) {
			return;
		}

		params = {
			aras: aWindow.aras,
			itemtypeName: itName,
			type: 'SearchDialog'
		};

		aWindow.ArasModules.MaximazableDialog.show('iframe', params).promise.then(
			function (res) {
				var val = res ? res.keyed_name : null;
				InputHelperDialogResultHandler(col, val);
			}
		);
	} else if (propDT === 'string' && propName === 'classification') {
		const classStructure = grid._itemType.class_structure.replace(
			/\benabled="0"/g,
			'enabled="1"'
		);

		params = {
			title: aras.getItemProperty(prop, 'label'),
			isEditMode: true,
			aras: aWindow.aras,
			class_structure: classStructure,
			dialogType: 'classification',
			itemTypeName: grid._itemType.name,
			selectLeafOnly: true,
			isRootClassSelectForbidden: true,
			dialogWidth: 600,
			dialogHeight: 700,
			resizable: true,
			content: 'ClassStructureDialog.html',
			expandClassPath: grid.inputRow.get(col, 'value')
		};

		aWindow.ArasModules.Dialog.show('iframe', params).promise.then(function (
			val
		) {
			InputHelperDialogResultHandler(col, val);
		});
	} else {
		aras.AlertError(
			aras.getResource('', 'search_grid_object.lookup_not_available', propDT)
		);
	}
}

function saveEditedData() {
	grid.turnEditOff();
}
