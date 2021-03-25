define([
	'dojo/_base/declare',
	'dojo/_base/connect',
	'dijit/popup',
	'./InputGroups/InputGroupFactory',
	'Aras/Client/Controls/Experimental/ContextMenu',
	'Modules/aras.innovator.core.Core/Scripts/Classes/Eventable'
], function (
	declare,
	connect,
	popup,
	InputGroupFactory,
	ContextMenu,
	Eventable
) {
	return declare('TemplatedEditor', [Eventable], {
		containerNode: null,
		domNode: null,
		contextMenu: null,
		_inputTemplate: null,
		_isIntelliSenseActive: false,
		_inputGroups: null,
		_groupsByName: null,
		_groupFactory: null,
		_groupEventListeners: null,
		_domEventListeners: null,
		_keyHandlers: null,
		_isValueLoading: false,
		_isResetValueLoading: false,
		_isRestoringState: false,
		_currentState: null,
		_inputStarted: false,
		_isEditable: false,
		_newFocusEventTarget: null,
		_menuAhcnorNode: null,

		constructor: function (initialArguments) {
			initialArguments = initialArguments || {};

			if (initialArguments.connectId) {
				this.containerNode =
					typeof initialArguments.connectId == 'string'
						? document.getElementById(initialArguments.connectId)
						: initialArguments.connectId;
				this._inputGroups = [];
				this._groupsByName = {};
				this._groupFactory = new InputGroupFactory(this);
				this._groupEventListeners = [];
				this._keyHandlers = {};
				this._domEventListeners = [];

				this._setupDomNode(this.containerNode);
				this.setInputTemplate(initialArguments.template || []);

				// context menu initialization
				if (initialArguments.contextMenuEnabled) {
					this._createContextMenu();
				}

				// intelliSense menu initialization
				this.intelliSenseMenu = new ContextMenu();

				this.setEditState(initialArguments.isEditable);
			}
		},

		setInputTemplate: function (inputTemplate) {
			/// <summary>
			/// Set editor input template.
			/// </summary>
			/// <param name="inputTemplate" type="[Object]">Template, which contains list of groups as 'template' array property and settings for each
			/// particular group.
			/// </param>
			if (inputTemplate) {
				this._inputTemplate = inputTemplate;
				this._inputStarted = false;
			}
		},

		getInputTemplate: function () {
			/// <summary>
			/// Get current editor input template.
			/// </summary>
			/// <returns>Object. Template descriptor or null.</returns>
			return this._inputTemplate;
		},

		setEditState: function (isEditable) {
			/// <summary>
			/// Switch edit state for the control.
			/// </summary>
			/// <param name="isEditable" type="Boolean">Applied value defines is editor content can be modified.</param>
			var newState = Boolean(isEditable);

			if (this._isEditable !== newState) {
				this._isEditable = newState;

				this.toggleCssClasses('aras-rule-editor_disabled', !newState);
				this._renderGroups();
			}
		},

		toggleCssClasses: function (cssClassNames, turnStyleOn, targetNode) {
			/// <summary>
			/// Method allows to toggle domNode css classes.
			/// </summary>
			/// <param name="cssClassNames" type="String|Array">Class names, which should be added or removed from the Node.</param>
			/// <param name="turnStyleOn" type="Boolean">If true, then classes will be added to the Node in other case they will be removed</param>
			/// <param name="targetNode" type="DOM Node, Nullable">Node, which should be modified. If parameter was not passed, then classes will be applied
			///  to editor DOM Node.
			/// </param>
			targetNode = targetNode || this.containerNode;

			if (targetNode && cssClassNames) {
				var cssClasses = Array.isArray(cssClassNames)
					? cssClassNames
					: cssClassNames.split(' ');
				var classList = targetNode.classList;
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

		isEditable: function () {
			/// <summary>
			/// Get edit state of the control.
			/// </summary>
			/// <returns>Boolean</returns>
			return this._isEditable;
		},

		_attachDomEventListeners: function (targetDomNode) {
			if (targetDomNode) {
				this._attachDomEventListener(
					targetDomNode,
					'focus',
					this._onFocusHandler.bind(this)
				);
				this._attachDomEventListener(
					targetDomNode,
					'blur',
					this._onBlurHandler.bind(this)
				);
				this._attachDomEventListener(
					targetDomNode,
					'keydown',
					this._onKeyDownHandler.bind(this)
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

		_removeDomEventListeners: function () {
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

		_onFocusHandler: function () {
			this.raiseEvent('onFocus');
		},

		_onBlurHandler: function (blurEvent) {
			this._newFocusEventTarget =
				blurEvent.explicitOriginalTarget ||
				blurEvent.relatedTarget ||
				document.activeElement;

			if (
				this._isIntelliSenseActive &&
				!this.isMenuFocused(this.intelliSenseMenu)
			) {
				this.hideIntelliSenseMenu();
			}

			if (!this.isEditorFocused()) {
				this.raiseEvent('onBlur', blurEvent);
			}
		},

		_onGroupFocusHandler: function (sourceGroup) {
			this.activeGroup = sourceGroup;

			if (!this.activeGroup.getValue() || !this.activeGroup.isInputValid()) {
				this.showIntelliSense(this.activeGroup);
			} else {
				this.hideIntelliSenseMenu();
			}
		},

		_onGroupBlurHandler: function (sourceGroup, blurEvent) {
			this.raiseEvent('onStateChanged');
			this._onBlurHandler(blurEvent);
		},

		_onGroupValueChangedHandler: function (sourceGroup) {
			if (!this._isValueLoading) {
				if (sourceGroup === this.activeGroup) {
					if (!sourceGroup._value) {
						this.hideIntelliSenseMenu();
					} else {
						this.showIntelliSense(sourceGroup);
					}
				}
			}

			if (!this._isValueLoading || this._isResetValueLoading) {
				this._onValueChanged();
			}
		},

		_onGroupValueEnteredHandler: function (sourceGroup) {
			if (this._inputStarted) {
				var groupIndex = this.getGroupIndex(sourceGroup);
				var groupCount = this._inputGroups.length;

				if (groupIndex < groupCount - 1) {
					var nextGroup = this._inputGroups[groupIndex + 1];

					if (!nextGroup.isActive) {
						nextGroup.activateGroup();
						nextGroup.focus();
					}
				}

				if (
					!this._isValueLoading ||
					this._isResetValueLoading ||
					this._isRestoringState
				) {
					this.raiseEvent(
						'onGroupValueEntered',
						sourceGroup,
						sourceGroup.getApprovedValue()
					);
				}
			}
		},

		_onGroupInvalidateIntellisense: function (sourceGroup) {
			if (this._isIntelliSenseActive && sourceGroup === this.activeGroup) {
				this.showIntelliSense(sourceGroup);
			}
		},

		_onValueChanged: function () {
			if (!this._isResetValueLoading) {
				this._saveState();
			}

			if (this.isInputValid()) {
				this.containerNode.classList.remove('editorInvalidInput');
			} else {
				this.containerNode.classList.add('editorInvalidInput');
			}

			this.raiseEvent('onValueChanged');
		},

		isInputValid: function () {
			/// <summary>
			/// Identifies that values from all input groups passed validation.
			/// </summary>
			/// <returns>Boolean</returns>
			var inputGroup;
			var i;

			for (i = 0; i < this._inputGroups.length; i++) {
				inputGroup = this._inputGroups[i];

				if (!inputGroup.isInputValid()) {
					return false;
				}
			}

			return true;
		},

		isInputStarted: function () {
			/// <summary>
			/// Identifies that template was set and all input groups were created.
			/// </summary>
			/// <returns>Boolean</returns>
			return this._inputStarted;
		},

		focus: function () {
			/// <summary>
			/// Places focus into active or first input group.
			/// </summary>
			/// <returns>Boolean</returns>
			var focusGroup =
				this.activeGroup || (this._inputGroups.length && this._inputGroups[0]);

			if (focusGroup) {
				focusGroup.focus();
			} else {
				this.contentDomNode.focus();
			}
		},

		focusGroup: function (groupName) {
			/// <summary>
			/// Places focus into particualr input group.
			/// </summary>
			/// <param name="groupName" type="String">Group name from template.</param>
			var targetGroup = this._groupsByName[groupName];

			if (targetGroup) {
				targetGroup.focus();
			}
		},

		focusFirstEditableGroup: function () {
			/// <summary>
			/// Places focus into first input group, which supports user iput.
			/// </summary>
			if (this._isEditable) {
				var groupsCount = this._inputGroups.length;
				var groupIndex = 0;

				while (groupIndex < groupsCount - 1) {
					inputGroup = this._inputGroups[groupIndex];
					inputGroup.activateGroup();

					if (!inputGroup.isEditable()) {
						groupIndex += 1;
					} else {
						inputGroup.focus();
						break;
					}
				}
			}
		},

		undoChange: function () {
			/// <summary>
			/// Drop previous editor value change.
			/// </summary>
			this._restoreState(this._currentState && this._currentState.prev);
		},

		redoChange: function () {
			/// <summary>
			/// Turn back change, that was previously dropped.
			/// </summary>
			this._restoreState(this._currentState && this._currentState.next);
		},

		getCurrentState: function () {
			/// <summary>
			/// Get current editor state info.
			/// </summary>
			/// <returns>Object with editor state information.</returns>
			return this._currentState;
		},

		_restoreState: function (targetState) {
			this._isRestoringState = true;

			if (targetState && targetState !== this._currentState) {
				this.setValue(targetState.value);

				if (targetState.activeGroup) {
					targetState.activeGroup.focus();
					targetState.activeGroup.restoreState(targetState.activeGroupState);
				}

				this._currentState = targetState;
			}

			this._isRestoringState = false;
			this.raiseEvent('onStateChanged');
		},

		resetChanges: function () {
			/// <summary>
			/// Reset all value changes. Editor will have initial value.
			/// </summary>
			var currentState = this._currentState;

			if (currentState) {
				while (currentState.prev) {
					currentState = currentState.prev;
				}

				this._restoreState(currentState);
			}
		},

		setStartState: function (startState) {
			/// <summary>
			/// Setup editor accordingly to state settings. Current changes queue will be dropped.
			/// </summary>
			if (startState) {
				startState.prev = null;
				startState.next = null;

				this._restoreState(startState);
			}
		},

		_saveState: function () {
			var currentState = this._currentState;
			var newState = {
				activeGroup: this.activeGroup,
				activeGroupState: this.activeGroup && this.activeGroup.getState(),
				value: this.getValue(),
				next: null,
				prev: currentState
			};

			if (currentState) {
				currentState.next = newState;
			}

			this._currentState = newState;
			this.raiseEvent('onStateChanged');
		},

		_dropChangesQueue: function () {
			this._currentState = null;
		},

		getValue: function (onlyApprovedValues) {
			/// <summary>
			/// Get current editor value.
			/// </summary>
			/// <returns>Object with values from all input groups. Key is group name from template.</returns>
			var resultValue = {};

			if (this._inputStarted) {
				var inputGroups = this._inputGroups;
				var templateParts = this._inputTemplate.template;
				var groupName;
				var currentGroup;

				for (i = 0; i < templateParts.length; i++) {
					currentGroup = inputGroups[i];
					groupName = templateParts[i];

					resultValue[groupName] = onlyApprovedValues
						? currentGroup.getApprovedValue()
						: currentGroup.getValue();
				}
			}

			return resultValue;
		},

		getStringValue: function (onlyApprovedValues) {
			/// <summary>
			/// Get editor value as string.
			/// </summary>
			/// <returns>String. Concatenation of all input group values.</returns>
			var resultValue = '';

			if (this._inputStarted) {
				var inputGroups = this._inputGroups;
				var templateParts = this._inputTemplate.template;
				var groupName;
				var currentGroup;
				var groupValue;

				for (i = 0; i < templateParts.length; i++) {
					currentGroup = inputGroups[i];
					groupName = templateParts[i];
					groupValue = onlyApprovedValues
						? currentGroup.getApprovedValue()
						: currentGroup.getValue();

					resultValue += groupValue ? ' ' + groupValue : '';
				}
			}

			return resultValue;
		},

		setValue: function (inputData) {
			/// <summary>
			/// Set editor value.
			/// </summary>
			/// <param name="inputData" type="Object">Value collection for editor input groups. Key = group name from template.</param>
			if (this._inputStarted) {
				this._isValueLoading = true;

				if (inputData) {
					var groupsNameHash = this._groupsByName;
					var defaultValueGroups = {};
					var currentGroup;
					var newValue;
					var groupName;

					for (groupName in groupsNameHash) {
						currentGroup = groupsNameHash[groupName];
						newValue = inputData[groupName];
						currentGroup.activateGroup();

						if (newValue) {
							currentGroup.setValue(newValue.toString());
						} else {
							defaultValueGroups[groupName] = currentGroup;
						}
					}

					this._isResetValueLoading = true;

					for (groupName in defaultValueGroups) {
						currentGroup = defaultValueGroups[groupName];
						currentGroup.resetValue({
							forceChange: currentGroup.defaultValue !== ''
						});
					}

					this._isResetValueLoading = false;
					this._renderGroups();

					if (!this._isRestoringState) {
						this._dropChangesQueue();
						this._onValueChanged();
					}
				}

				this._isValueLoading = false;
			}
		},

		getErrorString: function () {
			/// <summary>
			/// Get value validation error.
			/// </summary>
			/// <returns>String. Concatenation of validation errors from all input groups.</returns>
			var errorString = '';
			var inputGroup;
			var i;

			for (i = 0; i < this._inputGroups.length; i++) {
				inputGroup = this._inputGroups[i];

				if (inputGroup.errorString) {
					errorString += errorString ? ' ' : '';
					errorString += inputGroup.id + ': ' + inputGroup.errorString + '.';
				}
			}

			return errorString;
		},

		isEditorFocused: function () {
			/// <summary>
			/// Identifies is editor control has focus.
			/// </summary>
			/// <returns>Boolean</returns>
			var activeElement = this._newFocusEventTarget || document.activeElement;

			while (activeElement) {
				if (activeElement === this.containerNode) {
					return true;
				}

				activeElement = activeElement.parentNode;
			}

			return (
				this._isIntelliSenseActive && this.isMenuFocused(this.intelliSenseMenu)
			);
		},

		isMenuFocused: function (targetMenu) {
			/// <summary>
			/// Identifies is target menu control has focus.
			/// </summary>
			/// <param name="targetMenu" type="[Object, Aras.Client.Controls.Experimental.ContextMenu]">Menu widget which is used in editor.</param>
			/// <returns>Boolean</returns>
			var activeElement = this._newFocusEventTarget || document.activeElement;

			if (activeElement && targetMenu) {
				var menuDomNode = targetMenu.menu.domNode;
				var rootMenuNode = menuDomNode.parentNode || menuDomNode;

				while (activeElement) {
					if (activeElement === rootMenuNode) {
						return true;
					}

					activeElement = activeElement.parentNode;
				}
			}

			return false;
		},

		isValueModified: function () {
			/// <summary>
			/// Identifies is initial editor value was modified.
			/// </summary>
			/// <returns>Boolean</returns>
			return Boolean(this._currentState && this._currentState.prev);
		},

		registerShortcut: function (keyCode, isCtrl, isShift, callbackHandler) {
			/// <summary>
			/// Register shortcut for editor.
			/// </summary>
			/// <param name="keyCode" type="Number">Button key code.</param>
			/// <param name="isCtrl" type="Boolean">Is Ctrl key should be pressed.</param>
			/// <param name="isShift" type="Boolean">Is Shift key should be pressed.</param>
			/// <param name="callbackHandler" type="Function">Method, that will be called when shortcut is activated.</param>
			if (typeof callbackHandler === 'function') {
				var existingShortcuts =
					this._keyHandlers[keyCode] || (this._keyHandlers[keyCode] = []);

				existingShortcuts.push({
					ctrl: Boolean(isCtrl),
					shift: Boolean(isShift),
					handler: callbackHandler
				});
			}
		},

		_handleShortcuts: function (keyEvent) {
			var keyCode = keyEvent.which || keyEvent.keyCode;
			var keyHandlers = this._keyHandlers[keyCode];
			var isEventSuppressed = false;

			if (keyHandlers && !keyEvent.altKey) {
				var isCtrlPressed = keyEvent.ctrlKey || keyEvent.metaKey;
				var eventHandler;
				var i;

				for (i = 0; i < keyHandlers.length; i++) {
					eventHandler = keyHandlers[i];

					if (
						eventHandler.shift === keyEvent.shiftKey &&
						eventHandler.ctrl === isCtrlPressed
					) {
						if (eventHandler.handler.apply(this, arguments) === false) {
							isEventSuppressed = true;
						}
					}
				}
			}

			return isEventSuppressed;
		},

		_onKeyDownHandler: function (keyEvent) {
			if (this._handleShortcuts(keyEvent)) {
				this._stopEvent(keyEvent);
			} else {
				if (keyEvent.ctrlKey) {
					switch (keyEvent.keyCode) {
						case 89:
							this.redoChange();
							this._stopEvent(keyEvent);
							break;
						case 90:
							this.undoChange();
							this._stopEvent(keyEvent);
							break;
						case 32:
							this.showIntelliSense(this.activeGroup, true);
							this._stopEvent(keyEvent);
							break;
						case 40:
							if (!this._isIntelliSenseActive) {
								this.showIntelliSense(this.activeGroup, true);
							}

							if (
								this._isIntelliSenseActive &&
								!this.isMenuFocused(this.intelliSenseMenu)
							) {
								this.intelliSenseMenu.menu.focus();
							}

							this._stopEvent(keyEvent);
							break;
						default:
							break;
					}
				} else {
					var isSwitchAllowed;
					var groupState;
					var nextGroup;
					var previousGroup;

					switch (keyEvent.keyCode) {
						case 8:
							if (
								this._isIntelliSenseActive &&
								this.activeGroup &&
								!this.activeGroup.getValue()
							) {
								// There is need special handling "Backspace" key in case when no values are entered, but "IntelliSense" is shown ("Ctrl+Space").
								this.hideIntelliSenseMenu();
							}
							break;
						case 9:
						case 13:
							nextGroup = keyEvent.shiftKey
								? this.getPrevGroup(this.activeGroup)
								: this.getNextGroup(this.activeGroup);
							isSwitchAllowed =
								nextGroup.isActive || this.activeGroup.getValue();

							this._stopEvent(keyEvent);

							if (isSwitchAllowed) {
								if (!nextGroup.isActive) {
									nextGroup.activateGroup();
								}

								nextGroup.focus();
							}
							break;
						case 27:
							if (this._isIntelliSenseActive) {
								this.hideIntelliSenseMenu();
							}
							break;
						case 37:
							if (this.activeGroup) {
								groupState = this.activeGroup.getState();
								isSwitchAllowed =
									!this.activeGroup.isEditable() ||
									(groupState && groupState.cursorPosition === 0);

								if (isSwitchAllowed) {
									previousGroup = this.getPrevGroup(this.activeGroup);
									previousGroup.focus('end');

									this._stopEvent(keyEvent);
								}
							}
							break;
						case 39:
							if (this.activeGroup) {
								var groupValue = this.activeGroup.getValue();

								groupState = this.activeGroup.getState();
								isSwitchAllowed =
									!this.activeGroup.isEditable() ||
									(groupState &&
										groupState.cursorPosition === groupValue.length);

								if (isSwitchAllowed) {
									nextGroup = this.getNextGroup(this.activeGroup);
									nextGroup.focus(0);

									this._stopEvent(keyEvent);
								}
							}
							break;
						case 40:
							if (
								this._isIntelliSenseActive &&
								!this.isMenuFocused(this.intelliSenseMenu)
							) {
								this.intelliSenseMenu.menu.focus();
								this._stopEvent(keyEvent);
							}

							break;
						default:
							break;
					}
				}
			}
		},

		getGroupIndex: function (targetGroup) {
			/// <summary>
			/// Get index of particular input group.
			/// </summary>
			/// <param name="targetGroup" type="Object, InputGroup">Registered editor input group.</param>
			/// <returns>Number. Index of the group calculated based on template.</returns>
			return this._inputGroups.indexOf(targetGroup);
		},

		getGroupByIndex: function (groupIndex) {
			/// <summary>
			/// Get particular input group by index.
			/// </summary>
			/// <param name="groupIndex" type="Number">Group index from template.</param>
			/// <returns>InputGroup</returns>
			return groupIndex >= 0 && groupIndex < this._inputGroups.length
				? this._inputGroups[groupIndex]
				: -1;
		},

		getGroupByDomNode: function (targetDomNode) {
			/// <summary>
			/// Get particular input group by related DOM Node.
			/// </summary>
			/// <param name="targetDomNode" type="Node">DOM Node, which belongs to registered editor input group.</param>
			/// <returns>InputGroup</returns>
			if (targetDomNode) {
				var groupId;

				while (targetDomNode) {
					groupId =
						targetDomNode.nodeType === Node.ELEMENT_NODE &&
						targetDomNode.getAttribute('groupId');

					if (groupId) {
						var groupName;
						var inputGroup;

						for (groupName in this._groupsByName) {
							inputGroup = this._groupsByName[groupName];

							if (groupId === inputGroup.id.toString()) {
								return inputGroup;
							}
						}

						break;
					}

					targetDomNode = targetDomNode.parentNode;
				}
			}
		},

		getGroupName: function (targetGroup) {
			/// <summary>
			/// Get name of particular input group.
			/// </summary>
			/// <param name="targetGroup" type="Object, InputGroup">Registered editor input group.</param>
			/// <returns>String. Group name from template.</returns>
			var groupName;

			for (groupName in this._groupsByName) {
				if (targetGroup === this._groupsByName[groupName]) {
					return groupName;
				}
			}
		},

		getGroupByName: function (groupName) {
			/// <summary>
			/// Get registered editor input group by name from template.
			/// </summary>
			/// <param name="groupName" type="String">group name from active editor template.</param>
			/// <returns>InputGroup</returns>
			return this._groupsByName[groupName];
		},

		getGroupsCount: function () {
			/// <summary>
			/// Get count of input groups.
			/// </summary>
			/// <returns>Number</returns>
			return this._inputGroups.length;
		},

		getNextGroup: function (targetGroup) {
			/// <summary>
			/// Get next input group relatively to target group. If target group is last, then first group will be returned.
			/// </summary>
			/// <param name="targetGroup" type="Object, InputGroup">The group relatively to which next group will be searched.</param>
			/// <returns>InputGroup</returns>
			if (targetGroup) {
				var groupIndex = this.getGroupIndex(targetGroup);
				var groupsCount = this.getGroupsCount();

				return this.getGroupByIndex(
					groupIndex < groupsCount - 1 ? groupIndex + 1 : 0
				);
			}

			return this._inputGroups.length && this._inputGroups[0];
		},

		getPrevGroup: function (targetGroup) {
			/// <summary>
			/// Get previous input group relatively to target group. If it's a first editor group, then last group will be returned.
			/// </summary>
			/// <param name="targetGroup" type="Object, InputGroup">The group relatively to which previous group will be searched.</param>
			/// <returns>InputGroup</returns>
			if (targetGroup) {
				var groupIndex = this.getGroupIndex(targetGroup);
				var groupsCount = this.getGroupsCount();

				return this.getGroupByIndex(
					groupIndex === 0 ? groupsCount - 1 : groupIndex - 1
				);
			}

			return this._inputGroups.length && this._inputGroups[0];
		},

		_setupDomNode: function () {
			var ownerDocument = this.containerNode.ownerDocument;

			this.containerNode.classList.add('aras-rule-editor');
			this.containerNode.oncontextmenu = function (menuEvent) {
				this._stopEvent(menuEvent);
			}.bind(this);

			if (!this._isEditable) {
				this.containerNode.classList.add('aras-rule-editor_disabled');
			}

			this.contentDomNode = ownerDocument.createElement('div');
			this.contentDomNode.classList.add('editorContentNode');
			this.contentDomNode.setAttribute('tabindex', '-1');

			this._attachDomEventListeners(this.contentDomNode);

			this._menuAhcnorNode = ownerDocument.createElement('div');
			this._menuAhcnorNode.classList.add('menuAnchorNode');

			this.containerNode.appendChild(this.contentDomNode);
			this.containerNode.appendChild(this._menuAhcnorNode);
		},

		_attachGroupEventListeners: function (targetGroup) {
			this._groupEventListeners.push(
				targetGroup.addEventListener(
					this,
					this,
					'onGroupFocus',
					this._onGroupFocusHandler
				)
			);
			this._groupEventListeners.push(
				targetGroup.addEventListener(
					this,
					this,
					'onGroupBlur',
					this._onGroupBlurHandler
				)
			);
			this._groupEventListeners.push(
				targetGroup.addEventListener(
					this,
					this,
					'onValueEntered',
					this._onGroupValueEnteredHandler
				)
			);
			this._groupEventListeners.push(
				targetGroup.addEventListener(
					this,
					this,
					'onValueChanged',
					this._onGroupValueChangedHandler
				)
			);
			this._groupEventListeners.push(
				targetGroup.addEventListener(
					this,
					this,
					'onInvalidateIntellisense',
					this._onGroupInvalidateIntellisense
				)
			);
		},

		getGroupDomNode: function (targetGroup) {
			/// <summary>
			/// Get previous input group relatively to target group. If target group is first, then last group will be returned.
			/// </summary>
			/// <param name="targetGroup" type="Object,InputGroup | String">Existing editor input group.</param>
			/// <returns>InputGroup</returns>
			if (targetGroup) {
				var groupId =
					typeof targetGroup === 'object' ? targetGroup.id : targetGroup;

				return this.contentDomNode.querySelector(
					'.inputGroup[groupId="' + groupId + '"]'
				);
			}
		},

		startNewInput: function () {
			/// <summary>
			/// Creates editor input groups based on template, which is currently was set. All previous input groups will be removed.
			/// </summary>
			if (this._inputTemplate) {
				var inputGroups = this._inputTemplate.templateGroups;
				var templateParts = this._inputTemplate.template;
				var groupsCount = templateParts.length;

				this._cleanupEditor();

				if (groupsCount) {
					var groupDescriptor;
					var groupName;
					var inputGroup;
					var i;

					for (i = 0; i < groupsCount; i++) {
						groupName = templateParts[i];
						groupDescriptor = inputGroups[groupName];

						inputGroup = this._groupFactory.createGroup(groupDescriptor);
						this._inputGroups.push(inputGroup);
						this._groupsByName[groupName] = inputGroup;

						this._attachGroupEventListeners(inputGroup);
					}

					this._renderGroups();
					this.focusFirstEditableGroup();
					this._saveState();
				}

				this._inputStarted = true;
			}
		},

		_renderGroups: function () {
			var renderHTML = '';
			var i;

			for (i = 0; i < this._inputGroups.length; i++) {
				inputGroup = this._inputGroups[i];
				renderHTML += inputGroup.renderGroup();
			}

			this.contentDomNode.innerHTML = renderHTML;
			this.raiseEvent('onRender');
		},

		_cleanupContent: function () {
			this.contentDomNode.innerTHML = '';
		},

		_stopEvent: function (targetEvent) {
			targetEvent.stopPropagation();
			targetEvent.preventDefault();
		},

		showIntelliSense: function (targetGroup, allOptions) {
			/// <summary>
			/// Show intellisense menu with for particualar input group.
			/// </summary>
			/// <param name="targetGroup" type="Object, InputGroup">Existing editor input group.</param>
			/// <param name="allOptions" type="Boolean">If true, then all available group values will be shown. If false, then proposed values will be limited
			///  based on current group value.
			/// </param>
			if (
				targetGroup &&
				!targetGroup.isIntellisenseSuppressed() &&
				this._isEditable
			) {
				var intelliSenseOptions = targetGroup.getIntelliSenseOptions(
					allOptions
				);
				var intellisenseContext = {
					group: targetGroup,
					groupContext: targetGroup.getIntelliSenseContext()
				};

				if (
					this._showIntelliSenseMenu(
						targetGroup,
						intelliSenseOptions,
						intellisenseContext
					)
				) {
					return true;
				}
			}

			this.hideIntelliSenseMenu();
		},

		_showIntelliSenseMenu: function (
			targetGroup,
			menuItems,
			intellisenseContext
		) {
			if (targetGroup && menuItems.length) {
				var intelliSenseMenu = this.intelliSenseMenu;
				var groupDomNode =
					(intellisenseContext.groupContext &&
						intellisenseContext.groupContext.domNode) ||
					targetGroup.domNode;
				var menuWidget;
				var currentDomNode;
				var offsetLeft;
				var offsetTop;

				// at this point menu widget will be recreated
				intelliSenseMenu.removeAll();
				menuWidget = intelliSenseMenu.menu;
				menuWidget.domNode.classList.add('intellisenseMenu');

				intelliSenseMenu.addRange(menuItems);
				intelliSenseMenu.rowId = targetGroup;
				intelliSenseMenu.intellisenseContext = intellisenseContext;

				if (menuItems.selectedItemId) {
					var selectedItem = intelliSenseMenu.getItemById(
						menuItems.selectedItemId
					);

					intelliSenseMenu.menu.set('selected', selectedItem.item);
				}

				// attach menu widget event handlers
				connect.connect(menuWidget.domNode, 'mousedown', function (focusEvent) {
					// this will prevent menu from closing in Chrome during multiselection
					// or when user holds mouse button pressed for some time under menuitem
					focusEvent.preventDefault();
					focusEvent.stopPropagation();
				});

				connect.connect(
					menuWidget,
					'onBlur',
					function () {
						this.hideIntelliSenseMenu();
					}.bind(this)
				);

				connect.connect(
					menuWidget,
					'onKeyPress',
					function (keyEvent) {
						switch (keyEvent.keyCode) {
							case 27:
								this.hideIntelliSenseMenu();
								targetGroup.focus();
								break;
							case 9:
								var menuItem = this.intelliSenseMenu.menu.selected;

								this.hideIntelliSenseMenu();
								this._stopEvent(keyEvent);

								if (menuItem) {
									var isMultiValueGroup = targetGroup.isMultiValue();
									var selectedValue;

									if (isMultiValueGroup) {
										var selectedItems = menuWidget._selectedItems || [menuItem];

										selectedValue = selectedItems.map(function (currentItem) {
											return currentItem.label;
										});
									} else {
										selectedValue = menuItem.label;
									}

									this._onIntelliSenseItemClick(
										targetGroup,
										selectedValue,
										this.intelliSenseMenu.intellisenseContext
									);
								}
								break;
						}
					}.bind(this)
				);

				connect.connect(
					menuWidget,
					'onItemClick',
					function (menuItem, clickEvent) {
						var isMultiValueGroup = targetGroup.isMultiValue();
						var selectedItems;

						if (clickEvent.ctrlKey && isMultiValueGroup) {
							var itemIndex;

							selectedItems =
								menuWidget._selectedItems || (menuWidget._selectedItems = []);
							itemIndex = selectedItems.indexOf(menuItem);

							if (itemIndex !== -1) {
								menuItem.domNode.classList.toggle('selectedMenuItem', false);
								selectedItems.splice(itemIndex, 1);
							} else {
								menuItem.domNode.classList.toggle('selectedMenuItem', true);
								selectedItems.push(menuItem);
							}
						} else {
							var selectedValue;

							this.hideIntelliSenseMenu();

							if (isMultiValueGroup) {
								selectedItems = menuWidget._selectedItems || [menuItem];

								selectedValue = selectedItems.map(function (currentItem) {
									return currentItem.label;
								});
							} else {
								selectedValue = menuItem.label;
							}

							this._onIntelliSenseItemClick(
								targetGroup,
								selectedValue,
								this.intelliSenseMenu.intellisenseContext
							);
						}
					}.bind(this)
				);

				// calculating menu coordinates
				currentDomNode = groupDomNode;
				offsetLeft = offsetTop = 0;

				while (currentDomNode !== this.contentDomNode) {
					offsetLeft += currentDomNode.offsetLeft;
					offsetTop += currentDomNode.offsetTop;

					currentDomNode = currentDomNode.parentNode;
				}

				this._menuAhcnorNode.style.left = offsetLeft + 'px';
				this._menuAhcnorNode.style.top =
					offsetTop + groupDomNode.offsetHeight + 'px';
				this._menuAhcnorNode.style.display = 'block';

				// open context menu
				popup.open({
					popup: menuWidget,
					around: this._menuAhcnorNode,
					orient: ['below'],
					maxHeight: 200
				});

				this._isIntelliSenseActive = true;

				return true;
			}
		},

		_cleanupEditor: function () {
			var inputGroup;
			var i;

			this._cleanupContent();

			for (i = 0; i < this._inputGroups.length; i++) {
				inputGroup = this._inputGroups[i];
				inputGroup.removeEventListeners(this);

				inputGroup.removeDomEventListeners();
				inputGroup.removeEditorEventListeners();
			}

			this._inputGroups = [];
			this._groupsByName = {};
		},

		_createContextMenu: function () {
			this.contextMenu = new ContextMenu();
			this.containerNode.oncontextmenu = this._showContextMenu.bind(this);
		},

		_onIntelliSenseItemClick: function (
			targetGroup,
			selectedValue,
			intellisenseContext
		) {
			targetGroup.applyIntellisenseValue(
				selectedValue,
				intellisenseContext.groupContext
			);

			if (!targetGroup.isFocused()) {
				targetGroup.focus();
			}
		},

		onMenuItemClick: function (commandId, contextData) {
			/// <summary>
			/// Event raised when user click on editor context menu item.
			/// </summary>
			/// <param name="commandId" type="String">Id of selected menu item.</param>
			/// <param name="contextData" type="Any">Context information for menu.</param>
		},

		onMenuInit: function (menuEvent, targetGroup, targetGroupName) {
			/// <summary>
			/// Event raised before context menu creation. Is used to create list of requred menu items.
			/// </summary>
			/// <param name="menuEvent" type="Event">Corresponding native context menu event.</param>
			/// <param name="targetGroup" type="Object, InputGroup">Target editor input group context menu is created for.</param>
			/// <param name="targetGroupName" type="String">Input group name from template.</param>
			/// <returns>Array of menu items descriptors.</returns>
		},

		_showContextMenu: function (menuEvent) {
			var targetNode = menuEvent.target;
			var targetInputGroup = this.getGroupByDomNode(targetNode);
			var groupName = this.getGroupName(targetInputGroup);
			var menuModel = this.onMenuInit(menuEvent, targetInputGroup, groupName);

			if (menuModel && menuModel.length) {
				this.contextMenu.removeAll();
				this.contextMenu.addRange(menuModel);
				this.contextMenu.rowId = {
					group: targetInputGroup,
					groupName: groupName
				};

				connect.connect(
					this.contextMenu,
					'onItemClick',
					function (commandId, contextData) {
						this.onMenuItemClick(commandId, contextData);
						this._hideContextMenu();
					}.bind(this)
				);

				connect.connect(
					this.contextMenu.menu,
					'onBlur',
					function () {
						this._hideContextMenu();
					}.bind(this)
				);

				connect.connect(
					this.contextMenu.menu,
					'onKeyPress',
					function (keyEvent) {
						if (keyEvent.keyCode == 27) {
							this._hideContextMenu();
						}
					}.bind(this)
				);

				popup.open({
					popup: this.contextMenu.menu,
					x: menuEvent.clientX,
					y: menuEvent.clientY
				});

				this.contextMenu.menu.focus();
			}

			this._stopEvent(menuEvent);
		},

		_hideContextMenu: function () {
			popup.close(this.contextMenu.menu);
		},

		hideIntelliSenseMenu: function () {
			/// <summary>
			/// Hides active intellisense menu.
			/// </summary>
			if (this._isIntelliSenseActive) {
				popup.close(this.intelliSenseMenu.menu);
				this._isIntelliSenseActive = false;
				this._menuAhcnorNode.style.display = 'none';
			}
		}
	});
});
