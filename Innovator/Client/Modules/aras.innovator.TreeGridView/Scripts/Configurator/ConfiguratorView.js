define([
	'dojo/aspect',
	'dijit/popup',
	'./Dialogs/DialogHelper',
	'./ConfiguratorTreeGridContainer',
	'Aras/Client/Controls/Public/Toolbar'
], function (
	aspect,
	popup,
	DialogHelper,
	ConfiguratorTreeGridContainer,
	Toolbar
) {
	'use strict';
	var ConfiguratorView = (function () {
		function ConfiguratorView(
			clientControlsFactory,
			arasObject,
			controllerContext,
			moduleFactory
		) {
			this.arasObject = arasObject;
			this.clientControlsFactory = clientControlsFactory;
			this.controllerContext = controllerContext;
			this.dialogHelper = new DialogHelper(arasObject);
			this.moduleFactory = moduleFactory;
		}
		ConfiguratorView.prototype.onAfterInitGrid = function (treeGrid) {};
		ConfiguratorView.prototype.onCandidateVisibilityChanged = function (e) {};
		ConfiguratorView.prototype.onAddColumn = function (columnDefinition) {};
		ConfiguratorView.prototype.onRenameColumn = function (columnDefinition) {};
		ConfiguratorView.prototype.onRemoveColumn = function (
			columnDefinition,
			columnIndex
		) {};
		ConfiguratorView.prototype.onResizeColumn = function (
			columnDefinition,
			newWidth
		) {};
		ConfiguratorView.prototype.onMapTreeRow = function (rowId, graphNodeId) {};
		ConfiguratorView.prototype.onMultipleMap = function (graphNodeIds) {};
		ConfiguratorView.prototype.onInsertGroupAbove = function (
			graphNodeId,
			template
		) {};
		ConfiguratorView.prototype.onInsertGroupBelow = function (
			graphNodeId,
			template
		) {};
		ConfiguratorView.prototype.onUnmapTreeRow = function (treeGridRowModel) {};
		ConfiguratorView.prototype.onMultipleUnmap = function (
			treeGridRowModels
		) {};
		ConfiguratorView.prototype.onCombineNodes = function (graphNodeIds) {};
		ConfiguratorView.prototype.onDecombineNodes = function (graphNodeId) {};
		ConfiguratorView.prototype.onDoubleClick = function (
			treeGridRowModel,
			columnDefinition,
			targetDomNode
		) {};
		ConfiguratorView.prototype.onShowParameterMapping = function () {};
		ConfiguratorView.prototype.onShowDataTemplate = function (
			rowId,
			columnId
		) {};
		ConfiguratorView.prototype.setNode = function (node) {
			this.node = node;
		};
		ConfiguratorView.prototype.reload = function () {
			this.destroy();
			this.initialize();
		};
		ConfiguratorView.prototype.initialize = function () {
			if (!this.grid) {
				this.initializeGrid();
			} else {
				this.correctDojoGridStyles();
			}
			if (!this.toolbar) {
				this.initializeToolbar();
			}
		};
		ConfiguratorView.prototype.destroy = function () {
			this.destroyGrid();
		};
		ConfiguratorView.prototype.loadGridData = function (gridLayout) {
			this.grid.setLayout_Experimental(gridLayout);
		};
		ConfiguratorView.prototype.destroyGrid = function () {
			if (!this.grid) {
				return;
			}
			// close popup menu because it can be not closed.
			var menu = this.grid.menu();
			popup.close(menu.menu);
			this.grid.destroyHeaderContextMenu();
			this.grid.destroy();
			this.grid.destroy_Experimental();
			this.grid = null;
		};
		ConfiguratorView.prototype.initializeGrid = function () {
			var connectId = this.node.id;
			if (!connectId) {
				throw new Error(
					this.getResource('configurator.connected_id_not_found')
				);
			}
			this.grid = new ConfiguratorTreeGridContainer({
				connectId: connectId
			});
			this.subscribeGridEvents();
			this.grid.grid_Experimental.render();
			this.initializeGridHeaderMenu();
			this.initializeCellMenu();
			this.onAfterInitGrid(this.grid);
			this.correctDojoGridStyles();
		};
		ConfiguratorView.prototype.initializeToolbar = function () {
			this.toolbar = new Toolbar({ connectId: 'configuratorToolbar' });
			this.subscribeToolbarEvents();
			this.loadToolbarData();
			this.toolbar.show();
		};
		ConfiguratorView.prototype.subscribeToolbarEvents = function () {
			var _this = this;
			aspect.after(
				this.toolbar,
				'onClick',
				function (el) {
					_this.onShowParameterMapping();
				},
				true
			);
		};
		ConfiguratorView.prototype.loadToolbarData = function () {
			var relationshipBrowserModuleUrl = aras.getBaseURL(
				'/Modules/aras.innovator.TreeGridView/'
			);
			var configuratorToolbarUrl = aras.getI18NXMLResource(
				'configurator_toolbar.xml',
				relationshipBrowserModuleUrl
			);
			this.toolbar.loadXml(configuratorToolbarUrl);
		};
		ConfiguratorView.prototype.initializeGridHeaderMenu = function () {
			var headerMenu = this.moduleFactory.initHeaderMenu(
				this.controllerContext,
				this
			);
			headerMenu.init();
		};
		ConfiguratorView.prototype.initializeCellMenu = function () {
			var cellMenu = this.moduleFactory.initCellMenu(
				this.controllerContext,
				this
			);
			cellMenu.init();
		};
		ConfiguratorView.prototype.subscribeGridEvents = function () {
			var _this = this;
			this.grid.grid_Experimental.own(
				aspect.after(
					this.grid.grid_Experimental,
					'onResizeColumn',
					function (cellIdx) {
						_this.tryResizeColumn(cellIdx);
					},
					true
				),
				aspect.after(
					this.grid.grid_Experimental,
					'onHeaderCellDblClick',
					function (e) {
						if (window.isEditMode) {
							var cell = e.cell;
							var columnModel = _this.grid.getTreeGridColumnModel(
								cell.layoutIndex
							);
							_this.onRenameColumn(columnModel);
						}
					},
					true
				),
				aspect.after(
					this.grid.grid_Experimental,
					'onRowClick',
					function (e) {
						_this.checkOnRecursionNodeClick(e);
					},
					true
				),
				aspect.after(
					this.grid.grid_Experimental,
					'onDeselected',
					function (inRowIndex) {
						_this.checkOnRecursionRowDeselected(inRowIndex);
					},
					true
				),
				aspect.after(
					this.grid.grid_Experimental,
					'onRowMouseOver',
					function (e) {
						_this.tryShowRecursionIcon(e);
						_this.showTooltip(e);
					},
					true
				),
				aspect.after(
					this.grid.grid_Experimental,
					'onRowMouseOut',
					function (e) {
						_this.tryHideRecursionIcon(e);
					},
					true
				),
				aspect.after(
					this.grid.grid_Experimental,
					'onRowClick',
					function (e) {
						var menu = _this.grid.menu();
						popup.close(menu.menu);
					},
					true
				),
				aspect.after(
					this.grid.grid_Experimental,
					'onStyleRow',
					function (row) {
						_this.setCandidateIconOpacity(row);
					},
					true
				)
			);
			aspect.after(
				this.grid,
				'gridDoubleClick',
				function (rowId, columnIndex) {
					if (
						columnIndex === null ||
						columnIndex === undefined ||
						rowId === null ||
						rowId === undefined
					) {
						//sometimes it happens that gridDoubleClick occurs with empty columnIndex.
						//note that columnIndex = 0 - possible and valid value.
						return;
					}
					var treeGridRowModel = _this.grid.getTreeRowModel(rowId);
					var rowIndex = _this.grid.getRowIndex(rowId);
					var targetDomNode = _this.grid.grid_Experimental.views.views[0].getRowNode(
						rowIndex
					);
					targetDomNode =
						targetDomNode && targetDomNode.querySelectorAll('td')[columnIndex];
					var columnModel = _this.grid.getTreeGridColumnModel(columnIndex);
					_this.onDoubleClick(treeGridRowModel, columnModel, targetDomNode);
				},
				true
			);
		};
		ConfiguratorView.prototype.checkOnRecursionRowDeselected = function (
			rowIndex
		) {
			var rowId = this.getRowId(this.grid, rowIndex);
			if (rowId) {
				var isRecursiveRowFrom = this.getRowProperty(rowId, 'isRecursiveNode');
				if (isRecursiveRowFrom) {
					var rowFrom = this.grid.getRowByItemId_Experimental(rowId);
					this.changeElementDisplay(rowFrom, 'recursion-from', 'hidden');
					var recursiveRowIdOn = this.controllerContext.getRecursiveRowIdOn(
						rowId
					);
					if (recursiveRowIdOn) {
						var rowOn = this.grid.getRowByItemId_Experimental(recursiveRowIdOn);
						if (rowOn) {
							this.changeElementDisplay(rowOn, 'recursion-on', 'hidden');
						}
					}
				}
			}
		};
		ConfiguratorView.prototype.checkOnRecursionNodeClick = function (e) {
			var rowId = this.getRowId(this.grid, e.rowIndex);
			if (rowId) {
				var isRecursiveRowFrom = this.getRowProperty(rowId, 'isRecursiveNode');
				if (isRecursiveRowFrom) {
					var recursiveRowId = this.controllerContext.getRecursiveRowIdOn(
						rowId
					);
					if (recursiveRowId) {
						var row = this.grid.getRowByItemId_Experimental(recursiveRowId);
						if (row) {
							this.changeElementDisplay(row, 'recursion-on', 'visible');
						}
					}
				}
			}
		};
		ConfiguratorView.prototype.getRowProperty = function (rowId, property) {
			if (rowId) {
				return this.grid.getCellValue_Experimental(rowId, property);
			}
		};
		ConfiguratorView.prototype.getRowIdFromEvent = function (e) {
			if (e && e.rowIndex > -1) {
				return this.getRowId(this.grid, e.rowIndex);
			} else {
				return null;
			}
		};
		ConfiguratorView.prototype.changeElementDisplay = function (
			row,
			className,
			value
		) {
			var elementsByClassName = row.getElementsByClassName(className);
			if (elementsByClassName && elementsByClassName.length > 0) {
				var element = elementsByClassName[0];
				element.style.visibility = value;
			}
		};
		ConfiguratorView.prototype.getRowId = function (gridContext, rowIndex) {
			var store = gridContext.grid_Experimental.store;
			var item = gridContext.grid_Experimental.getItem(rowIndex);
			if (item) {
				return store.getValue(item, 'uniqueId', null);
			}
		};
		ConfiguratorView.prototype.onInsertGroupClick = function (
			graphNodeId,
			above
		) {
			var _this = this;
			var title = this.getResource('configurator.group_create_label');
			var message = this.getResource('configurator.group_create_dialog');
			var params = this.dialogHelper.createParamsForGroupDialog(
				'',
				title,
				message
			);
			ArasModules.Dialog.show('iframe', params).promise.then(function (result) {
				if (result && result.changed) {
					if (above) {
						_this.onInsertGroupAbove(graphNodeId, result.value);
					} else {
						_this.onInsertGroupBelow(graphNodeId, result.value);
					}
				}
			});
		};
		ConfiguratorView.prototype.tryResizeColumn = function (cellIdx) {
			var cell = this.grid.grid_Experimental.getCell(cellIdx);
			var widthStyleValue = cell.unitWidth || '';
			// Parse value in format: '100px'.
			var width = parseInt(widthStyleValue.slice(0, -2));
			if (isNaN(width)) {
				return;
			}
			var model = this.grid.getTreeGridColumnModel(cellIdx);
			this.onResizeColumn(model, width);
		};
		ConfiguratorView.prototype.tryShowRecursionIcon = function (e) {
			var rowId = this.getRowIdFromEvent(e);
			if (rowId) {
				var isRecursiveNode = this.getRowProperty(rowId, 'isRecursiveNode');
				if (isRecursiveNode) {
					this.changeElementDisplay(e.rowNode, 'recursion-from', 'visible');
				}
			}
		};
		ConfiguratorView.prototype.tryHideRecursionIcon = function (e) {
			var rowId = this.getRowIdFromEvent(e);
			var selectedIds = this.grid.getSelectedItemIdsArray();
			if (selectedIds.indexOf(rowId) === -1) {
				var isRecursiveNode = this.getRowProperty(rowId, 'isRecursiveNode');
				if (isRecursiveNode) {
					this.changeElementDisplay(e.rowNode, 'recursion-from', 'hidden');
				}
			}
		};
		ConfiguratorView.prototype.setCandidateIconOpacity = function (row) {
			var rowId = this.getRowId(this.grid, row.index);
			if (rowId) {
				var isCandidate = this.getRowProperty(rowId, 'isCandidate');
				if (isCandidate) {
					var icons = row.node.getElementsByClassName(
						'aras_item_image aras_lazytreegrid_icon'
					);
					if (icons.length > 0) {
						icons[0].style.opacity = '0.5';
					}
				}
			}
		};
		ConfiguratorView.prototype.showTooltip = function (e) {
			var tooltipContainer = e.rowNode.querySelector(
				'.aras_lazytreegrid_expando_with_icon'
			);
			var icon = e.rowNode.querySelector('.aras_lazytreegrid_icon');
			var rowModel = this.grid.getTreeRowModel(this.getRowIdFromEvent(e));
			var columnModel = this.grid.getTreeGridColumnModel(0);
			var columnMapping = rowModel.columnMappings.find(function (item) {
				return item.sourceId === columnModel.id;
			}, null);

			tooltipContainer.classList.remove('aras-tooltip');

			if (
				e.target === icon &&
				columnMapping &&
				columnMapping.template &&
				columnMapping.template.icon
			) {
				tooltipContainer.classList.toggle(
					'aras-tooltip_invalid',
					rowModel.icon === '../Images/RedWarning.svg'
				);
				tooltipContainer.classList.add('aras-tooltip');
				tooltipContainer.setAttribute(
					'data-tooltip',
					columnMapping.template.icon
				);
				tooltipContainer.setAttribute('data-tooltip-show', true);
				tooltipContainer.setAttribute('data-tooltip-pos', 'down');
			}
		};
		ConfiguratorView.prototype.getResource = function (resourceName) {
			return this.arasObject.getResource(
				'../Modules/aras.innovator.TreeGridView',
				resourceName
			);
		};
		ConfiguratorView.prototype.correctDojoGridStyles = function () {
			// overide default styles of treeGrid
			var connectedDiv = document.getElementById(this.node.id);
			if (connectedDiv) {
				var headers = connectedDiv.getElementsByClassName('dojoxGridHeader');
				if (headers && headers.length > 0) {
					var cssStyle = 'dojoxGridHeaderOverride';
					var element = headers[0];
					if (!element.classList.contains(cssStyle)) {
						element.classList.add('dojoxGridHeaderOverride');
					}
				}
			}
		};
		return ConfiguratorView;
	})();
	return ConfiguratorView;
});
