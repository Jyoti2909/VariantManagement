/*
Dialog arguments:
aras
itemTypeName or itemtypeID
sourceItemTypeName
sourcePropertyName
handler (if undefined used default behavior, handler signature: handler_func(Item))
(boolean) multiselect

Search Dialog Behavior
If action='exit' then ReturnValue = nothing, window is closed.

Following actions: Double-click, Return Selected click, Set Nothing mean the same: user is going to exit from the Search Dialog.

if action is Double-click then type_of_action="doubleclick"
if action is Return Selected then type_of_action="return_selected"
if action is Set Nothing then type_of_action="set_nothing"

When user is going to exit from the Search Dialog.
Switch param.multiselect:
1. param.multiselect = true
ReturnValue = selected item ids array.
NOTE: Grid Multiselect = true has to be supported
2. param.multiselect = false
Double-click:
ReturnValue = item structure (as currently implemented).
NOTE: Grid Multiselect = false has to be supported
End Switch

if Handler<>NULL Then
Handler call (input params: 1) ReturnValue, 2) type_of_action ),
if hadler returns true then modal dialog is closed.
Else
Close the window
End If

Places to Test:
1. Relationships Grid:
- Pick action: param.multiselect = true, double-click: search dialog is not closed, new relationships is added.
- Pick/Replace action: param.multiselect = false, handler is null.
2. Property of type=Item:
- param.multiselect = false, handler is null
*/
var sourceItemTypeName;
var sourcePropertyName;
var multiselect;
var handler;
var grid = null;

function initializeSearchDialogFunctions(container) {
	container.setupSearchDialog = function (searchArguments) {
		window.onload = container.searchDialogOnLoadHandler;
		searchLocation = 'Search Dialog';

		if (searchArguments.itemtypeName) {
			itemTypeName = searchArguments.itemtypeName;
			itemTypeID = aras.getItemTypeId(itemTypeName);
		} else if (searchArguments.itemtypeID) {
			itemTypeID = searchArguments.itemtypeID;
			itemTypeName = aras.getItemTypeName(itemTypeID);
		}

		if (searchArguments.handler) {
			handler = searchArguments.handler;
		}
		sourceItemTypeName = searchArguments.sourceItemTypeName;
		sourcePropertyName = searchArguments.sourcePropertyName;
		multiselect = !!searchArguments.multiselect;

		initPage(true);
	};

	container.makeReturnValue = function (itemID) {
		const resultObject = aras.newObject();
		itemID = itemID === 'set_nothing' ? '' : itemID;

		resultObject.itemID = itemID;
		resultObject.keyed_name = itemID;

		if (itemID) {
			const item = currQryItem
				.getResult()
				.selectSingleNode('Item[@id="' + itemID + '"]');
			if (item) {
				resultObject.keyed_name = aras.getKeyedNameEx(item);
			}
			resultObject.item = item;
		}

		return resultObject;
	};

	let destroyCuiLayout = null;
	container.initCuiLayout = function (options) {
		if (options.selectedPolyItemId) {
			window.layout && window.layout.destroy();
			window.removeEventListener('unload', destroyCuiLayout);
			container.itemTypeID = options.selectedPolyItemId;
			container.itemTypeName = aras.getItemTypeName(options.selectedPolyItemId);
			initPage(true);
			container.initSearch(false);
		}
		const containerNode = document.getElementById('searchToolbar');
		const cuiLayout = new SearchDialogCuiLayout(containerNode, 'SearchDialog', {
			itemTypeName: window.itemTypeName,
			selectedPolyItemId: options.selectedPolyItemId,
			polyItemType: options.polyItemType
		});
		cuiLayout.grid = grid._grid;
		window.layout = cuiLayout;
		destroyCuiLayout = () => window.layout.destroy();
		window.addEventListener('unload', destroyCuiLayout);
		return cuiLayout.init();
	};

	container.searchDialogOnLoadHandler = function () {
		if (!grid) {
			setTimeout(container.searchDialogOnLoadHandler, 50);
			return;
		}

		return container.initSearch(true).then(function () {
			container.initCuiLayout({
				selectedPolyItemId: window.selectedPolyItemId,
				polyItemType: searchContainer.getPolyItem()
			});
			container.initButtonsContainer();

			const onKeydown = function (e) {
				if (e.keyCode === 27) {
					// Esc
					window.frameElement.dialogArguments.dialog.close();
				}
			};
			document.addEventListener('keydown', onKeydown);
		});
	};

	container.searchDialogOnGridXmlLoaded = function () {
		grid.setMultiselect(multiselect);
		if (grid.getRowCount() > 0) {
			const rowId = grid.getRowId(0);
			grid.setSelectedRow(rowId, true, true);
		}
	};

	container.initButtonsContainer = function () {
		const okSpan = document.createElement('span');
		const cancelSpan = document.createElement('span');
		const okButton = document.createElement('button');
		const cancelButton = document.createElement('button');
		const buttonsContainer = document.getElementById('buttonsContainer');

		okSpan.classList.add('aras-button__text');
		okSpan.textContent = aras.getResource('', 'common.ok');
		cancelSpan.classList.add('aras-button__text');
		cancelSpan.textContent = aras.getResource('', 'common.cancel');

		okButton.classList.add(
			'aras-button',
			'aras-button_primary',
			'aras-buttons-bar__button'
		);
		okButton.addEventListener('click', container.onOkClick);
		cancelButton.classList.add(
			'aras-button',
			'aras-button_secondary-light',
			'aras-buttons-bar__button'
		);

		cancelButton.addEventListener('click', container.onCancelClick);

		okButton.appendChild(okSpan);
		cancelButton.appendChild(cancelSpan);
		buttonsContainer.appendChild(okButton);
		buttonsContainer.appendChild(cancelButton);
	};

	container.initSearch = function (isFirstTime) {
		return setupGrid(true).then(function () {
			const searchPlaceholder = document.getElementById('searchPlaceholder');
			if (!isFirstTime) {
				searchContainer.removeIFramesCollection();
			}
			searchContainer = new SearchContainer(
				itemTypeName,
				grid,
				null,
				searchLocation,
				searchPlaceholder
			);
			searchContainer.initSearchContainer();
			searchContainer.onStartSearchContainer();

			//disable "fixed criterion" cells of input row
			const colOrder = grid.getLogicalColumnOrder().split(';');
			colOrder.forEach(function (colName) {
				const propertyName = colName.substr(0, colName.length - 2);

				if (
					propertyName &&
					userMethodColumnCfgs[propertyName] &&
					userMethodColumnCfgs[propertyName].isFilterFixed
				) {
					grid.inputRow.set(grid.GetColumnIndex(colName), 'disabled', true);
				}
			});
			searchContainer.runAutoSearch();
			pagination.updateControlsState();
		});
	};

	container.onDoubleClick = function (rowID) {
		container.exit(rowID, 'doubleclick');
	};

	container.closeWindow = function (itemID, doReturnNothing) {
		let returnValue;
		if (multiselect) {
			returnValue = [];
			if (!doReturnNothing) {
				const selectedIds = grid.getSelectedItemIds();
				returnValue = searchArguments.fullMultiResponse
					? container.getFullMultiResponse(selectedIds)
					: selectedIds;
			}
		} else {
			returnValue = container.makeReturnValue(itemID);
		}

		searchArguments.dialog.close(returnValue);
	};

	container.exit = function (itemID, actionType) {
		const doReturnNothing = actionType === 'set_nothing';
		if (!doReturnNothing && !itemID) {
			aras.AlertError(aras.getResource('', 'searchdlg.select_item'));
			return;
		}

		if (!handler || handler(container.makeReturnValue(itemID), actionType)) {
			container.closeWindow(itemID, doReturnNothing);
		}
	};

	container.getFullMultiResponse = function (selectedIds) {
		const result = (selectedIds || []).map(function (id) {
			return container.makeReturnValue(id);
		});

		return result;
	};

	container.onCancelClick = function () {
		container.exit('set_nothing', 'set_nothing');
	};

	container.onOkClick = function () {
		container.exit(grid.getSelectedId(), 'return_selected');
	};

	container.onSearchGridLinkClick = function (linkValue) {
		if (!linkValue) {
			return;
		}

		linkValue = linkValue.replace(/'/g, '');
		const linkInfo = linkValue.split(',');
		const typeName = linkInfo[0];
		const id = linkInfo[1];
		aras.uiShowItem(typeName, id);
	};
}
