var WhereUsed = function (dom, itemTypeName, itemId) {
	var getChildNodes = function (rootNode) {
		return rootNode.childNodes;
	};

	var mapRowWithChildren = function (rowNode, rows) {
		var row = getRowFromXmlNode(rowNode);
		var currentRowId = (uniqueId++).toString();
		rows.set(currentRowId, row);

		var relatedItems = rowNode.firstChild;
		if (relatedItems) {
			relatedItems = getChildNodes(relatedItems);
			row.children = [];
			for (var i = 0, length = relatedItems.length; i < length; i++) {
				var childRowId = mapRowWithChildren(relatedItems[i], rows);
				row.children.push(childRowId);
			}
		}

		return currentRowId;
	};

	var getRowFromXmlNode = function (rowNode) {
		return {
			itemTypeName: rowNode.getAttribute('type'),
			itemId: rowNode.getAttribute('id'),
			icon: rowNode.getAttribute('icon'),
			label: rowNode.getAttribute('keyed_name'),
			children: true
		};
	};

	function getItemWhereUsed(itemTypeName, id) {
		return soap(
			"<Item type='" +
				itemTypeName +
				"' id='" +
				id +
				"' action='getItemWhereUsed' />",
			{ async: true }
		);
	}

	var scriptURL = aras.getScriptsURL();
	var uniqueId = 0;

	var grid = new TreeGrid(dom, { disableXLazyRendering: true });
	grid.getCellType = function () {
		return 'iconText';
	};
	Grid.formatters.iconText = function (headId, rowId, value, grid) {
		const formatter = {
			children: [
				{
					tag: 'span',
					children: [value]
				}
			]
		};

		const icon = grid.rows.get(rowId, 'icon');
		if (icon) {
			const iconNode = ArasModules.SvgManager.createInfernoVNode(icon);
			iconNode.className = 'aras-form-icon';
			formatter.children.unshift(iconNode);
		}
		return formatter;
	};
	grid.loadBranchDataHandler = function (branchId) {
		var row = grid.rows.get(branchId);
		return getItemWhereUsed(row.itemTypeName, row.itemId).then(function (
			result
		) {
			var relatedItems = result.firstChild.firstChild;
			if (relatedItems) {
				relatedItems = getChildNodes(relatedItems);
				var map = new Map();
				for (var i = 0, length = relatedItems.length; i < length; i++) {
					map.set((uniqueId++).toString(), getRowFromXmlNode(relatedItems[i]));
				}
				return map;
			}
		});
	};
	var contextMenu = new ArasModules.ContextMenu();
	var menuData = {
		open: {
			label: aras.getResource('', 'whereused.open_item')
		},
		properties: {
			label: aras.getResource('', 'itemsgrid.cntxt_menu.properties')
		}
	};
	contextMenu.applyData(menuData);

	var contextMenuHandler = function (rowId, e) {
		e.preventDefault();
		e.stopPropagation();
		contextMenu.show({ x: e.clientX, y: e.clientY }, rowId);
	};

	var contextItemHandler = function (menuItemId, e, rowId) {
		var rowItem = grid.rows.get(rowId);

		if (menuItemId === 'open') {
			aras.uiShowItem(rowItem.itemTypeName, rowItem.itemId);
		} else if (menuItemId === 'properties') {
			var currItemType = aras.getItemTypeDictionary(rowItem.itemTypeName);
			if (currItemType && !currItemType.isError()) {
				currItemType = currItemType.node;

				var item = aras.getItemById(rowItem.itemTypeName, rowItem.itemId, 0);
				if (item) {
					window.ArasCore.Dialogs.properties(item, currItemType, {
						aras: this.aras
					});
				}
			}
		}
	};

	contextMenu.on('click', contextItemHandler);
	grid.on('contextmenu', contextMenuHandler, 'row');

	grid.on(
		'dblclick',
		function (rowId) {
			var rowItem = grid.rows.get(rowId);
			aras.uiShowItem(rowItem.itemTypeName, rowItem.itemId);
		},
		'row'
	);

	return getItemWhereUsed(itemTypeName, itemId).then(function (result) {
		var rows = new Map();
		mapRowWithChildren(result.firstChild, rows);
		var head = new Map();
		head.set('label', {
			label: 'Used In',
			width: 400,
			resize: false
		});

		grid.head = head;
		grid.rows = rows;
		grid.roots = ['0'];
		grid.expand('0');
		return grid;
	});
};
