(function (window) {
	'use strict';

	const GRID_COLUMN_NAMES = {
		scope: 'scope',
		expression: 'expression'
	};

	function EffectivityExpressionItemGridController(parameters) {
		//window.aras is required for TopWindowHelper and other common stuff
		window.aras = this.aras = parameters.aras;
		this._title = parameters.title;
		this._effectivityExpressionItemsLoader =
			parameters.effectivityExpressionItemsLoader;
		this._effectiveItemId = parameters.effectiveItemId;
		this._effectiveItemTypeId = parameters.effectiveItemTypeId;
		this._closeButtonClickHandler = parameters.closeButtonClickHandler;
		this._extraAccessControlProviderMethodName =
			parameters.extraAccessControlProviderMethodName;
		this._onCreateUpdateDeleteExpressionCallback =
			parameters.onCreateUpdateDeleteExpressionCallback;
		this._init(
			parameters.titleConnectId,
			parameters.closeButtonConnectId,
			parameters.toolbarConnectId,
			parameters.gridConnectId
		);
	}

	EffectivityExpressionItemGridController.prototype = {
		constructor: EffectivityExpressionItemGridController,

		aras: null,

		controllerPublicApi: null,

		_onCreateUpdateDeleteExpressionCallback: null,

		_topWindow: null,

		_toolbar: null,

		_grid: null,

		_effectivityExpressionDialog: null,

		_effectivityExpressionUnsavedChangesDialogPromise: null,

		_effsModuleSolutionBasedRelativePath:
			'../Modules/aras.innovator.core.EffectivityServices',

		_init: function (
			titleConnectId,
			closeButtonConnectId,
			toolbarConnectId,
			gridConnectId
		) {
			this.controllerPublicApi = this._constructControllerApi();
			this._topWindow = this.aras.getMostTopWindowWithAras(window);

			this._loadTitle(titleConnectId);
			this._toggleCloseButton(closeButtonConnectId);
			this._loadGrid(gridConnectId);
			this._initGridContextMenu();
			this._loadToolbar(toolbarConnectId);
		},

		_loadTitle: function (titleConnectId) {
			const dom = document.getElementById(titleConnectId);
			dom.textContent = this._title;
		},

		_toggleCloseButton: function (closeButtonConnectId) {
			if (!this._closeButtonClickHandler) {
				return;
			}

			const closeButtonElement = document.getElementById(closeButtonConnectId);
			closeButtonElement.title = this.aras.getResource(
				this._effsModuleSolutionBasedRelativePath,
				'effectivity_expression_item_grid.close_button.label'
			);
			closeButtonElement.addEventListener(
				'click',
				this._closeButtonClickHandler
			);
			closeButtonElement.classList.toggle('aras-hide', false);
		},

		_loadToolbar: function (toolbarConnectId) {
			this._toolbar = new Toolbar();
			document.getElementById(toolbarConnectId).appendChild(this._toolbar);

			window.cuiToolbar(this._toolbar, 'effs_expressionItemGridToolbar', {
				effectivityContext: this.controllerPublicApi
			});
		},

		_initGridContextMenu: function () {
			window
				.cuiContextMenu(
					new ArasModules.ContextMenu(),
					'effs_expressionItemGridCtxMenu',
					{ effectivityContext: this.controllerPublicApi }
				)
				.then(
					function (contextMenu) {
						const gridRowContextMenuHandler = function (rowId, e) {
							e.preventDefault();

							contextMenu.show(
								{ x: e.clientX, y: e.clientY },
								{ expressionItemId: rowId }
							);
						};

						this._grid.on('contextmenu', gridRowContextMenuHandler, 'row');
					}.bind(this)
				);
		},

		_constructControllerApi: function () {
			const controller = this;

			const contextOptions = {};

			Object.defineProperty(contextOptions, 'grid', {
				value: {
					get selectedRowIds() {
						return controller._grid.settings.selectedRows.slice();
					},

					on: function (eventName, callback) {
						controller._grid.on(eventName, callback);
					},

					deleteRow: function (rowId) {
						controller._grid.rows.delete(rowId);
						controller._onExpressionsChange();
					},

					setRow: function (rowId, rowData) {
						controller._grid.rows.set(rowId, rowData);
					}
				},
				enumerable: true
			});

			Object.defineProperty(contextOptions, 'toolbar', {
				value: {
					setItemEnabled: function (id, isEnabled) {
						controller._toolbar.data.set(
							id,
							Object.assign({}, controller._toolbar.data.get(id), {
								disabled: !isEnabled
							})
						);
						controller._toolbar.render();
					}
				},
				enumerable: true
			});

			Object.defineProperty(
				contextOptions,
				'extraAccessControlProviderMethodName',
				{
					get: function () {
						return controller._extraAccessControlProviderMethodName;
					},
					enumerable: true
				}
			);

			Object.defineProperty(contextOptions, 'effectiveItemId', {
				get: function () {
					return controller._effectiveItemId;
				},
				enumerable: true
			});

			Object.defineProperty(contextOptions, 'effectiveItemTypeId', {
				get: function () {
					return controller._effectiveItemTypeId;
				},
				enumerable: true
			});

			Object.defineProperty(contextOptions, 'effectivityExpressionItemTypeId', {
				get: function () {
					return controller._effectivityExpressionItemsLoader
						.effectivityExpressionItemTypeId;
				},
				enumerable: true
			});

			Object.defineProperty(
				contextOptions,
				'effectivityExpressionItemTypeName',
				{
					get: function () {
						return controller._effectivityExpressionItemsLoader
							.effectivityExpressionItemTypeName;
					},
					enumerable: true
				}
			);

			Object.defineProperty(contextOptions, 'showEffectivityExpressionItem', {
				value: function (viewMode, expressionItemId) {
					controller._showEffectivityExpressionItem(viewMode, expressionItemId);
				}
			});

			return contextOptions;
		},

		_onExpressionsChange: function () {
			if (this._onCreateUpdateDeleteExpressionCallback) {
				const callbackParameters = {
					effectiveItemId: this._effectiveItemId
				};
				this._onCreateUpdateDeleteExpressionCallback(callbackParameters);
			}
		},

		_generateGridRowData: function (expressionItem) {
			const row = {};
			row[GRID_COLUMN_NAMES.scope] = expressionItem.getPropertyAttribute(
				'effs_scope_id',
				'keyed_name'
			);
			row[GRID_COLUMN_NAMES.expression] = expressionItem.getProperty(
				'string_notation'
			);

			return row;
		},

		_loadGrid: function (gridConnectId) {
			const dom = document.getElementById(gridConnectId);

			const head = new Map();
			head.set(GRID_COLUMN_NAMES.scope, {
				label: this.aras.getResource(
					this._effsModuleSolutionBasedRelativePath,
					'effectivity_expression_item_grid.grid.scope_column_label'
				),
				width: Math.floor(window.innerWidth / 5)
			});
			head.set(GRID_COLUMN_NAMES.expression, {
				label: this.aras.getResource(
					this._effsModuleSolutionBasedRelativePath,
					'effectivity_expression_item_grid.grid.expression_column_label'
				),
				width: Math.floor((window.innerWidth * 4) / 5)
			});

			const rows = new Map();
			const expressionItems = this._effectivityExpressionItemsLoader.getExpressionItems(
				this._effectiveItemId
			);
			const expressionItemCount = expressionItems.getItemCount();

			for (let i = 0; i < expressionItemCount; i++) {
				const curentExpressionItem = expressionItems.getItemByIndex(i);
				rows.set(
					curentExpressionItem.getId(),
					this._generateGridRowData(curentExpressionItem)
				);
			}

			this._grid = new Grid(dom);
			this._grid.head = head;
			this._grid.rows = rows;
		},

		_expressionEditorApplyButtonOnClickHandler: function (expressionItemNode) {
			const dialogDocument = this._effectivityExpressionDialog.contentNode.querySelector(
				'iframe'
			).contentDocument;

			this.aras.browserHelper.toggleSpinner(dialogDocument, true);

			return this.aras.IomInnovator.getItemInDom(expressionItemNode)
				.applyAsync('merge')
				.then(
					function (savedExpressionItem) {
						this.aras.browserHelper.toggleSpinner(dialogDocument, false);

						const expressionItemGridRow = this._generateGridRowData(
							savedExpressionItem
						);

						this._grid.rows.set(
							savedExpressionItem.getID(),
							expressionItemGridRow
						);

						this.aras.updateInCache(savedExpressionItem.node);

						this._effectivityExpressionDialog.close();
						this.aras.AlertSuccess(
							this.aras.getResource(
								'',
								'item_methods_ex.item_saved_successfully',
								"'" + savedExpressionItem.getProperty('keyed_name') + "' "
							)
						);

						return true;
					}.bind(this)
				)
				.catch(
					function (soapResponse) {
						this.aras.browserHelper.toggleSpinner(dialogDocument, false);

						const errorItem = this.aras.newIOMItem();
						errorItem.loadAML(soapResponse.responseText);
						this.aras.AlertError(errorItem);

						return false;
					}.bind(this)
				);
		},

		_expressionEditorCancelButtonOnClickHandler: function (
			expressionItemNode,
			isExpressionItemValid
		) {
			if (this._effectivityExpressionUnsavedChangesDialogPromise) {
				return {
					isDialogAlreadyOpen: true,
					promise: this._effectivityExpressionUnsavedChangesDialogPromise
				};
			}

			if (!this.aras.isDirtyEx(expressionItemNode)) {
				this._effectivityExpressionDialog.close();

				return {
					isDialogSkipped: true,
					promise: Promise.resolve(true)
				};
			}

			const confirmDialogParams = {
				additionalButton: [
					{
						text: this.aras.getResource('', 'common.discard'),
						actionName: 'discard'
					}
				],
				okButtonText: this.aras.getResource('', 'common.save'),
				title: this.aras.getResource('', 'item_methods_ex.unsaved_changes'),
				buttonsOrdering: ['ok', 'discard', 'cancel']
			};

			if (!isExpressionItemValid) {
				confirmDialogParams.okButtonModifier =
					'aras-button_primary effs-button_disabled effs-button-primary_disabled';
			}

			const confirmDialogMessage = this.aras.getResource(
				this._effsModuleSolutionBasedRelativePath,
				'effectivity_expression_editor.changes_not_saved'
			);

			this._effectivityExpressionUnsavedChangesDialogPromise = this._topWindow.ArasModules.Dialog.confirm(
				confirmDialogMessage,
				confirmDialogParams
			).then(
				function (dialogResult) {
					this._effectivityExpressionUnsavedChangesDialogPromise = null;

					if (dialogResult === 'ok') {
						return this._expressionEditorApplyButtonOnClickHandler(
							expressionItemNode
						);
					} else if (dialogResult === 'discard') {
						this.aras.removeFromCache(expressionItemNode);
						this._effectivityExpressionDialog.close();

						return true;
					}

					return false;
				}.bind(this)
			);

			return {
				promise: this._effectivityExpressionUnsavedChangesDialogPromise
			};
		},

		_showEffectivityExpressionItem: function (viewMode, expressionItemId) {
			const title = this.aras.getResource(
				this._effsModuleSolutionBasedRelativePath,
				'effectivity_expression_editor.title'
			);

			let expressionItemNode;

			if (viewMode === 'add') {
				expressionItemNode = this.aras.newItem(
					this._effectivityExpressionItemsLoader
						.effectivityExpressionItemTypeName
				);
				this.aras.setItemProperty(
					expressionItemNode,
					'source_id',
					this._effectiveItemId
				);
			} else {
				expressionItemNode = this.aras.getItemById(
					this._effectivityExpressionItemsLoader
						.effectivityExpressionItemTypeName,
					expressionItemId
				);
			}

			const dialogArguments = {
				aras: this.aras,
				expressionItemNode: expressionItemNode,
				viewMode: viewMode,
				cancelButtonOnClickHandler: this._expressionEditorCancelButtonOnClickHandler.bind(
					this
				),
				applyButtonOnClickHandler: this._expressionEditorApplyButtonOnClickHandler.bind(
					this
				),
				content:
					this.aras.getBaseURL() +
					'/Modules/aras.innovator.core.EffectivityServices/Views/EffectivityExpressionEditor.html',
				title: title,
				dialogWidth: 760,
				dialogHeight: 558
			};

			this._topWindow.effectivityExpressionDialog = this._effectivityExpressionDialog = this._topWindow.ArasModules.MaximazableDialog.show(
				'iframe',
				dialogArguments
			);

			this._effectivityExpressionDialog.promise.then(
				function () {
					this._topWindow.effectivityExpressionDialog = this._effectivityExpressionDialog = null;
					this._onExpressionsChange();
				}.bind(this)
			);

			const dialogCloseButtonEventInfo = this._effectivityExpressionDialog
				.attachedEvents.onCloseBtn;

			const dialogCloseButtonHandler = function () {
				const effectivityExpressionEditorWindow = this._effectivityExpressionDialog.contentNode.querySelector(
					'iframe'
				).contentWindow;

				return this._expressionEditorCancelButtonOnClickHandler(
					expressionItemNode,
					effectivityExpressionEditorWindow.effectivityExpressionEditorViewController.isExpressionItemValid()
				);
			}.bind(this);

			dialogCloseButtonEventInfo.node.removeEventListener(
				dialogCloseButtonEventInfo.eventName,
				dialogCloseButtonEventInfo.callback
			);
			dialogCloseButtonEventInfo.node.addEventListener(
				dialogCloseButtonEventInfo.eventName,
				dialogCloseButtonHandler
			);

			dialogCloseButtonEventInfo.callback = dialogCloseButtonHandler;
		}
	};

	window.EffectivityExpressionItemGridController = EffectivityExpressionItemGridController;
})(window);
