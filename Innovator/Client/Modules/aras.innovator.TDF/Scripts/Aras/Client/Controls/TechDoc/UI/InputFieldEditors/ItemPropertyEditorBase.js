define(['dojo/_base/declare', 'dijit/TooltipDialog', 'dijit/popup'], function (
	declare,
	TooltipDialog,
	popup
) {
	return declare(null, {
		tooltipDialog: null,
		_editorId: null,
		_editorParameters: null,
		_popupParameters: null,
		_showParameters: null,
		_domEventListeners: null,
		_isShown: false,
		_isHideForbidden: false,
		_initialValue: undefined,
		_iconPaths: null,
		_resourceStrings: null,
		owner: null,
		aras: null,
		value: null,
		domNode: null,
		controlNodes: null,

		constructor: function (initialParameters) {
			initialParameters = initialParameters || {};

			this._editorId = initialParameters.id;
			this._editorParameters = initialParameters.editorParameters || {};
			this._domEventListeners = [];
			this.owner = initialParameters.owner;
			this.aras = initialParameters.aras || this.owner.aras;
			this._iconPaths = Object.assign(
				{
					applyButton: '../../images/Apply.svg',
					cancelButton: '../../images/Discard.svg'
				},
				initialParameters.iconPaths
			);
			this._resourceStrings = Object.assign(
				{
					applyButtonTitle: this.aras.getResource('', 'common.apply'),
					cancelButtonTitle: this.aras.getResource('', 'common.discard')
				},
				initialParameters.resourceStrings
			);

			this.controlNodes = [];
		},

		_getTooltipDialog: function () {
			if (!this.tooltipDialog) {
				this._createDialog(this._editorParameters);
			}

			return this.tooltipDialog;
		},

		_createDialog: function (editorParameters) {
			const editorTemplate = this._buildEditorTemplate(editorParameters);

			this.tooltipDialog = new TooltipDialog({
				id: this._editorId
			});

			this.tooltipDialog.set('content', editorTemplate);
			this.domNode = this.tooltipDialog.domNode;

			this._setupControlNodes();
			this._attachDomEventListeners();
		},

		_destroyDialog: function () {
			if (this.tooltipDialog) {
				this._removeDomEventListeners();

				this.controlNodes = {};
				this.domNode = null;

				this.tooltipDialog.destroyRecursive();
				this.tooltipDialog = null;
			}
		},

		_setupControlNodes: function () {
			this.controlNodes = {};

			if (this.domNode) {
				const controlNodes = this.domNode.querySelectorAll('[controlNode]');

				for (let i = 0; i < controlNodes.length; i++) {
					const currentNode = controlNodes[i];
					const controlName = currentNode.getAttribute('controlNode');

					this.controlNodes[controlName] = currentNode;
				}
			}
		},

		_attachDomEventListeners: function () {
			if (this.domNode) {
				const applyButtonNode = this.controlNodes.applyButton;
				const cancelButtonNode = this.controlNodes.cancelButton;
				const dialogDomNode = this.tooltipDialog.domNode;

				this._attachDomEventListener(
					applyButtonNode,
					'click',
					this._onApplyValue.bind(this)
				);

				this._attachDomEventListener(
					cancelButtonNode,
					'mousedown',
					this._onDiscardValue.bind(this)
				);

				this._attachDomEventListener(
					dialogDomNode,
					'keydown',
					this._onEditorKeyDown.bind(this)
				);

				this._attachDomEventListener(
					dialogDomNode,
					'keypress',
					this._stopEventPropagation
				);

				this._attachDomEventListener(
					dialogDomNode,
					'focusout',
					this._onBlur.bind(this)
				);
			}
		},

		_removeDomEventListeners: function () {
			for (let i = 0; i < this._domEventListeners.length; i++) {
				const handlerDescriptor = this._domEventListeners[i];
				handlerDescriptor.node.removeEventListener(
					handlerDescriptor.event,
					handlerDescriptor.handler
				);
			}

			this._domEventListeners = [];
		},

		_attachDomEventListener: function (targetNode, eventName, eventHandler) {
			targetNode.addEventListener(eventName, eventHandler);

			this._domEventListeners.push({
				node: targetNode,
				event: eventName,
				handler: eventHandler
			});
		},

		_stopEventPropagation: function (targetEvent) {
			targetEvent.stopPropagation();
		},

		_stopEvent: function (targetEvent) {
			targetEvent.stopPropagation();
			targetEvent.preventDefault();
		},

		_onApplyValue: function () {
			const currentValue = this.getValue();
			this.hide(currentValue !== this._initialValue ? currentValue : undefined);
		},

		_onDiscardValue: function () {
			this.hide();
		},

		_onBlur: function (blurEvent) {
			const hideParameter =
				this._showParameters && this._showParameters.hideOnBlur;
			const hideEditor = hideParameter !== undefined ? hideParameter : true;
			const focusTarget = blurEvent.relatedTarget;

			if (
				hideEditor &&
				!this._isHideForbidden &&
				!this.domNode.contains(focusTarget)
			) {
				this.hide();
			}
		},

		_onEditorKeyDown: function (keyEvent) {
			const keyCode = keyEvent.which || keyEvent.keyCode;

			switch (keyCode) {
				case 13:
					this._onApplyValue();
					break;
				case 27:
					this._onDiscardValue();
					break;
				default:
					break;
			}

			keyEvent.stopPropagation();
		},

		_getEditorCssClasses: function (editorParameters) {
			return 'propertyeditor';
		},

		_buildEditorTemplate: function (editorParameters) {
			const titleTemplate = this._buildTitleTemplate(editorParameters);
			const mainLayoutTemplate = this._buildMainLayoutTemplate(
				editorParameters
			);
			const editorCssClasses = this._getEditorCssClasses(editorParameters);

			return this.wrapInTag(titleTemplate + mainLayoutTemplate, 'div', {
				class: editorCssClasses,
				controlNode: 'editorNode',
				tabIndex: -1
			});
		},

		_buildTitleTemplate: function (editorParameters) {
			const titleLabel = editorParameters && editorParameters.titleLabel;

			if (titleLabel) {
				return this.wrapInTag(titleLabel, 'div', {
					class: 'propertyeditor_title',
					controlNode: 'titleLabel'
				});
			}

			return '';
		},

		_buildMainLayoutTemplate: function (editorParameters) {
			const controlTemplate =
				this._buildEditControlTemplate(editorParameters) || '';
			const buttonsTemplate =
				this._buildButtonsTemplate(editorParameters) || '';

			return this.wrapInTag(controlTemplate + buttonsTemplate, 'div', {
				class: 'propertyeditor_mainlayout'
			});
		},

		_buildButtonsTemplate: function (editorParameters) {
			const applyButtonImage = this.wrapInTag('', 'img', {
				class: 'aras-button__icon',
				src: this._iconPaths.applyButton
			});
			const cancelButtonImage = this.wrapInTag('', 'img', {
				class: 'aras-button__icon',
				src: this._iconPaths.cancelButton
			});
			const applyButton = this.wrapInTag(applyButtonImage, 'button', {
				class: 'aras-button aras-button_apply',
				controlNode: 'applyButton',
				title: this._resourceStrings.applyButtonTitle
			});
			const cancelButton = this.wrapInTag(cancelButtonImage, 'button', {
				class: 'aras-button aras-button_cancel',
				controlNode: 'cancelButton',
				title: this._resourceStrings.cancelButtonTitle
			});

			return applyButton + cancelButton;
		},

		_buildEditControlTemplate: function (editorParameters) {
			return '';
		},

		_preparePopupParameters: function (inputParameters) {
			const popupParameters = {
				popup: this._getTooltipDialog()
			};

			if (inputParameters.x && inputParameters.y) {
				popupParameters.x = inputParameters.x;
				popupParameters.y = inputParameters.y;
			} else {
				popupParameters.around = inputParameters.element;
			}

			return popupParameters;
		},

		_onBeforeShow: function (showParameters) {
			showParameters = showParameters || {};

			if (showParameters.titleLabel !== undefined) {
				const titleLabelNode = this.controlNodes.titleLabel;

				if (titleLabelNode) {
					titleLabelNode.textContent = showParameters.titleLabel;
				}
			}

			if (showParameters.value !== undefined) {
				this.setValue(showParameters.value, {
					forceSet: true,
					skipValidation: true
				});
			}
			this._initialValue = showParameters.value;
		},

		_onAfterShow: function (showParameters) {
			this._adjustPosition(showParameters);
		},

		_adjustPosition: function (showParameters) {
			const popupNode = this.domNode.parentNode;
			const popupPositionY = showParameters.y;
			const popupHeight = popupNode.offsetHeight;
			const popupContainer = this.domNode.ownerDocument.body;
			const containerHeight = popupContainer.offsetHeight;
			const containerScrollY = popupContainer.scrollTop;

			if (containerHeight + containerScrollY - popupPositionY < popupHeight) {
				// there is not enought vertical space to display control
				const anchorNode = showParameters.anchorNode;
				const anchorHeight = anchorNode ? anchorNode.offsetHeight : 0;

				popupNode.style.top =
					popupPositionY - popupHeight - anchorHeight + 'px';
				this.domNode.classList.add('AboveDialog');
			} else {
				this.domNode.classList.remove('AboveDialog');
			}
		},

		_validateValue: function (targetValue) {
			const showParameters = this._showParameters;
			const valueValidator = showParameters.valueValidator;

			return valueValidator
				? valueValidator(this, targetValue)
				: {
						isValid: true,
						errorMessage: ''
				  };
		},

		_onValueInvalid: function (invalidValue, validationInfo) {},

		_showConfirmationDialog: function (confirmationMessage) {
			const topWindow = this.aras.getMostTopWindowWithAras();

			return topWindow.ArasModules.Dialog.show('iframe', {
				buttons: {
					btnYes: this.aras.getResource('', 'common.ok'),
					btnCancel: this.aras.getResource('', 'common.cancel')
				},
				defaultButton: 'btnCancel',
				aras: this.aras,
				center: true,
				dialogHeight: 180,
				dialogWidth: 300,
				message: confirmationMessage,
				content: 'groupChgsDialog.html'
			}).promise;
		},

		dropValue: function () {
			this.setValue(this._initialValue, {
				forceSet: true,
				skipValidation: true
			});
		},

		show: function (showParameters) {
			showParameters = showParameters || {};

			return new Promise(
				function (resolve) {
					const popupParameters = this._preparePopupParameters(showParameters);

					this._showParameters = showParameters;

					this._onBeforeShow(showParameters);

					this._popupResolve = resolve;
					this._popupParameters = popupParameters;
					popup.open(popupParameters);

					this._onAfterShow(showParameters);

					this._isShown = true;
				}.bind(this)
			);
		},

		hide: function (returnValue) {
			if (this._isShown && !this._isHideForbidden) {
				this._isShown = false;
				this._popupResolve(returnValue);

				if (this.tooltipDialog) {
					popup.close(this.tooltipDialog);
				}
			}
		},

		destroy: function () {
			this._destroyDialog();
		},

		isVisible: function () {
			return this._isShown;
		},

		getValue: function () {
			return this.value;
		},

		setValue: function (newValue, optionalParameters) {
			optionalParameters = optionalParameters || {};

			if (optionalParameters.forceSet || newValue !== this.value) {
				const validationResult = optionalParameters.skipValidation
					? { isValid: true }
					: this._validateValue(newValue);

				if (validationResult.isValid) {
					this.value = newValue;
					return true;
				} else {
					this._onValueInvalid(newValue, validationResult);
				}
			}
		},

		wrapInTag: function (sourceString, tagName, tagAttributes) {
			if (tagName) {
				let attributeString = '';

				if (tagAttributes) {
					for (let attributeName in tagAttributes) {
						if (
							tagAttributes[attributeName] !== '' &&
							tagAttributes[attributeName] !== undefined
						) {
							attributeString +=
								' ' + attributeName + '="' + tagAttributes[attributeName] + '"';
						}
					}
				}

				return (
					'<' +
					tagName +
					attributeString +
					'>' +
					sourceString +
					'</' +
					tagName +
					'>'
				);
			} else {
				return sourceString || '';
			}
		}
	});
});
