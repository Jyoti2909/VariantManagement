define([
	'dojo/_base/declare',
	'dijit/TooltipDialog',
	'dijit/popup',
	'dojo/on',
	'dijit/focus',
	'dojo/aspect'
],
function(declare, DojoTooltipDialog, popup, on, dijitFocus, aspect) {
	var dialogModule;

	return declare('Aras.Client.Controls.RequirementDocument.RequirementDialog', null, {
		_formId: null,
		aras: null,
		_tooltipElement: null,
		_dojoTooltipDialog: null,
		_listeners: [],
		_onClose: null,
		hideOnBlur: true,
		userEventCallbacks: null,
		_focusEventListenersTopWnd: null,
		_hideOnBlurSpecialHandling: null,
		_reqItem: null,
		_overlay: null,
		reqItemTypeNode: null,
		_fieldsComponents: null,

		constructor: function(args) {
			this._formId = 'E2EEAB96627546EBBC945E01F6D678ED',
			this.aras = args.aras;
			this.topWindow = this.aras.getMostTopWindowWithAras(window);
			this.userEventCallbacks = {};
			this._hideOnBlurSpecialHandling = [];

			this._overlay = document.createElement('div');
			this._overlay.className = 'tooltip_dialog_overlay';
			this._overlay.addEventListener('click', function(e) {
				e.stopPropagation();
			});
			this.reqItemTypeNode = this.getReqItemTypeDictionary();
		},

		_blockDocument: function() {
			document.body.appendChild(this._overlay);
		},

		_unblockDocument: function() {
			document.body.removeChild(this._overlay);
		},

		_setAvailableFieldsComponents: function() {
			this._fieldsComponents = [];

			const dialogWindow = this._dojoTooltipDialog.frameElement.contentWindow;
			const formFields = this.getFormFields();
			const formFieldsProperties = this.getFormFieldsProperties(formFields);

			for (let propIndex = 0; propIndex < formFieldsProperties.length; propIndex++) {
				const propName = formFieldsProperties[propIndex];
				const fieldComponent = dialogWindow.getFieldComponentByName(propName);
				if (fieldComponent) {
					this._fieldsComponents.push(fieldComponent);
				}
			}
		},

		_isFormFieldsValid: function() {
			for (let i = 0; i < this._fieldsComponents.length; i++) {
				const fieldComponent = this._fieldsComponents[i].component;
				if (fieldComponent._getCurrentInputValue() && !fieldComponent.validate()) {
					return false;
				}
			}
			return true;
		},

		_setSpeciallogicForDialogsInTooltipDialog: function(enable) {
			if (enable) {
				var dialogModule = this.topWindow.ArasModules.Dialog;

				var beforeShow = aspect.before(dialogModule.prototype, 'show', function() {
					this.hideOnBlur = false;
				}.bind(this));

				// this subscription is used to get context of dialog instance
				// instance has promise, which is resolved whend dialog was closed by esc key or close button
				const aroundShow = aspect.around(dialogModule.prototype, 'show', function(original) {
					const self = this;
					return function() {
						this.promise.then(function() {
							self._dojoTooltipDialog.focus();
							self.hideOnBlur = true;
						});
						return original.apply(this, arguments);
					};
				}.bind(this));

				this._hideOnBlurSpecialHandling.push(beforeShow);
				this._hideOnBlurSpecialHandling.push(aroundShow);
			} else {
				for (var aspectIndex = 0; aspectIndex < this._hideOnBlurSpecialHandling.length; aspectIndex++) {
					this._hideOnBlurSpecialHandling[aspectIndex].remove();
				}
			}
		},

		_destroy: function() {
			this._setSpeciallogicForDialogsInTooltipDialog(false);
			var dialogWidget = this._dojoTooltipDialog;
			var i;

			this._dojoTooltipDialog = null;

			for (i = 0; i < this._listeners.length; i++) {
				this._listeners[i].remove();
			}

			this._listeners = [];
			this.userEventCallbacks = {};
			this._fieldsComponents = null;

			if (dialogWidget) {
				// normalizing dijitFocus stack before closing dialog
				dialogWidget.focus();

				// implicitly clenup src in order to force 'unload' event
				dialogWidget.frameElement.src = '';
				dialogWidget.frameElement = null;

				popup.close(dialogWidget);
				dialogWidget.destroyRecursive();
			}

			if (dialogModule) {
				dialogModule.show = dialogModule.originalFuncShow;
				dialogModule.alert = dialogModule.originalFuncAlert;
			}
		},

		_on: function(domNode, eventName, func) {
			this._listeners.push(on(domNode, eventName, func));
		},

		_executeUserEventCallback: function(eventName) {
			var eventCallback = this.userEventCallbacks[eventName];

			if (typeof eventCallback === 'function') {
				var eventArguments = Array.prototype.slice.call(arguments, 1);

				return eventCallback.apply(this, eventArguments);
			}
		},

		_getFormNode: function() {
			if (this._formId) {
				var formDisplay = this.aras.getFormForDisplay(this._formId);
				return formDisplay.node;
			}
		},

		show: function(requirementParameters) {
			if (requirementParameters) {
				this._reqItem = requirementParameters.requirement;
				var formNode = this._getFormNode();
				var height = this.aras.getItemProperty(formNode, 'height');
				var width = this.aras.getItemProperty(formNode, 'width');
				var itemTypeNd = this.aras.getItemTypeDictionary('re_Requirement').node;
				this.setDefaultValuesToItem(this._reqItem);
				this.aras.uiPopulatePropertiesOnWindow(window, this._reqItem.node, itemTypeNd, formNode, true);
				var request = this.aras.uiDrawFormEx(formNode, 'add', itemTypeNd);
				this._showDialog(requirementParameters, request, height, width);
			}
		},

		_showDialog: function(requirementParameters, formUrl, height, width) {
			this._destroy();
			this._setSpeciallogicForDialogsInTooltipDialog(true);

			var iframeId = 'formIframeTooltipDialog';
			this._dojoTooltipDialog = new DojoTooltipDialog({id: 'tooltipId'});
			this.userEventCallbacks = requirementParameters.callback || {};

			this._dojoTooltipDialog.set('content', '<iframe id="' + iframeId + '" src="' + formUrl + '" style="width: 100%; height: 100%;' +
				(height && height > 0 ? 'min-height:' + height + 'px; height: ' + height + 'px;' : '') +
				(width && width > 0 ? ' width: ' + width + 'px;' : '')
				+ ' display: block;" frameborder="0"></iframe>'
			);

			popup.open({
				popup: this._dojoTooltipDialog,
				around: requirementParameters.node,
				orient: ['before-centered', 'after-centered']
			});

			var iframe = document.getElementById(iframeId);
			iframe.contentWindow.tooltipDialog = this;
			this._dojoTooltipDialog.frameElement = iframe;
			this._disableContextMenuInIframe(iframe.contentWindow, iframe.contentDocument);
			this._subscribeDialogEvents(this._dojoTooltipDialog);
			this._blockDocument();
		},

		_disableContextMenuInIframe: function(frameWindow, frameDocument) {
			frameWindow.addEventListener('load', function(menuEvent) {
				var contextMenuHandler = function(menuEvent) {
					menuEvent.preventDefault();
					menuEvent.stopPropagation();
				};
				var focusEventListenersFrameWnd;
				var unloadHandler = function() {
					frameDocument.removeEventListener('contextmenu', contextMenuHandler);
					frameWindow.removeEventListener('beforeunload', unloadHandler);
					focusEventListenersFrameWnd.remove();
					if (this._focusEventListenersTopWnd) {
						this._focusEventListenersTopWnd.remove();
						this._focusEventListenersTopWnd = null;
					}
				};
				frameDocument.addEventListener('contextmenu', contextMenuHandler);
				frameWindow.addEventListener('beforeunload', unloadHandler);
				focusEventListenersFrameWnd = dijitFocus.registerWin(frameWindow);
			});

			this._on(this._dojoTooltipDialog.domNode, 'contextmenu', function(menuEvent) {
				menuEvent.preventDefault();
				menuEvent.stopPropagation();
			});
		},

		cancel: function() {
			this._executeUserEventCallback('onCancel');
			this._destroy();
			this._unblockDocument();
		},

		_subscribeDialogEvents: function(dialogWidget) {
			dialogWidget.own(on(dialogWidget.domNode, 'keydown', dialogWidget._onKey.bind(dialogWidget)));
			dialogWidget.on('blur', function() {
				if (!this._focusEventListenersTopWnd) {
					this._focusEventListenersTopWnd = dijitFocus.registerWin(this.topWindow);
				}

				if (!this._fieldsComponents) {
					this._setAvailableFieldsComponents();
				}

				if (!this.hideOnBlur || !this._isFormFieldsValid() || !this._executeUserEventCallback('onSuccess')) {
					this._dojoTooltipDialog.focus();
					return;
				}

				this._unblockDocument();
				this._destroy();
			}.bind(this));
			const frameWindow = this._dojoTooltipDialog.frameElement.contentWindow;
			frameWindow.addEventListener('keydown', function(e) {
				if (e.keyCode == 27) {
					this.cancel();
				}
			}.bind(this));
			this._on(this._dojoTooltipDialog, 'cancel', this.cancel.bind(this));
		},

		getReqItemTypeDictionary: function() {
			return this.aras.getItemTypeDictionary('re_Requirement').node;
		},

		getFormFields: function() {
			var formNode = this._getFormNode();
			return formNode.selectNodes('Relationships/Item[@type=\'Body\']/Relationships/Item[@type=\'Field\']');
		},

		getFormFieldsProperties: function(formFields) {
			var formFieldsProperties = [];
			for (var fieldIndex = 0; fieldIndex < formFields.length; fieldIndex++) {
				var propName = this.aras.getItemPropertyAttribute(formFields[fieldIndex], 'propertytype_id', 'keyed_name');
				formFieldsProperties.push(propName);
			}
			return formFieldsProperties;
		},

		setDefaultValuesToItem: function(reqDocItem) {
			var formFields = this.getFormFields();
			var formFieldsProperties = this.getFormFieldsProperties(formFields);
			var propsWithDefaultValue = this.reqItemTypeNode.selectNodes('Relationships/Item[@type=\'Property\' and not(default_value=\'\')]');
			for (var propIndex = 0; propIndex < propsWithDefaultValue.length; propIndex++) {
				var propName = this.aras.getItemProperty(propsWithDefaultValue[propIndex], 'name');
				var matchIndex = formFieldsProperties.indexOf(propName);
				if (matchIndex !== -1) {
					reqDocItem.setProperty(propName, this.aras.getItemProperty(propsWithDefaultValue[propIndex], 'default_value'));
				}
			}
		},

		getRequiredFields: function() {
			var fieldsLabelsMap = [];
			var formFields = this.getFormFields();
			var requiredItemProperties = this.reqItemTypeNode.selectNodes('Relationships/Item[@type=\'Property\' and (is_required=\'1\')]');
			var formFieldsProperties = this.getFormFieldsProperties(formFields);
			for (var propIndex = 0; propIndex < requiredItemProperties.length; propIndex++) {
				var propName = this.aras.getItemProperty(requiredItemProperties[propIndex], 'name');
				var matchIndex = formFieldsProperties.indexOf(propName);
				if (matchIndex !== -1) {
					var label = this.aras.getItemProperty(formFields[matchIndex], 'label');
					fieldsLabelsMap.push({
						label: label,
						name: propName
					});
				}
			}
			return fieldsLabelsMap;
		}
	});
});
