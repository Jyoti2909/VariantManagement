define(['dojo/_base/declare'], function (declare) {
	return declare('MassPromote.ExecuteModule', null, {
		_errorProcessed: 'processed',

		constructor: function (mediator, itemID) {
			this._mediator = mediator;
			this._itemID = itemID;
			this._executeButtonHandler = this.onExecuteButtonClick.bind(this);
			this._executeButton = document.getElementById('executeButton');
			this._executeButton.addEventListener('click', this._executeButtonHandler);
			this._executeButton.value = this._mediator.getResource('execute');

			this._cancelButtonHandler = this._closeWindow.bind(this);
			this._cancelButton = document.getElementById('cancelButton');
			this._cancelButton.addEventListener('click', this._cancelButtonHandler);
			this._cancelButton.value = this._mediator.getResource('cancel');
		},

		// update state of execute button
		update: function (items, lifeCycleInfo, targetState) {
			if (this._executionStarted) {
				return;
			}

			if (items && items.length > 0 && lifeCycleInfo && targetState) {
				const existInvalidItems = items.some(function (el) {
					return el.getProperty('mpo_isItemValid') === '0';
				});
				this._executeButton.disabled = existInvalidItems;
			} else {
				this._executeButton.disabled = true;
			}
		},

		onCancelButtonClickBeforeExecute: function () {
			const self = this;
			this._cancelButton.disabled = true;
			const message = this._mediator.getResource(
				'cancel_operation_before_promotion'
			);
			const dialogParams = this._createDialogParams(message);

			return new Promise(function (resolve, reject) {
				ArasModules.Dialog.show('iframe', dialogParams).promise.then(function (
					resultState
				) {
					if (resultState === 'btnYes') {
						resolve(true);
					} else {
						self._cancelButton.disabled = false;
						resolve(false);
					}
				});
			});
		},

		onCloseButtonClick: function () {
			if (this._sessionCompleted) {
				return Promise.resolve(true);
			}

			if (this._executionStarted) {
				return this._tryToExitDuringExecution();
			}

			return this.onCancelButtonClickBeforeExecute();
		},

		_tryToExitDuringExecution: function () {
			// notify the main promotion thread that we would like to cancel
			this._onCancelButtonClickAfterExecute();

			// we need to wait while the main thread of promotion
			// will call callback
			return new Promise(
				function (resolve) {
					this._afterCancellCallback = function (cancelled) {
						resolve(cancelled);
					};
				}.bind(this)
			);
		},

		_callAfterCancelCallback: function (cancelled) {
			if (this._afterCancellCallback) {
				this._afterCancellCallback(cancelled);
				delete this._afterCancellCallback;
			}
		},

		_onCancelButtonClickAfterExecute: function () {
			this._cancelButton.disabled = true;
			this._cancelButtonPressed = true;
		},

		_showCancelDialog: function () {
			const statusOfPromotion = this._mediator.getStatusOfPromotion();
			const message = this._mediator.getResource(
				'cancel_operation_during_promotion',
				[
					statusOfPromotion.completedCount,
					statusOfPromotion.failedCount,
					statusOfPromotion.pendingCount
				]
			);

			const dialogParams = this._createDialogParams(message);

			return ArasModules.Dialog.show('iframe', dialogParams).promise.then(
				function (resultState) {
					return resultState === 'btnYes';
				}
			);
		},

		_closeWindow: function () {
			const mainWindow = aras.getMainWindow();
			const isTab = mainWindow.document.getElementById(window.name);

			if (isTab) {
				const tabsContainer = mainWindow.mainLayout.tabsContainer;
				const tabbar = tabsContainer.getTabbarByTabId(window.name);

				tabbar.removeTab(window.name);
			} else {
				window.close();
			}
		},

		_createDialogParams: function (message) {
			return {
				buttons: {
					btnYes: aras.getResource('', 'common.yes'),
					btnNo: aras.getResource('', 'common.no')
				},
				defaultButton: 'btnNo',
				dialogWidth: 300,
				dialogHeight: 200,
				message: message,
				aras: aras,
				content: 'groupChgsDialog.html',
				center: true
			};
		},

		_cancelOperation: function (massPromoteId) {
			const cancelRequest = aras.newIOMItem(
				'mpo_MassPromotion',
				'mpo_CancelOperation'
			);
			cancelRequest.setID(massPromoteId);
			const cancelResponse = cancelRequest.apply();
			const cancelResponseItem = this._parseResponseAML(cancelResponse);

			const records = cancelResponseItem.getRelationships(
				'mpo_MassPromotionRecord'
			);

			for (let i = 0; i < records.getItemCount(); i++) {
				const promoteInfo = records.getItemByIndex(i);
				const itemId = promoteInfo.getProperty('before_promote_item_id');
				const status = promoteInfo.getProperty('status');
				this._mediator.onItemPromoted(itemId, status);
			}
		},

		onExecuteButtonClick: function () {
			this._onExecuteStarted();
			this._mediator.onExecuteStarted();
			this._executionData = this._mediator.getDataForExecution();

			return this._prepareMassPromotionItem()
				.then(
					function (massPromoteId) {
						this._mediator._gridModule.onItemsPromoted('Processing');

						let promotionPromise = Promise.resolve();

						for (let i = 0; i < this._executionData.itemIds.length; i++) {
							promotionPromise = promotionPromise
								.then(
									function (massPromoteId, i) {
										return this._promoteSingleItem(massPromoteId, i);
									}.bind(this, massPromoteId, i)
								)
								.then(
									function (response) {
										const responseItem = this._parseResponseAML(response);
										const promoteInfo = responseItem
											.getRelationships('mpo_MassPromotionRecord')
											.getItemByIndex(0);
										const itemId = promoteInfo.getProperty(
											'before_promote_item_id'
										);
										const status = promoteInfo.getProperty('status');
										this._mediator.onItemPromoted(itemId, status);

										this._scrollTo(itemId);
									}.bind(this)
								);
						}

						return promotionPromise.then(
							function () {
								this._onExecuteCompleted();
								this._callAfterCancelCallback(true);

								return Promise.resolve();
							}.bind(this),
							function (response) {
								this._onExecuteCompleted();

								try {
									this._scrollTo(
										this._executionData.itemIds[
											this._executionData.itemIds.length - 1
										]
									);
									this._cancelOperation(massPromoteId);
								} catch (error) {
									return aras.AlertError(error);
								}

								const errorResult = new SOAPResults(
									aras,
									response.responseText
								);
								const faultString = errorResult.getFaultString();

								if (faultString) {
									return aras.AlertError(
										errorResult.getFaultString(),
										errorResult.getFaultDetails()
									);
								}
							}.bind(this)
						);
					}.bind(this)
				)
				.catch(
					function (exc) {
						if (exc !== this._errorProcessed) {
							this._onExecuteCompleted();
							aras.AlertError(exc);
						}
					}.bind(this)
				);
		},

		_onExecuteStarted: function () {
			this._executionStarted = true;
			this._executeButton.disabled = true;
			this._executeButton.removeEventListener(
				'click',
				this._executeButtonHandler
			);

			this._cancelButton.disabled = false;
			this._cancelButton.removeEventListener(
				'click',
				this._cancelButtonHandler
			);
			this._cancelButton.addEventListener(
				'click',
				this._onCancelButtonClickAfterExecute.bind(this)
			);
		},

		_onExecuteCompleted: function () {
			this._executeButton.value = this._mediator.getResource('done');
			this._executeButton.addEventListener('click', this._closeWindow);
			this._executeButton.disabled = false;
			this._cancelButton.disabled = true;
			this._sessionCompleted = true;
			this._updateCachedItem();
		},

		_updateCachedItem: function () {
			const node = aras.itemsCache.getItem(this._itemID);
			node.removeAttribute('isTemp');
			node.removeAttribute('isDirty');
		},

		_promoteSingleItem: function (massPromoteId, itemIndex) {
			if (this._cancelButtonPressed) {
				return this._showCancelDialog().then(
					function (cancelled) {
						if (cancelled) {
							this._callAfterCancelCallback(cancelled);

							return Promise.reject(this._errorProcessed);
						} else {
							this._cancelButtonPressed = false;
							this._cancelButton.disabled = false;
							this._callAfterCancelCallback(cancelled);

							return this._promoteAndUpdate(massPromoteId, itemIndex);
						}
					}.bind(this)
				);
			} else {
				return this._promoteAndUpdate(massPromoteId, itemIndex);
			}
		},

		_promoteAndUpdate: function (massPromoteId, index) {
			return this._promoteItem(massPromoteId, index);
		},

		_promoteItem: function (massPromoteId, index) {
			const currentId = this._executionData.itemIds[index];
			const request = aras.newIOMItem(
				'mpo_MassPromotion',
				'mpo_PromoteAndUpdate'
			);
			request.setID(massPromoteId);
			request.setProperty('item_id', currentId);

			return ArasModules.soap(request.node.xml, { async: true });
		},

		_prepareMassPromotionItem: function () {
			const request = aras.newIOMItem(
				'mpo_MassPromotion',
				'mpo_SetupOperation'
			);
			request.setID(this._itemID);
			request.setProperty('itemtype_name', this._executionData.itemTypeName);
			request.setProperty('item_type_id', this._executionData.itemTypeId);
			request.setProperty(
				'life_cycle_map_name',
				this._executionData.lifeCycleMapName
			);
			request.setProperty(
				'life_cycle_map_id',
				this._executionData.lifeCycleMapId
			);
			request.setProperty('target_state', this._executionData.targetStateName);
			request.setProperty('transition_comment', this._executionData.comment);
			request.setProperty('idlist', this._executionData.itemIds.join(','));

			return ArasModules.soap(request.node.xml, { async: true }).then(
				function (response) {
					return Promise.resolve(
						response.selectSingleNode('Item').getAttribute('id')
					);
				},
				function (errorResponse) {
					const errorResult = new SOAPResults(aras, errorResponse.responseText);

					return aras
						.AlertError(
							errorResult.getFaultString(),
							errorResult.getFaultDetails()
						)
						.then(
							function () {
								this._onExecuteCompleted();

								return Promise.reject(this._errorProcessed);
							}.bind(this)
						);
				}.bind(this)
			);
		},

		_parseResponseAML: function (response) {
			let responseXml = response;

			if (typeof response === 'object') {
				responseXml = response.dom.xml;
			}

			const responseNode = ArasModules.xml
				.parseString(responseXml)
				.selectSingleNode('//Item');
			const responseItem = aras.newIOMItem();
			responseItem.loadAML('<AML>' + responseNode.xml + '</AML>');

			return responseItem;
		},

		_scrollTo: function (itemId) {
			const statusColumnIndex = this._mediator._gridModule._grid.settings.indexHead.indexOf(
				'status'
			);
			this._mediator._gridModule._grid.settings.focusedCell = {
				headId: statusColumnIndex,
				rowId: itemId
			};
		}
	});
});
