(function () {
	var xClassEditorGrid = {};
	var tabID = aras.getRelationshipTypeId('xClass_xPropertyDefinition');
	var itemTypeName = 'xClass';

	function getIFrameSrc(itemID) {
		var db = aras.getDatabase();
		var editMode = isEditMode ? 1 : 0;

		var url = aras.getScriptsURL() + 'relationshipsGrid.html';
		var parameters =
			'db=' +
			db +
			'&isXClassRelationshipGrid=true&ITName=' +
			itemTypeName +
			'&itemID=' +
			itemID +
			'&relTypeID=' +
			tabID +
			'&editMode=' +
			editMode +
			'&toolbar=1';

		LocationSearches[tabID] = parameters;
		return url;
	}

	function loadRelationships(xClassItem, iframe) {
		var iframeSrc = getIFrameSrc(xClassItem.getAttribute('id'));
		var existingIframe = iframe.contentWindow.document.querySelector('iframe');
		if (existingIframe) {
			iframe.contentWindow.document.item = xClassItem;
			iframe.contentWindow.xClassTreeItem = window.item;
			iframe.contentWindow.itemTypeName = itemTypeName;
			iframe.contentWindow.LocationSearches = LocationSearches;
			if (iframeSrc === existingIframe.src) {
				existingIframe.src = null;
				existingIframe.src = iframeSrc;
			} else {
				existingIframe.src = iframeSrc;
				existingIframe.id = tabID;
			}

			existingIframe.skipCuiToolbars = true;
		}
	}

	xClassEditorGrid.getCurrentLoadedClassId = function () {
		if (xClassEditorGrid.node) {
			var iframe = xClassEditorGrid.node.querySelector('#wrapper');
			if (iframe.contentWindow.document.item) {
				return iframe.contentWindow.document.item.getAttribute('id');
			}
		}
	};

	xClassEditorGrid.init = function (node, item) {
		xClassEditorGrid.node = node;
		xClassEditorGrid.loadRelationships(item);
	};

	xClassEditorGrid.loadRelationships = function (item) {
		loadRelationships(item, xClassEditorGrid.node.querySelector('#wrapper'));
	};

	window.xClassEditorGrid = xClassEditorGrid;
})();
