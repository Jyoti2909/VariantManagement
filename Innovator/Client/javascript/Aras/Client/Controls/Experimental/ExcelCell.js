define(['dojo/_base/declare', 'Aras/Client/Controls/Public/Cell'], function (
	declare,
	Cell
) {
	var privateMethods = {
		getPropertyNodeByCellIndex: function (parentItem, cellIndex) {
			var idx = 0;
			var propNode;

			var rec = function (parentItem) {
				var properties = parentItem.selectNodes('./prop');
				if (idx + properties.length <= cellIndex) {
					idx += properties.length;
				} else {
					var propIndex = cellIndex - idx;
					propNode = properties[propIndex];
					return false;
				}
				var childItems = parentItem.selectNodes('./Item');
				for (var i = 0; i < childItems.length; i++) {
					if (!rec(childItems[i])) {
						return false;
					}
				}
				return true;
			};

			rec(parentItem);

			return propNode;
		}
	};

	return declare('Aras.Client.Controls.Experimental.ExcelCell', Cell, {
		_initialEditType: '',
		_initialCssClasses: '',

		constructor: function (
			grid,
			cellNodFunc,
			cell,
			indexColumn,
			publicGridOrTreeGridContainer,
			skipMethodNamingConventionForPerformance,
			cellIndex
		) {
			this._storeRowId = grid.store.getValue(cell, 'uniqueId');
			this._storeRowIndex = grid.map.getStoreRowIndexByRowId(this._storeRowId);
			this._storeCellIndex = cellIndex;

			// cell properties definition
			Object.defineProperty(this, 'InputHelperEnabled', {
				set: function (doEnabled) {
					var layoutCell = this.grid_Experimental.layout.cells[
						this.indexColumn_Experimental
					];
					if (doEnabled) {
						this._initialEditType = layoutCell.editableType;
						this._initialCssClasses = layoutCell.customClasses;
						layoutCell.editableType = 'InputHelper';
						layoutCell.customClasses += ' InputHelper';
					} else {
						layoutCell.editableType = this._initialEditType;
						layoutCell.customClasses = this._initialCssClasses;
					}
				},
				get: function () {
					var layoutCell = this.grid_Experimental.layout.cells[
						this.indexColumn_Experimental
					];
					return layoutCell.editableType === 'InputHelper';
				}
			});
		},
		isCheckbox: function () {
			if (this.isInputRow_Experimental) {
				return false;
			}
			var inputElements = this.cellNod_Experimental.getElementsByTagName(
				'input'
			);
			if (
				inputElements.length === 1 &&
				inputElements[0].getAttribute('type') === 'checkbox'
			) {
				return true;
			}
			return false;
		},
		isChecked: function () {
			return this.getValue() === '1';
		},
		setChecked: function (value) {
			this.setValue(value ? '1' : '0');
			this.cellNod_Experimental.getElementsByTagName('input')[0].checked = value
				? true
				: false;
		},
		getValue: function () {
			var item = this.cell_Experimental,
				itemXML = this.grid_Experimental.store.getValue(item, 'rowItemXML', ''),
				column = this.grid_Experimental.layout.cells[
					this.indexColumn_Experimental
				],
				inputDom = new XmlDocument();

			inputDom.loadXML(itemXML);

			var propNode = privateMethods.getPropertyNodeByCellIndex(
					inputDom.firstChild,
					this._storeCellIndex
				),
				storeValue = propNode.text,
				returnValue = storeValue;
			if (/^<checkbox\ state\=\"\d?\"\/>$/.test(storeValue)) {
				returnValue = storeValue.match(/^<checkbox\ state\=\"(\d?)\"\/>$/)[1];
			} else if (column.sort === 'NUMERIC' || column.sort === 'DATE') {
				returnValue = column.convertFromNeutral(storeValue);
			}

			return returnValue;
		},

		getLink_Experimental: function () {
			var item = this.cell_Experimental,
				itemXML = this.grid_Experimental.store.getValue(item, 'rowItemXML', ''),
				column = this.grid_Experimental.layout.cells[
					this.indexColumn_Experimental
				],
				inputDom = new XmlDocument(),
				propertyNode;

			inputDom.loadXML(itemXML);
			propertyNode = privateMethods.getPropertyNodeByCellIndex(
				inputDom.firstChild,
				this._storeCellIndex
			);

			return propertyNode ? propertyNode.getAttribute('link') : '';
		},

		setLink: function (newItemLink) {
			var item = this.cell_Experimental,
				itemXML = this.grid_Experimental.store.getValue(item, 'rowItemXML', ''),
				column = this.grid_Experimental.layout.cells[
					this.indexColumn_Experimental
				],
				inputDom = new XmlDocument(),
				propertyNode;

			inputDom.loadXML(itemXML);
			propertyNode = privateMethods.getPropertyNodeByCellIndex(
				inputDom.firstChild,
				this._storeCellIndex
			);

			if (propertyNode) {
				if (newItemLink) {
					propertyNode.setAttribute('link', newItemLink);
				} else {
					propertyNode.removeAttribute('link');
				}

				this.grid_Experimental.store.setValue(item, 'rowItemXML', inputDom.xml);
			}
		},

		SetValue: null,

		setValue: function (inValue) {
			var item = this.cell_Experimental,
				itemXML = this.grid_Experimental.store.getValue(item, 'rowItemXML', ''),
				column = this.grid_Experimental.layout.cells[
					this.indexColumn_Experimental
				],
				inputDom = new XmlDocument(),
				propNode,
				oldValue,
				formattedValue,
				storeValue;

			inputDom.loadXML(itemXML);
			propNode = privateMethods.getPropertyNodeByCellIndex(
				inputDom.firstChild,
				this._storeCellIndex
			);
			oldValue = propNode.text;

			var converter = dojoConfig.arasContext.converter;
			if (/^<checkbox\ state\=\"\d?\"\/>$/.test(oldValue)) {
				storeValue =
					inValue === '1' ? '<checkbox state="1"/>' : '<checkbox state="0"/>';
			} else if ('NUMERIC' === column.sort) {
				if (column.inputformat) {
					formattedValue = converter.convertToNeutral(
						inValue,
						'decimal',
						column.inputformat
					);
				} else {
					formattedValue = converter.convertToNeutral(inValue, 'float');
				}
				storeValue = formattedValue || oldValue;
			} else if ('DATE' === column.sort && column.inputformat) {
				formattedValue = converter.convertToNeutral(
					inValue,
					'date',
					column.inputformat
				);
				storeValue =
					formattedValue || formattedValue === '' ? formattedValue : oldValue;
			} else {
				storeValue = inValue;
			}

			propNode.text = storeValue;
			this.grid_Experimental.store.setValue(item, 'rowItemXML', inputDom.xml);
		},

		getRowSpan: function () {
			var rowSpan = this.cellNod_Experimental.rowSpan;
			return rowSpan === undefined ? 1 : parseInt(rowSpan);
		},

		getRowId: function () {
			return this.grid_Experimental.map.getRowIdByStoreRowIdAndStoreCellIndex(
				this._storeRowId,
				this._storeCellIndex
			);
		},

		setBgColor_Experimental: function (value) {
			var item = this.cell_Experimental;
			var itemXML = this.grid_Experimental.store.getValue(
				item,
				'rowItemXML',
				''
			);
			var column = this.grid_Experimental.layout.cells[
				this.indexColumn_Experimental
			];
			var inputDom = new XmlDocument();
			inputDom.loadXML(itemXML);

			var propNode = privateMethods.getPropertyNodeByCellIndex(
				inputDom.firstChild,
				this._storeCellIndex
			);

			propNode.setAttribute('bgColor', value);
			this.grid_Experimental.store.setValue(item, 'rowItemXML', inputDom.xml);
		},

		setComboType: function (comboType) {
			if (!isNaN(comboType)) {
				var layoutCell = this.grid_Experimental.layout.cells[
					this.indexColumn_Experimental
				];
				switch (comboType) {
					case 1:
						layoutCell.editableType = 'UnboundSelect';
						break;
					default:
						layoutCell.editableType = 'FilterComboBox';
						break;
				}
			}
		}
	});
});
