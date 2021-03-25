var isItemWindow = true;
var menuFrame;
var windowReady = false;
var isVersionableIT = aras.getItemProperty(itemType, 'is_versionable') == '1';
var isDependentIT = aras.getItemProperty(itemType, 'is_dependent') == '1';
var isRelationshipIT = aras.getItemProperty(itemType, 'is_relationship') == '1';
var use_src_accessIT = aras.getItemProperty(itemType, 'use_src_access') == '1';
var itemTypeID = aras.getItemTypeId(itemTypeName);
var can_addFlg = !isDependentIT && aras.getPermissions('can_add', itemTypeID);
var commandEventHandlers = {};
var relsDivHeight = '30%';
var openerMainWnd = aras.getMostTopWindowWithAras(opener);
var mainWnd = aras.getMostTopWindowWithAras(window);

var updateItemsGrid = window.aras.decorateForMultipleGrids(
	updateProvidedItemsGrid
);
var addRowToItemsGrid = window.aras.decorateForMultipleGrids(
	addRowToProvidedItemsGrid
);
var deleteRowFromItemsGrid = window.aras.decorateForMultipleGrids(
	deleteRowFromProvidedItemsGrid
);

var updateMenuState_tmt = 0;
var ExecuteUserCommandHandlerOptions = { Default: 0, EvalWinHandler: 1 };

if (!isTearOff) {
	//special code to set (un)registerCommandEventHandler
	const f = function (fNm) {
		fNm = fNm + 'registerCommandEventHandler';
		if (mainWnd[fNm]) {
			return;
		}

		mainWnd[fNm] = window[fNm];
		function g() {
			mainWnd[fNm] = undefined;
		}

		window.addEventListener('unload', g);
	};

	f('');
	f('un');
}

var __mediatorTop;
var __instanceHeight;
