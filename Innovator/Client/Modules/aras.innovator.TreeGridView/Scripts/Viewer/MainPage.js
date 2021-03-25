define([
	'dojo/_base/declare',
	'dojo/_base/connect',
	'./PublicAPI',
	'./TgvTreeGridToXml',
	'dojo/domReady!'
], function (declare, connect, PublicAPI, TgvTreeGridToXml) {
	return declare('MainPage', [], {
		_aras: null,

		_grid: null,

		_clientControlsFactory: false,

		_treeGridViewItemTypeInfo: null,

		_treeGridViewDefinitionNode: null,

		_startCondition: null,

		_eventHandlers: [],

		_toolbar: null,

		_tgvTreeGridToXml: null,

		_cancelButton: null,

		_doAutoGrowOnLoad: false,

		cancelClick: null,

		constructor: function (args) {
			this._clientControlsFactory = args.clientControlsFactory;
			this._treeGridViewItemTypeInfo = args.treeGridViewItemTypeInfo;
			this._treeGridViewDefinitionNode = args.treeGridViewDefinitionNode;
			this._parametersProvider =
				args.parametersProvider || new DefaultParametersProvider();
			this._tgvTreeGridToXml = new TgvTreeGridToXml();
			this._cancelButton = document
				.getElementById('dimmer_spinner')
				.querySelector('button');
			this._aras = args.aras;
			this._doAutoGrowOnLoad =
				this._aras.getItemProperty(
					this._treeGridViewDefinitionNode,
					'max_query_depth_is_onload'
				) === '1';

			let _visibleChildrenMaxCount;
			let self = this;
			Object.defineProperty(this, 'visibleChildrenMaxCount', {
				set: function (visibleChildrenMaxCount) {
					_visibleChildrenMaxCount = visibleChildrenMaxCount;
				},
				get: function () {
					return (
						_visibleChildrenMaxCount ||
						self._aras.getItemProperty(
							this._treeGridViewDefinitionNode,
							'max_child_items'
						)
					);
				},
				enumerable: true,
				configurable: true
			});

			window.onresize = function () {
				self._fixGridSize();
			};
		},

		_getTreeGridContainer: function () {
			return document.getElementById('rb_tree_grid');
		},

		_getTreeGridErrorContainer: function () {
			return document.getElementById('rb_tree_grid_error');
		},

		_fixGridSize: function () {
			var gridElement = this._getTreeGridContainer();
			this._aras.fixLiquidContainerHeight(document, gridElement);
			var gridHeight =
				window.innerHeight - toolbar_container.offsetHeight + 'px';
			gridElement.style.height = gridHeight;
			var gridErrorDiv = this._getTreeGridErrorContainer();
			gridErrorDiv.style.height = gridHeight;
			gridErrorDiv.style.lineHeight = gridHeight;
		},

		_uncompressCompressionDictionaries: function (rcData, dictionary) {
			var entry;
			for (var k in rcData.Entries) {
				if (!rcData.Entries.hasOwnProperty(k)) {
					continue;
				}
				entry = rcData.Entries[k];
				if (entry.QbKey) {
					entry.QbPath = dictionary.qbPathByKey[entry.QbKey];
					entry.QbKey = null;
				}
			}
		},

		load: function (startCondition) {
			this._startCondition = startCondition;
			this._fixGridSize();
			return this._createToolbar();
		},

		reload: function (startCondition) {
			this.onBeforeReload();

			if (startCondition) {
				this._startCondition = startCondition;
			}
			this._makeTreeGridVisible();
			const self = this;
			return this._fillTree(true).then(function () {
				self._updateToolbarItems();
			});
		},

		onBeforeReload: function () {},

		destroy: function () {
			var i;
			//remove attached handlers
			for (i = 0; i < this._eventHandlers.length; i++) {
				this._eventHandlers[i].remove();
			}

			this._eventHandlers = [];

			if (this._grid) {
				this._grid.destroy();
				this._grid = null;
			}
		},

		_getRequestParametersForTreeGridData: function (
			includeHeaders,
			rowContextData,
			offsetInfo,
			levelsToExpand
		) {
			const isIncludeHeaders = includeHeaders == true ? '1' : '0';
			var params = {
				startCondition: JSON.stringify(this._startCondition) || '',
				fetch: this.visibleChildrenMaxCount,
				row_context_data: rowContextData ? rowContextData : '',
				show_more_offset_info: offsetInfo,
				levels_to_expand: levelsToExpand,
				include_headers: isIncludeHeaders,
				tgvd_item: this._treeGridViewDefinitionNode.xml
			};
			return params;
		},

		getTreeGridData: function (
			rowContextData,
			includeHeaders,
			offsetInfo,
			levelsToExpand
		) {
			var overlay = document.getElementById('dimmer_spinner');
			var requestParameters = this._getRequestParametersForTreeGridData(
				includeHeaders,
				rowContextData,
				offsetInfo,
				levelsToExpand
			);
			var timerId = setTimeout(function () {
				overlay.classList.remove('overlay_transparent');
			}, 500);

			overlay.classList.add('overlay_transparent');
			overlay.classList.remove('overlay_hidden');

			var self = this;
			var queryPromise = new Promise(function (resolve, reject) {
				var xmlhttp = new XMLHttpRequest();
				var innovatorUrl = self._aras
					.getMostTopWindowWithAras(window)
					.aras.getServerBaseURL();
				var url = innovatorUrl + 'odata/method.rb_GetTreeGridData';
				xmlhttp.open('POST', url, true);
				xmlhttp.setRequestHeader(
					'Content-Type',
					'application/json; charset=utf-8'
				);
				var headers = self._aras
					.getMostTopWindowWithAras(window)
					.aras.getHttpHeadersForSoapMessage('ApplyItem');
				for (var hName in headers) {
					xmlhttp.setRequestHeader(hName, headers[hName]);
				}
				xmlhttp.onload = function () {
					if (this.status >= 200 && this.status < 300) {
						resolve(xmlhttp.response);
					} else {
						reject();
					}
				};
				xmlhttp.onerror = function () {
					reject();
				};
				xmlhttp.send(JSON.stringify(requestParameters));
			});

			return Promise.race([
				queryPromise,
				new Promise(function (resolve) {
					self.cancelClick = function () {
						resolve({ isCancelClicked: true });
					};

					self._cancelButton.addEventListener('click', self.cancelClick);
				})
			])
				.then(function (result) {
					clearTimeout(timerId);
					overlay.classList.add('overlay_hidden');

					self._cancelButton.removeEventListener('click', self.cancelClick);
					self.cancelClick = null;

					if (!result || result.isCancelClicked) {
						return result;
					}
					var res = JSON.parse(result);

					var toReturn = {};
					if (includeHeaders) {
						toReturn.headers = res.HeaderResult;
					}
					toReturn.gridRows = res.GridRows;
					toReturn.compressionDicts = {
						iconPathByKey: res.IconPathByKey,
						qbPathByKey: res.QbPathByKey
					};
					return toReturn;
				})
				.catch(
					function (e) {
						console.error(e);
						this._showTreeGridLoadError();
						overlay.classList.add('overlay_hidden');
					}.bind(this)
				);
		},

		_updateToolbarItems: function () {
			var topWindow = this._aras.getMostTopWindowWithAras(window);
			var contextParams = this._getCuiContextParams();
			topWindow.cui.updateToolbarItems(
				this._toolbar,
				{},
				null,
				true,
				contextParams
			);
		},

		_getTreeGridControlPath: function () {
			return 'TreeGridView/Scripts/Viewer/TgvTreeGrid';
		},

		_createEmptyTree: function () {
			this._clientControlsFactory.createControl(
				this._getTreeGridControlPath(),
				{
					connectId: 'rb_tree_grid'
				},
				function (control) {
					this._grid = control;
					control.onDemandLoader = {
						loadData: function (parentId, levelsToExpand, includeHeaders) {
							var row = control.getRow(parentId);
							if (row && row.rcData) {
								var dictionary =
									control.compressionDictionariesByRowId[row.gridRowId];
								if (dictionary) {
									this._uncompressCompressionDictionaries(
										row.rcData,
										dictionary
									);
								}
							}
							var rowContextData =
								row && row.rcData && JSON.stringify(row.rcData);
							return this.getTreeGridData(
								rowContextData,
								includeHeaders,
								null,
								levelsToExpand
							);
						}.bind(this)
					};
					var eventHandler = connect.connect(
						control,
						'gridLinkClick',
						this,
						function (itemData) {
							this._onLinkClick(itemData);
						}
					);
					this._eventHandlers.push(eventHandler);
					eventHandler = connect.connect(
						control,
						'gridMenuInit',
						this,
						function () {
							var topWindow = this._aras.getMostTopWindowWithAras(window);
							var menu = control.getMenu();
							var contextItem = this._getContextItem();
							var contextParams = this._getCuiContextParams();
							menu.removeAll();
							topWindow.cui.fillPopupMenu(
								'TGV_ContextMenu',
								menu,
								contextItem,
								null,
								null,
								contextParams
							);
							topWindow.cui.initPopupMenu(menu, contextItem, contextParams);
						}
					);
					this._eventHandlers.push(eventHandler);

					eventHandler = connect.connect(
						control,
						'onSelectRow',
						this,
						this._updateToolbarItems
					);
					this._eventHandlers.push(eventHandler);

					return this._fillTree();
				}.bind(this)
			);
		},

		expandAll: function () {
			const expandAllCount = this._getGrowDepth();

			if (!this._validateGrowDepth(expandAllCount)) {
				return this._aras.AlertError(
					this._aras.getResource(
						'../Modules/aras.innovator.TreeGridView',
						'expandAll_depth_error'
					)
				);
			}
			return this._grid.expandAll(expandAllCount);
		},

		_getGrowDepth: function () {
			const expandAllCountTextBox = this._toolbar.getItem('rb_MaxQueryDepth');
			return +expandAllCountTextBox.getText();
		},

		_validateGrowDepth: function (growDepth) {
			return (
				!isNaN(growDepth) && growDepth > 0 && parseInt(growDepth) === growDepth
			);
		},

		_onLinkClick: function (itemData) {
			if (!itemData || typeof itemData !== 'string') {
				return;
			}

			if (itemData === this._grid.showMoreLinkValue) {
				var selectedRowId = this._grid.getSelectedItemIDs_Experimental();
				var selectedRow = this._grid.getRow(selectedRowId);
				var offsetInfo =
					selectedRow.offsetInfo && JSON.stringify(selectedRow.offsetInfo);
				var parentGridRowId = this._grid.getParentId(selectedRowId);
				var parentRow = this._grid.getRow(parentGridRowId);
				if (parentRow && parentRow.rcData) {
					var dictionary = this._grid.compressionDictionariesByRowId[
						parentGridRowId
					];
					if (dictionary) {
						this._uncompressCompressionDictionaries(
							parentRow.rcData,
							dictionary
						);
					}
				}
				var rowContextData =
					parentRow && parentRow.rcData && JSON.stringify(parentRow.rcData);
				return this.getTreeGridData(rowContextData, false, offsetInfo).then(
					function (result) {
						if (!result || result.isCancelClicked) {
							return result;
						}
						this._grid.addRows(
							result.gridRows,
							result.compressionDicts,
							parentGridRowId,
							selectedRowId
						);
						return result;
					}.bind(this)
				);
			}
			var itemDataSplitted = itemData
				.replace(/'/g, '')
				.replace(/"/g, '')
				.split(',');
			if (itemDataSplitted.length !== 2) {
				return;
			}

			var type = itemDataSplitted[0];
			var id = itemDataSplitted[1];

			if (type && id) {
				this._aras.uiShowItem(type, id);
			}
		},

		_getContextItem: function () {
			return {
				itemID: this._treeGridViewDefinitionNode.getAttribute('id'),
				item: this._treeGridViewDefinitionNode,
				itemType: this._treeGridViewItemTypeInfo
			};
		},

		_getCuiContextParams: function () {
			return {
				tgvContext: new PublicAPI(this)
			};
		},

		_createToolbar: function () {
			var toolbar;
			var toolbarId;
			var topWindow = this._aras.getMostTopWindowWithAras(window);
			var self = this;

			var contextItem = self._getContextItem();
			var cuiContextParams = self._getCuiContextParams();

			if (!topWindow.cui._tgvCounter) {
				topWindow.cui._tgvCounter = 0;
			}

			toolbarId = 'tgvMainPageToolbar_' + topWindow.cui._tgvCounter++;
			toolbar = new ToolbarWrapper({
				id: toolbarId,
				connectId: 'toolbar_container',
				useCompatToolbar: true
			});
			return topWindow.cui.dataLoader
				.loadCommandBarAsync('TGV_Toolbar', contextItem)
				.then(function (items) {
					topWindow.cui.initToolbarEvents(
						toolbar,
						contextItem,
						cuiContextParams
					);
					Object.assign(contextItem, {
						toolbarApplet: toolbar,
						connectId: 'toolbar_container',
						toolbarId: toolbarId,
						items: items,
						contextParams: cuiContextParams
					});

					return topWindow.cui.loadToolbarFromCommandBarsAsync(contextItem);
				})
				.then(
					function () {
						toolbar.show();
						this._toolbar = toolbar;
						this._toolbarCreated();
						this._updateToolbarItems();
					}.bind(this)
				)
				.catch(function (err) {
					console.error(err);
				});
		},

		_toolbarCreated: function (toolbar) {
			this._createEmptyTree();
		},

		_showTreeGridLoadError: function () {
			var gridElement = this._getTreeGridContainer();
			var gridErrorDiv = this._getTreeGridErrorContainer();
			gridErrorDiv.style.display = 'block';
			gridElement.style.display = 'none';
			var errorResourceName = 'view.tree_grid_definition_error';
			gridErrorDiv.innerText = this._aras.getResource(
				'../Modules/aras.innovator.TreeGridView',
				errorResourceName
			);
		},

		_makeTreeGridVisible: function () {
			var gridElement = this._getTreeGridContainer();
			var gridErrorDiv = this._getTreeGridErrorContainer();
			gridErrorDiv.style.display = 'none';
			gridElement.style.display = '';
		},

		_fillTree: function (clearGrid) {
			if (this._doAutoGrowOnLoad) {
				const growDepth = this._getGrowDepth();

				if (!this._validateGrowDepth(growDepth)) {
					return this._aras.AlertError(
						this._aras.getResource(
							'../Modules/aras.innovator.TreeGridView',
							'expandAll_depth_error'
						)
					);
				}
				return this._grid.loadRowsWithDescendants(null, growDepth, true);
			}

			return this.getTreeGridData(null, true).then(
				function (result) {
					if (clearGrid) {
						this._grid.removeAllRows_Experimental();
						this._grid.removeOrderBy();
					}
					if (!result || result.isCancelClicked) {
						return;
					}
					this._grid.createHeader(result.headers);
					this._grid.addRows(result.gridRows, result.compressionDicts);
					return result;
				}.bind(this)
			);
		}
	});
});
