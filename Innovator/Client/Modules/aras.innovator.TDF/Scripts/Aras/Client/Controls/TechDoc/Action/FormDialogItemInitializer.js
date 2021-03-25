define([
	'dojo/_base/declare',
	'TDF/Scripts/Aras/Client/Controls/TechDoc/Action/BaseItemInitializer'
], function (declare, BaseItemInitializer) {
	return declare(BaseItemInitializer, {
		_formElementSelector: '#formFrame',
		// Pixels count on which dialog height should be increased due to embedding additional controls (button's panel)
		_dialogHeightExtention: 68,

		initItem: function (targetItem, optionalParameters) {
			optionalParameters = optionalParameters || {};

			this._prepareInitData(targetItem, optionalParameters);

			const initializationResult = Promise.resolve(
				this._callEventMethod('onBeforeInit', targetItem, optionalParameters)
			).then(
				function (resultItem) {
					return this._processInitialization(resultItem, optionalParameters);
				}.bind(this)
			);

			return Promise.resolve(initializationResult);
		},

		_processInitialization: function (targetItem, optionalParameters) {
			if (targetItem) {
				const formNode = this._getFormNode(targetItem, this._initData);

				if (formNode) {
					const topWindow = this.aras.getMostTopWindowWithAras();
					const arasModules = topWindow.ArasModules;
					const itemTypeName = targetItem.getType();
					const itemTypeDescriptor = this.aras.getItemTypeForClient(
						itemTypeName,
						'name'
					);
					const itemTypeLabel =
						(itemTypeDescriptor && itemTypeDescriptor.getProperty('label')) ||
						itemTypeName;
					const dialogParameters = {
						title: this.aras.getResource(
							'../Modules/aras.innovator.TDF',
							'dialogitemcreator.dialogtitle',
							itemTypeLabel
						),
						aras: this.aras,
						isEditable: true,
						item: targetItem,
						formId: formNode.getAttribute('id'),
						dialogWidth: parseInt(
							this.aras.getItemProperty(formNode, 'width', 400)
						),
						dialogHeight:
							parseInt(this.aras.getItemProperty(formNode, 'height', 300)) +
							this._dialogHeightExtention,
						beforeOnload: this._extendDialogForm.bind(this),
						content: 'ShowFormAsADialog.html'
					};

					return arasModules.Dialog.show(
						'iframe',
						dialogParameters
					).promise.then(
						function (resultItem) {
							return resultItem;
						}.bind(this)
					);
				} else {
					return this.aras.AlertError(
						this.aras.getResource(
							'../Modules/aras.innovator.TDF',
							'dialogitemcreator.formnotfound'
						)
					);
				}
			}
		},

		_getFormNode: function (targetItem, optionalParameters) {
			optionalParameters = optionalParameters || {};

			if (targetItem) {
				const formType = optionalParameters.formType || 'add';
				const formId =
					optionalParameters.formId ||
					this.aras.uiGetFormID4ItemEx(targetItem.node, formType);

				if (formId) {
					const formDisplay = this.aras.getFormForDisplay(formId);
					return formDisplay && formDisplay.node;
				}
			}
		},

		_extendDialogForm: function (dialogWindow) {
			const formFrame = dialogWindow.document.querySelector(
				this._formElementSelector
			);

			if (formFrame) {
				this._setContextParameters(dialogWindow);

				formFrame.addEventListener(
					'load',
					function () {
						this._adjustDialogSize(dialogWindow);
						this._appendButtonsPanel(dialogWindow);
						this._attachEventHandlers(dialogWindow);

						// Focus form to start catch keyboard events right after form loading ('escape' key currently tracked)
						this._focusForm(formFrame);
					}.bind(this)
				);
			}
		},

		_focusForm: function (formFrame) {
			const formBody = formFrame.contentDocument.body;

			formBody.setAttribute('tabindex', '-1');
			formBody.focus();
		},

		_adjustDialogSize: function (dialogWindow) {
			const frameElement = dialogWindow.frameElement;

			frameElement.style.height =
				'calc(100% - ' + this._dialogHeightExtention + 'px)';
		},

		_setContextParameters: function (dialogWindow) {
			const formFrame = dialogWindow.document.querySelector(
				this._formElementSelector
			);
			formFrame.tdfContextParameters = this._initData.contextParameters;
		},

		_appendButtonsPanel: function (dialogWindow) {
			const formFrame = dialogWindow.document.querySelector(
				this._formElementSelector
			);

			if (formFrame) {
				const frameElement = dialogWindow.frameElement;
				const buttonContainer = frameElement.ownerDocument.createElement('div');
				const applyButtonText = this.aras.getResource(
					'../Modules/aras.innovator.TDF',
					'dialogitemcreator.applybutton'
				);
				const cancelButtonText = this.aras.getResource(
					'../Modules/aras.innovator.TDF',
					'dialogitemcreator.cancelbutton'
				);

				buttonContainer.innerHTML =
					'<div class="aras-buttons-bar aras-buttons-bar_right" style="position:absolute; padding-top:20px; bottom:16px; left:16px; right:16px; z-index:10;">' +
					'<button class="buttonApply aras-button aras-button_primary aras-buttons-bar__button">' +
					`<span class="aras-button__text">${applyButtonText}</span>` +
					'</button>' +
					'<button class="buttonCancel aras-button aras-button_secondary-light aras-buttons-bar__button">' +
					`<span class="aras-button__text">${cancelButtonText}</span>` +
					'</button>' +
					'</div>';

				const applyButton = buttonContainer.querySelector('.buttonApply');
				applyButton.addEventListener(
					'click',
					function () {
						if (!applyButton._isProcessing) {
							const initData = this._initData;
							const targetItem = initData.item;

							applyButton._isProcessing = true;

							this._callEventMethod('onAfterInit', targetItem, initData).then(
								function (resultItem) {
									if (resultItem) {
										const beforeApplyHandler = initData.onBeforeApply;

										return Promise.resolve(
											beforeApplyHandler
												? beforeApplyHandler(resultItem)
												: resultItem
										).then(function (approvedItem) {
											applyButton._isProcessing = false;

											if (approvedItem) {
												dialogWindow.returnValue = approvedItem;
												dialogWindow.close();
											}
										});
									}

									applyButton._isProcessing = false;
								}.bind(this)
							);
						}
					}.bind(this)
				);

				const cancelButton = buttonContainer.querySelector('.buttonCancel');
				cancelButton.addEventListener('click', dialogWindow.close);

				frameElement.parentNode.appendChild(buttonContainer.firstChild);
			}
		},

		_attachEventHandlers: function (dialogWindow) {
			const formFrame = dialogWindow.document.querySelector(
				this._formElementSelector
			);

			if (formFrame) {
				const formDocument = formFrame.contentDocument;

				formDocument.addEventListener('keydown', function (keyEvent) {
					if (keyEvent.keyCode === 27) {
						dialogWindow.close();
					}
				});
			}
		}
	});
});
