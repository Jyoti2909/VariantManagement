var classReferencesStructure = function (dom, data) {
	var gridNode = document.createElement('div');
	var dialogNode = dom.parentNode.parentNode;
	gridNode.classList.add('class-references-tree-grid');
	dom.style.padding = '0';
	dom.style.height = '15rem';
	dom.appendChild(gridNode);

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
			label: rowNode.getAttribute('keyed_name')
		};
	};

	var scriptURL = aras.getScriptsURL();
	var uniqueId = 0;

	var grid = new TreeGrid(gridNode);
	grid.getCellType = function () {
		return 'iconText';
	};
	Grid.formatters.iconText = function (headId, rowId, value, grid) {
		var formatter = {
			children: [
				{
					tag: 'span',
					children: [value]
				}
			]
		};

		var icon = grid.rows.get(rowId, 'icon');
		if (icon) {
			formatter.children.unshift({
				tag: 'img',
				className: 'aras-form-icon',
				attrs: {
					src: scriptURL + icon
				}
			});
		}
		return formatter;
	};

	var contextMenu = new ArasModules.ContextMenu(dialogNode);
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

		var rowItem = grid.rows.get(rowId);
		if (rowItem.itemId) {
			contextMenu.show(
				{
					x: e.clientX - dialogNode.offsetLeft,
					y: e.clientY - dialogNode.offsetTop
				},
				rowItem
			);
		}
	};

	var contextItemHandler = function (menuItemId, e, rowItem) {
		if (menuItemId === 'open') {
			parent.parent.aras.uiShowItem(rowItem.itemTypeName, rowItem.itemId);
		} else if (menuItemId === 'properties') {
			var currItemType = aras.getItemTypeDictionary(rowItem.itemTypeName);
			if (currItemType && !currItemType.isError()) {
				currItemType = currItemType.node;

				var item = aras.getItemById(rowItem.itemTypeName, rowItem.itemId, 0);
				if (item) {
					parent.parent.ArasCore.Dialogs.properties(item, currItemType, {
						aras: this.aras
					});
				}
			}
		}
	};

	contextMenu.on('click', contextItemHandler);
	grid.on('contextmenu', contextMenuHandler, 'row');

	var rows = new Map();
	mapRowWithChildren(data.firstChild, rows);
	var head = new Map();
	head.set('label', {
		label: 'Used In',
		width: 10,
		resizable: false
	});

	grid.head = head;
	grid.rows = rows;
	grid.roots = ['0'];
	grid.expand('0');
	return grid;
};
