define([
	'dojo/_base/declare',
	'Controls/Common/RenderUtils',
	'Modules/aras.innovator.core.Core/Scripts/Classes/Eventable'
], function (declare, RenderUtils, Eventable) {
	return declare('TemplatedEditor.InputGroup', [Eventable], {
		owner: null,
		domNode: null,
		contentNode: null,
		renderUtils: null,
		id: null,
		defaultValue: null,
		isActive: false,
		errorString: '',
		_idCounter: { count: 0 },
		_editorEventListeners: null,
		_domEventListeners: null,
		_descriptor: null,
		_value: '',
		_approvedValue: '',
		_focused: false,
		_intellisenseSuppressed: false,

		constructor: function (ownerEditor, groupDescriptor) {
			groupDescriptor = groupDescriptor || {};

			this._constructorInitProperties(ownerEditor, groupDescriptor);

			this.setValue(this.defaultValue);
			this.attachEditorEventListeners();
		},

		_constructorInitProperties: function (ownerEditor, groupDescriptor) {
			this.owner = ownerEditor;
			this.renderUtils = RenderUtils;
			this.id = this._getNextId();

			this._descriptor = groupDescriptor;
			this._editorEventListeners = [];
			this._domEventListeners = [];

			if (groupDescriptor) {
				this.type = groupDescriptor.type || 'default';
				this.defaultValue = groupDescriptor.defaultValue || '';
			}
		},

		_getNextId: function () {
			return ++this._idCounter.count;
		},

		activateGroup: function () {
			this.isActive = true;
			this.toggleCssClasses('inactiveGroup', !this.isActive);
		},

		deactivateGroup: function () {
			this.isActive = false;
			this.toggleCssClasses('inactiveGroup', !this.isActive);
		},

		renderGroup: function () {
			var groupNodeAttributes = this._getRenderGroupNodeAttributes();
			var contentNodeAttributes = this._getRenderContentNodeAttributes();
			var contentNodeHTML = this.renderUtils.HTML.wrapInTag(
				this._prepareValueForDom(this._value),
				'div',
				contentNodeAttributes
			);
			var focusMarkNodeHTML = this.renderUtils.HTML.wrapInTag('', 'div', {
				class: 'focusMark'
			});

			return this.renderUtils.HTML.wrapInTag(
				contentNodeHTML + focusMarkNodeHTML,
				'div',
				groupNodeAttributes
			);
		},

		getState: function () {
			return null;
		},

		restoreState: function () {},

		getValue: function () {
			return this._value;
		},

		getApprovedValue: function () {
			return this._approvedValue;
		},

		setValue: function (newValue, optionalParameters) {
			optionalParameters = optionalParameters || {};

			if (newValue !== this._value || optionalParameters.forceChange) {
				this._value = newValue;
				this._refreshContentNode();

				if (!optionalParameters.suppressChangeEvent) {
					this.onValueChanged();
				}
			}
		},

		resetValue: function (optionalParameters) {
			this._approvedValue = '';

			this.setValue(this.defaultValue, optionalParameters);
		},

		_refreshContentNode: function () {
			if (this.contentNode) {
				this.contentNode.innerHTML = this._prepareValueForDom(this._value);

				if (!this._value) {
					var ownerDocument = this.contentNode.ownerDocument;

					this.contentNode.appendChild(ownerDocument.createTextNode(''));
				}
			}
		},

		_getValueFromDom: function () {
			return this.contentNode.textContent.replace(/\s/g, ' ');
		},

		_prepareValueForDom: function (contentValue) {
			return contentValue.replace(/\s/g, '\u00A0');
		},

		onValueChanged: function () {
			this.validateInput();
			this.raiseEvent('onValueChanged', this);
		},

		validateInput: function () {
			this._approvedValue = this._value;
			this.raiseEvent('onValueEntered', this, this._approvedValue);
		},

		isInputValid: function () {
			return true;
		},

		isEditable: function () {
			return false;
		},

		isMultiValue: function () {
			return false;
		},

		toggleCssClasses: function (cssClassNames, turnStyleOn) {
			if (this.domNode && cssClassNames) {
				var cssClasses = Array.isArray(cssClassNames)
					? cssClassNames
					: cssClassNames.split(' ');
				var classList = this.domNode.classList;
				var i;

				for (i = 0; i < cssClasses.length; i++) {
					if (turnStyleOn) {
						classList.add(cssClasses[i]);
					} else {
						classList.remove(cssClasses[i]);
					}
				}
			}
		},

		isIntellisenseSuppressed: function () {
			return this._intellisenseSuppressed;
		},

		getIntelliSenseOptions: function () {
			return [];
		},

		applyIntellisenseValue: function (selectedValue, intellisenseContext) {
			this.setValue(selectedValue);
		},

		getIntelliSenseContext: function () {
			return null;
		},

		onFocusHandler: function () {
			this._focused = true;

			this.toggleCssClasses('focusedGroup', true);
			this.raiseEvent('onGroupFocus', this);
		},

		onBlurHandler: function (blurEvent) {
			this._focused = false;

			this.toggleCssClasses('focusedGroup', false);
			this.raiseEvent('onGroupBlur', this, blurEvent);
		},

		attachDomEventListeners: function (targetDomNode) {
			if (targetDomNode) {
				this._attachDomEventListener(
					targetDomNode,
					'focus',
					this.onFocusHandler.bind(this)
				);
				this._attachDomEventListener(
					targetDomNode,
					'blur',
					this.onBlurHandler.bind(this)
				);
			}
		},

		_attachDomEventListener: function (targetNode, eventName, eventHandler) {
			targetNode.addEventListener(eventName, eventHandler);

			this._domEventListeners.push({
				node: targetNode,
				event: eventName,
				handler: eventHandler
			});
		},

		removeDomEventListeners: function () {
			var handlerDescriptor;
			var i;

			for (i = 0; i < this._domEventListeners.length; i++) {
				handlerDescriptor = this._domEventListeners[i];
				handlerDescriptor.node.removeEventListener(
					handlerDescriptor.event,
					handlerDescriptor.handler
				);
			}

			this._domEventListeners = [];
		},

		removeEditorEventListeners: function () {
			var i;

			for (i = 0; i < this._editorEventListeners.length; i++) {
				this._editorEventListeners[i].remove();
			}

			this._editorEventListeners = [];
		},

		focus: function () {
			if (this.domNode) {
				this.contentNode.focus();
			}
		},

		_getRenderCssClasses: function () {
			var resultClasses = ['inputGroup'];

			if (!this._value) {
				resultClasses.push('emptyGroup');
			}

			if (this._descriptor.cssClass) {
				resultClasses.push(this._descriptor.cssClass);
			}

			if (!this.isActive) {
				resultClasses.push('inactiveGroup');
			}

			if (this.errorString) {
				resultClasses.push('invalidInput');
			}

			return resultClasses;
		},

		_getRenderGroupNodeAttributes: function () {
			var cssClasses = this._getRenderCssClasses();

			return {
				class: cssClasses.join(' '),
				groupId: this.id,
				title: this._descriptor.title || ''
			};
		},

		_getRenderContentNodeAttributes: function () {
			var contentNodeAttributes = {
				class: 'groupContent'
			};

			if (this.owner.isEditable()) {
				contentNodeAttributes.tabindex = 1;
			}

			return contentNodeAttributes;
		},

		isFocused: function (targetMenu) {
			return this._focused;
		},

		attachEditorEventListeners: function () {
			if (this.owner) {
				var callbackDescriptor = this.owner.addEventListener(
					this,
					this,
					'onRender',
					this.onRenderEditorHandler.bind(this)
				);

				this._editorEventListeners.push(callbackDescriptor);
			}
		},

		onRenderEditorHandler: function () {
			this.domNode = this.owner.getGroupDomNode(this);
			this.contentNode = this.domNode.querySelector('.groupContent');

			this.removeDomEventListeners();

			if (this.owner.isEditable()) {
				this.attachDomEventListeners(this.contentNode);
			}

			this._refreshContentNode();
		}
	});
});
