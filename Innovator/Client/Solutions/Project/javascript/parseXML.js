var parseXML = {
	collectHeadFromXML: function(dom) {
		var tableNd = dom.selectSingleNode('./table');
		var thNodes = tableNd.selectNodes('thead/th');
		var columnNodes = tableNd.selectNodes('columns/column');
		var head = new Map();
		var nameColumns = [];
		var columnsOrder = [];

		if (thNodes.length === columnNodes.length) {
			var comboReg = /COMBO:(\d*)/;
			for (var i = 0; i < thNodes.length; i++) {
				var currentTh = thNodes[i];
				var currentColumn = columnNodes[i];

				var alignRow = getAlign(currentColumn.getAttribute('align'));
				var editable = currentColumn.getAttribute('edit');
				var colWidth = currentColumn.getAttribute('width');
				var order = parseInt(currentColumn.getAttribute('order'), 10);
				var id = currentColumn.getAttribute('name') || currentTh.text;
				var bgInvert = currentColumn.getAttribute('bginvert');
				var dataSourceName = currentColumn.getAttribute('dataSourceName');
				var options = [];
				var optionsLables = [];

				if (comboReg.test(editable)) {
					var idList = editable.match(comboReg)[1];
					var list = dom.selectSingleNode('./table/list[@id=' + idList + ']');
					if (list) {
						editable = 'FilterComboBox';
						var listItemsNodes = list.selectNodes('listitem');
						for (var j = 0; j < listItemsNodes.length; j++) {
							var val = listItemsNodes[j].getAttribute('value');
							var lab = listItemsNodes[j].getAttribute('label') || val;

							optionsLables.push(lab);
							options.push(val);
						}
					}
				}

				var searchType = '';
				switch (editable) {
					case 'dateTime':
						searchType = 'date';
						break;
					case 'InputHelper':
						searchType = 'singular';
						break;
					case 'FilterComboBox':
						searchType = 'filterList';
						break;
				}

				var headColumn = {
					dataSourceName: dataSourceName,
					label: currentTh.text || '',
					field: id,
					styles: {
						'text-align': alignRow
					},
					options: options,
					optionsLables: optionsLables,
					searchType: searchType,
					editableType: editable,
					sort: currentColumn.getAttribute('sort'),
					index: i,
					order: order,
					width: parseInt(colWidth),
					bginvert: bgInvert
				};

				columnsOrder.push(id);
				nameColumns[order] = id;
				head.set(id, headColumn);
			}
		}

		return {
			columnsOrder: columnsOrder,
			head: head,
			nameColumns: nameColumns
		};
	},

	collectRowsFromXML: function(dom, gridData) {
		var tableRows = dom.selectNodes('./table/tr');

		gridData.roots = [];
		gridData.rows = new Map();

		if (tableRows.length) {
			var rowObject = {
				getFields: function() {
					return this.rowXml.selectNodes('./td');
				},
				getFieldText: function(inItem) {
					return inItem.text;
				},
				getFieldAttribute: function(inItem, attributeName) {
					return inItem.getAttribute(attributeName) || this.rowXml.getAttribute(attributeName);
				}
			};

			for (i = 0; i < tableRows.length; i++) {
				rowObject.rowXml = tableRows[i];
				var rowId = rowObject.rowXml.getAttribute('id');
				var newRow = this.collectRowData(rowId, rowObject, gridData);
				gridData.rows.set(rowId, newRow);
			}
		}

		return {
			roots: gridData.roots,
			rows: gridData.rows
		};
	},

	collectRowData: function(id, row, gridData) {
		var regCheck = /<checkbox.*>/;
		var regCheckState = /.*(state|value)=["'](1|true)["'].*/;
		var rowXmlNode = row.rowXml;
		var columnsOrder = gridData.columnsOrder;
		var head = gridData.head;
		var newRow = {style: {}};
		var fields, currentField, layoutCell, i, fieldName,
			fieldSort, fieldText, fieldValue, fieldStyle,
			fieldBgColor;

		newRow.uniqueId = id;
		newRow.type = rowXmlNode.getAttribute('type');

		fields = row.getFields() || [];

		for (i = 0; i < fields.length; i++) {
			currentField = fields[i];
			layoutCell = head.get(columnsOrder[i]);
			if (!layoutCell) {
				return;
			}

			fieldName = layoutCell.field;
			fieldSort = layoutCell.sort;
			fieldText = row.getFieldText(currentField);
			fieldValue = fieldText;
			fieldStyle = {};
			if (regCheck.test(fieldText)) {
				fieldValue = regCheckState.test(fieldText);
			} else if ('DATE' === fieldSort) {
				fieldValue = fieldText;
			} else {
				fieldValue = fieldText;
				var link = row.getFieldAttribute(currentField, 'link');
				if (link) {
					newRow[fieldName + 'link'] = link;
				}
			}

			fieldBgColor = row.getFieldAttribute(currentField, 'bgColor');
			if (fieldBgColor) {
				fieldStyle['background-color'] = fieldBgColor.toLowerCase();
			}

			newRow[fieldName] = fieldValue;
			newRow.style[fieldName] = fieldStyle;
		}

		var rootLevel = rowXmlNode.getAttribute('level') === '0';
		if (rootLevel) {
			gridData.roots.push(id);
		}

		if (newRow.type === 'WBS Element') {
			var rowChildNodes =  rowXmlNode.selectNodes('./tr');
			if (rowChildNodes.length) {
				var childRowId;
				var children = [];
				for (i = 0; i < rowChildNodes.length; i++) {
					row.rowXml = rowChildNodes[i];
					childRowId = row.rowXml.getAttribute('id');
					children.push(childRowId);
					var childRow = this.collectRowData(childRowId, row, gridData);
					gridData.rows.set(childRowId, childRow);
				}
				newRow.children = children;

			} else if (!rootLevel && !gridData.fullyLoaded) {
				newRow.children = true;
			}

		} else {
			newRow.children = false;

			var isCritical = rowXmlNode.getAttribute('isCritical');
			if (isCritical) {
				newRow.isCritical = isCritical  === 'true';
			}

			var isMilestone = rowXmlNode.getAttribute('isMilestone');
			if (isMilestone) {
				newRow.isMilestone = isMilestone  === 'true';
			}

			var hasAssignments = rowXmlNode.getAttribute('hasAssignments');
			if (hasAssignments) {
				newRow.hasAssignments = hasAssignments  === 'true';
			}
		}

		return newRow;
	}
};

function getAlign(align) {
	var alignLetter = align && align[0].toLowerCase();

	if (alignLetter === 'c') {
		return 'center';
	}

	if (alignLetter === 'r') {
		return 'right';
	}

	return 'left';
}
