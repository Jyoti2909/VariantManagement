// © Copyright by Aras Corporation, 2004-2007.

var isFunctionDisabled = (function () {
	var disabledFunctions = {
		DFMEA: {
			'Save As': true,
			Version: true
		},
		FileExchangePackageFile: {
			Copy: true,
			Paste: true,
			'Paste Special': true
		},
		Language: {
			'Save As': true
		},
		'Process Planner': {
			'Save As': true,
			Version: true
		},
		Project: {
			'Save As': true
		},
		'Project Template': {
			'Save As': true
		},
		'Workflow Process': {
			Promote: true,
			'No Tabs': true
		},
		SavedSearch: {
			'Save As': true
		},
		SelfServiceReport: {
			'Save As': true
		},
		CAD: {
			'Save As': true
		},
		'Project Task': {
			Lock: true,
			Unlock: true
		},
		'FMEA Task': {
			Lock: true,
			Unlock: true
		},
		'InBasket Task': {
			Lock: true,
			Unlock: true,
			Delete: true,
			Open: true
		},
		'Express ECO EDR': {
			New: true,
			Delete: true,
			Copy: true,
			Promote: true
		},
		cmf_ContentType: {
			'Save As': true
		},
		xClassificationTree_ItemType: {
			'Pick Replace': true,
			Lock: true,
			Unlock: true,
			Copy: true,
			Paste: true,
			'Paste Special': true
		},
		fr_RepType_Characteristic: {
			'Pick Replace': true
		},
		ItemType_xPropertyDefinition: {
			'Pick Replace': true,
			Lock: true,
			Unlock: true
		},
		xPropertyDefinition: {
			Copy: true,
			'Save As': true
		},
		xClass_xPropertyDefinition: {
			Copy: true
		},
		gn_GraphViewItemType: {
			'Pick Replace': true,
			Lock: true,
			Unlock: true
		}
	};

	function isFunctionDisabled(itemTypeName, aFunction) {
		if (disabledFunctions[itemTypeName]) {
			return disabledFunctions[itemTypeName][aFunction];
		}
		return false;
	}

	return isFunctionDisabled;
})();
