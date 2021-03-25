define([
	'dojo/_base/declare',
	'dojo',
	'dojo/_base/config',
	'dojo/_base/lang',
	'../Experimental/TreeGrid',
	'../Experimental/GridModules',
	'dojo/data/ItemFileWriteStore',
	'dojox/grid/LazyTreeGridStoreModel',
	'../Experimental/TypeEditCell',
	'dijit/focus',
	'../Experimental/ContextMenu',
	'../Experimental/safeIFrame',
	'dijit/form/CheckBox',
	'dojo/aspect',
	'Aras/Client/Controls/Public/Cell'
], function (
	declare,
	dojo,
	config,
	lang,
	TreeGrid,
	GridModules,
	ItemFileWriteStore,
	LazyTreeGridStoreModel,
	TypeEditCell,
	focusUtil,
	ContextMenu,
	safeIFrame,
	CheckBox,
	aspect,
	Cell
) {
	function _addDomNodeClass(domNode, classToAdd) {
		if (
			-1 === (' ' + domNode.className + ' ').indexOf(' ' + classToAdd + ' ')
		) {
			domNode.className += ' ' + classToAdd;
		}
	}

	function _removeDomNodeClass(domNode, classToRemove) {
		if (
			-1 !== (' ' + domNode.className + ' ').indexOf(' ' + classToRemove + ' ')
		) {
			domNode.className = (' ' + domNode.className).replace(
				' ' + classToRemove,
				''
			);
		}
	}

	function getXmlDocument(xmlStringOrDoc) {
		var res;
		if (typeof xmlStringOrDoc === 'string') {
			res = new XmlDocument();
			res.loadXML(xmlStringOrDoc);
		} else {
			res = xmlStringOrDoc;
		}
		return res;
	}

	function setCellViewType(
		cellViewTypeHelper_Experimental,
		tdXmlNode,
		cellLayout,
		store,
		item
	) {
		var cellViewType, cellViewTypeItemKey;

		if (!cellViewTypeHelper_Experimental) {
			return;
		}
		cellViewType = cellViewTypeHelper_Experimental.getCellViewType(tdXmlNode);
		if (!cellViewType) {
			return;
		}
		cellViewTypeItemKey = cellLayout.field + '$cellViewType';
		if (store && store.isItem(item)) {
			store.setValue(item, cellViewTypeItemKey, cellViewType);
		} else {
			item[cellViewTypeItemKey] = cellViewType;
		}
	}
	//this variable is used to build documentation in ExtractJSApiDocs.wsf file
	if (typeof arasDocumentationHelper === 'undefined') {
		var _dojo_baseUrl = dojo.baseUrl,
			_expandoTemplateString =
				'<div class="dojoxGridExpando" style="padding-right: 7px; position: relative; z-index: 1;">' +
				'<div class="dojoxGridExpandoNode" dojoAttachEvent="onclick:onToggle">' +
				'<div class="dojoxGridExpandoNodeInner" dojoAttachPoint="expandoInner"></div>' +
				'</div>' +
				'<img  class="treeExpandoLeaf" alt="" src="' +
				_dojo_baseUrl +
				'resources/blank.gif" />' +
				'<img  class="treeExpandoLeafNoChilds" style="display: none;" alt="" src="' +
				_dojo_baseUrl +
				'resources/blank.gif" />' +
				'<img class="aras_item_image" src="' +
				_dojo_baseUrl +
				'resources/blank.gif" />' +
				'</div>',
			_imagesRelPath = _dojo_baseUrl + '../../cbin/',
			_imageClassName = 'aras_lazytreegrid_icon',
			_noImageClassName = 'aras_lazytreegrid_no_icon',
			lazyDataLoader = (function () {
				var _xmlNodes = {} /* collection of rows XML nodes (by itemId) */,
					_loadItemData = null,
					_getItemId = null;
				_getItem = null;

				return {
					setItemDataLoadingExecuter: function (executer) {
						_loadItemData = executer;
					},
					setItemIdGetter: function (itemIdGetter) {
						_getItemId = itemIdGetter;
					},
					setItemGetter: function (itemGetter) {
						_getItem = itemGetter;
					},
					clearXmlNodes: function () {
						_xmlNodes = {};
					},
					deferItemDataLoading: function (itemId, xmlNode) {
						_xmlNodes[itemId] = xmlNode;
					},
					fillRowWithDataByItemId: function (itemId) {
						var xmlNode = _xmlNodes[itemId];
						if (xmlNode) {
							_loadItemData(itemId, xmlNode);
							delete _xmlNodes[itemId];
						}
					},
					fillRowWithData: function (rowIndex) {
						var itemId = _getItemId(rowIndex);
						this.fillRowWithDataByItemId(itemId);
					},
					fillRowsWithData: function (firstRowIndex, lastRowIndex) {
						var rowIndex;
						for (
							rowIndex = firstRowIndex;
							rowIndex < lastRowIndex;
							rowIndex++
						) {
							this.fillRowWithData(rowIndex);
						}
					},
					fillChildrenWithData: function (rowIndex) {
						var storeItem = _getItem(rowIndex);

						if (storeItem && storeItem.children) {
							var itemId, currentChild, i;

							for (i = 0; i < storeItem.children.length; i++) {
								currentChild = storeItem.children[i];
								if (
									!currentChild ||
									!currentChild.uniqueId ||
									!Array.isArray(currentChild.uniqueId)
								) {
									continue;
								}
								var xmlNode = _xmlNodes[currentChild.uniqueId[0]];
								if (xmlNode && xmlNode.isFake) {
									continue;
								}

								this.fillRowWithDataByItemId(currentChild.uniqueId[0]);
							}
						}
					}
				};
			})(),
			dojoxgrid_Experimental__TreeGridView_buildRow =
				dojox.grid._TreeGridView.prototype.buildRow,
			dojoxgrid_Experimental__LazyExpando_onToggle =
				dojox.grid._LazyExpando.prototype.onToggle,
			ForestStoreModel = declare(
				'Aras.Client.Controls.Experimental.ForestStoreModel',
				LazyTreeGridStoreModel,
				{
					_onGetChildren: function (parentItem) {
						var parentItemId;
						if (this.treeGrid) {
							parentItemId = parentItem.uniqueId[0];
							this.treeGrid.onGetChildren_Experimental(parentItemId);
						}
					},
					mayHaveChildren: function (item) {
						var children = item.children || [],
							firstChild = children[0];
						if ('boolean' === typeof firstChild) {
							return firstChild;
						}
						return 0 < children.length;
					},
					getChildren: function (
						/*dojo.data.Item*/ parentItem,
						/*function*/ callback,
						/*function*/ onError
					) {
						var children = parentItem.children || (parentItem.children = []);
						if ('boolean' === typeof children[0]) {
							parentItem.children = [];
							this._onGetChildren(parentItem);
						}
						this.inherited(arguments);
					},
					onSetItem: function (item, attribute) {},
					onNewItem: function (item, parentInfo) {},
					onDeleteItem: function (item) {} //don't use "," after the last property all over the file, e.g, here because documentation will not be built
				}
			),
			Formatter = function (value, rowIndex) {
				value =
					value && value.replace && this.grid.escapeHTMLInData
						? value.replace(/&/g, '&amp;').replace(/</g, '&lt;')
						: value;

				var parentFormatter = this.grid.parentContainer.formatter_Experimental,
					valueGrid = parentFormatter.formatHandler(this, value, rowIndex),
					item = this.grid.getItem(rowIndex),
					id = item.uniqueId[0];

				if (this.grid.styleGrid[id] && this.grid.styleGrid[id][this.field]) {
					styleRow = this.grid.styleGrid[id][this.field];
					for (var styleItem in styleRow) {
						if (styleRow.hasOwnProperty(styleItem)) {
							this.customStyles[this.customStyles.length - 1] +=
								styleItem + ':' + styleRow[styleItem] + ';';
						}
					}
				}

				return valueGrid;
			};

		lang.extend(dojox.grid._TreeGridView, {
			buildRow: function (inRowIndex, inRowNode) {
				if (inRowNode) {
					lazyDataLoader.fillRowWithData(inRowIndex);
				}
				dojoxgrid_Experimental__TreeGridView_buildRow.apply(this, arguments);
			},
			adaptWidth: function () {
				var width =
					this.scrollboxNode.offsetWidth - (this.getScrollbarWidth() || 16);
				if (this.flexCells) {
					this.headerContentNode.firstChild.style.width = this.contentWidth = this.getContentWidth();
				}
				if (this._removingColumn) {
					width = Math.min(width, this.getColumnsWidth()) + 'px';
					this._removingColumn = false;
				} else {
					width = Math.max(width, this.getColumnsWidth()) + 'px';
				}
				this.contentNode.style.width = width;
				this.hasHScrollbar(true);
			}
		});

		lang.extend(dojox.grid._LazyExpando, {
			_childRowIndent: 28 /* px */,
			_marginPosAttr: 'marginLeft',
			templateString: _expandoTemplateString,

			onToggle: function () {
				var state;
				if (
					this.view.grid &&
					this.view.grid.edit_Experimental &&
					this.view.grid.edit_Experimental.isEditing()
				) {
					this.view.grid.edit_Experimental.apply();
				}
				dojoxgrid_Experimental__LazyExpando_onToggle.apply(this, arguments);
				state = this.grid._treeCache.items[this.rowIdx].opened;
				if (state) {
					this.grid.openedExpandos[this.itemId] = true;
				} else {
					delete this.grid.openedExpandos[this.itemId];
				}
				this.grid.onToggleRow(this.itemId, state);
			},

			setOpen: function (open) {
				var treeGrid = this.grid,
					item = treeGrid._by_idx[this.rowIdx].item,
					itemMayHaveChildren =
						item && treeGrid.treeModel.mayHaveChildren(item),
					gridIsNotLoading = !treeGrid._loading,
					stateIsNew = open !== treeGrid._treeCache.items[this.rowIdx].opened;

				if (itemMayHaveChildren && gridIsNotLoading && stateIsNew) {
					treeGrid._treeCache.items[this.rowIdx].opened = open;
					treeGrid.expandoFetch(this.rowIdx, open);
					this._updateOpenState(item);
				}
			},

			//copy from dojo
			setRowNode: function (rowIdx, rowNode, view) {
				if (this.cellIdx < 0 || !this.itemId) {
					return false;
				}
				var grid = (this.grid = view.grid),
					item = grid._by_idx[rowIdx].item,
					open;

				this.view = view;
				this.rowIdx = rowIdx;
				this.domNode.style[this._marginPosAttr] =
					this.level * this._childRowIndent + 'px';
				open = this._updateOpenStateAndReturnState(item);
				this._setImageSrc(item, open);
				this._addVerticalDots(item, this.level);
				return true;
			},

			_updateExpandoInner: function (state) {
				if (state) {
					this.expandoInner.innerHTML = '-';
					_addDomNodeClass(this.domNode, 'dojoxGridExpandoOpened');
				} else {
					this.expandoInner.innerHTML = '+';
					_removeDomNodeClass(this.domNode, 'dojoxGridExpandoOpened');
				}
				_removeDomNodeClass(this.domNode, 'dojoxGridExpandoLoading');
			},

			_updateOpenStateAndReturnState: function (item) {
				if (this.grid.treeModel.mayHaveChildren(item)) {
					var cachedItem = this.grid._treeCache.items[this.rowIdx];
					var state = cachedItem
						? cachedItem.opened
						: this.grid.openedExpandos[this.itemId];
					this._updateExpandoInner(state);
					return state;
				} else {
					_removeDomNodeClass(this.domNode, 'dojoxGridExpandoOpened');
					return false;
				}
			},

			_updateOpenState: function (item) {
				if (this.grid.treeModel.mayHaveChildren(item)) {
					var cachedItem = this.grid._treeCache.items[this.rowIdx];
					var state = cachedItem
						? cachedItem.opened
						: this.grid.openedExpandos[this.itemId];
					this._updateExpandoInner(state);
				} else {
					_removeDomNodeClass(this.domNode, 'dojoxGridExpandoOpened');
				}
			},

			_setImageSrc: function (item, open) {
				var collapsedIcon = item.icon && item.icon[0],
					expandedIcon = item.expandedIcon && item.expandedIcon[0],
					imageUrl = open ? expandedIcon || collapsedIcon : collapsedIcon,
					img = this.domNode.lastChild;

				if (imageUrl) {
					img.src =
						(/^http.*/i.test(imageUrl) ? '' : _imagesRelPath) + imageUrl;
					_addDomNodeClass(img, _imageClassName);
					_removeDomNodeClass(img, _noImageClassName);
				} else {
					img.src = '';
					_addDomNodeClass(img, _noImageClassName);
					_removeDomNodeClass(img, _imageClassName);
				}
				_addDomNodeClass(this.domNode, 'aras_lazytreegrid_expando_with_icon');
			},

			_addVerticalDots: function (item, level, calledRecursively) {
				var parentId = this.grid.store.getValue(item, 'parent'),
					parentItem = this.grid.store._itemsByIdentity[parentId];

				if (parentItem) {
					itemSiblings = parentItem.children;

					if (item !== itemSiblings[itemSiblings.length - 1]) {
						this._addDots(level, false);
					} else if (!calledRecursively) {
						this._addDots(level, true);
					}

					this._addVerticalDots(parentItem, level - 1, true);
				}
			},

			_addDots: function (level, isLastChild) {
				var cellNode = this.domNode.parentNode.parentNode,
					dotsDiv = document.createElement('div'),
					dotsIndent = level * this._childRowIndent,
					dotsWidth = dotsIndent + 8,
					rowHeight = this.grid.treeModel.treeGrid.rowHeight,
					dotsHeight = isLastChild ? rowHeight >> 1 : rowHeight,
					dotsStyle =
						'background-position: ' +
						dotsIndent +
						'px 0px; width: ' +
						dotsWidth +
						'px; height: ' +
						dotsHeight +
						'px';

				dotsDiv.setAttribute('class', 'aras_lazytreegrid_vert_dots');
				dotsDiv.setAttribute('style', dotsStyle);
				cellNode.insertBefore(dotsDiv, cellNode.childNodes[0]);
			}
		});

		var privateProps = {};
	}

	return declare('Aras.Client.Controls.Public.TreeGridContainer', null, {
		//don't add property here without "_Experimental" - it will be shown as field in documentation, properties are defined in constructor using defineProperties
		grid_Experimental: null,
		contexMenu_Experimental: null,
		//this object is used for Lazy Loading (not just lazy rendering).
		//it has following fields/methods:
		//function loadData(),  returns: {
		//	siblingTotalCount: @int
		//	xmlDoc: @XmlDocument
		//}
		//function isFakeChild(@XmlNode), returns: @bool
		onDemandLoader_Experimental: null,
		//this object is used to work with cellViewTypes: e.g., get from xml, set to store, parse to some format according to locale
		//it has following fields/methods:
		//function getCellViewType(@xmlNode),  returns: type: @string
		//function getCellViewTypeSettings(@XmlNode), returns: {
		//	sort: @string,	//e.g., 'DATE'
		//	inputformat: @string, //e.g., 'MM/dd/yyyy'
		//  other setting can be added here.
		//}
		cellViewTypeHelper_Experimental: null,

		constructor: function (args) {
			/// <summary>
			/// Container for grid in "tree" mode
			/// </summary>
			var properties = {
				bgColor: {
					get: function () {
						/// <summary>
						/// The default cell bgcolor.
						/// </summary>
						/// <returns>string</returns>
						return privateProps[self.propsId_Experimental]
							._bgColor_Experimental;
					},
					set: function (value) {
						if (value) {
							privateProps[
								self.propsId_Experimental
							]._bgColor_Experimental = value;
						}
					}
				},
				BGColor: {
					get: function () {
						return self.bgColor;
					},
					set: function (value) {
						self.bgColor = value;
					}
				},
				bgInvert: {
					get: function () {
						/// <summary>
						/// Enable background row color inverting when selected. Default is true.
						/// </summary>
						/// <returns>bool</returns>
						return privateProps[self.propsId_Experimental]
							._bgInvert_Experimental;
					},
					set: function (value) {
						privateProps[
							self.propsId_Experimental
						]._bgInvert_Experimental = value;
					}
				},
				BGInvert: {
					get: function () {
						return self.bgInvert;
					},
					set: function (value) {
						self.bgInvert = value;
					}
				},
				borderGColor: {
					get: function () {
						/// <summary>
						/// Cell border color.
						/// </summary>
						/// <returns>bool</returns>
						return privateProps[self.propsId_Experimental]
							._borderGColor_Experimental;
					},
					set: function (value) {
						if (value) {
							privateProps[
								self.propsId_Experimental
							]._borderGColor_Experimental = value;
						}
					}
				},
				BorderGColor: {
					get: function () {
						return self.borderGColor;
					},
					set: function (value) {
						self.borderGColor = value;
					}
				},
				delimeter: {
					get: function () {
						/// <summary>
						/// The delimiter character.
						/// </summary>
						/// <returns>string</returns>
						return privateProps[self.propsId_Experimental]
							._delimeter_Experimental;
					},
					set: function (value) {
						if (value) {
							privateProps[
								self.propsId_Experimental
							]._delimeter_Experimental = value;
						}
					}
				},
				Delimeter: {
					get: function () {
						return self.delimeter;
					},
					set: function (value) {
						self.delimeter = value;
					}
				},
				font: {
					get: function () {
						/// <summary>
						/// The default text font.
						/// </summary>
						/// <returns>string</returns>
						return privateProps[self.propsId_Experimental]._font_Experimental;
					},
					set: function (value) {
						privateProps[self.propsId_Experimental]._font_Experimental = value;
					}
				},
				Font: {
					get: function () {
						return self.font;
					},
					set: function (value) {
						self.font = value;
					}
				},
				rowHeight: {
					get: function () {
						/// <summary>
						/// Specifies the default row height in pixels. Default is 26.
						/// </summary>
						/// <returns>string</returns>
						return self.grid_Experimental.rowHeight || 26;
					},
					set: function (value) {
						if (value >= 0) {
							self.grid_Experimental.rowHeight = value;
						}
					}
				},
				RowHeight: {
					get: function () {
						return self.rowHeight;
					},
					set: function (value) {
						self.rowHeight = value;
					}
				} //don't use "," after the last property all over the file, e.g, here because documentation will not be built
			};

			//this variable is used to build documentation in ExtractJSApiDocs.wsf file
			if (typeof arasDocumentationHelper !== 'undefined') {
				arasDocumentationHelper.registerProperties(properties);
				arasDocumentationHelper.registerEvents(
					'gridLinkClick, gridMenuClick, gridMenuInit, gridClick, gridDoubleClick, gridKeyPress, gridRowSelect, gridSort, gridXmlLoaded, gridSelectCell'
				);
				return;
			}

			this.propsId_Experimental =
				args && args.connectId ? args.connectId : 'gridTD';
			var experimentalArguments = ['canEdit'], // workaround for solutions
				gridPropertyName;

			for (var ar in args) {
				gridPropertyName =
					experimentalArguments.indexOf(ar) != -1 ? ar + '_Experimental' : ar;
				this[gridPropertyName] = args[ar];
			}

			var counter = 1;
			while (privateProps[this.propsId_Experimental]) {
				this.propsId_Experimental = args.connectId + counter;
				counter = counter + 1;
			}

			privateProps[this.propsId_Experimental] = {
				Editable: false,
				_listsById: [],
				_bgColor_Experimental: null,
				_bgInvert_Experimental: true,
				_borderGColor_Experimental: null,
				_delimeter_Experimental: '$',
				_font_Experimental: null,
				_layout: null,
				itemDemandedChilds: {},
				rowHeight: 26 //don't use "," after the last property all over the file, e.g, here because documentation will not be built
			};

			this.initXml = this.initXML;
			this.getSelectedItemIds = this.getSelectedItemIDs;
			this.getSelectedId = this.getSelectedID;
			this.getXML = this.getXml;

			var self = this;
			Object.defineProperties(this, properties);
			var jsonStore = new ItemFileWriteStore({
				data: {
					identifier: 'uniqueId',
					items: []
				}
			});
			var treeModel = new ForestStoreModel({
				store: jsonStore,
				deferItemLoadingUntilExpand: true,
				childrenAttrs: ['children']
			});
			var treeClass = args.TreeClass || 'aras_tree';
			var treeGridOptions = {
				// prettier-ignore
				'class': treeClass,
				style: 'height: 100%; width: 100%',
				treeGridIndent: args.treeGridIndent || 26,
				treeModel: treeModel
			};
			this.grid_Experimental = new TreeGrid(treeGridOptions);
			this._store = this.grid_Experimental.store;
			this.contexMenu_Experimental = new ContextMenu(
				this.grid_Experimental.domNode
			);

			aspect.after(
				this.contexMenu_Experimental,
				'onItemClick',
				function (id, rowId, columnIndex) {
					self.gridMenuClick(id, rowId, columnIndex);
				},
				true
			);

			this.connectId_Experimental =
				args && args.connectId ? args.connectId : 'gridTD';

			document
				.getElementById(this.connectId_Experimental)
				.appendChild(this.grid_Experimental.domNode);

			this.grid_Experimental.startup();
			this.grid_Experimental.errorMessage =
				"<span class='dojoxGridError'>" +
				dojoConfig.arasContext.resources['grid.rows_must_have_unique_ids'] +
				'</span>';
			this.items_Experimental = this.items_Experimental(this.grid_Experimental);
			this.columns_Experimental = GridModules.columns(this.grid_Experimental);
			this.inputRow = GridModules.inputRow(this.grid_Experimental);
			this.edit_Experimental = GridModules.edit(this.grid_Experimental);
			this.selection_Experimental = GridModules.selection(
				this.grid_Experimental
			);
			this.formatter_Experimental = GridModules.formatter(this);
			this.grid_Experimental.parentContainer = this;

			if (args.dnd_Experimental) {
				this.dnd_Experimental = GridModules.dnd(this);
			}

			//temporary commented out because of dojo.arasContext is undefined
			GridModules.initTextDirection(
				this.grid_Experimental.domNode,
				dojoConfig.arasContext.languageDirection
			);

			// Connect to Grid Events
			this.grid_Experimental.treeModel.treeGrid = this;
			this.grid_Experimental.canEdit = function (inCell, indexRow) {
				if (
					this.parentContainer.dnd_Experimental &&
					this.parentContainer.dnd_Experimental.dragStarted
				) {
					return false;
				} else {
					var item = this.getItem(indexRow),
						rowId = item.uniqueId[0];

					return this.parentContainer.canEdit_Experimental(rowId, inCell.field);
				}
			};

			if (dojo.isIE) {
				this.grid_Experimental.onBlur = function () {
					this.edit.apply();
				};
			}

			var resizeTreeGrid = function () {
				setTimeout(function () {
					var info = self.grid_Experimental.edit.info;
					if (info && info.cell) {
						self.grid_Experimental.edit.apply();
					}
					self.resize_Experimental();
				}, 0);
			};
			window.addEventListener('load', resizeTreeGrid, false);
			window.addEventListener('resize', resizeTreeGrid, false);
			dojo.connect(this, 'destroy', function () {
				window.removeEventListener('resize', resizeTreeGrid);
				window.removeEventListener('load', resizeTreeGrid);
			});
			dojo.connect(
				this.grid_Experimental,
				'onStyleRow',
				this.grid_Experimental,
				GridModules.events.onStyleRow
			);
			dojo.connect(
				this.grid_Experimental,
				'onRowDblClick',
				this,
				GridModules.events.onRowDblClick
			);
			dojo.connect(
				this.grid_Experimental,
				'onSelected',
				this,
				GridModules.events.onSelected
			);
			dojo.connect(
				this.grid_Experimental,
				'onMoveColumn',
				this,
				GridModules.events.onMoveColumn
			);
			dojo.connect(
				this.grid_Experimental,
				'onRowContextMenu',
				this,
				GridModules.events.onRowContextMenu
			);
			dojo.connect(
				this.grid_Experimental,
				'onRowClick',
				this,
				GridModules.events.onRowClick
			);
			dojo.connect(
				this.grid_Experimental,
				'gridLinkClick',
				this,
				GridModules.events.gridLinkClick
			);
			dojo.connect(
				this.grid_Experimental,
				'onStartEdit',
				this,
				GridModules.events.onStartEdit
			);
			dojo.connect(
				this.grid_Experimental,
				'onStartSearch',
				this,
				GridModules.events.onStartSearch
			);
			dojo.connect(
				this.grid_Experimental,
				'onApplyCellEdit',
				this,
				GridModules.events.onApplyCellEdit
			);
			dojo.connect(
				this.grid_Experimental,
				'dokeydown',
				this,
				GridModules.events.dokeydown
			);
			dojo.connect(
				this.grid_Experimental,
				'onFocusInputRow',
				this,
				GridModules.events.onFocusInputRow
			);
			dojo.connect(this.grid_Experimental, 'onCellFocus', function (
				cellLayout,
				rowIndex
			) {
				var cell = self.cells(self.getRowId(rowIndex), cellLayout.index);
				self.gridSelectCell(cell);
			});
			dojo.connect(
				this.grid_Experimental,
				'onChangeInputRow',
				this,
				GridModules.events.onChangeInputRow
			);
			dojo.connect(
				this.grid_Experimental,
				'onInputHelperShow',
				this,
				GridModules.events.onInputHelperShow
			);
			dojo.connect(
				this.grid_Experimental,
				'onToggleRow',
				this.onToggleRow_Experimental
			);
			dojo.connect(this.grid_Experimental, 'sort', function () {
				self.gridSort(this.getSortIndex(), this.getSortAsc());
			});

			this.grid_Experimental.validateCell = this.validateCell_Experimental;

			lazyDataLoader.setItemDataLoadingExecuter(function (itemId, rowXmlNode) {
				self._loadDeferredItemDataFromXml_Experimental(itemId, rowXmlNode);
			});
			lazyDataLoader.setItemIdGetter(function (rowIndex) {
				return self.getRowId(rowIndex);
			});
			lazyDataLoader.setItemGetter(function (rowIndex) {
				return self.grid_Experimental.getItem(rowIndex);
			});
			aspect.before(this.grid_Experimental, 'updateRows', function (
				startIndex,
				howMany
			) {
				lazyDataLoader.fillRowsWithData(startIndex, startIndex + howMany);
			});
			aspect.before(this.grid_Experimental, '_insertChildren', function (
				parentIndex
			) {
				lazyDataLoader.fillChildrenWithData(parentIndex);
			});

			aspect.after(this.grid_Experimental, 'buildViews', function () {
				//todo: private "_getHeaderContent" method is overwritten here.
				//copy of _getHeaderContent native method
				this.views.views[0]._getHeaderContent = function (inCell) {
					var n = inCell.name || inCell.grid.getCellName(inCell);
					if (/^\s+$/.test(n)) {
						n = '&nbsp;'; //otherwise arrow styles will be messed up
					}
					var ret = ['<div class="dojoxGridSortNode'];
					var propInfo = inCell.index != inCell.grid.getSortIndex();

					if (propInfo) {
						ret.push('">');
					} else {
						ret = ret.concat([
							' ',
							inCell.grid.sortInfo > 0
								? 'dojoxGridSortUp'
								: 'dojoxGridSortDown',
							'"><div class="dojoxGridArrowButtonChar">',
							inCell.grid.sortInfo > 0 ? '&#9650;' : '&#9660;',
							'</div>',
							'<div class="dojoxGridColCaption">'
						]);
					}
					ret = ret.concat([
						n,
						(!propInfo
							? '<span class="dojoxGridArrowButtonNode" role="presentation"></span>'
							: '') + '</div></div>'
					]);
					return ret.join('');
				};
			});

			for (var method in this) {
				if (typeof this[method] === 'function') {
					var methodName = method.substr(0, 1).toUpperCase() + method.substr(1);
					this[methodName] = this[method];
				}
			}
		},

		// events region

		gridLinkClick: function TreeGridContainerPublic_gridLinkClick(link) {
			/// <summary>
			/// Called when any Hyperlink in grid is clicked.
			/// </summary>
			/// <param name="link" type="string"></param>
		},

		gridMenuClick: function TreeGridContainerPublic_gridMenuClick(
			command,
			rowId,
			columnIndex
		) {
			//TODO: columnIndex parameter doesn't work
			/// <summary>
			/// Occurs when a menu item is clicked.
			/// </summary>
			/// <param name="menuItem" type="string"></param>
			/// <param name="rowId" type="string"></param>
			/// <param name="columnIndex" type="int"></param>
		},

		gridMenuInit: function TreeGridContainerPublic_gridMenuInit(
			rowId,
			columnIndex
		) {
			//TODO: now always returns true
			/// <summary>
			/// Occurs before menu is shown.
			/// </summary>
			/// <param name="rowId" type="string"></param>
			/// <param name="columnIndex" type="int"></param>
			/// <returns>bool</returns>
			return true;
		},

		gridClick: function TreeGridContainerPublic_gridClick(rowId, columnIndex) {
			/// <summary>
			/// Occurs when the mouse pointer is over the grid cell and a mouse button is pressed.
			/// </summary>
			/// <param name="rowId" type="string"></param>
			/// <param name="columnIndex" type="int"></param>
		},

		gridDoubleClick: function TreeGridContainerPublic_gridDoubleClick(
			rowId,
			columnIndex
		) {
			/// <summary>
			/// Occurs when any item in grid is double clicked.
			/// </summary>
			/// <param name="rowId" type="string"></param>
			/// <param name="columnIndex" type="int"></param>
		},

		gridKeyPress: function TreeGridContainerPublic_gridKeyPress(key) {
			//TODO: should return object
			/// <summary>
			/// Occurs when a key is pressed.
			/// </summary>
			/// <param name="key" type="[Object, KeyboardEvent]"></param>
			/// <returns>object</returns>
			var keyCode = key.keyCode;
			if (13 === keyCode && focusUtil.curNode) {
				focusUtil.curNode.blur();
			}
		},

		gridRowSelect: function TreeGridContainerPublic_gridRowSelect(
			rowId,
			multi
		) {
			//TODO: parameter multi doesn't work
			/// <summary>
			/// Occurs before any row becomes selected.
			/// </summary>
			/// <param name="rowId" type="string"></param>
			/// <param name="multi" type="bool"></param>
		},

		gridSort: function TreeGridContainerPublic_gridSort(columnIndex, asc) {
			/// <summary>
			/// Occurs when column is sorted.
			/// </summary>
			/// <param name="columnIndex" type="int"></param>
			/// <param name="asc" type="bool"></param>
		},

		gridXmlLoaded: function TreeGridContainerPublic_gridXmlLoaded() {
			/// <summary>
			/// Occurs when XML content is loaded and parsed.
			/// </summary>
		},

		gridSelectCell: function TreeGridContainerPublic_gridSelectCell(cell) {
			/// <summary>
			/// Occurs when a cell is selected in UI.
			/// </summary>
			/// <param name="cell" type="Aras.Client.Controls.Public.Cell"></param>
		},

		// end events region

		addRow: function TreeGridContainerPublic_addRow(newID, text, action) {
			//TODO:
		},

		addXMLRows: function TreeGridContainerPublic_addXMLRows(
			xmlStringOrDoc,
			lazyOff
		) {
			//TODO: cannot validate, perhaps doesn't work
			/// <summary>
			/// Adds new rows loading information from xml document.
			/// </summary>
			/// <param name="xmlStringOrDoc" type="string">String or XMLDocument</param>
			var dom = getXmlDocument(xmlStringOrDoc),
				i;

			var listsNodes = dom.selectNodes('./table/list');
			for (i = 0; i < listsNodes.length; i = i + 1) {
				var listNode = listsNodes[i];
				var options = [],
					optionsLabels = [],
					listItemsNodes = listNode.selectNodes('listitem');
				for (var j = 0; j < listItemsNodes.length; j = j + 1) {
					var tempOption = listItemsNodes[j].getAttribute('value');
					var tempOptionsLabel = listItemsNodes[j].getAttribute('label');

					options.push(tempOption);
					optionsLabels.push(tempOptionsLabel);
				}
				privateProps[this.propsId_Experimental]._listsById[
					listNode.getAttribute('id')
				] = { labels: optionsLabels, values: options };
			}

			//TODO: perhaps need to move to exp. treeGrid to speed up performance, but then need to test all places where NOEDIT was (we'll change behavior of exp. grid so)
			var columnNodes = dom.selectNodes('./table/columns/column');
			var thNodes = dom.selectNodes('./table/thead/th');
			if (columnNodes.length === thNodes.length) {
				for (i = 0; i < columnNodes.length; i = i + 1) {
					if (columnNodes[i].getAttribute('edit') === 'NOEDIT') {
						var columnId =
							columnNodes[i].getAttribute('colname') || thNodes[i].text;
						var columnIndex = this.getColumnIndex(columnId);
						this.grid_Experimental.getCell(columnIndex).editable = false;
					}
				}
			}
			this.addXMLRows_Experimental(dom, lazyOff);
		},

		cellIsCheckbox: function TreeGridContainerPublic_cellIsCheckbox(
			rowId,
			columnIndex
		) {
			/// <summary>
			/// Returns true if this cell contains a checkbox.
			/// </summary>
			/// <param name="rowId" type="string"></param>
			/// <param name="columnIndex" type="int"></param>
			/// <returns>bool</returns>
			var cell = this.cells_Experimental(rowId, columnIndex, true);
			return cell.isCheckbox();
		},

		selectAll: function TreeGridContainerPublic_selectAll() {
			//TODO: Selects only root elements in .js, BUT all the elements in .NET
			/// <summary>
			/// Select all rows in grid.
			/// </summary>
			if (this.grid_Experimental.rowCount) {
				this.grid_Experimental.selection.selectRange(
					0,
					this.grid_Experimental.rowCount - 1
				);
			}
		},

		cells2: function TreeGridContainerPublic_cells2(rowIdInt, columnIndex) {
			/// <summary>
			/// Get cell object to manipulate directly with its properties.
			/// </summary>
			/// <param name="rowIdInt" type="int"></param>
			/// <param name="columnIndex" type="int"></param>
			/// <returns>Aras.Client.Controls.Public.Cell</returns>
			return this.cells(this.getRowId(rowIdInt), columnIndex);
		},

		cellWasChanged: function TreeGridContainerPublic_cellWasChanged(
			rowId,
			columnIndex
		) {
			/// <summary>
			/// Returns true if cell's value was changed by user during the last editing of this cell, false otherwise.
			/// </summary>
			/// <param name="rowId" type="string"></param>
			/// <param name="columnIndex" type="int"></param>
			/// <returns>bool</returns>
			var cell = this.cells_Experimental(rowId, columnIndex, true);
			return cell.wasChanged();
		},

		clear: function TreeGridContainerPublic_clear() {
			//TODO:
		},

		closeItem: function TreeGridContainerPublic_closeItem(id) {
			//TODO:
		},

		collapseAll: function TreeGridContainerPublic_collapseAll() {
			/// <summary>
			/// Collapses all the tree nodes.
			/// </summary>
			this.expandAll(false);
		},

		copyRowContent: function TreeGridContainerPublic_copyRowContent(
			fromID,
			toID
		) {
			//TODO
			//var r1 = this.grid_Experimental.store._getItemByIdentity(fromID);
			//var r2 = this.grid_Experimental.store._getItemByIdentity(toID);
			//if (!r1 || !r2) {
			//	return;
			//}
		},

		deleteColumn: function TreeGridContainerPublic_deleteColumn(index) {
			//TODO
		},

		deleteRow: function TreeGridContainerPublic_deleteRow(rowId) {
			/// <summary>
			/// Deletes a row with the specified id.
			/// </summary>
			/// <param name="rowId"></param>
			var index = this.getRowIndex(rowId);
			if (-1 < index) {
				var item = this.grid_Experimental.getItem(index);
				this.grid_Experimental.store.deleteItem(item);
			}
		},

		deleteSelectedItem: function TreeGridContainerPublic_deleteSelectedItem() {
			//TODO: "issue focus" - for multiple selection - .js delete all selected, but .net delete only focused.
			/// <summary>
			/// Deletes the selected row.
			/// </summary>
			var ids = this.getSelectedItemIDs_Experimental('|').split('|');
			for (var i = 0; i < ids.length; i++) {
				this.deleteRow(ids[i]);
			}
		},

		deselect: function TreeGridContainerPublic_deselect() {
			/// <summary>
			/// Deselect all selected rows.
			/// </summary>
			this.selection_Experimental.clear();
		},

		disableSortingByColumn: function TreeGridContainerPublic_disableSortingByColumn() {
			//TODO:
			this.columns_Experimental = -1;
		},

		disable: function TreeGridContainerPublic_disable() {
			//TODO: need to validate. It seems that doesn't work in both .NET and .js.
			this.grid_Experimental.domNode.style.zIndex = -1;
		},

		editCell: function TreeGridContainerPublic_editCell(rowId, columnIndex) {
			/// <summary>
			/// Move focus to this cell and switch it to the editable mode.
			/// </summary>
			/// <param name="rowId" type="string"></param>
			/// <param name="columnIndex" type="int"></param>
			this.edit_Experimental.set(rowId, columnIndex);
		},

		editCellX: function TreeGridContainerPublic_editCellX(cell) {
			//TODO:
		},

		enable: function TreeGridContainerPublic_enable() {
			/// <summary>
			/// Enables grid
			/// </summary>
			this.grid_Experimental.domNode.style.zIndex = '';
		},

		enablePopup: function TreeGridContainerPublic_enablePopup(val) {
			//TODO
			//this.contexMenu = val ? new ContextMenu(this.grid_Experimental.domNode) : null;
		},

		expandAll: function TreeGridContainerPublic_expandAll(bool) {
			/// <summary>
			/// Expands all the tree nodes.
			/// </summary>
			this.grid_Experimental[false !== bool ? 'expandAll' : 'collapseAll']();
		},

		findRowByLabel: function TreeGridContainerPublic_findRowByLabel(label) {
			//TODO: see "issue colname" and investigate .NET code - perhaps we needn't this functional
		},

		getAction: function TreeGridContainerPublic_getAction(id) {
			//TODO
		},

		getAllItemIds: function TreeGridContainerPublic_getAllItemIds(separator) {
			/// <summary>
			/// Returns a list of all rows ids separated by the specified separator.
			/// </summary>
			/// <param name="separator" type="string"></param>
			/// <returns>string</returns>
			var arr = this.items_Experimental.getAllId();
			return arr.join(separator || '');
		},

		getCellHeight: function TreeGridContainerPublic_getCellHeight(id, col) {
			//TODO:
			//var cell = this.cells_Experimental(id, col, true);
			//if (!cell) {
			//	return "";
			//}
			//return cell.cellNod.clientHeight;
		},

		getCellValue: function TreeGridContainerPublic_getCellValue(
			rowId,
			columnIndex
		) {
			/// <summary>
			/// A shortcut to get this cell value.
			/// </summary>
			/// <param name="rowId" type="string"></param>
			/// <param name="columnIndex" type="int"></param>
			/// <returns></returns>
			return this.cells_Experimental(rowId, columnIndex, true).getValue();
		},

		getCellValue_Experimental: function TreeGridContainerPublic_getCellValue(
			rowId,
			columnName
		) {
			//getCellValue returns "" instead of real value in onStartEdit_Experimental event. It's a workaround to fix.
			var itemValueArray = this._store._itemsByIdentity[rowId][columnName];
			return itemValueArray && itemValueArray.length && itemValueArray[0];
		},

		getCellX: function TreeGridContainerPublic_getCellX(id, col) {
			//TODO:
			//var cell = this.cells_Experimental(id, col, true);
			//if (!cell) {
			//	return "";
			//}
			//var bounds = cell.getBounds();
			//return bounds.x;
		},

		getCellXY: function TreeGridContainerPublic_getCellXY(id, col) {
			//TODO:
			//var cell = this.cells_Experimental(id, col, true);
			//if (!cell) {
			//    return "";
			//}
			//var bound = cell.getBounds();
			//return bound.x + "," + bound.y;
		},

		getCellY: function TreeGridContainerPublic_getCellY(id, col) {
			//TODO:
			//var cell = this.cells_Experimental(id, col, true);
			//if (!cell) {
			//    return "";
			//}
			//var bound = cell.getBounds();
			//return bound.y;
		},

		getCheckedItemIds: function TreeGridContainerPublic_getCheckedItemIds(
			separator,
			parent,
			all
		) {
			//TODO
		},

		getChildId: function TreeGridContainerPublic_getChildId(_id) {
			//TODO
		},

		getChildItemsCount: function TreeGridContainerPublic_getChildItemsCount(
			id
		) {
			//TODO
		},

		getChildItemsId: function TreeGridContainerPublic_getChildItemsId(
			rowId,
			all,
			separator
		) {
			/// <summary>
			/// Gets divided by separator string containing ID's of children rows for row with specified ID
			/// </summary>
			/// <param name="rowId" type="string"></param>
			/// <param name="all" type="bool">If true, all children id's will be returned.</param>
			/// <param name="separator" type="string"></param>
			/// <returns></returns>
			var array = this.items_Experimental.get(rowId, 'children');
			if (all) {
				var children = array;
				while (children.length) {
					var res = [];
					for (var i = 0; i < children.length; i += 1) {
						res = res.concat(
							this.items_Experimental.get(children[i], 'children')
						);
					}
					array = array.concat(res);
					children = res;
				}
			}
			return array.join(separator);
		},

		getColumnAt: function TreeGridContainerPublic_getColumnAt(x) {
			//TODO
		},

		getColumnCount: function TreeGridContainerPublic_getColumnCount() {
			/// <summary>
			/// Get column count.
			/// </summary>
			/// <returns>int</returns>
			return this.grid_Experimental.layout.cellCount;
		},

		getColumnOrder: function TreeGridContainerPublic_getColumnOrder(
			columnIndex
		) {
			/// <summary>
			/// Get this column order.
			/// </summary>
			/// <param name="columnIndex" type="int"></param>
			/// <returns>int</returns>
			return columnIndex > this.GetColumnCount()
				? -1
				: this.grid_Experimental.order[columnIndex];
		},

		getColWidth: function TreeGridContainerPublic_getColWidth(col) {
			//TODO
		},

		getColWidths: function TreeGridContainerPublic_getColWidths() {
			/// <summary>
			/// Gets all columns widths divided by ;
			/// </summary>
			/// <returns>string</returns>
			var length = [];
			for (var i = 0; i < this.grid_Experimental.layout.cells.length; i++) {
				var cell = this.grid_Experimental.layout.cells[i];
				length.push(cell.unitWidth || cell.width);
			}
			var res = length.join(';');
			return res.replace(/px/gi, '');
		},

		getCombo: function TreeGridContainerPublic_getCombo() {
			//TODO
		},

		getCurRow: function TreeGridContainerPublic_getCurRow() {
			//TODO: "issue focus" if selected two rows then it returns the first selected in .js, but it returns focused in .NET
			/// <summary>
			/// Get row number for currently selected row.
			/// </summary>
			/// <returns>int</returns>
			var res = -1,
				selectedId = this.getSelectedId();
			if (selectedId) {
				res = this.getRowIndex(selectedId);
			}
			return res;
		},

		getHeader: function TreeGridContainerPublic_getHeader() {
			/// <summary>
			/// Not implemented now.
			/// </summary>
			/// <returns>string</returns>
			return '';
		},

		getHeaderCol: function TreeGridContainerPublic_getHeaderCol(i) {
			//TODO: see "issue order"
			/// <summary>
			/// Returns column header label.
			/// </summary>
			/// <param name="i" type="int"></param>
			/// <returns>string</returns>
			if (i < this.getColumnCount() && i >= 0) {
				return this.grid_Experimental.layout.cells[i].name;
			}
		},

		getHeaderIndex: function TreeGridContainerPublic_getHeaderIndex(label) {
			//TODO: see "issue order"
			/// <summary>
			/// For Automation. Gets header index. Returns -1 if no such header
			/// </summary>
			/// <param name="label" type="string"></param>
			/// <returns>int</returns>
			var headers = this.grid_Experimental.layout.cells;
			if (label) {
				for (var i = 0; i < headers.length; i++) {
					if (headers[i].name === label) {
						return i;
					}
				}
			}
			return -1;
		},

		getHorAligns: function TreeGridContainerPublic_getHorAligns() {
			//TODO:
		},

		getMenu: function TreeGridContainerPublic_getMenu() {
			//TODO: important, need to realize menuPublic.js?
			/// <summary>
			/// Gets pointer to grid context menu.
			/// </summary>
			/// <returns></returns>
			return this.contexMenu_Experimental;
		},

		getOpenedItems: function TreeGridContainerPublic_getOpenedItems(separator) {
			//works different ways
			/// <summary>
			/// Returns the list of currently opened(expanded) items' IDs, delimited with this separator.
			/// </summary>
			/// <param name="separator" type="string"></param>
			/// <returns>string</returns>
			return this.getOpenedItems_Experimental(separator);
		},

		getParentId: function TreeGridContainerPublic_getParentId(rowId) {
			/// <summary>
			/// Get the ID of the parent row for this row; null if no parent.
			/// </summary>
			/// <param name="rowId" type="string"></param>
			/// <returns>string</returns>
			return this.items_Experimental.get(rowId, 'value', 'parent');
		},

		getRowAt: function TreeGridContainerPublic_getRowAt(y) {
			//TODO
		},

		getRowCount: function TreeGridContainerPublic_getRowCount() {
			/// <summary>
			/// Gets the number of rows actually contained in the table.
			/// </summary>
			/// <returns>int</returns>
			return this.grid_Experimental.get('rowCount');
		},

		getRowId: function TreeGridContainerPublic_getRowId(rowIndex) {
			/// <summary>
			/// Get row ID by row index (zero based, from "top" to "bottom").
			/// </summary>
			/// <param name="rowIndex" type="int"></param>
			/// <returns>string</returns>
			var item = this.grid_Experimental.getItem(rowIndex);
			return (item && item.uniqueId && item.uniqueId[0]) || '';
		},

		getRowIndex: function TreeGridContainerPublic_getRowIndex(rowId) {
			/// <summary>
			/// Returns sequential index of this row.
			/// </summary>
			/// <param name="rowId" type="string"></param>
			/// <returns></returns>
			var item = this.grid_Experimental.store._getItemByIdentity(rowId);
			return item ? this.grid_Experimental.getItemIndex(item) : -1;
		},

		getRowsNum: function TreeGridContainerPublic_getRowsNum() {
			/// <summary>
			/// Returns the total number of rows in the table.
			/// </summary>
			/// <returns>int</returns>
			return this.getRowCount();
		},

		getSelectedCell: function TreeGridContainerPublic_getSelectedCell() {
			//TODO: "issue order"
			/// <summary>
			/// Returns selected cell
			/// </summary>
			/// <returns>Aras.Client.Controls.Public.Cell</returns>
			var focusManager = this.grid_Experimental.focus;
			return this.cells2(focusManager.rowIndex, focusManager.cell.index);
		},

		getSelectedID: function TreeGridContainerPublic_getSelectedID() {
			//TODO: "issue focus" when several rows are selected .js get the first selected, but .net get focused.
			/// <summary>
			/// Returns the id of the selected row.
			/// </summary>
			/// <returns>string</returns>
			var selectedItems = this.grid_Experimental.selection.getSelected();
			if (0 === selectedItems.length || !selectedItems[0]) {
				return '';
			}
			return selectedItems[0].uniqueId[0];
		},

		getSelectedItemIDs: function TreeGridContainerPublic_getSelectedItemIDs(
			separator
		) {
			//TODO: order of row Ids in .js and .NET can be different in the results
			/// <summary>
			/// Returns a list of selected rows' ids separated by specified separator.
			/// </summary>
			/// <param name="separator" type="string"></param>
			/// <returns>string</returns>
			var result = this.getSelectedItemIDs_Experimental(separator);
			if (!separator) {
				result = result.join('');
			}
			return result;
		},

		getUserControlInfo: function TreeGridContainerPublic_getUserControlInfo() {
			//TODO
		},

		getUserData: function TreeGridContainerPublic_getUserData(
			rowId,
			keyOptional
		) {
			/// <summary>
			/// Get extra row data stored by USERDATAn parameter for this row (or by SetUserData method).
			/// </summary>
			/// <param name="rowId" type="string"></param>
			/// <param name="keyOptional" type="object">Optional</param>
			/// <returns>string</returns>
			return GridModules.getUserData_Gm(
				this.grid_Experimental.store,
				rowId,
				keyOptional
			);
		},

		getUserDataX: function TreeGridContainerPublic_getUserDataX(id, key) {
			//see setUserDataX
			//TODO
		},

		getVisibleItemIDs: function TreeGridContainerPublic_getVisibleItemIDs(
			separator
		) {
			/// <summary>
			/// Returns a list of all currently visible rows ids separated by specified separator.
			/// </summary>
			/// <param name="separator" type="string"></param>
			/// <returns>string</returns>
			var arr = [],
				gr = this.grid_Experimental;
			for (var i = 0; i < this.getRowCount(); i++) {
				arr.push(gr.store.getIdentity(gr.getItem(i)));
			}
			return arr.join(separator);
		},

		getXml: function TreeGridContainerPublic_getXml(useValues, withSubRows) {
			//TODO: didn't validate every tag. useValues, withSubRows don't work
			/// <summary>
			/// Gets XML representation of the grid.
			/// </summary>
			/// <param name="useValues" type="bool">Boolean flag to use the cells values or labels. True is default.</param>
			/// <param name="withSubRows" type="bool"></param>
			/// <returns>string</returns>
			return GridModules.getXML(this, useValues, withSubRows);
		},

		initXML: function TreeGridContainerPublic_initXML(gridXml, lazyOff) {
			/// <summary>
			/// Load this XML string/url into the grid.
			/// </summary>
			/// <param name="gridXml" type="string"></param>
			var gridXmlDocument = getXmlDocument(gridXml);

			if (this.InitXML_Experimental(gridXmlDocument, true)) {
				var cells = this.grid_Experimental.layout.cells;
				for (var i = 0; i < cells.length; i++) {
					cells[i].layoutIndex =
						privateProps[this.propsId_Experimental]._layout[i].layoutIndex;
				}

				this.addXMLRows(gridXmlDocument, lazyOff);
			}
		},

		initXMLRows: function TreeGridContainerPublic_initXMLRows(doc) {
			/// <summary>
			/// Initialize rows from xml document.
			/// </summary>
			/// <param name="doc" type="string"></param>
			//TODO: validate, fix if need
			this.InitXMLRows_Experimental(doc);
		},

		insertRowAt: function TreeGridContainerPublic_insertRowAt(
			index,
			newID,
			text,
			action
		) {
			//TODO
		},

		insertNewChild: function TreeGridContainerPublic_insertNewChild(
			parentId,
			newItemId,
			cellsValues,
			action,
			collapsedIcon,
			expandedIcon
		) {
			//TODO: action doesn't work
			/// <summary>
			/// Inserts a new row as a child row for the specified parent row (parentId).
			/// </summary>
			/// <param name="parentId" type="string"></param>
			/// <param name="newItemId" type="string"></param>
			/// <param name="cellsValues" type="string"></param>
			/// <param name="action" type="string"></param>
			/// <param name="collapsedIcon" type="string">Optional. Path of Icon for Collapsed state relatively "cbin" folder</param>
			/// <param name="expandedIcon" type="string">Optional. Path of Icon for Expanded state relatively "cbin" folder. If it isn't specified and collapsedIcon is specified collapsedIcon will be used as it.</param>
			var rowJsonObj = {
				id: newItemId,
				icon: collapsedIcon,
				expandedIcon: expandedIcon,
				fields: Array.isArray(cellsValues)
					? cellsValues
					: cellsValues.split(this.delimeter)
			};
			var treeGrid = this.grid_Experimental;
			var parentItem = parentId
				? treeGrid.store._itemsByIdentity[parentId]
				: null;
			var treePath = parentItem
				? parentItem.treePath.join('/') + '/' + parentItem.children.length
				: treeGrid.store._arrayOfTopLevelItems.length.toString();
			var rowItem = this._getRowItemFromJson_Experimental(
				rowJsonObj,
				parentId,
				treePath
			);

			treeGrid.onNewUpdateEnabled = false;
			this.items_Experimental.add(rowItem, parentId);
			treeGrid.onNewUpdateEnabled = true;
		},

		insertRoot: function TreeGridContainerPublic_insertRoot(
			newId,
			cellsValues,
			action,
			collapsedIcon,
			expandedIcon
		) {
			//TODO: action doesn't work
			/// <summary>
			/// Inserts a new row at the root level.
			/// </summary>
			/// <param name="newId" type="string"></param>
			/// <param name="text" type="string"></param>
			/// <param name="cellsValues" type="string"></param>
			/// <param name="collapsedIcon" type="string">Optional. Path of Icon for Collapsed state relatively "cbin" folder</param>
			/// <param name="expandedIcon" type="string">Optional. Path of Icon for Expanded state relatively "cbin" folder. If it isn't specified and collapsedIcon is specified collapsedIcon will be used as it.</param>
			if (!this.grid_Experimental.store || !this._store) {
				this.grid_Experimental.styleGrid = {};
				var store = new ItemFileWriteStore({
					data: { identifier: 'uniqueId', items: [] }
				});
				this.grid_Experimental.setStore(store);
				this._store = this.grid_Experimental.store;
				var model = new ForestStoreModel({
					store: this._store,
					childrenAttrs: ['children'],
					deferItemLoadingUntilExpand: true,
					treeGrid: this
				});
				this.grid_Experimental.setModel(model);
			}
			this.insertNewChild(
				null,
				newId,
				cellsValues,
				action,
				collapsedIcon,
				expandedIcon
			);
		},

		loadBaselineXml: function TreeGridContainerPublic_loadBaselineXml(init) {
			//TODO: there are no such method in tree grid, but we can create as in grid
		},

		addColumnToDiffView: function TreeGridContainerPublic_addColumnToDiffView(
			name
		) {
			//TODO
		},

		addAllColumnsToDiffView: function TreeGridContainerPublic_addAllColumnsToDiffView() {
			//TODO
		},

		removeColumnFromDiffView: function TreeGridContainerPublic_removeColumnFromDiffView(
			name
		) {
			//TODO
		},

		removeAllColumnsFromDiffView: function TreeGridContainerPublic_removeAllColumnsFromDiffView() {
			//TODO
		},

		isColumnVisible: function TreeGridContainerPublic_isColumnVisible(
			columnIndex
		) {
			/// <summary>
			/// Gets value that indicates whether the column is visible or hidden.
			/// </summary>
			/// <param name="columnIndex" type="int"></param>
			return !this.grid_Experimental.layout.cells[columnIndex].hidden;
		},

		isEditable: function TreeGridContainerPublic_isEditable() {
			/// <summary>
			/// Returns true if cell editing is enabled.
			/// </summary>
			/// <returns>bool</returns>
			return privateProps[this.propsId_Experimental].Editable;
		},

		isInputRowVisible: function TreeGridContainerPublic_isInputRowVisible() {
			//cannot validate, showinputrow doesn't work
			/// <summary>
			/// Returns true when input row is visible
			/// </summary>
			/// <returns>bool</returns>
			return this.grid_Experimental.visibleSearchBar;
		},

		isItemExists: function TreeGridContainerPublic_isItemExists(id) {
			//TODO
		},

		isMultiselect: function TreeGridContainerPublic_isMultiselect() {
			/// <summary>
			/// Returns true if multiselect is enabled.
			/// </summary>
			/// <returns>bool</returns>
			return this.grid_Experimental.get('selectionMode') === 'extended';
		},

		loadCheckboxIcons: function TreeGridContainerPublic_loadCheckboxIcons(
			image0,
			image1
		) {
			//TODO
		},

		loadSortIcons: function TreeGridContainerPublic_loadSortIcons(
			image0,
			image1
		) {
			//TODO
		},

		menu: function TreeGridContainerPublic_menu() {
			/// <summary>
			/// Get popup menu object to manipulate directly with its properties.
			/// </summary>
			/// <returns></returns>
			return this.getMenu();
		},

		menuAdd: function TreeGridContainerPublic_menuAdd(text, image) {
			//TODO: parameter image is not implemented
			//doesn't work in .net, so in .net need to see deeper to compare, but works in the code below
			//we use text as id of menu, but in .Net it's auto-increment number.
			/// <summary>
			/// Adds a ToolStripItem that displays the specified image and text to the collection.
			/// </summary>
			/// <param name="text" type="string"></param>
			/// <param name="image" type="string"></param>
			var menu = this.menu();
			if (menu) {
				menu.add(text, text);
			}
		},

		menuAddSeparator: function TreeGridContainerPublic_menuAddSeparator() {
			/// <summary>
			/// Adds a menu separator. Now adds separator like "-".
			/// </summary>
			var menu = this.menu();
			if (menu) {
				menu.addSeparator();
			}
		},

		menuRemoveAll: function TreeGridContainerPublic_menuRemoveAll() {
			/// <summary>
			/// Removes all MenuItem objects from the menu item collection.
			/// </summary>
			var menu = this.menu();
			if (menu) {
				menu.removeAll();
			}
		},

		menuSetEnabled: function TreeGridContainerPublic_menuSetEnabled(
			text,
			flag
		) {
			//we use text as id of menu, but in .Net it's auto-increment number. So .js has text as first parameter, but .Net has pos (int type)
			/// <summary>
			///  Gets or sets a value indicating whether the menu item is enabled.
			/// </summary>
			/// <param name="text" type="string"></param>
			/// <param name="flag" type="bool"></param>
			var menu = this.menu();
			if (menu) {
				var it = menu.collectionMenu[text];
				if (it) {
					it.setEnabled(flag);
				}
			}
		},

		moveRowDown: function TreeGridContainerPublic_moveRowDown(id) {
			//TODO
		},

		moveRowUp: function TreeGridContainerPublic_moveRowUp(id) {
			//TODO
		},

		openItem: function TreeGridContainerPublic_openItem(rowId) {
			/// <summary>
			/// Opens (expands) this item's children programmatically (same as if user double-clicks the
			/// item). If the item is already opened, nothing happens.
			/// </summary>
			/// <param name="rowId" type="string"></param>
			this.items_Experimental.set(rowId, 'open', true);
		},

		removeAllRows: function TreeGridContainerPublic_removeAllRows() {
			/// <summary>
			/// Remove all rows from grid.
			/// </summary>
			var updateWasDisabled = !this.grid_Experimental._updateEnabled;
			if (updateWasDisabled) {
				this.grid_Experimental.setPaintEnabled(true, true);
			}
			this.grid_Experimental.selection.clear();
			if (this.grid_Experimental.treeModel) {
				var store = new ItemFileWriteStore({
					data: { identifier: 'uniqueId', items: [] }
				});
				var model = new ForestStoreModel({
					store: store,
					childrenAttrs: ['children'],
					deferItemLoadingUntilExpand: true,
					treeGrid: this
				});
				this.grid_Experimental.setModel(model);
				this._store = null;
			}
			if (updateWasDisabled) {
				this.setPaintEnabled(false);
			}
		},

		requestFocus: function TreeGridContainerPublic_requestFocus() {
			/// <summary>
			/// Sets input focus to the control.
			/// </summary>
			var self = this;
			setTimeout(function () {
				var focus = self.grid_Experimental.focus;
				var view = self.grid_Experimental.views.views[0];
				var cellNod = view.getCellNode(focus.rowIndex, focus.cell.index);
				cellNod.focus();
			}, 10);
		},

		scrollToColumn: function TreeGridContainerPublic_scrollToColumn(index) {
			//TODO
		},

		setAction: function TreeGridContainerPublic_setAction(id, action) {
			//TODO
		},

		setCellCombo: function TreeGridContainerPublic_setCellCombo(
			rowId,
			columnIndex,
			labels,
			values
		) {
			/// <summary>
			/// Set comboBox for specified cell.
			/// </summary>
			/// <param name="rowId" type="string"></param>
			/// <param name="columnIndex" type="int"></param>
			/// <param name="labels"></param>
			/// <param name="values"></param>
			var cell = this.cells_Experimental(rowId, columnIndex, true);
			cell.setCombo(labels, values);
		},

		setCellFont: function TreeGridContainerPublic_setCellFont(
			rowId,
			columnIndex,
			value
		) {
			//doesn't work.
			/// <summary>
			/// Sets fort for specified cell.
			/// Value is in the following formats:
			/// Name-style-size, style:{bold,italic,bolditalic}
			/// [examples: Courier-bold-12]
			/// </summary>
			/// <param name="rowId" type="string"></param>
			/// <param name="columnIndex" type="int"></param>
			/// <param name="value" type="string"></param>
			var cell = this.cells_Experimental(rowId, columnIndex, true);
			cell.setFont(value);
		},

		setCellLink: function TreeGridContainerPublic_setCellLink(
			rowId,
			columnIndex,
			value
		) {
			/// <summary>
			/// Sets link for specified cell.
			/// </summary>
			/// <param name="rowId" type="string"></param>
			/// <param name="columnIndex" type="int"></param>
			/// <param name="value" type="string"></param>
			var cell = this.cells_Experimental(rowId, columnIndex, true);
			cell.setLink(value);
		},

		setCellTextColor: function TreeGridContainerPublic_setCellTextColor(
			rowId,
			columnIndex,
			value
		) {
			//doesn't work, the error the same as if setting font
			/// <summary>
			/// Sets text color in specified cell.
			/// </summary>
			/// <param name="rowId" type="string"></param>
			/// <param name="columnIndex" type="int"></param>
			/// <param name="value" type="string"></param>
			var cell = this.cells_Experimental(rowId, columnIndex, true);
			cell.setTextColor(value);
		},

		setRowBgColor: function TreeGridContainerPublic_setRowBgColor(
			rowId,
			bgColors
		) {
			//TODO: rename to experimental or add this.grid_Experimental._update(); at the end of the method to work in public API
			/// <summary>
			/// Sets row background color.
			/// </summary>
			/// <param name="rowId"></param>
			/// <param name="bgColors">bgColors are separated by Delimeter</param>
			var columnIndex, cell;
			bgColors = bgColors.split(this.delimeter);
			for (columnIndex = 0; columnIndex < bgColors.length; columnIndex++) {
				cell = this.cells_Experimental(rowId, columnIndex, true);
				cell.setBgColor_Experimental(bgColors[columnIndex]);
			}
		},

		setRowIcons: function TreeGridContainerPublic_setRowIcons(
			rowId,
			collapsedIcon,
			expandedIcon
		) {
			/// <summary>
			/// Sets the icons for the specified row, for Collapsed and Expanded state respectively. If expandedIcon isn't specified collapsedIcon will be used as it.
			/// </summary>
			/// <param name="rowId" type="string"></param>
			/// <param name="collapsedIcon" type="string">Required. Path of Icon for Collapsed state relatively "cbin" folder</param>
			/// <param name="expandedIcon" type="string">Optional. Path of Icon for Expanded state relatively "cbin" folder. If it isn't specified collapsedIcon will be used as it.</param>
			this.items_Experimental.set(rowId, 'value', 'icon', collapsedIcon);
			this.items_Experimental.set(rowId, 'value', 'expandedIcon', expandedIcon);
		},

		setCellValue: function TreeGridContainerPublic_setCellValue(
			rowId,
			columnIndex,
			value
		) {
			/// <summary>
			/// A shortcut to set this cell value.
			/// </summary>
			/// <param name="rowId" type="string"></param>
			/// <param name="columnIndex" type="int"></param>
			/// <param name="value" type="string"></param>
			var cell = this.cells_Experimental(rowId, columnIndex, true);
			cell.setValue(value);
		},

		setColumnCount: function TreeGridContainerPublic_setColumnCount(val) {
			//TODO
		},

		getColumnIndex: function TreeGridContainerPublic_getColumnIndex(
			columnName
		) {
			//"issue order"
			/// <summary>
			/// Gets column index by column name.
			/// </summary>
			/// <param name="columnName" type="string"></param>
			/// <returns>
			/// int. Column position in grid; otherwise -1 returned.
			/// </returns>
			return GridModules.GetColumnIndex(this, columnName);
		},

		getColumnName: function TreeGridContainerPublic_getColumnName(columnIndex) {
			/// <summary>
			/// Gets column name by column index.
			/// </summary>
			/// <param name="columnIndex" type="int"></param>
			/// <returns>string</returns>
			if (columnIndex < this.getColumnCount() && columnIndex >= 0) {
				return this.getColumnName_Experimental(columnIndex);
			}
			return '';
		},

		getLogicalColumnOrder: function TreeGridContainerPublic_getLogicalColumnOrder() {
			//TODO: "issue colname" it returns column name for .js when colname is not specified. But return undefined in .net.
			/// <summary>
			/// Gets all column names divided by ; and in order they are shown in grid.
			/// </summary>
			/// <returns>string</returns>
			var length = [];
			for (var i = 0; i < this.grid_Experimental.layout.cells.length; i++) {
				length.push(this.grid_Experimental.layout.cells[i].field);
			}
			return length.join(';');
		},

		setColumnOrder: function TreeGridContainerPublic_setColumnOrder(
			col,
			newPos
		) {
			//TODO
		},

		setColumnProperties: function TreeGridContainerPublic_setColumnProperties(
			s,
			index
		) {
			//TODO: checks only COMBO in string. If true then it sets Combo and listId = 0 always.
			/// <summary>
			/// A comma delimited list of name/value pairs to configures the column by setting its type and other properties.
			/// type={FIELD|COMBO|NOEDIT}, list={integer}, sortable={yes|no}, sorttype={string|numeric|date}, inputformat={format_string}, locale={locale_string}
			/// Property name is case sensitive.
			/// Type NOEDIT means this column's cells will be non-editable.
			/// Type FIELD means cells will be editable with input field as edit widget.
			/// Type COMBO means cells will be editable with combobox as edit widget.
			/// For type=COMBO also specify the LISTn property to Initialize combobox.
			/// For type=COMBO also specify the LISTn property to Initialize combobox.
			/// You also can Initialize combobox at runtime using ONEDITCELL event handler.
			/// There is also a possibility to insert checkbox in cell. See TEXTn parameter description.
			/// example 1: type=COMBO,list=1,sortable=no
			/// example 2: sorttype=date, inputformat={dd/MM/yy, hh:mm:ss},locale=enUS
			/// </summary>
			/// <param name="s" type="string"></param>
			/// <param name="columnIndex" type="int"></param>
			this.grid_Experimental.layout.cells[
				this.grid_Experimental.order[index]
			].editableType = type.indexOf('COMBO') > 0 ? 'COMBO:0' : 'FIELD';
		},

		setColumnVisible: function TreeGridContainerPublic_setColumnVisible(
			columnIndex,
			visible,
			columnWidth
		) {
			/// <summary>
			/// Sets column visible
			/// </summary>
			/// <param name="columnIndex" type="int"></param>
			/// <param name="visible" type="bool"></param>
			/// <param name="columnWidth" type="int"></param>
			if (visible) {
				this.grid_Experimental.layout.cells[columnIndex].unitWidth =
					columnWidth + 'px';
			} else {
				this.grid_Experimental.layout.cells[columnIndex].unitWidth = '0px';
			}
			this.grid_Experimental.layout.setColumnVisibility(columnIndex, visible);
		},

		setColWidth: function TreeGridContainerPublic_setColWidth(col, width) {
			//TODO
		},

		setComboList: function TreeGridContainerPublic_setComboList(s, i) {
			//TODO
		},

		setCursor: function TreeGridContainerPublic_setCursor(c) {
			//TODO
		},

		setEditable: function TreeGridContainerPublic_setEditable(bool) {
			/// <summary>
			/// Enable/Disable cell editing at runtime.
			/// </summary>
			/// <param name="bool" type="bool"></param>
			if (privateProps[this.propsId_Experimental].Editable != bool) {
				for (var i = 0; i < this.grid_Experimental.layout.cellCount; i++) {
					this.grid_Experimental.layout.cells[i].editable = bool;
				}
				privateProps[this.propsId_Experimental].Editable = bool;
			}
		},

		setHeader: function TreeGridContainerPublic_setHeader(value) {
			//TODO
		},

		setHeaderCol: function TreeGridContainerPublic_setHeaderCol(i, val) {
			//TODO
		},

		setHorAligns: function TreeGridContainerPublic_setHorAligns(value) {
			//TODO
		},

		setInitWidths: function TreeGridContainerPublic_setInitWidths(value) {
			//TODO
		},

		setInitWidthsP: function TreeGridContainerPublic_setInitWidthsP(
			widths_in_pixels
		) {
			//TODO
		},

		setMultiselect: function TreeGridContainerPublic_setMultiselect(value) {
			/// <summary>
			/// Enable/Disable multiselect at runtime.
			/// </summary>
			/// <param name="value" type="string"></param>
			this.selection_Experimental.set('multi', value);
		},

		setPaintEnabled: function TreeGridContainerPublic_setPaintEnabled(b) {
			//don't know how to validate, need to investigate
			/// <summary>
			/// Enable/disable grid redrawing at runtime.
			/// </summary>
			/// <param name="b" type="bool"></param>
			this.grid_Experimental.setPaintEnabled(b);
		},

		setRowTextBold: function TreeGridContainerPublic_setRowTextBold(b) {
			//TODO
		},

		setRowTextNormal: function TreeGridContainerPublic_setRowTextNormal(b) {
			//TODO
		},

		setSelectedRow: function TreeGridContainerPublic_setSelectedRow(
			rowId,
			multi,
			show
		) {
			//TODO: validate parameter show. All rest works.
			/// <summary>
			/// Set selected row at runtime. If multi == false new row becomes the only selected row. If
			/// multi == true new row becomes the selected and all previously selected rows stay selected
			/// also. You should use next trick to Deselect all rows:
			/// </summary>
			/// <param name="rowId" type="string"></param>
			/// <param name="multi" type="bool"></param>
			/// <param name="show" type="bool">Optional. Scrolls row to visible area if true.</param>
			var grid = this.grid_Experimental,
				index = this.getRowIndex(rowId);

			if (!multi) {
				grid.selection.clear();
			}

			if (-1 !== index) {
				grid.selection.setSelected(index, true);
				if (show) {
					grid.scrollToRow(index);
				}
			}
		},

		setUserData: function TreeGridContainerPublic_setUserData(
			rowId,
			keyOrValue,
			value
		) {
			/// <summary>
			/// To set row level data. You can use this method to store some extra data or flags.
			/// </summary>
			/// <param name="rowId" type="string"></param>
			/// <param name="keyOrValue" type="string">key is optional, so it can be specified value here</param>
			/// <param name="value" type="string">set if key is passed in keyOrValue, but not value</param>
			GridModules.setUserData_Gm(
				this.grid_Experimental.store,
				rowId,
				keyOrValue,
				value
			);
		},

		setUserDataX: function TreeGridContainerPublic_setUserDataX(
			id,
			key,
			userData
		) {
			//if see GetUserDataX it seem that we need two the same storages are different, e.g., to key we can add/remove "X".
			//TODO
		},

		showContent: function TreeGridContainerPublic_showContent() {
			//TODO
		},

		showInputRow: function TreeGridContainerPublic_showInputRow(bool) {
			/// <summary>
			/// Display input row it true; otherwise, input row will be hidden.
			/// </summary>
			/// <param name="bool" type="bool"></param>
			if (this.grid_Experimental.visibleSearchBar != bool) {
				this.grid_Experimental.visibleSearchBar = bool;
				this.grid_Experimental._update();
			}
		},

		showRow: function TreeGridContainerPublic_showRow(rowID) {
			//TODO
		},

		sort: function TreeGridContainerPublic_sort(columnIndex, asc) {
			/// <summary>
			/// Sort table by column in ascending or descending order.
			/// </summary>
			/// <param name="columnIndex" type="int"></param>
			/// <param name="asc" type="bool">true if ascending, false if descending.</param>
			this.grid_Experimental.setSortIndex(columnIndex, asc);
		},

		sortEx: function TreeGridContainerPublic_sortEx(col, asc) {
			//TODO
		},

		stretchColumnWidths: function TreeGridContainerPublic_stretchColumnWidths() {
			//TODO
		},

		turnEditOff: function TreeGridContainerPublic_turnEditOff() {
			/// <summary>
			/// Direction to lost focus from grid cell.
			/// </summary>
			var editManager = this.grid_Experimental.edit;
			if (editManager.isEditing()) {
				if (editManager._isValidInput()) {
					editManager.apply();
				} else {
					editManager.cancel();
				}
			}
		},

		setUserDragData: function TreeGridContainerPublic_setUserDragData(
			dragData
		) {
			//TODO
		},

		cells: function TreeGridContainerPublic_cells(rowId, columnIndex) {
			return this.cells_Experimental(rowId, columnIndex, false);
		},

		cells_Experimental: function TreeGridContainerPublic_cells_Experimental(
			rowId,
			columnIndex,
			skipMethodNamingConventionForPerformance
		) {
			/// <summary>
			/// Get cell object to manipulate directly with its properties. Special row ids: "header_row", "input_row".
			/// </summary>
			/// <param name="rowId" type="string"></param>
			/// <param name="columnIndex" type="int"></param>
			/// <returns>Aras.Client.Controls.Public.Cell</returns>
			var cell = null,
				thatGrid = this.grid_Experimental;
			if ('input_row' === rowId) {
				var sBarCellFunc = function () {
					var sBar = thatGrid.inputRowNode;
					return sBar.childNodes[columnIndex].childNodes[0];
				};
				cell = new Cell(
					this.grid_Experimental,
					sBarCellFunc,
					null,
					columnIndex,
					this,
					skipMethodNamingConventionForPerformance
				);
				cell.isInputRow_Experimental = true;
			} else {
				if (this.grid_Experimental.store !== this._store) {
					this.grid_Experimental.store = this._store;
				}
				lazyDataLoader.fillRowWithDataByItemId(rowId);
				var item = this.grid_Experimental.store._getItemByIdentity(rowId);
				if (item) {
					var column = this.grid_Experimental.order[columnIndex];
					var cellNodFunc = function () {
						var view = thatGrid.views.views[0];
						var res = view.getCellNode(thatGrid.getItemIndex(item), column);
						return res;
					};
					cell = new Cell(
						this.grid_Experimental,
						cellNodFunc,
						item,
						column,
						this,
						skipMethodNamingConventionForPerformance
					);

					var columnSortVal =
						privateProps[this.propsId_Experimental]._layout[column].sort;
					if ('DATE' === columnSortVal) {
						cell.sortDate_Experimental = true;
					} else if ('NUMERIC' === columnSortVal) {
						cell.sortNumber_Experimental = true;
					}
				}
			}
			return cell;
		},

		//experimenatal events region

		addOnScrollListener_Experimental: function (listener) {
			var grid = this.grid_Experimental;
			if (grid.scroller) {
				dojo.connect(grid.scroller, 'scroll', listener);
			} else {
				dojo.connect(grid, 'createScroller', function () {
					dojo.connect(grid.scroller, 'scroll', listener);
				});
			}
		},

		onToggleRow_Experimental: function (itemId, state) {
			//Event fired after row is expanded or collapsed
		},

		onGetChildren_Experimental: function (rowId) {
			//Event fired when request children
		},

		onStartEdit_Experimental: function (rowId, column) {
			//Event fired when editing is started for a given grid rowID
		},

		onApplyEdit_Experimental: function (rowId, column, value) {
			//Event fired when editing is finish for a given grid rowID and value
		},

		onDragStart_Experimental: function () {
			//Event fired when row dragging is started
		},

		onDragDrop_Experimental: function (targetRowId, isCtrlPressed) {
			//Event fired when row dragging is finished
			//if targetRowId is "", then drop before first element
		},

		canDragDrop_Experimental: function () {},

		canEdit_Experimental: function (rowId, column) {
			//Event fired when check edit cell;
			return this.grid_Experimental._canEdit;
		},

		onStartSearch_Experimental: function (rowId, column) {
			//Event fired when click arrow inputHelper in edit mode cell;
		},

		onInputHelperShow_Experimental: function (rowId, column) {
			//Event fired when click arrow inputHelper in edit mode cell;
		},

		validateCell_Experimental: function (rowId, column, value) {
			//Event fired when start and finish edit cell;
			return true;
		},

		eventInputRow_Experimental: function (mode, rowID, col) {
			//event run when focus, blur and press key on input row
		},

		//end event experimenatal region

		//experimental methods
		getColumnIndex_Experimental: function (column) {
			return privateProps[this.propsId_Experimental]._layout[column]
				.layoutIndex;
		},

		setLayout_Experimental: (function () {
			var standartFormatter = function (value, index) {
				if (
					this.optionsLables &&
					this.optionsLables.length &&
					dojo.indexOf(this.options, value) > -1
				) {
					return this.optionsLables[this.options.indexOf(value)];
				} else if ('boolean' == typeof value) {
					return new dijit.form.CheckBox({
						checked: value,
						onClick: function () {
							return false;
						}
					});
				}
				return value;
			};

			return function (columnDescriptors) {
				if (this.grid_Experimental.edit.isEditing()) {
					this.grid_Experimental.edit.cancel();
				}
				var nameColumns = new Array(columnDescriptors.length);
				var order = new Array(columnDescriptors.length);
				for (var i = 0; i < columnDescriptors.length; i++) {
					var columnDescriptor = columnDescriptors[i];
					order[i] = i;
					nameColumns[i] = columnDescriptor.field;
					if (!columnDescriptor.formatter) {
						columnDescriptor.formatter = standartFormatter;
						columnDescriptor.cellType =
							Aras.Client.Controls.Experimental.TypeEditCell;
					}
				}
				this.grid_Experimental.selection.clear();
				this.grid_Experimental.order = order;
				this.grid_Experimental.nameColumns = nameColumns;
				this.grid_Experimental.set('structure', columnDescriptors);
				privateProps[this.propsId_Experimental]._layout = columnDescriptors;
			};
		})(),

		getOpenedItems_Experimental: function (delim) {
			var openedItems = [],
				openedExpandos = this.grid_Experimental.openedExpandos,
				itemId;
			for (itemId in openedExpandos) {
				if (openedExpandos[itemId]) {
					openedItems.push(itemId);
				}
			}
			return delim ? openedItems.join(delim) : openedItems;
		},

		items_Experimental: function (grid) {
			var setters = {
					value: function (item, field, value) {
						this.grid.store.setValue(item, field, value);
					},
					open: function (item, open) {
						var itemId = item.uniqueId[0];
						this.grid._fold(itemId, open !== false);
					}
				},
				getters = {
					value: function (item, field) {
						return this.grid.store.getValue(item, field);
					},
					children: function (item) {
						var children = item.children,
							childrenCount = children ? children.length : 0,
							childrenIds = [],
							i;
						for (i = 0; i < childrenCount; i++) {
							childrenIds[i] = children[i].uniqueId[0];
						}
						return childrenIds;
					},
					id: function (item) {
						return item.uniqueId[0];
					}
				};

			return {
				grid: grid,

				_addChildren: function (parentItemObj, parentItem) {
					var grid = this.grid,
						childrenObjs = parentItemObj.children,
						childrenCount = childrenObjs ? childrenObjs.length : 0,
						childObj,
						newItem,
						i;
					for (i = 0; i < childrenCount; i++) {
						childObj = childrenObjs[i];
						newItem = grid._newItem(childObj, parentItem, true);
						newItem.children = [];
						this._addChildren(childObj, newItem);
					}
				},

				isDirty: function (id) {
					var item = this.grid.store._getItemByIdentity(id);
					if (item > -1) {
						return this.grid.store.isDirty(item);
					}
				},

				add: function (itemObj, parentId) {
					var newItem, parentItem;
					if (this.grid.edit.isEditing()) {
						this.grid.edit.apply();
					}
					itemObj.parent = parentId;
					parentItem = this.grid.store._itemsByIdentity[parentId];
					if (parentItem) {
						newItem = this.grid._newItem(itemObj, parentItem, true);
					} else {
						newItem = this.grid._newRootItem(itemObj, true);
					}
					newItem.children = [];
					this._addChildren(itemObj, newItem);
				},

				remove: function (id) {
					var item = this.grid.store._getItemByIdentity(id);
					if (item) {
						this.grid.treeModel.store.deleteItem(item);
					}
				},

				getAllId: function () {
					var result = [],
						onComplete = function (items) {
							var i,
								length = items.length;
							for (i = 0; i < length; i += 1) {
								result.push(items[i].uniqueId[0]);
								if (items[i].children) {
									onComplete(items[i].children);
								}
							}
						};
					this.grid.store.fetch({ onComplete: onComplete });
					return result;
				},

				set: function (id, key, value) {
					var item = this.grid.store._getItemByIdentity(id),
						args;
					if (setters[key] && item) {
						args = Array.prototype.slice.call(arguments, 2);
						args.splice(0, 0, item);
						setters[key].apply(this, args);
					}
				},

				get: function (id, key, field) {
					var item = null;
					if ('id' === key) {
						item = this.grid.getItem(id);
					} else {
						item = this.grid.store._getItemByIdentity(id);
					}
					if (getters[key] && item) {
						return getters[key].call(this, item, field);
					}
				}
			};
		},

		_foundChildren_Experimental: function (
			rowsNodes,
			parentId,
			parentTreePath,
			isParentExpanded,
			visibleRowsCount,
			lazyOff,
			totalChildCount
		) {
			var children = [],
				grid = this.grid_Experimental,
				expandosOpenStates = grid.openedExpandos,
				rowsCount = totalChildCount ? totalChildCount : rowsNodes.length,
				i,
				rowXmlNode,
				treePath,
				rowItem,
				rowChildNodes,
				isRowInvisible,
				isRowExpanded,
				isFakeRow;
			parentTreePath = parentTreePath ? parentTreePath + '/' : '';
			for (i = 0; i < rowsCount; i++) {
				rowXmlNode = rowsNodes[i];
				treePath = parentTreePath + i;
				isRowInvisible =
					(!isParentExpanded || visibleRowsCount >= grid.keepRows) && !lazyOff;
				isFakeRow =
					this.onDemandLoader_Experimental &&
					(!rowXmlNode ||
						this.onDemandLoader_Experimental.isFakeChild(rowXmlNode));
				if (isRowInvisible || isFakeRow) {
					if (!rowXmlNode) {
						rowXmlNode = {
							isFake: true,
							getAttribute: function () {}
						};
					}
					rowItem = this._getEmptyRowItemFromXml_Experimental(
						rowXmlNode,
						parentId,
						treePath
					);
					lazyDataLoader.deferItemDataLoading(rowItem.uniqueId, rowXmlNode);
				} else {
					rowItem = this._getRowItemFromXml_Experimental(
						rowXmlNode,
						parentId,
						treePath
					);
					visibleRowsCount++;
				}
				rowChildNodes =
					this.onDemandLoader_Experimental && isRowInvisible
						? {}
						: rowXmlNode.selectNodes('./tr');
				if (rowChildNodes.length) {
					isRowExpanded = isParentExpanded && rowItem.expanded;
					if (rowItem.expanded) {
						expandosOpenStates[rowItem.uniqueId] = true;
					} else {
						delete expandosOpenStates[rowItem.uniqueId];
					}
					rowItem.children = this._foundChildren_Experimental(
						rowChildNodes,
						rowItem.uniqueId,
						treePath,
						isRowExpanded,
						visibleRowsCount,
						lazyOff
					);
				}
				delete rowItem.expanded;
				children.push(rowItem);
			}
			return children;
		},

		addXMLRows_Experimental: function (xmlStringOrDoc, lazyOff) {
			var gridData,
				siblingTotalCount,
				isToLoadFromServer =
					!xmlStringOrDoc && this.onDemandLoader_Experimental;

			if (isToLoadFromServer) {
				gridData = this.onDemandLoader_Experimental.loadData(
					'',
					0,
					this.grid_Experimental.keepRows
				);
				if (!gridData) {
					return;
				}
				siblingTotalCount = gridData.siblingTotalCount;
			}

			var dom = !isToLoadFromServer
					? getXmlDocument(xmlStringOrDoc)
					: gridData.xmlDoc,
				tableRows,
				tableColumns,
				items,
				root,
				rootId,
				rootChildren,
				rootChildrenCount,
				itemsModule,
				item,
				i,
				def;

			var tableNode = dom.selectSingleNode('./table');
			var bgInvertAttr = tableNode.getAttribute('bgInvert');
			if (bgInvertAttr !== null) {
				this.bgInvert = bgInvertAttr && bgInvertAttr.toLowerCase() === 'true';
			}
			this.delimeter = tableNode.getAttribute('delim') || this.delimeter;

			tableRows = dom.selectNodes('./table/tr');

			if (tableRows.length) {
				this.grid_Experimental.styleGrid =
					this.grid_Experimental.styleGrid || {};
				tableColumns = dom.selectNodes('./table/columns/column');
				if (tableColumns) {
					this._modifyColumnsData_Experimental(tableColumns);
				}

				lazyDataLoader.clearXmlNodes();
				items = this._foundChildren_Experimental(
					tableRows,
					'',
					'',
					true,
					0,
					lazyOff,
					siblingTotalCount
				);
				if (this._store) {
					if (1 === items.length) {
						root = items[0];
						rootId = root.uniqueId;
						item = this._store._itemsByIdentity[rootId];
						if (item) {
							itemsModule = this.items_Experimental;
							rootChildren = root.children;
							rootChildrenCount = rootChildren.length;
							item.children = [];
							for (i = 0; i < rootChildrenCount; i++) {
								itemsModule.add(rootChildren[i], rootId);
							}
							def = this.grid_Experimental.treeModel.defenderChildren;
							if (def && def[rootId]) {
								def[rootId].callback(true);
							}
						}
					}
				} else {
					this._store = new ItemFileWriteStore({
						data: {
							identifier: 'uniqueId',
							items: items
						}
					});
					this.grid_Experimental.setModel(
						new ForestStoreModel({
							store: this._store,
							childrenAttrs: ['children'],
							deferItemLoadingUntilExpand: true,
							treeGrid: this
						})
					);
				}
			}

			//note: gridXmlLoaded is called too early. E.g., in time of calling you can see that getRowCount returns 1.
			//it's lazy tree grid now and the logic in [aspect.before(this.grid_Experimental, "updateRows", function (startIndex, howMany) {...] filles the tree
			//but how to find the last call of updateRows (or e.g., _onFetchComplete of dojo, overrides the function in our code) - the problem, I don't find a way.
			this.gridXmlLoaded(true);
		},

		removeSelectedRows_Experimental: function () {
			this.grid_Experimental.removeSelectedRows();
		},

		getColumnName_Experimental: function (columnIdx) {
			return this.grid_Experimental.nameColumns[
				this.grid_Experimental.order[columnIdx]
			];
		},

		getVisibleRowsIds_Experimental: function (resultAsDict) {
			var ids = resultAsDict ? {} : [],
				treeGrid = this.grid_Experimental,
				firstVisibleRowIndex = treeGrid.scroller.firstVisibleRow,
				lastVisibleRowIndex = treeGrid.scroller.lastVisibleRow,
				byIndex = treeGrid._by_idx,
				i,
				itemWrapper;
			for (i = firstVisibleRowIndex; i <= lastVisibleRowIndex; i++) {
				itemWrapper = byIndex[i];
				if (itemWrapper) {
					if (resultAsDict) {
						ids[itemWrapper.idty] = i + 1;
						ids.length = ids.length ? ids.length + 1 : (ids.length = 1);
					} else {
						ids[ids.length] = itemWrapper.idty;
					}
				}
			}
			return ids;
		},

		getRowByItemId_Experimental: function (id) {
			var rowIndex = this.getRowIndex(id);
			var length = this.grid_Experimental.views.views.length - 1;
			return this.grid_Experimental.views.views[length].rowNodes[rowIndex];
		},

		getElementOffsetTop_Experimental: function (element) {
			var key = 'top'; //to explicitly allow "top" usage
			return element.getBoundingClientRect()[key];
		},

		getTreeGridOffsetTop_Experimental: function () {
			var key = 'top'; //to explicitly allow "top" usage
			return this.grid_Experimental.viewsNode.getBoundingClientRect()[key];
		},

		getSelectedItemIDs_Experimental: function (delim) {
			var selectedItems = this.grid_Experimental.selection.getSelected();
			var result = [];
			dojo.forEach(
				selectedItems,
				function (item) {
					if (item) {
						result.push(item.uniqueId[0]);
					}
				},
				this
			);
			return result.join(delim);
		},

		InitXML_Experimental: function (xmlStringOrDoc, isCalledFromPublic) {
			this.grid_Experimental.order = [];
			var nameColumns = [];
			var dom = getXmlDocument(xmlStringOrDoc);
			var th = dom.selectNodes('./table/thead/th');
			var columns = dom.selectNodes('./table/columns/column');

			privateProps[this.propsId_Experimental].Editable =
				'true' === dom.selectSingleNode('./table').getAttribute('editable');

			var imageStyle =
				'margin-right: 4px; height: auto; width: auto; max-width: 20px; max-height: 20px;';
			var imgLables = [
				"<span style='padding: 0 22px;'>" +
					dojoConfig.arasContext.resources[
						'itemsgrid.locked_criteria_ppm.clear_criteria'
					] +
					'</span>',
				"<img src='" +
					config.baseUrl +
					"../../images/LockedByMe.svg' align='left' style='" +
					imageStyle +
					"' />" +
					dojoConfig.arasContext.resources[
						'itemsgrid.locked_criteria_ppm.locked_by_me'
					],
				"<img src='" +
					config.baseUrl +
					"../../images/LockedByOthers.svg' align='left' style='" +
					imageStyle +
					"' />" +
					dojoConfig.arasContext.resources[
						'itemsgrid.locked_criteria_ppm.locked_by_others'
					],
				"<img src='" +
					config.baseUrl +
					"../../images/LockedByAnyone.svg' align='left' style='" +
					imageStyle +
					"' />" +
					dojoConfig.arasContext.resources[
						'itemsgrid.locked_criteria_ppm.locked_by_anyone'
					]
			];

			var imgValues = [
				'',
				"<img src='" +
					config.baseUrl +
					"../../images/LockedByMe.svg' style='" +
					imageStyle +
					"' />",
				"<img src='" +
					config.baseUrl +
					"../../images/LockedByOthers.svg' style='" +
					imageStyle +
					"' />",
				"<img src='" +
					config.baseUrl +
					"../../images/LockedByAnyone.svg' style='" +
					imageStyle +
					"' />"
			];

			function getUniqueColName(colName) {
				var resName = colName,
					counter = 0;
				while (nameColumns.indexOf(resName) > -1) {
					resName = colName + '_' + counter++;
				}
				return resName;
			}

			function sortBySortOrder(i, ii) {
				if (Number(i.order) > Number(ii.order)) {
					return 1;
				} else if (Number(i.order) < Number(ii.order)) {
					return -1;
				} else {
					return 0;
				}
			}

			function getArrayOfColumnsObjects(columnNodes, thNodes, dom, cntxt) {
				var result = [];
				var comboReg = /COMBO:(\d*)/;
				var mvListReg = /MV_LIST:(\d*)/;
				for (var i = 0; i < columnNodes.length; i++) {
					var currentColumn = columnNodes[i];
					var ri = {
						field: getUniqueColName(
							currentColumn.getAttribute('colname') || thNodes[i].text
						),
						name: '' === thNodes[i].text ? ' ' : thNodes[i].text,
						styles: GridModules.getAlign_Gm(
							currentColumn.getAttribute('align')
						),
						headerStyles: GridModules.getAlign_Gm(
							thNodes[i].getAttribute('align')
						),
						cellType: Aras.Client.Controls.Experimental.TypeEditCell,
						editable: undefined,
						editableType: currentColumn.getAttribute('edit'),
						width: currentColumn.getAttribute('width'),
						inputFormat: currentColumn.getAttribute('inputformat')
							? currentColumn
									.getAttribute('inputformat')
									.replace(/tt/g, 'a')
									.replace(/dddd/g, 'EEEE')
							: undefined,
						order: parseInt(currentColumn.getAttribute('order'), 10),
						sort: currentColumn.getAttribute('sort'),
						locale: currentColumn.getAttribute('locale'),
						layoutIndex: i,
						options: [],
						optionsLables: [],
						formatter: Formatter
					};
					ri.width +=
						ri.width.indexOf('%') > -1 ||
						ri.width.indexOf('em') > -1 ||
						ri.width.indexOf('px') > -1
							? ''
							: 'px';
					ri.width = ri.width === 'px' ? undefined : ri.width;
					if (
						comboReg.test(ri.editableType) ||
						mvListReg.test(ri.editableType)
					) {
						var idList = comboReg.test(ri.editableType)
							? ri.editableType.match(comboReg)[1]
							: ri.editableType.match(mvListReg)[1];
						var list = dom.selectSingleNode('./table/list[@id=' + idList + ']');
						if (list) {
							ri.editableType = comboReg.test(ri.editableType)
								? 'FilterComboBox'
								: 'CheckedMultiSelect';
							var listItemsNodes = list.selectNodes('listitem');
							for (var j = 0; j < listItemsNodes.length; j++) {
								ri.options.push(listItemsNodes[j].getAttribute('value'));
								ri.optionsLables.push(
									listItemsNodes[j].getAttribute('label') ||
										listItemsNodes[j].getAttribute('value')
								);
							}
						}
					}
					if ('L' == ri.field) {
						ri.options = imgValues;
						ri.optionsLables = imgLables;
						ri.editableType = 'dropDownButton';
						ri.editable = false;
					} else {
						ri.editable = privateProps[cntxt.propsId_Experimental].Editable;
					}
					result[i] = ri;
				}
				result.sort(sortBySortOrder);
				return result;
			}

			if (this.grid_Experimental.edit.isEditing()) {
				this.grid_Experimental.edit.cancel();
			}

			if (th.length == columns.length) {
				privateProps[this.propsId_Experimental]._layout = [];
				var columnsObject = getArrayOfColumnsObjects(columns, th, dom, this);
				var i = 0;
				for (var indx in columnsObject) {
					var columnObj = columnsObject[indx];
					columnObj.order = i;
					privateProps[this.propsId_Experimental]._layout[i] = columnObj;
					nameColumns[i] = columnObj.field;
					this.grid_Experimental.order[columnObj.layoutIndex] = i;
					i++;
				}

				var inputrow = dom.selectSingleNode('./table/inputrow');
				if (inputrow) {
					this.grid_Experimental.visibleSearchBar =
						'false' == inputrow.getAttribute('visible') ? false : true;
					dom.selectSingleNode('./table').removeChild(inputrow);
				} else {
					this.grid_Experimental.visibleSearchBar = false;
				}

				this.removeAllRows();
				this.grid_Experimental.defaultOpen = false;
				this.grid_Experimental.expandoCell = this.grid_Experimental.order[0];
				this.grid_Experimental.nameColumns = nameColumns;
				this.grid_Experimental.set(
					'structure',
					privateProps[this.propsId_Experimental]._layout
				);
				this.grid_Experimental.focus.cell = null;

				if (isCalledFromPublic) {
					return true;
				}
				this.addXMLRows_Experimental(xmlStringOrDoc);

				var cells = this.grid_Experimental.layout.cells;
				for (i = 0; i < cells.length; i++) {
					cells[i].layoutIndex =
						privateProps[this.propsId_Experimental]._layout[i].layoutIndex;
				}
			}
		},

		InitXMLRows_Experimental: function (xmlStringOrDoc) {
			this.removeAllRows();
			this.addXMLRows_Experimental(xmlStringOrDoc);
		},

		_modifyColumnsData_Experimental: function (columns) {
			var columnsCount = columns ? columns.length : 0,
				value,
				i;
			for (i = 0; i < columnsCount; i++) {
				value = columns[i].getAttribute('bginvert');
				if (value !== null) {
					privateProps[this.propsId_Experimental]._layout[i].bginvert = value;
				}
			}
		},

		_getRowItemFromJson_Experimental: function (
			rowJsonObj,
			parentId,
			treePath
		) {
			var rowItemUniqueId =
					rowJsonObj.id || GridModules.uniqueIdGenerator.get(),
				rowItemStyles = {},
				rowItemAttrs = {},
				rowItem = {
					parent: parentId,
					uniqueId: rowItemUniqueId,
					icon: rowJsonObj.icon,
					expandedIcon: rowJsonObj.expandedIcon,
					style: [rowItemStyles],
					attrs: [rowItemAttrs],
					treePath: treePath.split('/'),
					userData$Gm: []
				},
				grid = this.grid_Experimental,
				layout = privateProps[this.propsId_Experimental]._layout,
				gridOrder = grid.order,
				gridLayoutCells = grid.layout.cells,
				fields = rowJsonObj.fields,
				rowUserData = rowJsonObj.userdata,
				layoutCell,
				fieldValue,
				sort,
				fieldName,
				bgInvert,
				propertyName,
				i;

			grid.styleGrid[rowItemUniqueId] = { styleRow: {} };

			if (rowUserData) {
				for (propertyName in rowUserData) {
					rowItem.userData$Gm[propertyName] = rowUserData[propertyName];
				}
			}

			for (i = 0; i < fields.length; i++) {
				fieldValue = fields[i];
				layoutCell = gridLayoutCells[gridOrder[i]];
				sort = layoutCell.sort && layoutCell.sort.toUpperCase();
				fieldName = layoutCell.field;

				rowItemStyles[fieldName] = {};
				rowItemAttrs[fieldName] = {};

				bgInvert = layout[i].bginvert;
				if (bgInvert) {
					rowItemAttrs[fieldName].bginvert = bgInvert;
				}

				switch (sort) {
					case 'NUMERIC':
						rowItem[fieldName] = fieldValue ? parseFloat(fieldValue) : '';
						break;
					case 'DATE':
						rowItem[fieldName] = fieldValue;
						break;
					default:
						if (/<checkbox.*>/.test(fieldValue)) {
							rowItem[fieldName] = /.*(state|value)=["'](1|true)["'].*/.test(
								fieldValue
							);
						} else {
							rowItem[fieldName] = fieldValue;
						}
						break;
				}
			}

			return rowItem;
		},

		_loadDeferredItemDataFromXml_Experimental: function (
			rowItemUniqueId,
			rowXmlNode
		) {
			var grid = this.grid_Experimental,
				layout = privateProps[this.propsId_Experimental]._layout,
				gridOrder = grid.order,
				gridLayoutCells = grid.layout.cells,
				rowItemGridStyles = (grid.styleGrid[rowItemUniqueId] = {
					styleRow: {}
				}),
				store = this._store,
				item = store._itemsByIdentity[rowItemUniqueId],
				rowItemStyles = [],
				rowItemAttrs = [],
				i,
				itemTd,
				itemTdHasAttrs,
				thisLayout,
				sort,
				itemTdText,
				field,
				bgColor,
				bgInvert,
				tableNode,
				link;

			grid.onSetUpdateEnabled = false;

			if (this.onDemandLoader_Experimental) {
				if (this.onDemandLoader_Experimental.isFakeChild(rowXmlNode)) {
					//visibleRowsCount can be wrong here. Perhaps we need to take lastvisible row like select node, but not the last visible row, because expand can be done higher than last last visible row. Need to fix and test with expand='true' attributes
					var visibleRowsCount =
						grid.scroller.lastVisibleRow - grid.scroller.firstVisibleRow;
					var onDemandDataResult = this.onDemandLoader_Experimental.loadData(
						item.parent[0],
						0,
						grid.keepRows - visibleRowsCount
					);
					if (!onDemandDataResult) {
						return;
					}
					var siblingsNodeOfFakeChild = onDemandDataResult.xmlDoc;
					var siblingsTableNode = siblingsNodeOfFakeChild.selectSingleNode(
						'./table'
					);
					var siblingRowNodesOfFakeChild = siblingsTableNode.selectNodes(
						'./tr'
					);
					var parentItem = store._itemsByIdentity[item.parent[0]];
					var siblingsOfFakeChild = this._foundChildren_Experimental(
						siblingRowNodesOfFakeChild,
						item.parent[0],
						parentItem.treePath[0],
						true,
						visibleRowsCount,
						false,
						onDemandDataResult.siblingTotalCount
					);
					store.deleteItem(item);
					for (i = 0; i < siblingsOfFakeChild.length; i++) {
						this.items_Experimental.add(siblingsOfFakeChild[i], item.parent[0]);
					}
					grid.onSetUpdateEnabled = true;
					return;
				}

				if (rowXmlNode.isFake) {
					var allChildsIdsArray;
					if (item.parent[0] !== '') {
						allChildsIdsArray = this.items_Experimental.get(
							item.parent[0],
							'children'
						);
					} else {
						//we should use getAllId and calculate manually because this.items_Experimental.get(item.parent[0], 'children') doesn't work if parent is root,
						allChildsIdsArray = [];
						var ids = this.items_Experimental.getAllId();
						for (i = 0; i < ids.length; i++) {
							if (store._itemsByIdentity[ids[i]].parent[0] === '') {
								allChildsIdsArray.push(
									store._itemsByIdentity[ids[i]].uniqueId[0]
								);
							}
						}
					}

					if (
						!privateProps[this.propsId_Experimental].itemDemandedChilds[
							item.parent[0]
						]
					) {
						privateProps[this.propsId_Experimental].itemDemandedChilds[
							item.parent[0]
						] = {};
					}
					var itemDemandedChildsForCurrentItem =
						privateProps[this.propsId_Experimental].itemDemandedChilds[
							item.parent[0]
						];

					var trIndexInParentScope;
					for (i = 0; i < allChildsIdsArray.length; i++) {
						if (allChildsIdsArray[i] === rowItemUniqueId) {
							trIndexInParentScope = i;
						}
					}
					rowXmlNode = itemDemandedChildsForCurrentItem[trIndexInParentScope];
					if (!rowXmlNode) {
						var firstRowIndexInScopeOfParent = trIndexInParentScope;
						var lastRowIndexInScopeOfParent =
							firstRowIndexInScopeOfParent + grid.rowsPerPage;
						if (allChildsIdsArray.length < lastRowIndexInScopeOfParent) {
							lastRowIndexInScopeOfParent = allChildsIdsArray.length;
						}

						var onDemandResult = this.onDemandLoader_Experimental.loadData(
							item.parent[0],
							trIndexInParentScope,
							lastRowIndexInScopeOfParent
						);
						if (!onDemandResult) {
							return;
						}
						var siblingsNodeOfLoadedItems = onDemandResult.xmlDoc;

						var siblingsRowNodesOfLoadedItems = siblingsNodeOfLoadedItems.selectNodes(
							'./table/tr'
						);
						rowXmlNode = siblingsRowNodesOfLoadedItems[0];

						for (i = 0; i < siblingsRowNodesOfLoadedItems.length; i++) {
							itemDemandedChildsForCurrentItem[trIndexInParentScope + i] =
								siblingsRowNodesOfLoadedItems[i];
						}
					}

					var childFakeRowNodes = rowXmlNode.selectNodes('./tr');
					if (childFakeRowNodes.length) {
						var fakeChildren = this._foundChildren_Experimental(
							childFakeRowNodes,
							rowItemUniqueId,
							item.treePath[0],
							false,
							0,
							false
						);
						this.items_Experimental.add(fakeChildren[0], rowItemUniqueId);
					}
				} else {
					var childNodes = rowXmlNode.selectNodes('./tr');
					if (
						childNodes &&
						childNodes.length &&
						this.onDemandLoader_Experimental.isFakeChild(childNodes[0])
					) {
						var fakeChilds = this._foundChildren_Experimental(
							childNodes,
							rowItemUniqueId,
							item.treePath[0],
							false,
							0,
							false
						);
						if (fakeChilds.length) {
							this.items_Experimental.add(fakeChilds[0], rowItemUniqueId);
						}
					}
				}
				var icon = rowXmlNode.getAttribute('icon0');
				if (icon) {
					store.setValue(item, 'icon', icon);
				}
				var expandedIcon = rowXmlNode.getAttribute('icon1');
				if (expandedIcon) {
					store.setValue(item, 'expandedIcon', expandedIcon);
				}
			}

			var userdata = rowXmlNode.selectNodes('./userdata'),
				userdataCount = userdata.length,
				fields = rowXmlNode.selectNodes('./td'),
				fieldsCount = fields.length,
				textColor = rowXmlNode.getAttribute('textColor');

			if (textColor) {
				rowItemGridStyles.styleRow.color = textColor;
			}

			for (i = 0; i < userdataCount; i++) {
				this.setUserData(
					rowItemUniqueId,
					userdata[i].getAttribute('key'),
					userdata[i].getAttribute('value')
				);
			}
			for (i = 0; i < fieldsCount; i++) {
				itemTd = fields[i];
				itemTdHasAttrs = itemTd.attributes.length > 0;
				thisLayout = gridLayoutCells[gridOrder[i]];
				sort =
					thisLayout.sort || (itemTdHasAttrs && itemTd.getAttribute('sort'));
				itemTdText = itemTd.text;
				field = thisLayout.field;

				if (sort) {
					sort = sort.toUpperCase();
					if (!thisLayout.sort) {
						thisLayout.sort = sort;
					}
				}
				if (!thisLayout.inputformat) {
					thisLayout.inputformat =
						itemTdHasAttrs && itemTd.getAttribute('inputformat');
				}
				rowItemStyles[field] = [];
				rowItemAttrs[field] = [];
				bgColor =
					(itemTdHasAttrs && itemTd.getAttribute('bgColor')) || this.bgColor;
				if (bgColor) {
					rowItemStyles[field]['background-color'] = bgColor;
				}

				if (this.borderGColor) {
					rowItemStyles[field]['border-color'] =
						this.borderGColor + ' !important';
				}

				GridModules.setFont_Gm(
					itemTd.getAttribute('font') ||
						rowXmlNode.getAttribute('font') ||
						this.font,
					rowItemStyles[field]
				);

				rowItemGridStyles[field] = rowItemStyles[field];

				bgInvert = itemTdHasAttrs && itemTd.getAttribute('bginvert');
				if (!bgInvert) {
					if (layout[i].bginvert) {
						bgInvert = layout[i].bginvert;
					} else if (
						rowXmlNode &&
						bgColor &&
						(tableNode ||
							(tableNode = rowXmlNode.ownerDocument.selectSingleNode('table')))
					) {
						bgInvert = this.bgInvert.toString();
						if (bgInvert === null || bgInvert === undefined) {
							bgInvert = tableNode.getAttribute('bgInvert');
						}
					}
				}
				if (bgInvert) {
					rowItemAttrs[field].bginvert = bgInvert;
				}

				if (itemTdText.indexOf('<checkbox') > -1) {
					store.setValue(item, field, /.*state=['"]1['"].*/.test(itemTdText));
				} else if ('NUMERIC' === sort) {
					store.setValue(item, field, itemTdText ? parseFloat(itemTdText) : '');
				} else if ('DATE' === sort) {
					store.setValue(item, field, itemTdText);
				} else {
					store.setValue(item, field, itemTdText);
					link = itemTdHasAttrs && itemTd.getAttribute('link');
					if (link) {
						store.setValue(item, field + 'link', link);
					}
				}

				setCellViewType(
					this.cellViewTypeHelper_Experimental,
					itemTd,
					thisLayout,
					store,
					item
				);
			}
			store.setValue(item, 'style', [rowItemStyles]);
			store.setValue(item, 'attrs', [rowItemAttrs]);

			grid.onSetUpdateEnabled = true;
		},

		_getEmptyRowItemFromXml_Experimental: function (
			rowXmlNode,
			parentId,
			treePath
		) {
			return {
				parent: parentId,
				uniqueId:
					rowXmlNode.getAttribute('id') || GridModules.uniqueIdGenerator.get(),
				icon: rowXmlNode.getAttribute('icon0'),
				expandedIcon: rowXmlNode.getAttribute('icon1'),
				style: [[]],
				attrs: [[]],
				treePath: treePath.split('/'),
				expanded: 'true' === rowXmlNode.getAttribute('expanded')
			};
		},

		_getRowItemFromXml_Experimental: function (rowXmlNode, parentId, treePath) {
			//TODO: Investigate and fix why _getRowItemFromXml_Experimental and _loadDeferredItemDataFromXml_Experimental are of Copy-Paste inheritence?
			var rowItemUniqueId =
					rowXmlNode.getAttribute('id') || GridModules.uniqueIdGenerator.get(),
				rowItemStyles = [],
				rowItemAttrs = [],
				rowItem = {
					parent: parentId,
					uniqueId: rowItemUniqueId,
					icon: rowXmlNode.getAttribute('icon0'),
					expandedIcon: rowXmlNode.getAttribute('icon1'),
					style: [rowItemStyles],
					attrs: [rowItemAttrs],
					treePath: treePath.split('/'),
					expanded: 'true' === rowXmlNode.getAttribute('expanded'),
					userData$Gm: []
				},
				grid = this.grid_Experimental,
				layout = privateProps[this.propsId_Experimental]._layout,
				gridOrder = grid.order,
				gridLayoutCells = grid.layout.cells,
				rowItemGridStyles = (grid.styleGrid[rowItemUniqueId] = {
					styleRow: {}
				}),
				userdata = rowXmlNode.selectNodes('./userdata'),
				fields = rowXmlNode.selectNodes('./td'),
				fieldsCount = fields.length,
				textColor = rowXmlNode.getAttribute('textColor'),
				i,
				itemTd,
				itemTdHasAttrs,
				thisLayout,
				sort,
				itemTdText,
				field,
				bgColor,
				bgInvert,
				tableNode,
				link;

			if (textColor) {
				rowItemGridStyles.styleRow.color = textColor;
			}

			for (i = 0; i < userdata.length; i++) {
				var key = userdata[i].getAttribute('key');
				var value = userdata[i].getAttribute('value');
				rowItem.userData$Gm[key] = value;
			}
			for (i = 0; i < fieldsCount; i++) {
				itemTd = fields[i];
				itemTdHasAttrs = itemTd.attributes.length > 0;
				thisLayout = gridLayoutCells[gridOrder[i]];
				sort =
					thisLayout.sort || (itemTdHasAttrs && itemTd.getAttribute('sort'));
				itemTdText = itemTd.text;
				field = thisLayout.field;

				if (sort) {
					sort = sort.toUpperCase();
					if (!thisLayout.sort) {
						thisLayout.sort = sort;
					}
				}
				if (!thisLayout.inputformat) {
					thisLayout.inputformat =
						itemTdHasAttrs && itemTd.getAttribute('inputformat');
				}

				rowItemStyles[field] = [];
				rowItemAttrs[field] = [];
				bgColor =
					(itemTdHasAttrs && itemTd.getAttribute('bgColor')) || this.bgColor;

				if (bgColor) {
					rowItemStyles[field]['background-color'] = bgColor;
				}

				if (this.borderGColor) {
					rowItemStyles[field]['border-color'] =
						this.borderGColor + ' !important';
				}

				GridModules.setFont_Gm(
					itemTd.getAttribute('font') ||
						rowXmlNode.getAttribute('font') ||
						this.font,
					rowItemStyles[field]
				);

				rowItemGridStyles[field] = rowItemStyles[field];

				bgInvert = itemTdHasAttrs && itemTd.getAttribute('bginvert');
				if (!bgInvert) {
					if (layout[i].bginvert) {
						bgInvert = layout[i].bginvert;
					} else if (
						rowXmlNode &&
						bgColor &&
						(tableNode ||
							(tableNode = rowXmlNode.ownerDocument.selectSingleNode('table')))
					) {
						bgInvert = this.bgInvert.toString();
					}
				}
				if (bgInvert) {
					rowItemAttrs[field].bginvert = bgInvert;
				}

				if (itemTdText.indexOf('<checkbox') > -1) {
					rowItem[field] = /.*state=['"]1['"].*/.test(itemTdText);
				} else if ('NUMERIC' === sort) {
					rowItem[field] = itemTdText ? parseFloat(itemTdText) : '';
				} else if ('DATE' === sort) {
					rowItem[field] = itemTdText;
				} else {
					rowItem[field] = itemTdText;
					link = itemTdHasAttrs && itemTd.getAttribute('link');
					if (link) {
						rowItem[field + 'link'] = link;
					}
				}

				setCellViewType(
					this.cellViewTypeHelper_Experimental,
					itemTd,
					thisLayout,
					this._store,
					rowItem
				);
			}

			return rowItem;
		},

		isEditing_Experimental: function () {
			return this.grid_Experimental.edit.isEditing();
		},

		setNoRowSelect_Experimental: function (value) {
			this.selection_Experimental.set('none', value);
		},

		getStyleRow_Experimental: function (rowId) {
			return (
				this.grid_Experimental.styleGrid[rowId] &&
				this.grid_Experimental.styleGrid[rowId].styleRow
			);
		},

		updateRowStyles_Experimental: function (rowId) {
			this.grid_Experimental.views.views[0].updateRowStyles(
				this.getRowIndex(rowId)
			);
		},

		destroy_Experimental: function () {
			this.contexMenu_Experimental.menu.destroyRecursive(false);
			this.grid_Experimental.destroyRecursive(false);
			this.grid_Experimental = 'destroyed, please call constructor';
		},

		resize_Experimental: function () {
			this.grid_Experimental.resize();
		},

		getListsById_Experimental: function () {
			return privateProps[this.propsId_Experimental]._listsById;
		} //don't use "," after the last property all over the file, e.g, here because documentation will not be built
	});
});
