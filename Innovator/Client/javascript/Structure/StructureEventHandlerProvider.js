function StructureEventHandlerProvider() {}

StructureEventHandlerProvider.prototype.OnLoad = function StructureEventHandlerProviderOnLoad() {};

StructureEventHandlerProvider.prototype.OnClick = function StructureEventHandlerProviderOnClick(
	point
) {
	return true;
};

StructureEventHandlerProvider.prototype.OnDbClick = function StructureEventHandlerProviderOnDbClick(
	item
) {
	if (item) {
		this.OnMenuClick(openitemCMDId, item);
	}
};

StructureEventHandlerProvider.prototype.OnMenuClick = function StructureEventHandlerProviderOnMenuClick(
	text,
	item
) {
	if (!item) {
		return;
	}

	var itemId = item.getId();
	var itemTypeName = item.getUserData('itemTypeName');
	if (text === openitemCMDId) {
		setTimeout(
			'aras.uiShowItem("' + itemTypeName + '","' + itemId + '");',
			150
		);
	} else if (text === propertiesCMDId) {
		var currItemType = aras.getItemTypeDictionary(itemTypeName);
		if (currItemType && !currItemType.isError()) {
			currItemType = currItemType.node;

			var itm = aras.getItemById(itemTypeName, itemId, 0);
			if (itm) {
				var win = aras.getMostTopWindowWithAras(window);
				win.ArasCore.Dialogs.properties(itm, currItemType, { aras: aras });
			}
		}
	} else if (text === expandFromHereCMDId) {
		var statusId = aras.showStatusMessage(
			'status',
			aras.getResource('', 'statusbar.expanding_all'),
			'../images/Progress.gif'
		);
		var i;
		var childrenCount = item.childrens && item.childrens.length;

		for (i = 0; i < childrenCount; i++) {
			item.childrens[0].remove();
		}

		var levelsToSelectPrev = levelsToSelect;
		levelsToSelect = -1;

		lastOpenedNode = item;
		onOpenItem2(item.getUserData('itemTypeName'), item.getId(), true);
		levelsToSelect = levelsToSelectPrev;

		setTimeout(function () {
			item.collapse(false);
			item.expand(true);
			aras.clearStatusMessage(statusId);
		}, 0);
	}
};

StructureEventHandlerProvider.prototype.OnMenuShow = function StructureEventHandlerProviderOnMenuShow(
	point,
	item
) {
	if (item) {
		window.focus();
		return true;
	} else {
		return false;
	}
};

StructureEventHandlerProvider.prototype.OnNameEdit = function StructureEventHandlerProviderOnNameEdit(
	mode,
	structNd,
	confirmed
) {
	return true;
};

StructureEventHandlerProvider.prototype.OnOpenItem = function StructureEventHandlerProviderOnOpenItem(
	item
) {
	return true;
};
