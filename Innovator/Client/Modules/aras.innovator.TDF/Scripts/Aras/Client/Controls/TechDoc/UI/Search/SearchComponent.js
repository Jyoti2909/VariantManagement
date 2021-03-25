define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/UI/Search/SearchEngine',
	'Modules/aras.innovator.core.Core/Scripts/Classes/Eventable'
], function (declare, BaseSearchEngine, Eventable) {
	return declare([Eventable], {
		containerNode: null,
		domNode: null,
		controlNodes: null,
		_isActive: null,
		_isVisible: null,
		_isDomCreated: false,
		_domEventListeners: null,
		_searchValue: null,
		_searchEngine: null,
		_searchSource: null,
		_activeMatchIndex: -1,
		_timers: null,
		_intervals: null,
		_keyHandlers: null,
		_isButtonClicked: false,
		_collapseOnSpaceLack: null,
		_isSearchActive: false,
		_controlsStates: null,
		_isRestoringState: false,
		_isManualMode: null, // identifies is search will be initiated with Enter key press or during every value change event
		_resizeObserver: null,
		_resourceStrings: {
			placeholderText: 'Enter search phrase...',
			prevButtonTitle: 'Previous match',
			nextButtonTitle: 'Next match',
			toggleButtonTitle: 'Show control',
			toggleButtonActiveTitle: 'Hide control',
			noMatchesLabel: 'no matches',
			notEnoughSpaceAlert: 'Not enough space to show control'
		},
		_templateString:
			'<div class="SearchComponent {isActive}"> ' +
			'<div class="LayoutContainer">' +
			'<div class="ActiveElementsContainer">' +
			'<div class="SearchControlsPanel">' +
			'<input class="SearchInput" type="text" placeholder="{placeholderText}" value="{initialValue}"/>' +
			'<div class="PositionPanel Hidden">' +
			'<input class="PositionInput Hidden" type="text"/>' +
			'<span class="CountLabel"></span>' +
			'</div>' +
			'<div class="Button Prev" disabled title="{prevButtonTitle}"></div>' +
			'<div class="Button Next" disabled title="{nextButtonTitle}"></div>' +
			'</div>' +
			'</div>' +
			'<div class="Button Toggle"></div>' +
			'</div>' +
			'</div>',

		constructor: function (initialParameters) {
			initialParameters = initialParameters || {};

			this.containerNode =
				(initialParameters.connectId
					? document.getElementById(initialParameters.connectId)
					: initialParameters.containerNode) || document.body;
			this._domEventListeners = [];
			this._timers = {};
			this._intervals = {};
			this._keyHandlers = {};
			this._controlsStates = {};
			this._searchValue = initialParameters.initialValue || '';
			this._isActive =
				typeof initialParameters.isActive !== undefined
					? Boolean(initialParameters.isActive)
					: false;
			this._isVisible =
				initialParameters.visible !== undefined
					? initialParameters.visible
					: true;
			this._searchEngine =
				initialParameters.searchEngine || new BaseSearchEngine();
			this._searchMode = initialParameters.searchMode || 'static';
			this._collapseOnSpaceLack =
				initialParameters.collapseOnSpaceLack || false;
			this._isManualMode =
				initialParameters.isManualMode !== undefined
					? Boolean(initialParameters.isManualMode)
					: true;

			this.setResourceStrings(initialParameters.resourceStrings);

			this._createDom();
			this._attachDomEventListeners();
			this._registerComponentShortcuts();
			this._saveControlState('searchInput');
			this._setVisibility(this._isVisible);

			this.setSearchSource(initialParameters.searchSource);
		},

		_registerComponentShortcuts: function () {
			this.registerShortcut(
				89,
				true,
				false,
				function (keyEvent) {
					this._handleRedoShortcut(keyEvent);
					return false;
				}.bind(this)
			);

			this.registerShortcut(
				90,
				true,
				false,
				function (keyEvent) {
					this._handleUndoShortcut(keyEvent);
					return false;
				}.bind(this)
			);
		},

		_getControlKeyByNode: function (targetNode) {
			for (var controlKey in this.controlNodes) {
				if (targetNode == this.controlNodes[controlKey]) {
					return controlKey;
				}
			}
		},

		_handleUndoShortcut: function (keyEvent) {
			var controlKey = this._getControlKeyByNode(keyEvent.target);
			var currentControlState = this._controlsStates[controlKey];

			this._restoreControlState(
				currentControlState && currentControlState.prev
			);
		},

		_handleRedoShortcut: function (keyEvent) {
			var controlKey = this._getControlKeyByNode(keyEvent.target);
			var currentControlState = this._controlsStates[controlKey];

			this._restoreControlState(
				currentControlState && currentControlState.next
			);
		},

		_applyResourceString: function (resourceId, resourceString) {
			this._resourceStrings[resourceId] = resourceString;

			if (this._isDomCreated) {
				switch (resourceId) {
					case 'prevButtonTitle':
						this.controlNodes.prevButton.setAttribute('title', resourceString);
						break;
					case 'nextButtonTitle':
						this.controlNodes.nextButton.setAttribute('title', resourceString);
						break;
					case 'toggleButtonTitle':
						if (!this._isActive) {
							this.controlNodes.toggleButton.setAttribute(
								'title',
								resourceString
							);
						}
						break;
					case 'toggleButtonActiveTitle':
						if (this._isActive) {
							this.controlNodes.toggleButton.setAttribute(
								'title',
								resourceString
							);
						}
						break;
					case 'placeholderText':
						this.controlNodes.searchInput.setAttribute(
							'placeholder',
							resourceString
						);
						break;
				}
			}
		},

		_createDom: function () {
			if (this.containerNode) {
				var ownerDocument = this.containerNode.ownerDocument;
				var tempContainerNode = ownerDocument.createElement('div');

				tempContainerNode.innerHTML = this._prepareTemplateString();
				this.domNode = tempContainerNode.firstChild;
				this.containerNode.appendChild(this.domNode);

				this.controlNodes = {
					positionPanel: this.domNode.querySelector('.PositionPanel'),
					positionInput: this.domNode.querySelector('.PositionInput'),
					countLabel: this.domNode.querySelector('.CountLabel'),
					searchInput: this.domNode.querySelector('.SearchInput'),
					nextButton: this.domNode.querySelector('.Next'),
					prevButton: this.domNode.querySelector('.Prev'),
					toggleButton: this.domNode.querySelector('.Toggle')
				};

				this._setControlTitle(
					'toggleButton',
					this._isActive
						? this._resourceStrings.toggleButtonActiveTitle
						: this._resourceStrings.toggleButtonTitle
				);
				this._isDomCreated = true;
			}
		},

		_attachDomEventListeners: function () {
			if (this._isDomCreated) {
				var positionInputNode = this.controlNodes.positionInput;
				var searchInputNode = this.controlNodes.searchInput;
				var nextButtonNode = this.controlNodes.nextButton;
				var prevButtonNode = this.controlNodes.prevButton;
				var toggleButtonNode = this.controlNodes.toggleButton;

				this._attachDomEventListener(
					positionInputNode,
					'input',
					this._onPositionChanged.bind(this)
				);
				this._attachDomEventListener(
					positionInputNode,
					'keypress',
					this._stopEventPropagation
				);
				this._attachDomEventListener(
					positionInputNode,
					'keydown',
					this._onPositionInputKeyDown.bind(this)
				);

				this._attachDomEventListener(
					searchInputNode,
					'input',
					this._onValueChanged.bind(this)
				);
				this._attachDomEventListener(
					searchInputNode,
					'keydown',
					this._onSearchInputKeyDown.bind(this)
				);
				this._attachDomEventListener(
					searchInputNode,
					'keypress',
					this._stopEventPropagation
				);

				this._attachDomEventListener(
					nextButtonNode,
					'mousedown',
					this._onNextButtonClick.bind(this)
				);
				this._attachDomEventListener(
					nextButtonNode,
					'mouseup',
					this._onButtonReleased.bind(this)
				);
				this._attachDomEventListener(
					nextButtonNode,
					'mouseleave',
					this._onButtonReleased.bind(this)
				);

				this._attachDomEventListener(
					prevButtonNode,
					'mousedown',
					this._onPrevButtonClick.bind(this)
				);
				this._attachDomEventListener(
					prevButtonNode,
					'mouseup',
					this._onButtonReleased.bind(this)
				);
				this._attachDomEventListener(
					prevButtonNode,
					'mouseleave',
					this._onButtonReleased.bind(this)
				);

				this._attachDomEventListener(
					toggleButtonNode,
					'click',
					this._onToggleButtonClick.bind(this)
				);

				if (ResizeObserver) {
					this._resizeObserver = new ResizeObserver(
						function (entries) {
							this._setTimer(
								'windowResize',
								function () {
									this._onContainerResize();
								}.bind(this),
								100
							);
						}.bind(this)
					);

					this._resizeObserver.observe(this.containerNode);
				} else {
					this._attachDomEventListener(
						window,
						'resize',
						function (resizeEvent) {
							this._setTimer(
								'windowResize',
								function () {
									this._onContainerResize(resizeEvent);
								}.bind(this),
								100
							);
						}.bind(this)
					);
				}
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

		_prepareTemplateString: function () {
			var resultTemplateString = this._templateString
				.replace('{isActive}', this._isActive ? 'Active' : '')
				.replace('{initialValue}', this._searchValue);
			var resourceId;

			// applying all resource strings
			for (resourceId in this._resourceStrings) {
				resultTemplateString = resultTemplateString.replace(
					'{' + resourceId + '}',
					this._resourceStrings[resourceId]
				);
			}

			return resultTemplateString;
		},

		_saveControlState: function (controlKey) {
			if (!this._isRestoringState) {
				var currentState = this._controlsStates[controlKey];
				var newState = {
					next: null,
					prev: currentState,
					key: controlKey
				};

				switch (controlKey) {
					case 'searchInput':
						newState.searchValue = this.getSearchValue();
						break;
					case 'positionInput':
						newState.matchIndex = this._activeMatchIndex;
						break;
				}

				if (currentState) {
					var statesCount = 0;

					currentState.next = newState;

					// max state count per control is 200 records
					while (currentState.prev) {
						if (++statesCount > 200) {
							currentState.next.prev = null;
							currentState.next = null;

							break;
						}

						currentState = currentState.prev;
					}
				}

				this._controlsStates[controlKey] = newState;
			}
		},

		_resetControlStates: function (controlKey) {
			var currentState = this._controlsStates[controlKey];

			if (currentState) {
				while (currentState.prev) {
					currentState = currentState.prev;
				}

				this._restoreControlState(currentState);
			}
		},

		_restoreControlState: function (targetState) {
			this._isRestoringState = true;

			if (
				targetState &&
				targetState !== this._controlsStates[targetState.key]
			) {
				switch (targetState.key) {
					case 'searchInput':
						this.setSearchValue(targetState.searchValue);
						break;
					case 'positionInput':
						this.setActiveMatch(targetState.matchIndex);
						break;
				}

				this._controlsStates[targetState.key] = targetState;
			}

			this._isRestoringState = false;
		},

		_setTimer: function (timerKey, timerCallback, timerDelay) {
			var targetTimer = this._timers[timerKey];

			if (targetTimer) {
				clearTimeout(targetTimer);
				this._timers[timerKey] = null;
			}

			if (timerCallback) {
				timerDelay = timerDelay || 0;
				this._timers[timerKey] = setTimeout(timerCallback, timerDelay);
			}
		},

		_stopEventPropagation: function (targetEvent) {
			targetEvent.stopPropagation();
		},

		_setInterval: function (intervalKey, intervalCallback, intervalFrequency) {
			var targetInterval = this._intervals[intervalKey];

			if (targetInterval) {
				clearInterval(targetInterval);
				this._intervals[intervalKey] = null;
			}

			if (intervalCallback) {
				intervalFrequency = intervalFrequency || 50;
				this._intervals[intervalKey] = setInterval(
					intervalCallback,
					intervalFrequency
				);
			}
		},

		_onContainerResize: function (resizeEvent) {
			this.adjustControlPlacement();
		},

		_onButtonReleased: function (mouseEvent) {
			if (this._isButtonClicked) {
				this._isButtonClicked = false;

				this._setTimer('buttonDelayedClicker', null);
				this._setInterval('buttonClicker', null);
			}
		},

		_onPositionChanged: function (inputEvent) {
			var positionInput = this.controlNodes.positionInput;
			var positionValue = parseInt(positionInput.value);

			if (!isNaN(positionValue)) {
				this.setActiveMatch(positionValue - 1);
			}
		},

		_onPositionKeyPressed: function (keyEvent) {
			keyEvent.stopPropagation();
			keyEvent.preventDefault();
		},

		_onValueChanged: function (inputEvent) {
			this.setSearchValue(this.controlNodes.searchInput.value);
		},

		_onPositionInputKeyDown: function (keyEvent) {
			var keyCode = keyEvent.which || keyEvent.keyCode;

			if (this._handleShortcuts(keyEvent)) {
				this._stopEvent(keyEvent);
			} else {
				switch (keyCode) {
					case 38:
						this.activatePreviousMatch();
						break;
					case 40:
						this.activateNextMatch();
						break;
					default:
						break;
				}

				keyEvent.stopPropagation();
			}
		},

		_onSearchInputKeyDown: function (keyEvent) {
			var keyCode = keyEvent.which || keyEvent.keyCode;

			if (this._handleShortcuts(keyEvent)) {
				this._stopEvent(keyEvent);
			} else {
				switch (keyCode) {
					case 13:
						if (this._isManualMode) {
							this.runSearch();
						}

						keyEvent.preventDefault();
						break;
					case 38:
						this.activatePreviousMatch();
						break;
					case 40:
						this.activateNextMatch();
						break;
					default:
						break;
				}

				keyEvent.stopPropagation();
			}

			this.onKeyDown(
				keyCode,
				keyEvent.shiftKey,
				keyEvent.ctrlKey || keyEvent.metaKey
			);
		},

		_onNextButtonClick: function (clickEvent) {
			var buttonNode = this.controlNodes.nextButton;

			if (this._isControlEnabled(buttonNode)) {
				this.activateNextMatch();
				this._isButtonClicked = true;

				if (this._isControlEnabled(buttonNode)) {
					this._setTimer(
						'buttonDelayedClicker',
						function () {
							if (this._isButtonClicked) {
								this._setInterval(
									'buttonClicker',
									function () {
										this._onNextButtonClick();
									}.bind(this),
									50
								);
							}
						}.bind(this),
						500
					);
				} else {
					this._onButtonReleased();
				}
			}
		},

		_onPrevButtonClick: function (clickEvent) {
			var buttonNode = this.controlNodes.prevButton;

			if (this._isControlEnabled(buttonNode)) {
				this.activatePreviousMatch();
				this._isButtonClicked = true;

				if (this._isControlEnabled(buttonNode)) {
					this._setTimer(
						'buttonDelayedClicker',
						function () {
							if (this._isButtonClicked) {
								this._setInterval(
									'buttonClicker',
									function () {
										this._onPrevButtonClick();
									}.bind(this),
									50
								);
							}
						}.bind(this),
						500
					);
				} else {
					this._onButtonReleased();
				}
			}
		},

		_onToggleButtonClick: function () {
			const initialState = this._isActive;

			this.setActiveState(!this._isActive);

			if (initialState !== this._isActive && !this._isActive) {
				this.setSearchValue('');

				if (this._isManualMode) {
					this.cleanupResults();
				}
			}
		},

		_collapseIfNoSpace: function (withMessage) {
			if (this._collapseOnSpaceLack && this._isActive) {
				var containerBounds = this.containerNode.getBoundingClientRect();

				if (
					this.domNode.offsetTop > containerBounds.height ||
					this.domNode.offsetLeft + this.domNode.offsetWidth >
						containerBounds.width
				) {
					this.setActiveState(false);

					if (withMessage) {
						console.warn(this._resourceStrings.notEnoughSpaceAlert);
					}
				}
			}
		},

		_removeDomEventHandlers: function () {
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

		_enableControl: function (controlName, doEnabled) {
			var controlNode = this.controlNodes[controlName];

			if (controlNode) {
				var currentState = this._isControlEnabled(controlNode);

				if (currentState !== doEnabled) {
					if (doEnabled) {
						controlNode.removeAttribute('disabled');
					} else {
						controlNode.setAttribute('disabled', true);
					}
				}
			}
		},

		_setControlTitle: function (controlName, titleText) {
			var controlNode = this.controlNodes[controlName];

			if (controlNode) {
				controlNode.setAttribute('title', titleText);
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

		_updatePositionPanel: function () {
			var matchesCount = this._searchEngine.getMatchesCount();
			var positionPanel = this.controlNodes.positionPanel;
			var positionInput = this.controlNodes.positionInput;
			var countLabel = this.controlNodes.countLabel;
			var boundingRect;

			if (matchesCount) {
				this._setTimer('hidePositionPanel', null);

				// first of all we should make panel visible to use getBoundingClientRect method
				positionPanel.classList.remove('Hidden');

				countLabel.textContent = '/ ' + matchesCount;
				boundingRect = countLabel.getBoundingClientRect();

				positionInput.style.width = boundingRect.width - 10 + 'px';
				positionInput.value = this._activeMatchIndex + 1;

				positionPanel.style.minWidth = boundingRect.width * 2 - 5 + 'px';
				positionInput.classList.remove('Hidden');
			} else {
				if (this._isSearchActive) {
					positionInput.classList.add('Hidden');
					positionPanel.classList.remove('Hidden');
					countLabel.textContent = this._resourceStrings.noMatchesLabel;

					boundingRect = countLabel.getBoundingClientRect();
					positionPanel.style.minWidth = boundingRect.width + 'px';

					if (this._isManualMode) {
						this._setTimer(
							'hidePositionPanel',
							function () {
								positionPanel.classList.add('Hidden');
							},
							500
						);
					}
				} else {
					positionPanel.classList.add('Hidden');
					positionInput.classList.add('Hidden');
				}
			}
		},

		_stopEvent: function (targetEvent) {
			targetEvent.stopPropagation();
			targetEvent.preventDefault();
		},

		_isControlEnabled: function (controlNode) {
			return controlNode && !controlNode.hasAttribute('disabled');
		},

		_updateControlState: function () {
			var matchesCount = this.getMatchesCount();
			var matchesFound = matchesCount > 1;

			this._enableControl('nextButton', matchesFound);
			this._enableControl('prevButton', matchesFound);
			this._updatePositionPanel();
		},

		_normalizeSearchValue: function (searchValue) {
			searchValue = searchValue
				? typeof searchValue == 'string'
					? searchValue
					: searchValue.toString()
				: '';

			if (searchValue) {
				searchValue = searchValue.substr(0, 128); // value should be truncated to 128 symbols
				searchValue = searchValue.replace(/\s/g, ' '); // replacing any whitespace characters(e.g. \u00A0) with common whitespace
			}

			return searchValue;
		},

		_setVisibility: function (doVisible) {
			if (this._isDomCreated) {
				doVisible = Boolean(doVisible);

				if (this._isVisible !== doVisible) {
					this._isVisible = doVisible;

					this.domNode.style.display = doVisible ? '' : 'none';
				}
			}
		},

		adjustControlPlacement: function () {
			/// <summary>
			/// Recalculate component positioning and collapse state.
			/// </summary>
			this._collapseIfNoSpace();
		},

		onKeyDown: function (keyCode, shiftKey, ctrlKey) {
			/// <summary>
			/// Is called when 'keydown' event appears on search input control element.
			/// </summary>
			/// <param name="keyCode" type="Number">Button key code.</param>
			/// <param name="isCtrl" type="Boolean">Is Ctrl key should be pressed.</param>
			/// <param name="isShift" type="Boolean">Is Shift key should be pressed.</param>
			this.raiseEvent('onKeyDown', keyCode, shiftKey, ctrlKey);
		},

		onSearchValueChanged: function (newSearchValue) {
			/// <summary>
			/// Is called when component search value has been changed.
			/// </summary>
			/// <param name="newSearchValue" type="String">New search string value.</param>
			this.raiseEvent('onSearchValueChanged', newSearchValue);
		},

		onBeforeSearch: function (searchValue, searchSource) {
			/// <summary>
			/// Is called before search execution. Raised always.
			/// </summary>
			/// <param name="searchValue" type="String">Value that is used for search.</param>
			/// <param name="searchSource" type="Any|Array of Any">Source that is used for searching matches.</param>
			this.raiseEvent('onBeforeSearch', searchValue, searchSource);
		},

		onSearchComplete: function (searchValue, searchSource, foundMatches) {
			/// <summary>
			/// Is called if search after search execution. Raised if only searchValue and serachSource are valid and search was executed.
			/// </summary>
			/// <param name="searchValue" type="String">Value that is used for search.</param>
			/// <param name="searchSource" type="Any|Array of Any">Source that is used for searching matches.</param>
			/// <param name="foundMatches" type="Array of MatchDescriptors">All found matches descriptors.</param>
			this.raiseEvent(
				'onSearchComplete',
				searchValue,
				searchSource,
				foundMatches
			);
		},

		onAfterSearch: function (searchValue, searchSource) {
			/// <summary>
			/// Is called if after run search execution. Raised always.
			/// </summary>
			/// <param name="searchValue" type="String">Value that is used for search.</param>
			/// <param name="searchSource" type="Any|Array of Any">Source that is used for searching matches.</param>
			this.raiseEvent('onAfterSearch', searchValue, searchSource);
		},

		onSearchCleared: function () {
			/// <summary>
			/// Is called when active search results where cleaned up.
			/// </summary>
			this.raiseEvent('onSearchCleared');
		},

		onActiveMatchChanged: function (matchIndex, matchDescriptor) {
			/// <summary>
			/// Is called when active match index was changed.
			/// </summary>
			/// <param name="matchIndex" type="Number">New active match index.</param>
			/// <param name="matchDescriptor" type="Object">New active match descriptor.</param>
			this.raiseEvent('onActiveMatchChanged', matchIndex, matchDescriptor);
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

		setResourceStrings: function (resourceStrings) {
			/// <summary>
			/// Applies new resource strings to the control.
			/// </summary>
			/// <param name="resourceStrings" type="Object">Object, which contains 'resourceIds' as keys and 'resourceStrings' as values.</param>
			if (resourceStrings) {
				for (var resourceId in resourceStrings) {
					this._applyResourceString(resourceId, resourceStrings[resourceId]);
				}
			}
		},

		setSearchValue: function (newValue) {
			/// <summary>
			/// Set current search value. If current mode is not manual, then search will be executed.
			/// </summary>
			/// <param name="newValue" type="String">String, which should be used for search.</param>
			newValue = this._normalizeSearchValue(newValue);
			this.controlNodes.searchInput.value = newValue;

			if (newValue !== this._searchValue) {
				this._searchValue = newValue;

				this.onSearchValueChanged(this._searchValue);

				if (!this._isManualMode) {
					this.runSearch();
				} else {
					this._updateControlState();
				}

				this._saveControlState('searchInput');
			}
		},

		setActiveState: function (isActive) {
			/// <summary>
			/// Sets control state (Active/Inactive).
			/// </summary>
			/// <param name="isActive" type="Boolean">Required control state. If false, then all control elements except toggle button will be hidden.</param>
			isActive = Boolean(isActive);

			if (this._isActive !== isActive) {
				this._isActive = !this._isActive;

				if (this._isActive) {
					this.domNode.classList.add('Active');
				} else {
					this.domNode.classList.remove('Active');
				}

				this._setControlTitle(
					'toggleButton',
					this._isActive
						? this._resourceStrings.toggleButtonActiveTitle
						: this._resourceStrings.toggleButtonTitle
				);
				this._collapseIfNoSpace(true);
			}
		},

		isActive: function () {
			/// <summary>
			/// Returns current control state (Active/Inactive).
			/// </summary>
			/// <returns>Boolean</returns>
			return this._isActive;
		},

		isSearchActive: function () {
			/// <summary>
			/// Returns current state of search execution.
			/// </summary>
			/// <returns>Boolean. True if search was executed and matches are found.</returns>
			return this._isSearchActive;
		},

		getSearchSource: function () {
			/// <summary>
			/// Returns current search source.
			/// </summary>
			/// <returns>Any</returns>
			return this._searchSource;
		},

		setSearchSource: function (searchSource) {
			/// <summary>
			/// Set current search source.
			/// </summary>
			/// <param name="searchSource" type="Any|Array of Any">Sources, where component will search matches.</param>
			if (searchSource !== this._searchSource) {
				this._searchSource = searchSource;
				this.cleanupResults();

				return true;
			}
		},

		runSearch: function (searchSource) {
			/// <summary>
			/// Set current search source.
			/// </summary>
			/// <param name="searchSource" type="Null|Any|Array of Any">Sources, where component will search matches. If parameter is not specified, then
			/// current component search source will be used
			/// </param>
			/// <returns>Boolean. True if search was successful.</returns>
			var foundMatches;

			this.onBeforeSearch(
				this._searchValue,
				searchSource || this._searchSource
			);

			if (!searchSource || !this.setSearchSource(searchSource)) {
				this.cleanupResults();
			}

			if (this._searchSource && this._searchValue) {
				this._isSearchActive = true;

				this._searchEngine.runSearch(this._searchValue, this._searchSource);

				foundMatches = this._searchEngine.getAllMatches();
				this.onSearchComplete(
					this._searchValue,
					this._searchSource,
					foundMatches
				);
				this.onAfterSearch(this._searchValue, this._searchSource);

				if (foundMatches.length) {
					this.setActiveMatch(0);
				} else {
					this._updatePositionPanel();
					this._isSearchActive = false;
				}
			} else {
				this.onAfterSearch(this._searchValue, this._searchSource);
			}
		},

		cleanupResults: function () {
			/// <summary>
			/// Cleanup current search results.
			/// </summary>
			if (this._isSearchActive) {
				this._activeMatchIndex = -1;
				this._isSearchActive = false;

				this._searchEngine.cleanup();
				this._updateControlState();

				this.onSearchCleared();
			}
		},

		focus: function () {
			/// <summary>
			/// Sets focus to the search input control element.
			/// </summary>
			if (this._isDomCreated && this._isActive) {
				this.controlNodes.searchInput.focus();
			}
		},

		getMatchesCount: function () {
			/// <summary>
			/// Cleanup current search results.
			/// </summary>
			/// <returns>Number. Total number of found matches after last search.</returns>
			return this._searchEngine.getMatchesCount();
		},

		getActiveMatch: function () {
			/// <summary>
			/// Returns active match descriptor.
			/// </summary>
			/// <returns>Object. Match desriptor (contained information depends on SearchEngine, which was used for search).</returns>
			return this._searchEngine.getMatchByIndex(this._activeMatchIndex);
		},

		getActiveMatchIndex: function () {
			/// <summary>
			/// Returns active match index.
			/// </summary>
			/// <returns>Number</returns>
			return this._activeMatchIndex;
		},

		setActiveMatch: function (matchIndex) {
			/// <summary>
			/// Sets current active match by index.
			/// </summary>
			/// <param name="matchIndex" type="Number">Index of match.</param>
			if (this._isSearchActive && matchIndex !== this._activeMatchIndex) {
				var matchesCount = this.getMatchesCount();

				if (matchIndex >= 0 && matchIndex < matchesCount) {
					this._activeMatchIndex = matchIndex;
					this._updateControlState();
					this._saveControlState('positionInput');

					this.onActiveMatchChanged(
						this._activeMatchIndex,
						this.getActiveMatch()
					);
				}
			}
		},

		activateNextMatch: function () {
			/// <summary>
			/// Activates next match. If current match is last, then first match will be activated.
			/// </summary>
			var nextMatchIndex = this._activeMatchIndex + 1;
			var matchesCount = this.getMatchesCount();

			this.setActiveMatch(nextMatchIndex >= matchesCount ? 0 : nextMatchIndex);
		},

		activatePreviousMatch: function () {
			/// <summary>
			/// Activates previous match. If current match is first, then last match will be activated.
			/// </summary>
			this.setActiveMatch(
				this._activeMatchIndex === 0
					? this.getMatchesCount() - 1
					: this._activeMatchIndex - 1
			);
		},

		getSearchValue: function () {
			/// <summary>
			/// Returns current search value.
			/// </summary>
			return this._searchValue;
		},

		isVisible: function () {
			/// <summary>
			/// Returns current visibility status.
			/// </summary>
			return this._isVisible;
		},

		show: function () {
			/// <summary>
			/// Shows component if it was hidden.
			/// </summary>
			this._setVisibility(true);
		},

		hide: function () {
			/// <summary>
			/// Hides component if it was visible.
			/// </summary>
			this._setVisibility(false);
		}
	});
});
