function Dependencies() {}

Dependencies.view = function DependenciesView(
	itemTypeName,
	itemId,
	viewWhereUsed,
	aras,
	isInTearOff
) {
	let params = '';
	const itemType = aras.getItemTypeDictionary(itemTypeName, 'name');
	if (!itemType || itemType.isError()) {
		return;
	}

	const item = aras.getItemById(itemTypeName, itemId, 0);
	if (!item) {
		return;
	}

	if (aras.isNew(item)) {
		aras.AlertError(
			aras.getResource(
				'',
				'dependencies.is_new_error',
				itemType.getProperty('label')
			)
		);
		return;
	}

	let url = aras.getScriptsURL();
	let strBrItemID;

	if (viewWhereUsed) {
		url += 'whereUsed.html?id=' + itemId + '&type_name=' + itemTypeName;
		strBrItemID = itemId + '_whereUsed';
	} else {
		url += 'StructureBrowser.html?id=' + itemId + '&type_name=' + itemTypeName;
		strBrItemID = itemId + '_StructureBrowser';
	}

	const wndWidth = screen.width * 0.7;
	const wndHeight = screen.height * 0.7;
	const leftCoord = screen.width / 2 - wndWidth / 2;
	const topCoord = screen.height / 2 - wndHeight / 2;
	params =
		'left=' +
		leftCoord +
		', top=' +
		topCoord +
		', width=' +
		wndWidth +
		', height=' +
		wndHeight +
		', menubar=0, resizable=1, scrollbars=0, location=0, toolbar=0, status=0' +
		(isInTearOff ? ', isOpenInTearOff=true' : '');

	let win = aras.uiFindWindowEx(strBrItemID);
	if (!win || aras.isWindowClosed(win)) {
		win = aras.uiOpenWindowEx(strBrItemID, params);
		if (!win) {
			return;
		}

		aras.uiRegWindowEx(strBrItemID, win);
		window.open(url, win.name, params);
	} else {
		win.focus();
	}
};
