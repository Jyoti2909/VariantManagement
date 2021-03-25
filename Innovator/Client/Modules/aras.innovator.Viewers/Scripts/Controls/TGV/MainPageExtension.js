define([
	'dojo/_base/declare',
	'dojo/_base/connect',
	'./PathManager',
	'./DynamicProductNavigationAPI'
], function (declare, connect, PathManager, DynamicProductNavigationAPI) {
	return declare([], {
		_pathManager: new PathManager(),
		_isOneCallOfFillTreeDone: false,
		_extraModelIds: [],

		constructor: function (args) {
			const customObject = parent.customObject;
			const callback = function () {
				//TODO: change the alert.//AlertError or AlertWarning?
				alert('Select failed. Perhaps some items were deleted/versioned.');
			};
			this.threeDViewerSetOnNotFoundItemCallback(callback);
			if (customObject) {
				let eventHandler = connect.connect(
					customObject,
					'onSelectItemOnModel',
					this,
					this.threeDViewerSelectByPaths
				);
				this._eventHandlers.push(eventHandler);

				eventHandler = connect.connect(
					customObject,
					'onLoadWithParameters',
					this,
					this.loadWithParameters
				);
				this._eventHandlers.push(eventHandler);

				eventHandler = connect.connect(
					customObject,
					'onDisableTgvToolbar',
					this,
					this.disableToolbar
				);
				this._eventHandlers.push(eventHandler);

				eventHandler = connect.connect(
					customObject,
					'onEnableTgvToolbar',
					this,
					this.enableToolbar
				);
				this._eventHandlers.push(eventHandler);

				eventHandler = connect.connect(
					customObject,
					'onGetExtraModelIds',
					this,
					this.getExtraModelIds
				);
				this._eventHandlers.push(eventHandler);

				eventHandler = connect.connect(
					customObject,
					'onSetExtraModelIds',
					this,
					this.setExtraModelIds
				);
				this._eventHandlers.push(eventHandler);
			}
		},

		threeDViewerSetOnNotFoundItemCallback: function (callback) {
			this._pathManager.setOnNotFoundItemCallback(callback);
		},

		threeDViewerSelectByPaths: function (pathsStr) {
			this._pathManager.selectByPaths(pathsStr);
			this.updateRemoveModelBtnState(pathsStr);
		},

		tgvSelectByPaths: function () {
			if (this._pathManager.isShowMoreLoadingInProgress) {
				return;
			}
			var pathsStr = this.threeDViewerGetPathsOfSelectedNode();
			this._grid._customObject.onSelectRowOnTgvTreeGrid(pathsStr);
			this.updateRemoveModelBtnState(pathsStr);
		},

		threeDViewerGetPathsOfSelectedNode: function () {
			var paths = this._pathManager.getPathsOfSelectedNode();
			return paths;
		},

		threeDViewerSetSpecialQueryItemRefId: function (refId) {
			this._pathManager.setSpecialQueryItemRefId(refId);
		},

		_createEmptyTree: function () {
			this._pathManager.setMainPage(this);
			return this.inherited(arguments);
		},

		_fillTree: function () {
			var self = this;
			if (!this._isOneCallOfFillTreeDone) {
				this._isOneCallOfFillTreeDone = true;
				if (self._grid._customObject) {
					const eventHandler = connect.connect(
						self._grid,
						'onSelectRow',
						this,
						self.tgvSelectByPaths
					);
					self._eventHandlers.push(eventHandler);
				}

				this._pathManager.overrideTreeGridForCancelClick(this);

				this._grid.setPathManager(this._pathManager);
			}

			const promise = this.inherited(arguments);
			promise.then(function () {
				self._pathManager._callSelectByPathIfRequired();
			});
			return promise;
		},

		_onLinkClick: function () {
			const self = this;
			const promise = this.inherited(arguments);
			promise.then(function () {
				self._pathManager._callSelectByPathIfRequired();
			});
			return promise;
		},
		_getTreeGridControlPath: function () {
			return 'Viewers/TGV/ThreeDViewerTgvTreeGrid';
		},

		reload: function () {
			var params = this._getRequestParametersForTreeGridData();
			this._grid._customObject.refresh3DView(
				params.qb_parameters_value_by_name
			);

			return this.inherited(arguments);
		},

		_getRequestParametersForTreeGridData: function () {
			const result = this.inherited(arguments);
			if (this._grid._customObject.isToSkipModelLoading()) {
				result.fetch = 1; //TGV doesn't have a logic to get only a header, so, we get minimum data for better performance.
			}
			return result;
		},

		loadWithParameters: function (qdParameters) {
			let parameters = JSON.parse(qdParameters);
			let paramName;
			for (paramName in parameters) {
				if (parameters.hasOwnProperty(paramName)) {
					this._parametersProvider.setParameter(
						paramName,
						parameters[paramName]
					);
				}
			}

			const startCondition = {
				id: [].concat(this.getRootItemId()).concat(this._extraModelIds)
			};
			this.reload(startCondition);
		},

		disableToolbar: function () {
			if (this._toolbar) {
				this._toolbar.Disable();
			}
		},

		enableToolbar: function () {
			if (this._toolbar) {
				this._toolbar.Enable();
				// I-019252 button should become enabled after selecting row in TGV.
				var rbCollapseLevelButton = this._toolbar.GetItem('rb_CollapseLevel');
				if (rbCollapseLevelButton) {
					rbCollapseLevelButton.Disable();
				}
				this.updateRemoveModelBtnState();
			}
		},

		_getCuiContextParams: function () {
			let cuiContextParams = this.inherited(arguments);
			cuiContextParams = Object.assign(cuiContextParams, {
				dpnContext: new DynamicProductNavigationAPI(this)
			});
			return cuiContextParams;
		},

		_createToolbar: function () {
			var toolbar;
			var toolbarId;
			var topWindow = this._aras.getMostTopWindowWithAras(window);
			var self = this;
			const customObject = parent.customObject;

			var contextItem = self._getContextItem();
			var cuiContextParams = self._getCuiContextParams();

			if (!topWindow.cui._tgvCounter) {
				topWindow.cui._tgvCounter = 0;
			}

			toolbarId =
				'com.aras.innovator.viewers.dynamicViewer.tgv.toolbar_' +
				topWindow.cui._tgvCounter++;
			toolbar = new ToolbarWrapper({
				id: toolbarId,
				connectId: 'toolbar_container',
				useCompatToolbar: true
			});
			return topWindow.cui.dataLoader
				.loadCommandBarAsync('dpn_tgvToolbarCustomization', contextItem)
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
						self._toolbar = toolbar;
						self._toolbarCreated();
						self._updateToolbarItems();
					}.bind(self)
				)
				.then(function () {
					customObject.tgv_parameters = JSON.stringify(
						self._parametersProvider.getParameters()
					);
					if (!customObject.isToSkipModelLoading()) {
						customObject.refresh3DView(customObject.tgv_parameters);
					}
				})
				.catch(function (err) {
					console.error(err);
				});
		},

		addModel: function (itemIds) {
			const initialCountOfExtraModels = this._extraModelIds.length;
			const rootItemId = this.getRootItemId();

			for (let i = 0; i < itemIds.length; i++) {
				const itemId = itemIds[i];
				if (!this._extraModelIds.includes(itemId) && itemId !== rootItemId) {
					this._extraModelIds.push(itemId);
				}
			}

			if (initialCountOfExtraModels < this._extraModelIds.length) {
				const startCondition = {
					id: [].concat(this.getRootItemId()).concat(this._extraModelIds)
				};
				this.reload(startCondition);
			}
		},

		removeModel: function (itemId) {
			if (itemId !== this.getRootItemId()) {
				const index = this._extraModelIds.indexOf(itemId);
				if (index !== -1) {
					this._extraModelIds.splice(index, 1);

					const startCondition = {
						id: [].concat(this.getRootItemId()).concat(this._extraModelIds)
					};
					this.reload(startCondition);
				}
			}
		},

		getRootItemTypeName: function () {
			return parent.customObject.getItemData().itemTypeName;
		},

		getRootItemId: function () {
			return parent.customObject.getItemData().itemId;
		},

		getExtraModelIds: function () {
			return this._extraModelIds;
		},

		setExtraModelIds: function (extraModelIds) {
			this._extraModelIds = extraModelIds;
		},

		updateRemoveModelBtnState: function (selectedItemPath) {
			const dpnRemoveModelButton = this._toolbar.GetItem('dpn_RemoveModel');

			if (dpnRemoveModelButton) {
				// 'Remove Model' button can be enanbled only after geometry is loaded completely.
				if (selectedItemPath && !parent.customObject.isModelLoading()) {
					const queryItemRefIdToItemIdMap = selectedItemPath.split(
						this._pathManager._pathsDelimiter
					);
					const isTopLevel = queryItemRefIdToItemIdMap.length == 1;

					if (isTopLevel) {
						const selectedItemId = queryItemRefIdToItemIdMap[0].split(':')[1];
						const rootItemId = this.getRootItemId();

						if (selectedItemId !== rootItemId) {
							dpnRemoveModelButton.Enable();
							return;
						}
					}
				}
				dpnRemoveModelButton.Disable();
			}
		}
	});
});
