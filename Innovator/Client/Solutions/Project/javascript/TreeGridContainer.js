function TreeGridContainer(nodeId, options, controlMethods) {
	var self = this;
	Object.assign(this, controlMethods);

	this.disabledRows = new Set();
	this._cellFormattersMap = new Map();

	const itemIcons = new Map();
	itemIcons.set('Milestone', '../images/Milestone.svg');
	itemIcons.set('WBS Element', '../images/WBSElement.svg');
	itemIcons.set('Activity2', '../images/Activity2.svg');
	itemIcons.set('Deliverable', '../images/Deliverable.svg');
	this.itemIcons = itemIcons;

	const projectImages = [];
	itemIcons.forEach(function(src) {
		projectImages.push(src);
	});

	ArasModules.SvgManager.init();
	ArasModules.SvgManager.load(projectImages);

	var gridNode = document.getElementById(nodeId);
	this._grid = new TreeGrid(gridNode, options);

	this._grid.head = new Map();

	this._grid.loadBranchDataHandler = this.onGetChildren;

	const getClassName = function(headId, rowId, grid) {
		switch (grid.getCellType(headId, rowId)) {
			case 'ArasTreeGridActivityNumberFormatter':
			case 'ArasTreeGridColorFormatter':
			case 'ArasTreeGridLinkFormatter':
			case 'ArasTreeGridImgFormatter':
				return '';
			default:
				return (headId === 'attach' || self.canEdit(rowId, headId, grid)) ? '' : ' aras-grid-row-cell_disabled ';
		}
	};

	const wrapFormatter = function(formatterName, headId, rowId, value, grid, metadata) {
		const template = Grid.formatters[formatterName](headId, rowId, value, grid, metadata);
		const additionalClassname = getClassName(headId, rowId, grid);
		template.className = template.className ? template.className += additionalClassname : additionalClassname;
		template.style = grid.head.get(headId).styles;
		return template;
	};

	Grid.formatters.defaultFormatter = function(headId, rowId, value, grid) {
		return {
			children: [value],
			style: Object.assign({}, grid.head.get(headId).styles),
			className: getClassName(headId, rowId, grid)
		};
	};

	Grid.formatters.ArasTreeGridColorFormatter = function(headId, rowId, value, grid) {
		const template = Grid.formatters.defaultFormatter(headId, rowId, value, grid);
		const rowStyle = grid.rows.get(rowId, 'style');
		const cellStyle = rowStyle[headId] || {};
		Object.assign(template.style || {}, cellStyle);

		return template;
	};

	Grid.formatters.ArasTreeGridActivityNumberFormatter = function(headId, rowId, value, grid) {
		value = getActNum(rowId);
		return Grid.formatters.defaultFormatter(headId, rowId, value, grid);
	};

	Grid.formatters.ArasTreeGridActivityPredecessorFormatter = function(headId, rowId, value, grid) {
		value = getPredecessorValue(rowId);
		return Grid.formatters.defaultFormatter(headId, rowId, value, grid);
	};

	Grid.formatters.ArasTreeGridIconTextFormatter = function(headId, rowId, value, grid) {
		const formatter = Grid.formatters.defaultFormatter(headId, rowId, value, grid);
		const itemType = grid.rows.get(rowId, 'isMilestone') ? 'Milestone' : grid.rows.get(rowId, 'type');
		const icon = self.itemIcons.get(itemType);
		if (icon) {
			const iconNode = Grid.formatters.img(headId, rowId, icon);
			formatter.children.unshift(iconNode.children[0]);
			formatter.className += 'aras-grid-row-cell__icon';
		}
		return formatter;
	};

	Grid.formatters.ArasTreeGridImgFormatter = function(headId, rowId, value, grid) {
		const re = /\ssrc=(?:(?:'([^']*)')|(?:"([^"]*)")|([^\s]*))/i;
		const res = value.match(re);
		let imgSrc = '';

		if (res) {
			imgSrc = res[1] || res[2] || res[3] || '';
		}
		if (imgSrc) {
			const svgId = ArasModules.SvgManager.getSymbolId(imgSrc);
			if (!svgId) {
				imgSrc = '../../../' + imgSrc;
			}
		}
		return wrapFormatter('img', headId, rowId, imgSrc, grid);
	};

	Grid.formatters.ArasTreeGridLinkFormatter = wrapFormatter.bind(null, 'link');

	Grid.formatters.ArasTreeGridDateFormatter = wrapFormatter.bind(null, 'calendar');

	Grid.formatters.ArasTreeGridSelectFormatter = wrapFormatter.bind(null, 'select');

	Grid.formatters.ArasTreeGridBooleanFormatter = wrapFormatter.bind(null, 'boolean');

	Grid.editors.ArasTreeGridActivityPredecessor = function(dom, headId, rowId, value, grid, metadata) {
		value = getPredecessorValue(rowId);
		return Grid.editors.text(dom, headId, rowId, value, grid, metadata);
	};

	this._grid.getEditorType = function(headId, rowId, value, type) {
		const formatter = self.determineCellFormatter(headId, rowId, value, type, this);
		if (formatter === 'ArasTreeGridLinkFormatter') {
			return 'link';
		}

		if (headId === 'leader') {
			return 'link';
		}

		switch (type) {
			case 'ArasTreeGridBooleanFormatter':
				return 'nonEditable';
			case 'ArasTreeGridSelectFormatter':
				return 'select';
			case 'ArasTreeGridDateFormatter':
				return 'calendar';
			case 'ArasTreeGridActivityPredecessorFormatter':
				return 'ArasTreeGridActivityPredecessor';
			default:
				return 'text';
		}
	};

	this._grid.getCellType = function(headId, rowId, value, type) {
		var cellId = headId + rowId;
		if (self._cellFormattersMap.has(cellId)) {
			return self._cellFormattersMap.get(cellId);
		}

		var formatter = self.determineCellFormatter(headId, rowId, value, type, this);
		if (headId === 'attach') {
			return formatter;
		}

		if (formatter === 'ArasTreeGridLinkFormatter') {
			return this.view.defaultSettings.editable ? 'defaultFormatter' : 'ArasTreeGridLinkFormatter';
		}

		self._cellFormattersMap.set(cellId, formatter);
		return formatter;
	};

	this.determineCellFormatter = function(headId, rowId, value, type, grid) {
		if (type === 'boolean') {
			return 'ArasTreeGridBooleanFormatter';
		}

		if (/^(&lt;|<)img[\w\W]*>$/.test(value)) {
			return 'ArasTreeGridImgFormatter';
		}

		if (grid.rows.get(rowId, headId + 'link')) {
			return 'ArasTreeGridLinkFormatter';
		}

		var columnIndex = grid.head.get(headId, 'index');
		var column = ProjectPlan.columns[viewShare.properties.fldToCol[columnIndex]];
		if (column && !column.isSystem) {
			var itemType = grid.rows.get(rowId, 'type');
			var isMilestone = grid.rows.get(rowId, 'isMilestone');
			var shortType = itemType === 'WBS Element' ? 'wbs' : isMilestone ? 'mil' : 'act';
			var columnSource = column.sources[shortType];
			var columnParams = columnSource ? columnSource.params : null;

			if (columnParams) {
				var fieldType = columnParams.field_type;
				switch (fieldType) {
					case 'text':
						return 'defaultFormatter';
					case 'item':
						return 'ArasTreeGridLinkFormatter';
					case 'color':
						return 'ArasTreeGridColorFormatter';
					case 'image':
						return 'ArasTreeGridImgFormatter';
					case 'date':
						return 'ArasTreeGridDateFormatter';
					case 'dropdown':
						return 'ArasTreeGridSelectFormatter';
				}
			}
		} else {
			switch (headId) {
				case 'n':
					return 'ArasTreeGridActivityNumberFormatter';
				case 'treeNode':
					return 'ArasTreeGridIconTextFormatter';
				case 'status':
					return 'ArasTreeGridColorFormatter';
				case 'predecessor':
					return 'ArasTreeGridActivityPredecessorFormatter';
			}

			switch (grid.head.get(headId, 'editableType')) {
				case 'FilterComboBox':
					return 'ArasTreeGridSelectFormatter';
				case 'dateTime':
					return 'ArasTreeGridDateFormatter';
				case 'boolean':
					return 'ArasTreeGridBooleanFormatter';
				case 'InputHelper':
					return 'defaultFormatter';
			}
		}

		return 'defaultFormatter';
	};

	this._grid.getCellMetadata = function(headId, rowId, type) {
		if (type === 'ArasTreeGridSelectFormatter' || type === 'filterList' || type === 'select') {
			const options = self._grid.head.get(headId, 'options') || [];
			const optionsLables = self._grid.head.get(headId, 'optionsLables') || [];
			const optionsList = options.map(function(itemValue, i) {
				return {
					value: itemValue,
					label: optionsLables[i]
				};
			});

			return {
				list: optionsList,
				options: optionsList
			};
		}

		const clickHandler = function() {
			self.onInputHelperShow(rowId, headId);
		};

		if (rowId === 'searchRow') {
			if (type === 'date' || type === 'singular') {
				return {
					itemType: this.head.get(headId, 'dataSourceName'),
					handler: clickHandler
				};
			}

			return null;
		}

		const willValidate = function(value) {
			return self.validateCell(rowId, headId, value);
		};

		if (type === 'ArasTreeGridDateFormatter' || type === 'calendar') {
			const format = getDateFormat(headId, self._grid.rows.get(rowId, 'type'));
			return {
				format: format,
				editorClickHandler: clickHandler,
				willValidate: function(value) {
					value = aras.convertToNeutral(value, 'date', getSnakeCased(format));
					return willValidate(value);
				}
			};
		}

		if (type === 'link') {
			return {
				editorClickHandler: clickHandler,
				willValidate: willValidate
			};
		}

		return {
			willValidate: willValidate,
			checkValidity: function(value) {
				return self.preValidateCell(rowId, headId, value);
			}
		};
	};

	this._grid.checkEditAvailability = function(headId, rowId, grid) {
		if (self.disabledRows.has(rowId) || self._cutSelectedItemsBuffer.has(rowId)) {
			return false;
		}

		return self.canEdit(rowId, headId, grid);
	};

	this._grid.getRowClasses = function(rowId) {
		if (self._cutSelectedItemsBuffer.has(rowId)) {
			return 'aras-grid-row__cut';
		}

		if (self._grid.rows.get(rowId, 'isCritical')) {
			return 'aras-grid-row__critical';
		}

		return '';
	};

	this._grid.actions._updateIndexRows = function() {
		var newIndexRows = [];
		var gridSettings = this.grid.settings;
		var indexTreeRows = gridSettings.indexTreeRows;
		var expanded = gridSettings.expanded;
		var updateRow = function(key) {
			indexTreeRows[key].forEach(function(rowId) {
				newIndexRows.push(rowId);
				if (expanded.has(rowId) && indexTreeRows[rowId]) {
					updateRow(rowId);
				}
			});
		};
		updateRow('roots');
		gridSettings.indexRows = newIndexRows;
	};

	this._grid.actions._moveRowHandler = function(targetId, selectedRows, sameLevel) {
		var grid = this.grid;
		var gridSettings = grid.settings;
		var indexTreeRows = gridSettings.indexTreeRows;
		var expanded = gridSettings.expanded;

		selectedRows.forEach(function(rowId) {
			var parentId = self.getParentId(rowId);
			var parentRow = indexTreeRows[parentId];
			if (!parentRow) {
				return;
			}

			parentRow.splice(parentRow.indexOf(rowId), 1);
			var parentRowObj = grid.rows.get(parentId);
			if (indexTreeRows[parentId].length) {
				parentRowObj.children = parentRow.slice();
			} else {
				delete parentRowObj.children;
				expanded.delete(parentId);
			}

			grid.rows.set(parentId, parentRowObj);
		});

		var targetRowChildren;
		if (sameLevel) {
			var targetParentId = self.getParentId(targetId);
			targetRowChildren = indexTreeRows[targetParentId];
			var targetPosition = targetRowChildren.indexOf(targetId);
			Array.prototype.splice.apply(targetRowChildren, [targetPosition + 1, 0].concat(selectedRows));
			grid.rows.set(targetParentId, targetRowChildren.slice(), 'children');
		} else {
			targetRowChildren = grid.rows.get(targetId, 'children');
			targetRowChildren = targetRowChildren ? targetRowChildren.slice() : [];
			Array.prototype.splice.apply(targetRowChildren, [0, 0].concat(selectedRows));
			indexTreeRows[targetId] = targetRowChildren;
			grid.rows.set(targetId, targetRowChildren.slice(), 'children');
			if (!expanded.has(targetId)) {
				expanded.add(targetId);
			}
		}

		grid.actions._updateIndexRows();
		grid.metadata = grid.actions._calcRowsMetadata(indexTreeRows);
		grid.render();
	};

	Object.defineProperty(this._grid.actions, '_sortFn', {
		get: function(a, b) {
			var grid = this.grid;
			var orderBy = grid.settings.orderBy;
			var dataSourceGetters = {
				n: getActNum,
				predecessor: getPredecessorValue,
				default: grid.rows.get.bind(grid.rows)
			};

			return function(a, b) {
				for (var i = 0; i < orderBy.length; i++) {
					var prop = orderBy[i].headId;
					var valueGetter = dataSourceGetters[prop] || dataSourceGetters['default'];
					var valA = valueGetter(a, prop);
					valA = +valA || valA;
					var valB = valueGetter(b, prop);
					valB = +valB || valB;
					var reverse = orderBy[i].desc;
					if (valA < valB) {
						return reverse ? 1 : -1;
					}
					if (valA > valB) {
						return reverse ? -1 : 1;
					}
				}
				return 0;
			};
		}
	});

	this.columns_Experimental = {
		get: function(headId, property) {
			return self._grid.head.get(headId, property);
		},
		get grid() {
			return self.grid_Experimental;
		}
	};

	this.grid_Experimental = {
		order: self.columnsOrder,
		expandAll: function() {
			var grid = self._grid;
			var gridSettings = grid.settings;
			var indexTreeRows = gridSettings.indexTreeRows;

			if (grid.rows) {
				grid.rows._store.forEach(function(child, key) {
					if (child.children && !gridSettings.expanded.has(key)) {
						if (child.children.length) {
							gridSettings.expanded.add(key);
							if (!indexTreeRows[key]) {
								indexTreeRows[key] = child.children.slice().sort(grid.actions._sortFn.bind(grid));
							}
						} else {
							child.children = undefined;
						}
					}
				});
			}
		},
		clearCache: function() {
			this._layout = null;
			this._cachedUniqueId = null;
		},
		collapseAll: function() {
			self._grid.settings.expanded = new Set();
		},
		onToggleRow: function() {},
		viewsHeaderNode: {
			get offsetHeight() {
				return self._grid.view.header.offsetHeight;
			}
		},
		domNode: {
			get clientWidth() {
				return self._grid.dom.clientWidth;
			}
		},
		_cachedUniqueId: null,
		getItem: function(index) {
			const that = this;
			if (!this._cachedUniqueId) {
				this._cachedUniqueId = new Map();
				const indexRows = self._grid.settings.indexRows;
				indexRows.forEach(function(rowId) {
					const rowItem = self._grid.rows.get(rowId);
					that._cachedUniqueId.set(rowItem.uniqueId, [rowItem.uniqueId]);
				});
			}

			const rowId = self._grid.settings.indexRows[index];
			const row = self._grid.rows.get(rowId);
			const result = {};
			if (!row) {
				return result;
			}

			result.parent = [self.getParentId(rowId)];
			const icon = self.itemIcons.get(row.isMilestone ? 'Milestone' : row.type);
			result.icon = ['../' + icon.replace(/\.\.\//g, '')];

			this.layout.cells.forEach(function(column) {
				result[column.name] = [row[column.field]];
			});

			result.uniqueId = this._cachedUniqueId.get(row.uniqueId);
			if (row.children && row.children.length) {
				result.children = row.children.map(function (x) {
					return {uniqueId: that._cachedUniqueId.get(x)};
				});
			} else {
				result.children = row.children === true ? [true] : [];
			}

			return result;
		},
		_layout: null,
		get layout() {
			if (this._layout) {
				return this._layout;
			}

			const head = self._grid.head;

			const cells = [];
			head._store.forEach(function(value, headId) {
				const cellStyle = Object.keys(value.styles).reduce(function(resultStyle, styleName) {
					resultStyle += (styleName + ': ' + value.styles[styleName] + ';');
					return resultStyle;
				}, '');
				cells[value.order] = {
					unitWidth: value.width + 'px',
					width: value.width + 'px',
					name: value.label,
					field: value.field,
					styles: cellStyle,
					layoutIndex: value.index,
					inputFormat: '',
					headerStyles: 'text-align:center;'
				};
			});

			this._layout = {cells: cells};

			return this._layout;
		},
		store: {
			getValue: function(rowId, fieldLinkName) {
				return self._grid.rows.get(rowId[0], fieldLinkName);
			}
		},
		get styleGrid() {
			const indexRows = self._grid.settings.indexRows;
			const styleGrid = {};
			const columns = this.layout.cells;

			indexRows.forEach(function(rowId) {
				const style = self._grid.rows.get(rowId, 'style');

				styleGrid[rowId] = columns.reduce(function(styleItem, column) {
					styleItem[column.name] = style[column.field];
					return styleItem;
				}, {});

				styleGrid[rowId].styleRow = {color: self._grid.rows.get(rowId, 'isCritical') ? '#FF0000' : undefined };
			});
			return styleGrid;
 		}
	};

	this._grid.on('applyEdit', function(e) {
		var detail = e.detail;
		self.onApplyEdit(detail.rowId, detail.headId, detail.value);
	});

	this._grid.on('selectRow', function(e) {
		self.onSelectItemChanged();
	});

	this._grid.on('click', function(headId, rowId, event) {
		var link = this.rows.get(rowId, headId + 'link');
		if (link) {
			self.gridLinkClick(link);
		}
	}, 'cell');

	this._grid.on('focusCell', function() {
		var focusedCell = self._grid.settings.focusedCell;
		if (focusedCell && focusedCell.editing) {
			self.onStartEdit(focusedCell.rowId, focusedCell.headId, self._grid);
		}
	});

	this._grid.on('search', function() {
		self.onStartSearch();
	});

	this._grid.on('expand', function() {
		self.grid_Experimental.onToggleRow();
	});

	this._grid.view.body.addEventListener('click', this._grid.view._clickHandler.bind(this._grid.view));
	this._grid.view.body.addEventListener('mousedown', function(e) {
		if (e.button === 0 && self.canDragDrop()) {
			self._grid.view._dragTimeout = window.setTimeout(
				self._grid.view._rowDragHandler.bind(self._grid.view, e),
				200
			);
		}
	});

	window.addEventListener('resize', this._grid.view._resizeWindowHandler.bind(this._grid.view));

	this.gridItemEvents.forEach(function(event) {
		self._grid.on(event.action, event.handler.bind(self));
	});

	this._initContextMenu();

	this._cells_Experimental = {
		getText: function() {
			const headId = this.headId;
			const rowId = this.cell_Experimental[0];

			if (headId === 'n') {
				return getActNum(rowId);
			}

			if (headId === 'predecessor') {
				return getPredecessorValue(rowId);
			}

			const grid = self._grid;
			const value = grid.rows.get(rowId, headId);
			const formatter = grid.getCellType(headId, rowId, value);
			if (formatter === 'ArasTreeGridDateFormatter') {
				const metadata = grid.getCellMetadata(headId, rowId, formatter);
				const template = Grid.formatters.calendar(headId, rowId, value, grid, metadata);
				return template.children[0].children[0];
			}

			return value;
		}
	};
}

TreeGridContainer.prototype = {
	constructor: TreeGridContainer,

	addOnScrollListener_Experimental: function(listener) {
		this._grid.view.body.addEventListener('scroll', listener, true);
	},

	addXMLRows: function(xml) {
		var gridData = {
			columnsOrder: this.columnsOrder,
			head: this._grid.head._store,
			fullyLoaded: treeIsFullyLoaded
		};
		var dom = new XmlDocument();
		dom.loadXML(xml);

		return this.parseXml.collectRowsFromXML(dom, gridData);
	},

	cells: function(rowId, columnIndex) {
		return this.cells_Experimental(rowId, columnIndex);
	},

	cells_Experimental: function(rowId, columnIndex) {
		const cell = {cell_Experimental: rowId, indexColumn_Experimental: viewShare.properties.fldToCol[columnIndex], headId: this.columnsOrder[columnIndex]};
		return Object.assign(cell, this._cells_Experimental);
	},

	clearSelection: function() {
		this._grid.settings.selectedRows = [];
		this._grid.render();
	},

	expandAll: function(bool) {
		this.grid_Experimental[(false !== bool) ? 'expandAll' : 'collapseAll']();
		this._grid.actions._updateIndexRows();
		this.grid_Experimental.onToggleRow();
		this._grid.render();
	},

	getColWidths: function() {
		var colWidths = [];
		this._grid.head._store.forEach(function(value, headId) {
			colWidths[value.order] = value.width;
		});

		return colWidths.join(';');
	},

	getMenu: function() {
		return this.contextMenu;
	},

	GetOpenedItems: function(delim) {
		const result = this.getOpenedItems();
		return delim ? result.join(delim) : result;
	},

	getOpenedItems: function() {
		var openedItems = [];
		this._grid.settings.expanded.forEach(function(rowId) {
			openedItems.push(rowId);
		});
		return openedItems;
	},

	getParentId: function(itemId) {
		var indexTreeRows = this._grid.settings.indexTreeRows;
		var indexRowsIds = Object.keys(indexTreeRows);

		return indexRowsIds.find(function(indexRowId) {
			return indexTreeRows[indexRowId].indexOf(itemId) !== -1;
		});
	},

	getRowCount: function() {
		return this._grid.settings.indexRows.length;
	},

	getRowIndex: function(rowId) {
		return this._grid.settings.indexRows.indexOf(rowId);
	},

	getRowIdsToDownload: function(rowId) {
		const rowsToDownload = [];
		const rows = this._grid.rows;
		function findRowsToDownload(rowId) {
			const children = rows.get(rowId, 'children');
			if (children) {
				if (children.length) {
					return children.forEach(findRowsToDownload);
				}
	
				rowsToDownload.push(rowId);
			}
		}
		
		findRowsToDownload(rowId);
		return rowsToDownload;
	},

	getSelectedItemIDs: function(delim) {
		var result = this._grid.settings.selectedRows.slice();
		return delim ? result.join(delim) : result;
	},

	getVisibleRowsIds_Experimental: function(resultAsDict) {
		var ids = resultAsDict ? {} : [],
			treeGridView = this._grid.view,
			firstVisibleRowIndex = treeGridView._findFirstRow(),
			rowsCount = treeGridView._getRowsCount(),
			rowsForRender = treeGridView._getRowsForRender(firstVisibleRowIndex, rowsCount),
			rowsForRenderLength = rowsForRender.length,
			i, itemWrapper;

		for (i = 0; i < rowsForRenderLength; i++) {
			itemWrapper = rowsForRender[i];
			if (itemWrapper) {
				if (resultAsDict) {
					ids[itemWrapper.id] = i + 1;
					ids.length = ids.length ? ids.length + 1 : ids.length = 1;
				} else {
					ids[ids.length] = itemWrapper.id;
				}
			}
		}
		return ids;
	},

	getElementOffsetTop_Experimental: function(element) {
		var key = 'top'; //to explicitly allow "top" usage
		return element.getBoundingClientRect()[key];
	},

	getTreeGridOffsetTop_Experimental: function() {
		var key = 'top'; //to explicitly allow "top" usage
		return this._grid.view.body.getBoundingClientRect()[key];
	},

	getRowByItemId_Experimental: function(id) {
		var rowIndex = this.getRowIndex(id);
		return this._grid.view.scroller.querySelector('.aras-grid-row[data-index="' + rowIndex + '"]');
	},

	InitXML: function(xml, expandedArray, reInit) {
		var grid = this._grid;
		var dom = new XmlDocument();
		dom.loadXML(xml);

		if (!reInit) {
			var headData = this.parseXml.collectHeadFromXML(dom);
			this.columnsOrder = headData.columnsOrder;
			grid.settings.treeHeadView = 'treeNode';
			grid.head = headData.head;
			grid.settings.indexHead = headData.nameColumns.filter(function(value) {
				return value !== undefined;
			});
		}

		var rowsData = this.addXMLRows(xml);
		grid.rows = rowsData.rows;
		grid.roots = rowsData.roots;

		if (expandedArray.length) {
			var gridRows = grid.rows;

			var expanded = expandedArray.filter(function(rowId) {
				var children = gridRows.get(rowId, 'children');
				if (children === true) {
					var row = gridRows.get(rowId);
					delete row.children;
					gridRows.set(rowId, row);
				} else {
					return true;
				}
			});

			grid.settings.expanded = new Set(expanded);
			grid.actions._updateIndexRows();
		}

		this._cutSelectedItemsBuffer = new Set();

		this.gridXmlLoaded();
	},

	setCellBgColor: function(rowId, headId, color) {
		const rowStyle = this._grid.rows.get(rowId, 'style');
		if (rowStyle[headId]) {
			rowStyle[headId]['background-color'] = color;
		} else {
			rowStyle[headId] = {'background-color': color};
		}
	},

	setEditable: function(bool) {
		if (this._grid.view.defaultSettings.editable != bool) {
			this._grid.view.defaultSettings.editable = bool;
		}
	},

	setSelectedRow: function(rowId, multi, show) {
		var rowIndex = this.getRowIndex(rowId);
		if (rowIndex === -1) {
			return;
		}
		if (multi) {
			if (this._grid.settings.selectedRows.indexOf(rowId) === -1) {
				this._grid.settings.selectedRows.push(rowId);
			}
		} else {
			this._grid.settings.selectedRows = [rowId];
		}
		if (show) {
			this.scrollToRow(rowId);
		}

		treeGrid._grid.render();
		onSelectItemChanged();
	},

	scrollToRow: function(rowId) {
		if (!rowId) {
			return;
		}

		const gridSettings = this._grid.settings;
		if (gridSettings.focusedCell) {
			gridSettings.focusedCell = Object.assign(gridSettings.focusedCell, {rowId: rowId});
			return;
		}

		gridSettings.focusedCell = {
			rowId: rowId,
			headId: 'treeNode'
		};
	},

	turnEditOff: function() {
		this._grid.cancelEdit();
	},

	updateIndexTreeBranch: function(rowId) {
		const updatedIndexTree = {};
		const grid = this._grid;
		const needSort = grid.settings.orderBy.length > 0;
		function getNewIndexTreeRows(rowId) {
			const children = grid.rows.get(rowId, 'children');
			if (children && children.length) {
				children.forEach(getNewIndexTreeRows);
				updatedIndexTree[rowId] = children.slice();
				if (needSort) {
					updatedIndexTree[rowId].sort(grid.actions._sortFn.bind(grid));
				}
			}
		}
		
		getNewIndexTreeRows(rowId);
		Object.assign(grid.settings.indexTreeRows, updatedIndexTree);
	},

	_initContextMenu: function() {
		const contextMenu = new ArasModules.ContextMenu();
		const contextMenuHandler = function(rowId, e) {
			e.preventDefault();
			const rowNotSelected = this._grid.settings.selectedRows.indexOf(rowId) === -1;
			if (rowNotSelected) {
				this.setSelectedRow(rowId);
			}
			this.gridMenuInit();
			contextMenu.show({x: e.clientX, y: e.clientY}, rowId);
		}.bind(this);

		const menuItems = getMenuItems(true, false, true).reduce(function(result, item) {
			result[item.id] = item.type === 'separator' ? {} : {label: item.label};
			return result;
		}, {separator: {}});

		contextMenu.applyData(menuItems);
		contextMenu.on('click', this.gridMenuClick);
		this._grid.on('contextmenu', contextMenuHandler, 'row');
		this.contextMenu = contextMenu;
	}
};
