define([
	'dojo/_base/declare',
	'dijit/Editor',
	'dojo/keys',
	'dojo/aspect',
	'dojo/dom-construct',
	'dojo/_base/sniff',
	'TechDoc/Aras/Client/Controls/TechDoc/UI/DOMRange',
	'TechDoc/Aras/Client/Controls/TechDoc/UI/DOM',
	'TechDoc/Aras/Client/Controls/TechDoc/UI/DOMRenderer',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/Aras/_ArasTableXmlSchemaElement/editor/plugins/ResizeTableColumn',
	'Aras/Client/Controls/Experimental/ContextMenu',
	'TDF/Scripts/Aras/Client/Controls/TechDoc/UI/InputFieldEditors/ItemPropertyEditor',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/DocumentationEnums',
	'dijit/popup',
	'dojo/on'
], function (
	declare,
	DijitEditor,
	keys,
	aspect,
	domConstruct,
	has,
	DOMRange,
	DOMapi,
	DOMRenderer,
	ResizeTableColumn,
	ContextMenu,
	ItemPropertyEditor,
	Enums,
	popup,
	on
) {
	return declare('Aras.Client.Controls.TechDoc.Editor', DijitEditor, {
		viewmodel: null,
		actionsHelper: null,
		contentNode: null,
		_clipboard: null,
		_allowedKeydownKeys: {}, //the list of buttons to create child elements
		_specialKeypressCodes: { 13: true, 32: true },
		_environment: null,
		_passedKeyDownCheck: null,
		_contextMenu: null,
		_contextMenuKey: null,
		_isExplicitHeight: false,
		_currentSelection: null,
		_waitLoadCounter: null,
		_invalidateIteration: null,
		_isContentLoaded: null,
		_defferedMethodCalls: null,
		_classificationStyleNode: null,
		_searchControl: null,
		_textChangesObserver: null,
		_textObserverConfig: null,
		_searchData: null,
		_itemPropertyEditor: null,

		constructor: function (args) {
			var aras = args.structuredDocument ? args.structuredDocument._aras : null;
			var keydownKeyIntervals = ['32', '48-57', '65-90', '96-111', '186-222']; // space, number, letters, num pad, (; = , - . / ~ [ \ ] ')
			var keyInterval;
			var lowerBound;
			var upperBound;

			this.aras = aras;
			this.viewmodel = args.structuredDocument;
			this.actionsHelper = this.viewmodel.ActionsHelper();
			this._clipboard = this.viewmodel.Clipboard();
			this.plugins = [
				{
					name:
						'Aras.Client.Controls.TechDoc.ViewModel.Aras._ArasTableXmlSchemaElement.editor.plugins.ResizeTableColumn',
					command: 'ResizeTableColumn'
				}
			];
			this._classificationStyleNode = null;
			this.styleSheets =
				args.styleSheet ||
				'Scripts/Aras/Client/Controls/TechDoc/themes/Editor.css';
			this._currentSelection = [];
			this._invalidateIteration = 0;
			this._isContentLoaded = true;
			this._defferedMethodCalls = [];
			this._environment = {
				isMacOS: /mac/i.test(navigator.platform),
				isFirefox: aras ? aras.Browser.isFf() : has('ff'),
				isIE: aras ? aras.Browser.isIe() : has('ie'),
				isChrome: aras && aras.Browser.isCh(),
				isIE11: aras
					? aras.Browser.isIe() && aras.Browser.getMajorVersionNumber() == 11
					: false
			};
			this._contextMenuKey = 0;
			this._textChangesObserver = new MutationObserver(
				this._onTextElementChange.bind(this)
			);
			this._textObserverConfig = {
				subtree: true,
				childList: true,
				characterData: true,
				characterDataOldValue: true
			};

			this.actionsHelper.editor = this;
			this.setSearchControl(args.searchControl);

			for (i = 0; i < keydownKeyIntervals.length; i++) {
				keyInterval = keydownKeyIntervals[i].split('-');

				if (keyInterval.length == 1) {
					this._allowedKeydownKeys[keyInterval[0]] = true;
				} else {
					lowerBound = Math.min(
						parseInt(keyInterval[0]),
						parseInt(keyInterval[1])
					);
					upperBound = Math.max(
						parseInt(keyInterval[0]),
						parseInt(keyInterval[1])
					);

					for (j = lowerBound; j <= upperBound; j++) {
						this._allowedKeydownKeys[j] = true;
					}
				}
			}

			Object.defineProperty(this, 'scrollNode', {
				get: function () {
					return this._environment.isIE && !this._environment.isIE11
						? this.editNode.parentNode
						: this.editNode;
				}
			});

			// cltr + key handlers
			this.addKeyHandler(66, true, false, this.handleCtrlB); //Ctlr + B
			this.addKeyHandler(73, true, false, this.handleCtrlI); //Ctlr + I
			this.addKeyHandler(83, true, false, this.handleCtrlS); //Ctrl + S
			this.addKeyHandler(85, true, false, this.handleCtrlU); //Ctlr + U
			this.addKeyHandler(89, true, false, this.handleCtrlY); //Ctrl + Y
			this.addKeyHandler(90, true, false, this.handleCtrlZ); //Ctrl + Z
		},

		syncModelWithHTML: function (element) {
			var elementDomNode = this.domapi.getNode(element);

			if (element && !element._domSynchronized) {
				element.updateFromDom(elementDomNode);
				element._domSynchronized = true;
			}
		},

		syncBeforeAction: function (e) {
			//save data from range
			this.domRange.refresh();
			var modelCursor = this.viewmodel.Cursor();
			var cursorData = {
				start: modelCursor.start,
				startOffset: modelCursor.startOffset,
				end: modelCursor.end,
				endOffset: modelCursor.endOffset
			};

			this.syncModelWithHTML(modelCursor.commonAncestor);

			//restore range
			this.domRange.setCursorTo(
				cursorData.start,
				cursorData.startOffset,
				cursorData.end,
				cursorData.endOffset
			);

			if (
				modelCursor.commonAncestor &&
				modelCursor.commonAncestor.is('ArasTextXmlSchemaElement')
			) {
				modelCursor.commonAncestor.InvalidRange(this.viewmodel.Cursor());
			}
		},

		blurTextNode: function (e) {
			var id = e.target.getAttribute('id');
			var element = this.viewmodel.GetElementById(id);

			// need to update model cursor before focus will be lost
			this.domRange.refresh();

			this.syncModelWithHTML(element);
		},

		handleCtrlZ: function (e) {
			this.syncBeforeAction(e);
			this.actionsHelper.executeAction('undoaction');

			return false;
		},

		handleCtrlY: function (e) {
			this.syncBeforeAction(e);
			this.actionsHelper.executeAction('redoaction');

			return false;
		},

		handleShortcuts: function (keyEvent) {
			var keyCode = keyEvent.which || keyEvent.keyCode;
			var keyHandlers = this._keyHandlers[keyCode];
			var isEventSuppressed = false;

			if (keyHandlers && !keyEvent.altKey) {
				var isCtrlPressed = this._environment.isMacOS
					? keyEvent.metaKey
					: keyEvent.ctrlKey;
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

		handleCtrlV: function (e) {
			// currently unused due to changes in Copy/Paste functionality
			this.syncBeforeAction(e);
			var text = this._clipboard.getData('Text') || '';
			// +++ IR-029149 +++
			text = text.replace(/\r/g, '');
			// --- IR-029149 ---
			this.domRange.refresh();

			this.viewmodel.SuspendInvalidation();

			var _cursor = this.viewmodel.Cursor();
			var isCollapsed = _cursor.collapsed;
			var startItem = _cursor.start;
			var ancesstorItem = _cursor.commonAncestor;

			if (ancesstorItem && ancesstorItem.is('ArasTextXmlSchemaElement')) {
				var content = this._clipboard.getData('ArasTextXmlSchemaElement');

				if (content && content.plainText == text) {
					ancesstorItem.InsertEmphs(content.formattedText);
				} else {
					ancesstorItem.InsertText(text);
				}
			} else if (ancesstorItem || startItem) {
				if (!isCollapsed) {
					_cursor.DeleteContents();
				}

				if (_cursor.collapsed) {
					var selectedItem = _cursor.commonAncestor;

					if (selectedItem && selectedItem.is('XmlSchemaText')) {
						var insertPosition = _cursor.startOffset;
						var stringBeforeEditing = selectedItem.Text();
						var stringAfterEditing = [
							stringBeforeEditing.slice(0, insertPosition),
							text,
							stringBeforeEditing.slice(insertPosition)
						].join('');

						selectedItem.Text(stringAfterEditing);
						_cursor.Set(
							selectedItem,
							insertPosition + text.length,
							selectedItem,
							insertPosition + text.length
						);
					}
				}
			}

			this.viewmodel.ResumeInvalidation();

			//we handle all dom modifications manually
			return false;
		},

		handleCtrlC: function (e) {
			// currently unused due to changes in Copy/Paste functionality
			this.syncBeforeAction(e);
			this._copyToClipboard();
			return false;
		},

		handleCtrlX: function (e) {
			// currently unused due to changes in Copy/Paste functionality
			this.syncBeforeAction(e);

			var plainText;

			this.domRange.refresh();
			plainText = this.domRange.plainText;

			if (plainText) {
				var viewCursor = this.viewmodel.Cursor();
				var ancesstorItem = viewCursor.commonAncestor;

				this._clipboard.setData('Text', plainText);
				this._copyToClipboard();

				//delete selection
				this.viewmodel.SuspendInvalidation();

				if (ancesstorItem && ancesstorItem.is('ArasTextXmlSchemaElement')) {
					if (!viewCursor.collapsed) {
						ancesstorItem.DeleteText();
					}
				} else {
					var startItem = viewCursor.start;
					var endItem = viewCursor.end;
					var startPosition = viewCursor.startOffset;
					var endPosition = viewCursor.endOffset;

					if (startItem && endItem && startPosition != -1) {
						if (startItem == endItem && startItem.is('XmlSchemaText')) {
							var stringBeforeEditing = startItem.Text();
							var stringAfterEditing = [
								stringBeforeEditing.slice(0, startPosition),
								stringBeforeEditing.slice(endPosition)
							].join('');

							startItem.Text(stringAfterEditing);
							viewCursor.Set(
								startItem,
								startPosition,
								startItem,
								startPosition
							);
						}
					}
				}

				this.viewmodel.ResumeInvalidation();
			}

			return false;
		},

		onBeforeDeactivate: function () {
			// error is triggered for some reasons in IE when perform text formating
		},

		onBeforeActivate: function () {
			// error is triggered for some reasons in IE when perform text formating
		},

		startup: function () {
			this.inherited(arguments);

			if (this._tablePluginHandler) {
				this._tablePluginHandler.connectDraggable = function () {
					/*deactivate the old code to drag&drop in old IE*/
				};
			}
			//get rid of toolbar from editor
			domConstruct.destroy(this.toolbar.domNode.parentNode);
		},

		/**
		 * @param {String} html
		 */
		onLoad: function (html) {
			this.inherited(arguments);

			this.domapi = new DOMapi({
				document: this.document,
				viewmodel: this.viewmodel
			});
			this.domRenderer = new DOMRenderer({
				domapi: this.domapi,
				viewmodel: this.viewmodel
			});
			this.domRange = new DOMRange({
				window: this.window,
				viewmodel: this.viewmodel,
				domapi: this.domapi
			});

			const topWindow = this.aras.getMostTopWindowWithAras();
			const arasModules = topWindow.ArasModules;
			this._itemPropertyEditor = new ItemPropertyEditor({
				aras: this.aras
			});

			aspect.after(
				this.domRange,
				'onRefresh',
				this._onDOMRangeRefresh.bind(this),
				true
			);

			// replace editor innerHTML content with root node, which will be used as storage for documentContent
			this.editNode.innerHTML = '<div class="editorContentNode"></div>';
			this.contentNode = this.editNode.firstChild;
			this._initShadowInput();

			//prevent context menu on editable grid
			this.editNode.spellcheck = false;
			this.editNode.setAttribute('contentEditable', 'false');

			this.editNode.oncontextmenu = this.onContextMenuShow.bind(this);
			if (this._environment.isIE) {
				this.domNode.ownerDocument.oncontextmenu = this.onContextMenuShow.bind(
					this
				);
				//disable auto insert <a> after typing URL in IE for contentEditable block
				this.domNode.ownerDocument.execCommand('AutoUrlDetect', false, false);
			}
			this.scrollNode.addEventListener(
				'scroll',
				this.dropExplicitContentHeight.bind(this)
			);

			this._contextMenu = new ContextMenu(this.editNode, true);
			aspect.after(
				this._contextMenu,
				'onItemClick',
				this._onMenuItemClick.bind(this),
				true
			);

			this.iframe.onfocus = function () {
				//it was pulled from RichText.js it breaks contextmenu on TOC
				//_this.editNode.setActive();
			};

			this.viewmodel.getStatePromise('initComplete').then(
				function () {
					this._onViewModelInitialized();
				}.bind(this)
			);

			on(
				this.editNode,
				'.ArasTextXmlSchemaElement:focusout',
				this.blurTextNode.bind(this)
			);
			on(
				this.editNode,
				'.XmlSchemaText:focusout',
				this.blurTextNode.bind(this)
			);
			on(this.editNode, 'dblclick', this.onDblClick.bind(this));
			on(this.editNode, 'paste', this.onPaste.bind(this));
		},

		_onViewModelInitialized: function () {
			this.applySchemaSettings();

			this._setInitialValue();

			aspect.after(
				this.viewmodel,
				'OnInvalidate',
				this._onViewModelInvalidate.bind(this),
				true
			);
			aspect.after(
				this.viewmodel,
				'onSelectionChanged',
				this.selectionChangeHandler.bind(this),
				true
			);
			aspect.after(
				this.viewmodel,
				'OnClassificationChanged',
				this._onClassificationChanged.bind(this),
				true
			);

			this.actionsHelper.addEventListener(
				this,
				this,
				'ActionExecuted',
				this.onActionExecutedHandler
			);
		},

		onActionExecutedHandler: function (actionName) {
			const eventArguments = Array.from(arguments);

			switch (actionName) {
				case 'appendelement':
					this.focus();
					break;
				case 'arastextactions':
					const targetElement = eventArguments[3];
					const elementDomNode = this.domapi.getNode(targetElement);
					const modelCursor = this.viewmodel.Cursor();

					this._focusNode(elementDomNode);

					this.domRange.setCursorTo(
						modelCursor.start,
						modelCursor.startOffset,
						modelCursor.end,
						modelCursor.endOffset
					);
					break;
			}
		},

		_setInitialValue: function () {
			/*
			 * Create deferred execution RenderHtml method to call it in the end,
			 * because after the first editor appearance, method onload calls before
			 * startup and elements not paint in the editor.
			 */
			setTimeout(
				function () {
					this.set('value', this.domRenderer.RenderHtml(this.viewmodel.Dom()));

					this.selectionChangeHandler(
						this.viewmodel,
						this.viewmodel.GetSelectedItems()
					);

					this.editNode.classList.add('controlInited');
				}.bind(this),
				0
			);
		},

		setSearchControl: function (searchControl) {
			if (this._searchControl) {
				this._searchControl.removeEventListeners(this);
			}

			this._searchControl = searchControl;
			this._attachSearchEventListeners();
		},

		_attachSearchEventListeners: function () {
			var searchControl = this._searchControl;

			if (this._searchControl) {
				searchControl.addEventListener(
					this,
					this,
					'onBeforeSearch',
					function (searchValue, sourceNodes) {
						this.viewmodel.SuspendInvalidation();
					}.bind(this)
				);

				searchControl.addEventListener(
					this,
					this,
					'onAfterSearch',
					function (searchValue, sourceNodes) {
						this.viewmodel.ResumeInvalidation();
					}.bind(this)
				);

				searchControl.addEventListener(
					this,
					this,
					'onSearchComplete',
					function (searchValue, sourceNodes, foundMatches) {
						this._highlightSearchMatches(foundMatches);
					}.bind(this)
				);

				searchControl.addEventListener(
					this,
					this,
					'onSearchCleared',
					function () {
						this.viewmodel.SuspendInvalidation();
						this._cleanupSearchMatches();
						this.viewmodel.ResumeInvalidation();
					}.bind(this)
				);

				searchControl.addEventListener(
					this,
					this,
					'onActiveMatchChanged',
					function (matchIndex, activeMatch) {
						var searchData = this._searchData;
						var currentMatch = searchData.activeMatch;
						var textHighlightning;
						var textSchemaElement;
						var elementDomNode;
						var highlightNodes;
						var i;

						if (currentMatch) {
							textSchemaElement = currentMatch.matchInfo.schemaElement;
							textHighlightning = textSchemaElement.getTextHighlightning();
							elementDomNode = this.domapi.getNode(textSchemaElement);
							highlightNodes = elementDomNode.querySelectorAll('hlr[active]');

							for (i = 0; i < highlightNodes.length; i++) {
								highlightNodes[i].removeAttribute('active');
							}

							textHighlightning.setRangeActiveState(currentMatch.id, false);
						}

						searchData.activeMatch = activeMatch;

						textSchemaElement = activeMatch.matchInfo.schemaElement;
						textHighlightning = textSchemaElement.getTextHighlightning();
						elementDomNode = this.domapi.getNode(textSchemaElement);
						highlightNodes = elementDomNode.querySelectorAll(
							'hlr[rangeId="' + activeMatch.id + '"]'
						);

						for (i = 0; i < highlightNodes.length; i++) {
							highlightNodes[i].setAttribute('active', true);
						}

						textHighlightning.setRangeActiveState(activeMatch.id, true);
						this.viewmodel.SetSelectedItems(textSchemaElement);
						this.scrollToSelection(highlightNodes);
					}.bind(this)
				);
			}
		},

		_cleanupSearchMatches: function () {
			var searchData = this._searchData;

			if (searchData && searchData.normalizedMatches.length) {
				var textSchemaElement;
				var textHighlightning;
				var i;

				for (i = 0; i < searchData.normalizedMatches.length; i++) {
					textSchemaElement = searchData.normalizedMatches[i].schemaElement;

					textHighlightning = textSchemaElement.getTextHighlightning();
					textHighlightning.cleanupRanges();
				}
			}

			this._searchData = null;
		},

		_highlightSearchMatches: function (foundMatches) {
			if (foundMatches && foundMatches.length) {
				var normalizedMatches = this._normalizeMatches(foundMatches);
				var searchData = {
					matches: foundMatches,
					normalizedMatches: normalizedMatches,
					activeMatch: null
				};
				var elementMatchesInfo;
				var textSchemaElement;
				var textHighlightning;
				var elementMatches;
				var currentMatch;
				var matchInfo;
				var i;

				this._searchData = {
					matches: foundMatches,
					activeMatch: null
				};

				for (i = 0; i < normalizedMatches.length; i++) {
					elementMatchesInfo = normalizedMatches[i];
					textSchemaElement = elementMatchesInfo.schemaElement;
					elementMatches = elementMatchesInfo.matches;

					textHighlightning = textSchemaElement.getTextHighlightning();
					textHighlightning.cleanupRanges();

					for (j = 0; j < elementMatches.length; j++) {
						currentMatch = elementMatches[j];
						matchInfo = currentMatch.matchInfo;
						textHighlightning.addRange(
							matchInfo.firstIndex,
							matchInfo.lastIndex,
							{ rangeId: currentMatch.id, suppressEvent: true }
						);
					}

					textSchemaElement.NotifyChanged();
				}

				this._searchData = searchData;
			}
		},

		_normalizeMatches: function (foundMatches) {
			var uniqueTextElements = [];
			var normalizedMatches = [];
			var elementIndex;
			var currentMatch;
			var matchInfo;
			var i;

			for (i = 0; i < foundMatches.length; i++) {
				currentMatch = foundMatches[i];
				matchInfo = currentMatch.matchInfo;
				elementIndex = uniqueTextElements.indexOf(matchInfo.schemaElement);

				if (elementIndex == -1) {
					uniqueTextElements.push(matchInfo.schemaElement);
					normalizedMatches.push({
						schemaElement: matchInfo.schemaElement,
						matches: [currentMatch]
					});
				} else {
					normalizedMatches[elementIndex].matches.push(currentMatch);
				}
			}

			return normalizedMatches;
		},

		applySchemaSettings: function () {
			var schemaHelper = this.viewmodel.Schema();
			var editorSettings = schemaHelper.getEditorSettings();
			var fullCssStyleStr = '';

			var classification = this.viewmodel.ItemClassification();
			var classificationSettings =
				editorSettings[classification] || editorSettings.global;

			if (classificationSettings) {
				for (var i = 0; i < classificationSettings.length; i++) {
					var setting = classificationSettings[i];
					if (setting.cssStyle) {
						fullCssStyleStr +=
							(fullCssStyleStr ? '\n\n' : '') +
							'/* ' +
							setting.name +
							' */\n' +
							setting.cssStyle;
					}
				}
			}

			if (fullCssStyleStr) {
				var ownerDocument = this.editNode.ownerDocument;
				var cssTextNode = ownerDocument.createTextNode(fullCssStyleStr);
				var styleNode = this._classificationStyleNode;

				if (styleNode) {
					styleNode.removeChild(styleNode.childNodes[0]);
				} else {
					this._classificationStyleNode = ownerDocument.head.appendChild(
						ownerDocument.createElement('style')
					);
					styleNode = this._classificationStyleNode;
				}

				styleNode.appendChild(cssTextNode);
			}
		},

		_onMenuItemClick: function (cmdId, itemId) {
			this.actionsHelper.hideContextMenu(this._contextMenu);

			if (cmdId == 'add_parent_sibling') {
				var modelCursor = this.viewmodel.Cursor();
				var targetElement = this.viewmodel.GetElementById(itemId);
				var parentElement = targetElement.Parent;

				this.viewmodel.SetSelectedItems(parentElement);
				modelCursor.Set(parentElement, 0, parentElement, 0);

				setTimeout(
					function () {
						this.showSiblingCreateMenu(parentElement);
					}.bind(this),
					0
				);
			} else {
				this.actionsHelper.onMenuItemClick(cmdId, itemId);

				if (cmdId.split(':')[0] === 'pasteelement') {
					var selectedNode = this.domapi.getNodeById(itemId);
					selectedNode.focus();
				}
			}
		},

		_copyToClipboard: function () {
			this.domRange.refresh();
			//copy paste formatted text
			var content = this.domRange.cloneContents();

			if (content) {
				this._clipboard.setData(content.type, content.data);
			}
		},

		_onDOMRangeRefresh: function (sender, earg) {
			var cursor = this.viewmodel.Cursor();

			cursor.Reinitialize(sender);
		},

		/**
		 * @param {Integer} value
		 */
		setExplicitContentHeight: function (value) {
			var contentHeight = parseInt(value);

			if (!isNaN(contentHeight) && contentHeight > 0) {
				this.contentNode.style.height = contentHeight + 'px';
				this._isExplicitHeight = true;
			}
		},

		dropExplicitContentHeight: function () {
			if (this._isExplicitHeight && this._isContentLoaded) {
				this.contentNode.style.height = 'auto';
				this._isExplicitHeight = false;
			}
		},

		_onTextElementChange: function (mutationData) {
			var dataIndex = 0;
			var targetElement;

			do {
				targetElement = this.domapi.getObject(mutationData[dataIndex].target);
				dataIndex++;
			} while (!targetElement && dataIndex < mutationData.length);

			targetElement._domSynchronized = false;

			this.tryApplyTextStyleOnMutation(targetElement, mutationData);

			if (this._searchControl && this._searchControl.isSearchActive()) {
				var modelCursor = this.viewmodel.Cursor();
				var cursorData;

				this.domRange.refresh();

				this.viewmodel.SuspendInvalidation();
				this.syncModelWithHTML(targetElement);

				cursorData = {
					start: modelCursor.start,
					startOffset: modelCursor.startOffset,
					end: modelCursor.end,
					endOffset: modelCursor.endOffset
				};

				this._searchControl.cleanupResults();
				this.viewmodel.ResumeInvalidation();

				//restore cursor position
				this.domRange.setCursorTo(
					cursorData.start,
					cursorData.startOffset,
					cursorData.end,
					cursorData.endOffset
				);
			}
		},

		tryApplyTextStyleOnMutation: function (targetElement, mutationData) {
			if (
				!targetElement ||
				!targetElement.is('ArasTextXmlSchemaElement') ||
				!mutationData
			) {
				return;
			}

			const textStyle = targetElement.getFreezyStyle();
			const charactedMutationRecord = mutationData.find(function (record) {
				return record.type === 'characterData';
			});

			if (textStyle && charactedMutationRecord) {
				const mutationTarget = charactedMutationRecord.target;
				const currentValue = mutationTarget.data;
				const oldValue = charactedMutationRecord.oldValue;

				// user typed one symbol
				if (oldValue.length + 1 === currentValue.length) {
					const modelCursor = this.viewmodel.Cursor();
					const cursorData = { ...modelCursor };
					const selectionFrom = targetElement.selection.From();
					let currentEmphText;
					let currentEmph;
					let newEmph;

					this.viewmodel.SuspendInvalidation();

					this.syncModelWithHTML(targetElement);

					if (selectionFrom) {
						currentEmph = targetElement.GetEmphObjectById(selectionFrom.id);
						currentEmphText = currentEmph.Text();
						newEmph = currentEmph.Break(selectionFrom.offset);

						if (currentEmphText.length - selectionFrom.offset > 1) {
							newEmph.Break(1);
						}
					} else {
						const emphsCount = targetElement.getEmphsCount();
						newEmph = targetElement.getEmphObjectByIndex(emphsCount - 1);
					}

					for (let styleName in textStyle) {
						newEmph.Style(styleName, textStyle[styleName]);
					}

					targetElement.InvalidRange();
					this.viewmodel.ResumeInvalidation();

					this.domRange.setCursorTo(
						cursorData.start,
						cursorData.startOffset + 1,
						cursorData.end,
						cursorData.endOffset + 1
					);

					return true;
				}
			}
		},

		_attachContentObservers: function () {
			var frameDocument = this.iframe.contentDocument;
			var textElementNodes = frameDocument.querySelectorAll(
				'.ArasTextXmlSchemaElement, .XmlSchemaText'
			);
			var currentNode;
			var i;

			for (i = 0; i < textElementNodes.length; i++) {
				currentNode = textElementNodes[i];

				if (!currentNode._observerAttached) {
					this._textChangesObserver.observe(
						textElementNodes[i],
						this._textObserverConfig
					);
					currentNode._observerAttached = true;
				}
			}
		},

		/**
		 * @param {StructuredDocument} sender
		 * @param {Object} earg
		 */
		_onViewModelInvalidate: function (sender, earg) {
			var originContentHeight = this.contentNode.scrollHeight;
			var originScrollTop = this.scrollNode.scrollTop;
			var incompleteImages = [];
			var invalidationList = earg.invalidationList || [];
			var modelCursor = earg.cursor;
			var imageNodes;
			var imageNode;
			var invalidObject;
			var i;

			for (i = 0; i < invalidationList.length; i++) {
				invalidObject = invalidationList[i];
				this.domRenderer.invalidate(invalidObject);
			}

			this._savedScrollPosition = originScrollTop;
			this.setExplicitContentHeight(originContentHeight);

			this.domRenderer.refresh();
			this._attachContentObservers();
			this.highlightItems(this._currentSelection, true);

			this._invalidateIteration += 1;

			imageNodes = this.editNode.querySelectorAll('img');
			for (i = 0; i < imageNodes.length; i++) {
				imageNode = imageNodes[i];

				if (!imageNodes[i].complete) {
					incompleteImages.push(imageNode);
				}
			}

			this._isContentLoaded = incompleteImages.length === 0;
			this._waitLoadCounter = incompleteImages.length;

			if (!this._isContentLoaded) {
				var iterationNumber = this._invalidateIteration;
				var imageLoadHandler = function () {
					if (this._invalidateIteration === iterationNumber) {
						if (this._waitLoadCounter > 1) {
							this._waitLoadCounter -= 1;
						} else {
							this.onContentLoaded();
							this._isContentLoaded = true;
						}
					}
				}.bind(this);

				for (i = 0; i < incompleteImages.length; i++) {
					incompleteImages[i].onload = imageLoadHandler;
				}
			}
			this.callWhenContentLoaded(this, this.dropExplicitContentHeight);

			if (modelCursor.IsModified()) {
				this.domRange.setCursorTo(
					modelCursor.start,
					modelCursor.startOffset,
					modelCursor.end,
					modelCursor.endOffset
				);

				// during setCursorTo call content can be scrolled
				if (this.scrollNode.scrollTop != originScrollTop) {
					this.scrollNode.scrollTop = originScrollTop;
				}
			}
		},

		_onClassificationChanged: function () {
			this.applySchemaSettings();
		},

		/**
		 * @param {StructuredDocument} sender
		 * @param {ArrayOfWrappedObjects} selectedItems
		 */
		selectionChangeHandler: function (sender, selectedItems) {
			// turn off previous selection highlightning
			this.highlightItems(this._currentSelection, false);

			// turn on current selection highlightning
			if (selectedItems.length) {
				this.highlightItems(selectedItems, true);
				this._currentSelection = selectedItems.slice();

				this.callWhenContentLoaded(this, this.scrollToSelection, [
					this._currentSelection,
					this.viewmodel._isInvalidating
				]);

				if (selectedItems.length === 1) {
					const selectedItem = selectedItems[0];
					const viewCursor = this.viewmodel.Cursor();
					const commonAncestor = viewCursor.commonAncestor;
					if (
						commonAncestor !== selectedItem &&
						!(
							commonAncestor &&
							commonAncestor.Parent === selectedItem &&
							commonAncestor.is('XmlSchemaText')
						)
					) {
						this.domRange.setCursorTo(selectedItem, 'end', selectedItem, 'end');
					}
					if (!this._tryAttachShadowInput(selectedItem)) {
						const elementNode = this.domapi.getNode(selectedItem);
						this._focusNode(elementNode);
					}
				}
			}
		},

		_focusNode: function (targetNode) {
			if (targetNode && targetNode.focus) {
				targetNode.focus();
				if (this._environment.isFirefox) {
					targetNode.focus();
				}
			}
		},

		_initShadowInput: function () {
			const contentDocument =
				this.contentNode && this.contentNode.ownerDocument;

			if (contentDocument) {
				const containerNode = contentDocument.createElement('div');
				containerNode.innerHTML = '<input class="shadowInput"/>';

				const shadowInputNode = containerNode.firstChild;
				this.contentNode.appendChild(shadowInputNode);

				shadowInputNode.addEventListener(
					'compositionstart',
					function () {
						this.insertSymbolAtCursor('');
					}.bind(this)
				);

				this._shadowInput = shadowInputNode;
			}
		},

		_tryAttachShadowInput: function (targetElement) {
			if (targetElement) {
				const elementNode = this.domapi.getNode(targetElement);
				const schemaHelper = this.viewmodel.Schema();

				// If element doesn't support direct text input then all input will be caught with shadow input element
				if (
					this.viewmodel.IsEditable() &&
					!this._isEditableNode(elementNode) &&
					!schemaHelper.IsContentMixed(targetElement)
				) {
					this._shadowInput.value = '';
					this._shadowInput.activated = true;
					this._shadowInput.sourceSchemaElement = targetElement;

					elementNode.appendChild(this._shadowInput);
					this._focusNode(this._shadowInput);

					return true;
				}
			}

			this._detachShadowInput();
		},

		_detachShadowInput: function (targetElement) {
			const shadowInput = this._shadowInput;

			if (shadowInput.activated) {
				shadowInput.activated = false;
				shadowInput.sourceSchemaElement = null;

				shadowInput.parentNode.removeChild(shadowInput);
			}
		},

		_isEditableNode: function (targetNode) {
			if (targetNode) {
				if (
					targetNode.nodeName.toUpperCase() === 'INPUT' ||
					(targetNode.getAttribute &&
						targetNode.getAttribute('contenteditable') == 'true')
				) {
					return true;
				} else {
					return this._isEditableNode(targetNode.parentNode);
				}
			}

			return false;
		},

		/**
		 * @param {ArrayOfWrappedObjects} itemsList
		 * @param {Boolean} doHighlighted
		 */
		highlightItems: function (itemsList, doHighlighted) {
			if (itemsList.length) {
				var targetItem;
				var referencedItem;
				var referencedItems;
				var elementNode;
				var i;
				var j;

				for (i = 0; i < itemsList.length; i++) {
					targetItem = itemsList[i];
					referencedItems = this.viewmodel.GetElementsByOrigin(
						targetItem.origin
					);

					for (j = 0; j < referencedItems.length; j++) {
						referencedItem = referencedItems[j];
						referencedItem = this.viewmodel.GetAncestorOrSelfElement(
							referencedItem
						);

						elementNode = this.domapi.getNode(referencedItem);
						if (elementNode) {
							if (doHighlighted) {
								elementNode.classList.add('TechDocElementSelection');
							} else {
								elementNode.classList.remove('TechDocElementSelection');
							}
						}
					}
				}
			}
		},

		callWhenContentLoaded: function (contextItem, method, methodArguments) {
			if (method) {
				contextItem = contextItem || this;

				if (this._isContentLoaded) {
					method.apply(contextItem, methodArguments);
				} else {
					var isCallExists = false;
					var callInfo;
					var i;

					for (i = 0; i < this._defferedMethodCalls.length; i++) {
						callInfo = this._defferedMethodCalls[i];

						if (
							callInfo.context === contextItem &&
							callInfo.method === method
						) {
							callInfo.arguments = methodArguments;
							isCallExists = true;
							break;
						}
					}

					if (!isCallExists) {
						this._defferedMethodCalls.push({
							context: contextItem,
							method: method,
							arguments: methodArguments
						});
					}
				}
			}
		},

		onContentLoaded: function () {
			var callInfo;
			var i;

			for (i = 0; i < this._defferedMethodCalls.length; i++) {
				callInfo = this._defferedMethodCalls[i];
				callInfo.method.apply(callInfo.context, callInfo.arguments);
			}
			this._defferedMethodCalls.length = 0;
		},

		/**
		 * @param {ArrayOfWrappedObjects} selectedItems
		 * @param {Boolean} useSavedPosition
		 */
		scrollToSelection: function (selectedItems, useSavedPosition) {
			if (selectedItems.length) {
				var frameDocument = this.iframe.contentDocument;
				var scrollNode = this.scrollNode;
				var editorScrollTop = useSavedPosition
					? this._savedScrollPosition
					: scrollNode.scrollTop;
				var offsetTopsOfElements = [];
				var elementsHash = {};
				var elementScrollMargin = 15;
				var topValue;
				var currentNode;
				var selectedItem;
				var elementNode;
				var minOffsetTop;
				var isAbove;
				var isUnder;
				var isHigher;
				var isVisible;
				var elementOffsetBottom;
				var frameScrollBottom;
				var i;

				for (i = 0; i < selectedItems.length; i++) {
					selectedItem = selectedItems[i];
					elementNode = this.viewmodel.isDocumentElement(selectedItem)
						? frameDocument.getElementById(selectedItem.Id())
						: selectedItem;

					if (elementNode) {
						currentNode = elementNode;
						topValue = 0;

						while (currentNode) {
							topValue += currentNode.offsetTop;
							currentNode = currentNode.offsetParent;
						}

						topValue =
							topValue - elementScrollMargin > 0
								? topValue - elementScrollMargin
								: 0;

						offsetTopsOfElements.push(topValue);
						elementsHash[topValue] =
							elementNode.offsetHeight + elementScrollMargin * 2;
					}
				}

				// check that we need to scroll editor content
				minOffsetTop = Math.min.apply(null, offsetTopsOfElements);
				elementHeight = elementsHash[minOffsetTop];

				frameScrollBottom = editorScrollTop + scrollNode.offsetHeight;
				elementOffsetBottom = minOffsetTop + elementHeight;

				isAbove = minOffsetTop <= editorScrollTop;
				isUnder = elementOffsetBottom >= frameScrollBottom;
				isHigher = elementHeight >= scrollNode.offsetHeight;
				isVisible =
					(minOffsetTop > editorScrollTop &&
						minOffsetTop < frameScrollBottom) ||
					(elementOffsetBottom > editorScrollTop &&
						elementOffsetBottom < frameScrollBottom);

				if (!(isAbove && isUnder)) {
					if (isAbove && (!isVisible || !isHigher)) {
						scrollNode.scrollTop = minOffsetTop;
					} else if (isUnder && (!isVisible || !isHigher)) {
						scrollNode.scrollTop =
							elementOffsetBottom - scrollNode.offsetHeight;
					}
				}
			}
		},

		_stopEvent: function (targetEvent) {
			targetEvent.preventDefault();
			targetEvent.stopPropagation();
		},

		_calcContextMenuCoordinates: function (selectedItems, e, elementId) {
			var resultCoordinates = this._calcNodeOffsetCoordinates(this.domNode);

			if (this._contextMenuKey === 93) {
				var targetNode = this.domapi.getNodeById(elementId);
				var nodeOffset = this._calcNodeOffsetCoordinates(targetNode);

				resultCoordinates.x += nodeOffset.x + 10;
				resultCoordinates.y +=
					nodeOffset.y + targetNode.offsetHeight - this.scrollNode.scrollTop;
			} else {
				resultCoordinates.x += e.pageX;
				resultCoordinates.y += e.pageY;
			}

			return resultCoordinates;
		},

		onContextMenuShow: function (e) {
			var selectedItems = this.viewmodel.GetSelectedItems();
			var targetObject = selectedItems.length && selectedItems[0];

			if (!targetObject) {
				// If no one element was selected, then try to calculate appropriate target element for context menu
				var rootSchemaElement = this.viewmodel.Dom();
				var firstLevelElements = rootSchemaElement.ChildItems();

				if (!firstLevelElements.length()) {
					// If document is empty
					targetObject = rootSchemaElement;
					selectedItems = [targetObject];

					this.viewmodel.SetSelectedItems(selectedItems);
				}
			}
			targetObject =
				targetObject && this.viewmodel.GetAncestorOrSelfElement(targetObject);

			if (targetObject) {
				var menuModel = this.actionsHelper.GetActionsMenuModel(selectedItems);
				var elementId = targetObject.Id();
				var coord;

				this.scrollToSelection([targetObject]);
				coord = this._calcContextMenuCoordinates(selectedItems, e, elementId);

				this.actionsHelper.showContextMenu(
					this._contextMenu,
					this,
					menuModel,
					elementId,
					{
						x: coord.x,
						y: coord.y,
						onClose: function () {
							var targetNode = this.domapi.getNodeById(elementId);

							if (targetNode && targetNode.focus) {
								targetNode.focus();
							} else {
								this.iframe.contentWindow.focus();
							}
						}.bind(this)
					}
				);
			}

			this._contextMenuKey = 0;
			this._stopEvent(e);
		},

		/**
		 * @param {DomNode} targetNode
		 */
		getSpecialActionByTargetNode: function (targetNode) {
			if (targetNode && targetNode.nodeType === 1) {
				if (targetNode.className.indexOf('ExpandoButton') > -1) {
					return 'expandNode';
				} else if (targetNode.className.indexOf('ConditionButton') > -1) {
					return 'showCondition';
				} else if (targetNode.className.indexOf('ElementPlaceholder') > -1) {
					var targetElement = this.domapi.getObject(targetNode);

					if (targetElement.is('ArasImageXmlSchemaElement')) {
						return 'selectImage';
					} else if (targetElement.is('ArasItemXmlSchemaElement')) {
						return 'selectItem';
					}
				}
			}
		},

		onClick: function (e) {
			var targetObject = this.domapi.getObject(e.target);
			var changeSelection = true;

			this.inherited(arguments);
			this.viewmodel.SuspendInvalidation();

			if (!targetObject) {
				// If no one element was selected, then try to calculate appropriate target element
				const rootSchemaElement = this.viewmodel.Dom();
				const firstLevelElements = rootSchemaElement.ChildItems().List();

				// if current document is empty, then root element will be selected
				targetObject = !firstLevelElements.length && rootSchemaElement;
			}

			if (e.button === 0) {
				var specialAction = this.getSpecialActionByTargetNode(e.target);

				if (specialAction && targetObject) {
					switch (specialAction) {
						case 'expandNode':
							targetObject.collapseInactiveContent(
								!targetObject.isContentCollapsed()
							);
							changeSelection = false;
							break;
						case 'showCondition':
							this.actionsHelper.executeAction('changecondition', {
								selectedItem: targetObject
							});
							changeSelection = false;
							break;
						case 'selectImage':
							if (
								this.viewmodel.IsEditable() &&
								!this.viewmodel
									.ExternalBlockHelper()
									.isExternalBlockContains(targetObject)
							) {
								this.actionsHelper
									.getAction('appendelement')
									._SearchImage(function (result) {
										targetObject.Image(result.image);
									});
							}

							break;
						case 'selectItem':
							if (
								this.viewmodel.IsEditable() &&
								!this.viewmodel
									.ExternalBlockHelper()
									.isExternalBlockContains(targetObject)
							) {
								var schemaHelper = this.viewmodel.Schema();
								var typeIdAttribute = schemaHelper.getSchemaAttribute(
									targetObject,
									'typeId'
								);
								var typeId = typeIdAttribute
									? typeIdAttribute.Fixed
									: 'DE828FBA99FF4ABB9E251E8A4118B397';

								this.actionsHelper.getAction('appendelement')._SearchItem(
									typeId,
									function (result) {
										var resultItem = result.item;

										//we have to get original item type because tp_Item doesn't have all required properties in order to perform custom rendering if it exists
										if (typeId == 'DE828FBA99FF4ABB9E251E8A4118B397') {
											// tp_Item
											var itemQuery = this.aras.newIOMItem();
											var itemId = this.aras.getItemProperty(resultItem, 'id');

											itemQuery.setAttribute(
												'typeId',
												'DE828FBA99FF4ABB9E251E8A4118B397'
											);
											itemQuery.setID(itemId);
											itemQuery.setAction('get');
											resultItem = itemQuery.apply().node;
										}

										targetObject.Item(resultItem);
									}.bind(this)
								);
							}

							break;
					}

					this._stopEvent(e);
				} else {
					this.domRange.refresh();

					if (targetObject) {
						var targetNode = e.target;

						if (targetNode.ownerDocument.activeElement !== targetNode) {
							targetNode.focus();
						}
					}
				}
			} else {
				if (e.button == 2 && targetObject) {
					this.domRange.setCursorTo(targetObject, 0, targetObject, 0);
				}
			}

			if (changeSelection) {
				this.viewmodel.SetSelectedItems(targetObject);
			}

			this.viewmodel.ResumeInvalidation();

			if (
				this._shadowInput.activated &&
				this._shadowInput.sourceSchemaElement == targetObject
			) {
				this._shadowInput.focus();
			}
		},

		validateItemPropertyValue: function (targetElement, newValue) {
			const propertyDescriptor = {
				data_type: targetElement.getPropertyInfo('data_type'),
				pattern: targetElement.getPropertyInfo('pattern'),
				is_required: targetElement.getPropertyInfo('is_required') === '1',
				stored_length: parseInt(targetElement.getPropertyInfo('stored_length'))
			};
			const validationResult = {
				isValid: true,
				errorMessage: ''
			};

			if (newValue) {
				validationResult.isValid = this.aras.isPropertyValueValid(
					propertyDescriptor,
					newValue
				);
				validationResult.errorMessage = this.aras.ValidationMsg;
			} else if (propertyDescriptor.is_required) {
				validationResult.isValid = propertyDescriptor.data_type === 'boolean';

				if (!validationResult.isValid) {
					validationResult.errorMessage = this.aras.getResource(
						'',
						'item_methods_ex.field_required_provide_value',
						targetElement.getPropertyInfo('label')
					);
				}
			}

			return validationResult;
		},

		showItemPropertyEditor: function (targetElement) {
			if (targetElement) {
				const readonlyReason = targetElement.getReadonlyReason();

				if (!readonlyReason) {
					const elementNode = this.domapi.getNode(targetElement);
					const editorOffset = this._calcNodeOffsetCoordinates(this.domNode);
					const nodeOffset = this._calcNodeOffsetCoordinates(elementNode);
					const propertyDataType = targetElement.getPropertyInfo('data_type');
					const propertyPattern = targetElement.getPropertyInfo('pattern');
					const localizedValue = targetElement.getPropertyLocalValue();
					const editorSettings = {
						titleLabel:
							targetElement.getPropertyInfo('label') ||
							targetElement.getPropertyName(),
						type: propertyDataType,
						pattern:
							propertyDataType === 'date'
								? this.aras.getDotNetDatePattern(
										propertyPattern || 'short_date'
								  )
								: propertyPattern,
						value: localizedValue,
						valueValidator: function (propertyEditor, newValue) {
							return this.validateItemPropertyValue(targetElement, newValue);
						}.bind(this)
					};

					editorSettings.x = nodeOffset.x + editorOffset.x;
					editorSettings.y =
						nodeOffset.y +
						editorOffset.y +
						elementNode.offsetHeight -
						this.scrollNode.scrollTop;
					editorSettings.anchorNode = elementNode;

					return this._itemPropertyEditor.show(editorSettings).then(
						function (selectedValue) {
							if (selectedValue !== undefined) {
								const neutralValue = this.aras.convertToNeutral(
									selectedValue,
									propertyDataType,
									propertyPattern
								);

								targetElement.setPropertyValue(neutralValue);
							}
						}.bind(this)
					);
				} else {
					this.aras.AlertError(readonlyReason);
				}
			}

			return Promise.resolve();
		},

		onDblClick: function (clickEvent) {
			const targetNode = clickEvent.target;
			const targetElement = this.domapi.getObject(targetNode);

			this.inherited(arguments);

			if (clickEvent.button === 0) {
				if (
					targetElement.is('ArasItemPropertyXmlSchemaElement') &&
					this.viewmodel.IsEditable()
				) {
					this.showItemPropertyEditor(targetElement);
					this._stopEvent(clickEvent);
				}
			}
		},

		onKeyDown: function (e) {
			var keyCode = (this._contextMenuKey = e.which || e.keyCode);

			// [FF.24 specific] _passedKeyDownCheck was introduced in order to fix problem in FF.24, where e.prevenetDefault()
			// in "keydown" event doesn't stop "keypress" event occurance
			// this workaround can be removed, when minimal supported version will be changed
			this._passedKeyDownCheck = true;

			switch (keyCode) {
				case keys.RIGHT_ARROW:
				case keys.LEFT_ARROW:
				case keys.DOWN_ARROW:
				case keys.UP_ARROW:
					setTimeout(
						function () {
							this.handleArrowKey(keyCode);
						}.bind(this),
						0
					);

					return false;
				case keys.TAB:
					this.handleTabKey(e);
					this._stopEvent(e);

					return false;
				case keys.ENTER:
					this.handleEnterKey(e);

					return false;
				default:
					if (
						!this.viewmodel.IsEditable() &&
						!(keyCode == 67 && e.ctrlKey && !e.altKey)
					) {
						// only copy operation allowed
						e.preventDefault();
						this._passedKeyDownCheck = false;
						return false;
					} else {
						if (this.handleShortcuts(e)) {
							this._stopEvent(e);
							this._passedKeyDownCheck = false;
						}

						if (this._allowedKeydownKeys[keyCode]) {
							this.handleAllowedKey(e);
						}
					}
					break;
			}
		},

		onPaste: function (e) {
			if (this._shadowInput.activated) {
				setTimeout(this._applyShadowInputContent.bind(this));
			}

			// If files are being pasted during event, then try to create appropriate elements using those data
			const clipboardData = e.clipboardData || window.clipboardData;
			const dataItems =
				clipboardData && (clipboardData.items || clipboardData.files);
			const selectedItems = this.viewmodel.GetSelectedItems();
			const isSingleSelection = selectedItems.length === 1;

			if (dataItems && isSingleSelection && this.viewmodel.IsEditable()) {
				for (let i = 0; i < dataItems.length; i++) {
					const clipboardItem = dataItems[i];

					// If there is an image file in clipboard, then try to create image element
					if (clipboardItem.type.startsWith('image')) {
						const contextSchemaElement = selectedItems[0];
						const schemaHelper = this.viewmodel.Schema();
						const expectedImageElements = schemaHelper.GetExpectedElements(
							contextSchemaElement,
							Enums.XmlSchemaElementType.Image
						);
						const isInsertAllowed = this.viewmodel.isInsertAllowed(
							contextSchemaElement
						);
						const isAppendAllowed = this.viewmodel.isAppendAllowed(
							contextSchemaElement
						);
						const addDirection =
							(isInsertAllowed &&
								expectedImageElements.insert.length &&
								'insert') ||
							(isAppendAllowed &&
								expectedImageElements.append.length &&
								'append');
						const imageElementName =
							addDirection && expectedImageElements[addDirection][0];

						if (imageElementName) {
							this.syncBeforeAction(e);

							this.actionsHelper.executeAction('appendnewitem', {
								context: selectedItems[0],
								elementName: imageElementName,
								direction: addDirection,
								initializerType: 'coreBrowserFileImage',
								initializerParameters: {
									// if clipboardItem is an instance of DataTransferItem, then it should be converted into file with getAsFile method
									sourceFile: clipboardItem.getAsFile
										? clipboardItem.getAsFile()
										: clipboardItem
								}
							});
						} else {
							const restrictionWarning = this.aras.getResource(
								'../Modules/aras.innovator.TDF',
								'action.schemarestriction.imagenotfit'
							);
							this.aras.AlertWarning(restrictionWarning);
						}

						this._stopEvent(e);
						return;
					}
				}
			}
		},

		onKeyPress: function (e) {},

		onKeyUp: function (e) {},

		/**
		 * get correct current item
		 *
		 * @param {cursor} cursorItem - viewCursor.commonAncestor
		 * @param {item} selectItem - viewmodel.GetSelectedItems()(last)
		 */
		getNormalizedItem: function (cursorItem, selectItem) {
			return cursorItem && cursorItem.Parent === selectItem
				? cursorItem
				: selectItem;
		},

		handleAllowedKey: function (e) {
			const isCtrlPressed = e.ctrlKey || e.metaKey;

			// if shadow input is active, then try to apply it's content to appropriate text element
			if (!isCtrlPressed && this._shadowInput.activated) {
				// setTimeout is required to not break keyboard event sequence with dom, selection and focus changes
				setTimeout(
					function () {
						this._applyShadowInputContent();
					}.bind(this),
					0
				);
			}
		},

		/**
		 * @param {Integer} keyCode
		 */
		handleArrowKey: function (keyCode) {
			var viewCursor = this.viewmodel.Cursor();
			var oldCursorState = viewCursor.CreateMemento().GetState();
			var newCursorState;

			this.domRange.refresh();
			newCursorState = viewCursor.CreateMemento().GetState();

			if (
				newCursorState.startOffset == newCursorState.endOffset &&
				oldCursorState.startOffset == newCursorState.startOffset &&
				oldCursorState.endOffset == newCursorState.endOffset
			) {
				var moveDirection;

				switch (keyCode) {
					case keys.UP_ARROW:
						moveDirection = Enums.Directions.Up;
						break;
					case keys.RIGHT_ARROW:
						moveDirection = Enums.Directions.Right;
						break;
					case keys.DOWN_ARROW:
						moveDirection = Enums.Directions.Down;
						break;
					case keys.LEFT_ARROW:
						moveDirection = Enums.Directions.Left;
						break;
				}

				this.shiftSelectedElement(
					moveDirection,
					moveDirection == Enums.Directions.Right ||
						moveDirection == Enums.Directions.Down
				);
			}
		},

		/**
		 * @param {String} newSymbol
		 */
		insertSymbolAtCursor: function (newSymbol) {
			var viewCursor = this.viewmodel.Cursor();
			var schemaHelper = this.viewmodel.Schema();
			var selectedItems = this.viewmodel.GetSelectedItems();
			var selectedItem = selectedItems.length
				? selectedItems[selectedItems.length - 1]
				: viewCursor.commonAncestor;
			var insertResult = { placement: 'direct', element: selectedItem };

			if (selectedItem !== viewCursor.commonAncestor) {
				selectedItem = this.getNormalizedItem(
					viewCursor.commonAncestor,
					selectedItem
				);
				insertResult.element = selectedItem;
			}

			this.domRange.refresh();
			this.viewmodel.SuspendInvalidation();

			if (selectedItem && selectedItem.is('ArasTextXmlSchemaElement')) {
				selectedItem.InsertText(newSymbol);
			} else if (selectedItem) {
				if (!viewCursor.collapsed) {
					viewCursor.DeleteContents();
				}

				if (viewCursor.collapsed) {
					if (selectedItem) {
						if (selectedItem.is('XmlSchemaText')) {
							var insertPosition = viewCursor.startOffset;
							var stringBeforeEditing = selectedItem.Text();
							var stringAfterEditing = [
								stringBeforeEditing.slice(0, insertPosition),
								newSymbol,
								stringBeforeEditing.slice(insertPosition)
							].join('');

							selectedItem.Text(stringAfterEditing);
							viewCursor.Set(
								selectedItem,
								insertPosition + 1,
								selectedItem,
								insertPosition + 1
							);
						} else {
							var childItems = selectedItem.ChildItems();
							var isPlacedIntoChild = false;
							var targetTextElement;

							// if selected element have childs and first child is textElement, then append newSymbol to this element
							if (childItems.length()) {
								var firstChild = childItems.get(0);

								if (
									firstChild.is('ArasTextXmlSchemaElement') ||
									schemaHelper.IsContentMixed(firstChild)
								) {
									targetTextElement = firstChild;
									insertResult = {
										placement: 'existingChild',
										element: firstChild
									};
									isPlacedIntoChild = true;
								}
							}

							if (!isPlacedIntoChild) {
								var expectedTextChilds = schemaHelper.GetExpectedElements(
									selectedItem,
									Enums.XmlSchemaElementType.Text |
										Enums.XmlSchemaElementType.Mixed
								).insert;

								if (expectedTextChilds.length) {
									if (expectedTextChilds.length == 1) {
										// if only one type of text element is expected, then imediately create it
										targetTextElement = this.viewmodel.CreateElement(
											'element',
											{ type: expectedTextChilds[0] }
										);
										childItems.insertAt(0, targetTextElement);
										insertResult = {
											placement: 'newChild',
											element: targetTextElement
										};
									} else {
										// if there are several possible elements exist, then ask user
										this.showTextElementCreateMenu(
											selectedItem,
											expectedTextChilds
										);
										insertResult = {
											placement: 'menu',
											element: null
										};
									}
								}
							}

							// if appropriate text container was found, then place newSymbol into it
							if (targetTextElement) {
								var textContent;

								if (targetTextElement.is('ArasTextXmlSchemaElement')) {
									textContent = targetTextElement.GetTextAsString();
									viewCursor.Set(
										targetTextElement,
										textContent.length,
										targetTextElement,
										textContent.length
									);
									this.viewmodel.SetSelectedItems(targetTextElement);

									if (newSymbol) {
										targetTextElement.InsertText(newSymbol);
									}
								} else if (schemaHelper.IsContentMixed(targetTextElement)) {
									var textElementChilds = targetTextElement.ChildItems();
									var textChild = textElementChilds.get(
										textElementChilds.length() - 1
									);

									if (textChild && textChild.is('XmlSchemaText')) {
										if (newSymbol) {
											textContent = textChild.Text() + newSymbol;
											textChild.Text(textContent);
										} else {
											textContent = textChild.Text();
										}

										this.viewmodel.SetSelectedItems(textChild);
										viewCursor.Set(
											textChild,
											textContent.length,
											textChild,
											textContent.length
										);
									}
								}
							}
						}
					}
				}
			}

			this.viewmodel.ResumeInvalidation();
			return insertResult;
		},

		_applyShadowInputContent: function () {
			const textContent = this._shadowInput.value;

			if (textContent) {
				const sourceElement = this._shadowInput.sourceSchemaElement;
				const isTextSourceElement =
					sourceElement.is('ArasTextXmlSchemaElement') ||
					sourceElement.is('XmlSchemaText');
				let targetTextElement = isTextSourceElement && sourceElement;

				// Searching for appropriate text element
				if (!isTextSourceElement) {
					const insertResult = this.insertSymbolAtCursor('');

					if (
						insertResult.placement === 'newChild' ||
						insertResult.placement === 'existingChild'
					) {
						targetTextElement = insertResult.element;
					}
				}

				if (targetTextElement) {
					const elementDomNode = this.domapi.getNode(targetTextElement);
					const newTextNode = elementDomNode.ownerDocument.createTextNode(
						textContent
					);

					elementDomNode.appendChild(newTextNode);

					if (targetTextElement !== sourceElement) {
						this.viewmodel.SetSelectedItems(targetTextElement);
					}

					this.domRange.setCursorTo(
						targetTextElement,
						'end',
						targetTextElement,
						'end'
					);
					this._detachShadowInput();
				}
			}
		},

		_calcSiblingMenuCoordinates: function (targetNode) {
			var nodeOffset = this._calcNodeOffsetCoordinates(targetNode);
			var editorOffset = this._calcNodeOffsetCoordinates(this.domNode);

			nodeOffset.x += editorOffset.x + 10;
			nodeOffset.y +=
				editorOffset.y + targetNode.offsetHeight - this.scrollNode.scrollTop;

			return nodeOffset;
		},

		_calcNodeOffsetCoordinates: function (targetNode) {
			var xCoor = 0;
			var yCoor = 0;

			while (targetNode) {
				xCoor += targetNode.offsetLeft;
				yCoor += targetNode.offsetTop;

				targetNode = targetNode.offsetParent;
			}

			return { x: xCoor, y: yCoor };
		},

		/**
		 * @param {WrappedObject} targetElement
		 * @param {Boolean} isNextIteration
		 */
		showSiblingCreateMenu: function (targetElement, isNextIteration) {
			if (!targetElement) {
				return;
			}

			var selectedItems = this.viewmodel.GetSelectedItems();
			var immutable =
				this.viewmodel.hasClassificationBindedElements() &&
				selectedItems.some(
					function (item) {
						return this.viewmodel.isRootElementContained(item.Parent || item);
					}.bind(this)
				);

			if (immutable) {
				return;
			}

			var contextMenuItems = this.actionsHelper.getCreateSiblingMenu(
				targetElement
			);
			var parentElement = targetElement.Parent;
			var isTargetTableCell =
				!!parentElement &&
				parentElement.is('ArasRowXmlSchemaElement') &&
				targetElement.is('ArasCellXmlSchemaElement');

			if (contextMenuItems.length && !isTargetTableCell) {
				var elementId = targetElement.Id();
				var targetNode = this.domapi.getNodeById(elementId);
				var firstMenuItem;

				if (parentElement) {
					contextMenuItems.unshift({
						id: 'add_parent_sibling',
						name: 'Go up',
						icon: '../../images/GoUp.svg'
					});
				}

				var coord = this._calcSiblingMenuCoordinates(targetNode);

				this.actionsHelper.showContextMenu(
					this._contextMenu,
					this,
					contextMenuItems,
					elementId,
					{
						x: coord.x,
						y: coord.y,
						maxHeight: 250,
						onClose: function () {
							var targetNode = this.domapi.getNodeById(elementId);

							if (targetNode && targetNode.focus) {
								targetNode.focus();
							} else {
								this.iframe.contentWindow.focus();
							}
						}.bind(this)
					}
				);

				firstMenuItem = this._contextMenu.getItemById(contextMenuItems[0].id);
				firstMenuItem.item.focus();
			} else if (parentElement && !isNextIteration) {
				var modelCursor = this.viewmodel.Cursor();

				this.viewmodel.SetSelectedItems(parentElement);
				modelCursor.Set(parentElement, 0, parentElement, 0);

				setTimeout(
					function () {
						this.showSiblingCreateMenu(parentElement, true);
					}.bind(this),
					0
				);
			}
		},

		/**
		 * @param {WrappedObject} targetElement
		 * @param {Array} elementsList
		 */
		showTextElementCreateMenu: function (targetElement, elementsList) {
			if (targetElement && elementsList.length) {
				var elementId = targetElement.Id();
				var targetNode = this.domapi.getNodeById(elementId);
				var schemaHelper = this.viewmodel.Schema();
				var editorOffset = this._calcNodeOffsetCoordinates(this.domNode);
				var nodeOffset = this._calcNodeOffsetCoordinates(targetNode);
				var contextMenuItems = [];
				var firstMenuItem;
				var itemName;
				var itemType;
				var i;

				for (i = 0; i < elementsList.length; i++) {
					itemName = elementsList[i];
					itemType = schemaHelper.GetSchemaElementType(itemName);
					contextMenuItems.push({
						id: 'insertelement:' + itemName,
						name: itemName,
						icon: Enums.getImagefromType(itemType)
					});
				}

				// menu positioning
				nodeOffset.x += editorOffset.x + 10;
				nodeOffset.y +=
					editorOffset.y + targetNode.offsetHeight - this.scrollNode.scrollTop;

				this.actionsHelper.showContextMenu(
					this._contextMenu,
					this,
					contextMenuItems,
					elementId,
					{
						x: nodeOffset.x,
						y: nodeOffset.y,
						onClose: function () {
							var targetNode = this.domapi.getNodeById(elementId);

							if (targetNode && targetNode.focus) {
								targetNode.focus();
							} else {
								this.iframe.contentWindow.focus();
							}
						}.bind(this)
					}
				);

				firstMenuItem = this._contextMenu.getItemById(contextMenuItems[0].id);
				firstMenuItem.item.focus();
			}
		},

		handleEnterKey: function (e) {
			if (this.viewmodel.IsEditable() && !e.altKey && !e.ctrlKey) {
				if (!e.shiftKey) {
					var selectedItems = this.viewmodel.GetSelectedItems();

					if (selectedItems.length === 1) {
						var targetElement = this.viewmodel.GetAncestorOrSelfElement(
							selectedItems[0]
						);

						if (targetElement) {
							this.scrollToSelection([targetElement]);
							this.showSiblingCreateMenu(targetElement);
						}
					}

					this._stopEvent(e);
				}
			} else {
				this._stopEvent(e);
			}
		},

		handleTabKey: function (e) {
			if (!e.ctrlKey) {
				this.shiftSelectedElement(
					!e.shiftKey ? Enums.Directions.Right : Enums.Directions.Left
				);
			} else if (this.viewmodel.IsEditable()) {
				this.syncBeforeAction(e);
				this.insertSymbolAtCursor('\t');
			}

			return false;
		},

		/**
		 * @param {Enums.Directions} moveDirection
		 * @param {Boolean} cursorAtStart
		 */
		shiftSelectedElement: function (moveDirection, cursorAtStart) {
			var selectedItems = this.viewmodel.GetSelectedItems();

			if (selectedItems.length) {
				var currentItem = selectedItems[selectedItems.length - 1];
				var nextElement = this.getNextElementByDirection(
					currentItem,
					moveDirection
				);
				var nextIndex = this.viewmodel.getElementIndex(nextElement);

				if (nextElement) {
					var innacurateElement = nextElement;
					var schemaHelper = this.viewmodel.Schema();

					while (
						innacurateElement &&
						innacurateElement.ChildItems &&
						innacurateElement.ChildItems().length() > 0 &&
						!schemaHelper.IsContentMixed(innacurateElement)
					) {
						nextIndex += 1;
						innacurateElement = this.viewmodel.getElementByIndex(nextIndex);
					}

					nextElement = innacurateElement || nextElement;

					setTimeout(
						function () {
							this.placeCursorOnElement(
								nextElement,
								cursorAtStart ? 'start' : 'end'
							);
							this.viewmodel.SetSelectedItems(nextElement);
						}.bind(this),
						0
					);
				}
			}
		},

		/**
		 * @param {WrappedObject} targetElement
		 */
		getCellContainer: function (targetElement) {
			while (targetElement) {
				if (targetElement.is('ArasCellXmlSchemaElement')) {
					return targetElement;
				}

				targetElement = targetElement.Parent;
			}
		},

		/**
		 * @param {WrappedObject} targetElement
		 */
		getTableContainer: function (targetElement) {
			var rowContainer;

			while (targetElement) {
				if (targetElement.is('ArasTableXmlSchemaElement')) {
					return targetElement;
				} else if (
					targetElement.is('ArasRowXmlSchemaElement') &&
					!rowContainer
				) {
					rowContainer = targetElement;
				}

				targetElement = targetElement.Parent;
			}

			return rowContainer;
		},

		/**
		 * @param {WrappedObject} targetElement
		 * @param {Enums.Directions} moveDirection
		 */
		getNextElementByDirection: function (targetElement, moveDirection) {
			var mergeCells;
			var cellChilds;
			var i;
			if (targetElement) {
				var positionIncrement =
					moveDirection == Enums.Directions.Right ||
					moveDirection == Enums.Directions.Down;
				var positionOffset = positionIncrement ? 1 : -1;
				var nextIndex;
				var nextElement;
				var targetTableContainer;
				var nextTableContainer;
				var parentCell;

				parentCell = this.getCellContainer(targetElement);

				if (!positionIncrement) {
					while (
						targetElement !== parentCell &&
						targetElement.Parent &&
						targetElement.Parent.ChildItems().index(targetElement) === 0
					) {
						targetElement = targetElement.Parent;
					}
				}

				if (parentCell) {
					cellChilds = parentCell.getAllChilds();
					var isCellNavigation =
						targetElement.is('ArasCellXmlSchemaElement') ||
						((moveDirection == Enums.Directions.Left ||
							moveDirection == Enums.Directions.Up) &&
							targetElement == cellChilds[1]) ||
						((moveDirection == Enums.Directions.Right ||
							moveDirection == Enums.Directions.Down) &&
							targetElement == cellChilds[cellChilds.length - 1]);

					if (isCellNavigation) {
						mergeCells = parentCell.getMergeCells();
						var nextMergeCell;

						if (mergeCells.length == 1) {
							nextElement = parentCell.getNextCell(moveDirection);
						} else {
							var indexLimit = positionIncrement ? mergeCells.length : -1;
							var nextPosition =
								mergeCells.indexOf(parentCell) + positionOffset;
							var nextCell;

							while (nextPosition != indexLimit) {
								nextCell = mergeCells[nextPosition];

								if (nextCell.ChildItems().length() > 0) {
									nextMergeCell = nextCell;
									break;
								}

								nextPosition += positionOffset;
							}

							nextElement =
								nextMergeCell || parentCell.getNextCell(moveDirection);
						}

						// if next cell was found
						if (nextElement) {
							if (!positionIncrement) {
								if (mergeCells.indexOf(nextElement) != -1) {
									var allCellChilds = nextElement.getAllChilds();

									nextElement = allCellChilds[allCellChilds.length - 1];
								} else {
									var foundElement = nextElement;

									mergeCells = nextElement.getMergeCells();

									for (i = mergeCells.length - 1; i >= 0; i--) {
										nextMergeCell = mergeCells[i];
										cellChilds = nextMergeCell.getAllChilds();

										if (cellChilds.length > 1) {
											foundElement = cellChilds[cellChilds.length - 1];
											break;
										}
									}

									nextElement = foundElement;
								}
							}

							return nextElement;
						} else {
							// if cell was not found, then selection moved out from the table
							var cellContainer = parentCell.GetTable() || parentCell.Parent;

							if (!positionIncrement) {
								var containerIndex = this.viewmodel.getElementIndex(
									cellContainer
								);

								nextElement =
									this.viewmodel.getElementByIndex(containerIndex - 1) ||
									cellContainer;
							} else {
								var tableSiblings = cellContainer.Parent.ChildItems();

								nextElement =
									tableSiblings.get(tableSiblings.index(cellContainer) + 1) ||
									targetElement;
							}
						}
					}

					targetTableContainer = this.getTableContainer(parentCell);
				}

				if (!nextElement) {
					nextIndex =
						this.viewmodel.getElementIndex(targetElement) +
						(positionIncrement ? 1 : -1);
					nextElement = this.viewmodel.getElementByIndex(nextIndex);

					// skip XmlSchemaText nodes
					while (nextElement && nextElement.is('XmlSchemaText')) {
						nextIndex += positionIncrement ? 1 : -1;
						nextElement = this.viewmodel.getElementByIndex(nextIndex);
					}
				}

				// trying to correct next element
				if (nextElement) {
					nextTableContainer = this.getTableContainer(nextElement);

					// if we switched into the table from other element
					if (
						nextTableContainer &&
						targetTableContainer != nextTableContainer
					) {
						// if switched from element, that placed under the table
						if (!positionIncrement) {
							nextElement = this.getCellContainer(nextElement);

							// if switched to last cell via upArrow, then move selection to the first cell of the last row
							if (moveDirection == Enums.Directions.Up) {
								if (nextElement == nextTableContainer.getLastCell()) {
									nextElement = nextTableContainer.is(
										'ArasTableXmlSchemaElement'
									)
										? nextTableContainer.getSelectableCell(
												nextTableContainer.RowCount() - 1,
												0
										  )
										: nextTableContainer.ChildItems().get(0);
								}
							}

							mergeCells = nextElement.getMergeCells();

							for (i = mergeCells.length - 1; i >= 0; i--) {
								cellChilds = mergeCells[i].getAllChilds();

								if (cellChilds.length > 1) {
									nextElement = cellChilds[cellChilds.length - 1];
									break;
								}
							}
						}
					}
				}

				return nextElement;
			}
		},

		/**
		 * @param {WrappedObject} targetElement
		 * @param {String} cursorPlace
		 */
		placeCursorOnElement: function (targetElement, cursorPlace) {
			var viewCursor = this.viewmodel.Cursor();
			var schemaHelper = this.viewmodel.Schema();
			var isCursorAtTheEnd = cursorPlace == 'end';
			var cursorPosition;

			if (targetElement.is('ArasTextXmlSchemaElement')) {
				var targetEmph = targetElement.getEmphObjectByIndex(
					isCursorAtTheEnd ? targetElement.getEmphsCount() - 1 : 0
				);

				targetElement.selection.Clear();
				if (targetEmph) {
					cursorPosition = isCursorAtTheEnd ? targetEmph.TextLength() : 0;

					targetElement.selection.From(targetEmph.Id(), cursorPosition);
					targetElement.selection.To(targetEmph.Id(), cursorPosition);
				}

				this.domRange.setCursorTo(
					targetElement,
					cursorPlace,
					targetElement,
					cursorPlace
				);
			} else if (schemaHelper.IsContentMixed(targetElement)) {
				var textChilds = targetElement.ChildItems();
				var targetString = textChilds.get(textChilds.length() - 1);

				if (targetString && targetString.is('XmlSchemaText')) {
					var textContent = targetString.Text();

					cursorPosition = isCursorAtTheEnd ? textContent.length : 0;
					viewCursor.Set(
						targetString,
						cursorPosition,
						targetString,
						cursorPosition
					);
				}
			} else {
				viewCursor.Set(targetElement, 0, targetElement, 0);
			}
		},

		handleCtrlB: function (e) {
			if (this.viewmodel.IsEditable()) {
				this.syncBeforeAction(e);
				this.actionsHelper.executeAction('arastextactions', {
					actionName: 'bold'
				});
			}

			return false;
		},

		handleCtrlI: function (e) {
			if (this.viewmodel.IsEditable()) {
				this.syncBeforeAction(e);
				this.actionsHelper.executeAction('arastextactions', {
					actionName: 'italic'
				});
			}

			return false;
		},

		handleCtrlS: function (e) {
			if (this.viewmodel.IsEditable()) {
				this.syncBeforeAction(e);
				// Calling onSaveCommand after document invalidation only
				setTimeout(function () {
					window.aras.getMostTopWindowWithAras(window).onSaveCommand();
				}, 0);
				return false;
			}

			return true; // let standard onSaveCommand() be executed and save Item
		},

		handleCtrlU: function (e) {
			if (this.viewmodel.IsEditable()) {
				this.syncBeforeAction(e);
				this.actionsHelper.executeAction('arastextactions', {
					actionName: 'under'
				});
			}

			return false;
		},

		setupDefaultShortcuts: function () {
			/*   Need to kill error of RichText's call shortcuts
			Override dijit._editor.RichText that use setupDefaultShortcuts to set
				b, i, u, a, s, m
			*/
		},

		/**
		 * @param {Boolean} value
		 */
		_setDisabledAttr: function (value) {
			// union of dijit.Editor._setDisabledAttr and dijit._editor.RichText._setDisabledAttr
			// but specific logic for "ff" was not included in order to fix problem with flashing caret
			// which is allways visible if document.designMode = "On", also seems that minimal supported by Aras
			// version of FF behaves normally with "contentEditable"

			// this code copied from dijit.Editor._setDisabledAttr
			this.setValueDeferred.then(
				function () {
					if (
						(!this.disabled && value) ||
						(!this._buttonEnabledPlugins && value)
					) {
						// Disable editor: disable all enabled buttons and remember that list
						this._plugins.forEach(function (p) {
							p.set('disabled', true);
						});
					} else if (this.disabled && !value) {
						// Restore plugins to being active.
						this._plugins.forEach(function (p) {
							p.set('disabled', false);
						});
					}
				}.bind(this)
			);

			// this code copied from dijit._editor.RichText
			value = !!value;
			this._set('disabled', value);
			if (!this.isLoaded) {
				return;
			} // this method requires init to be complete
			var preventIEfocus =
				this._environment.isIE && (this.isLoaded || !this.focusOnLoad);
			if (preventIEfocus) {
				this.editNode.unselectable = 'on';
			}

			this.editNode.tabIndex = value ? '-1' : this.tabIndex;
			if (preventIEfocus) {
				this.defer(function () {
					if (this.editNode) {
						// guard in case widget destroyed before timeout
						this.editNode.unselectable = 'off';
					}
				});
			}

			if (value) {
				this.editNode.classList.add('editorDisabled', value);
			} else {
				this.editNode.classList.remove('editorDisabled', value);
			}

			this._disabledOK = true;
		},

		_onBlur: function () {
			// union of dijit.Editor._onBlur, dijit._editor.RichText._onBlur and dijit._FocusMixin._onBlur
			// partially removed code from RichText._onBlur with focus logic (IE specific)
			// summary:
			//		Called from focus manager when focus has moved away from this editor
			// tags:
			//		protected
			var newValue;

			// dijit._FocusMixin code part
			this.onBlur();
			// end of dijit._FocusMixin code part

			// dijit._editor.RichText code part
			newValue = this.getValue(true);
			if (newValue !== this.value) {
				this.onChange(newValue);
			}
			this._set('value', newValue);
			// end of dijit._editor.RichText code part

			// dijit.Editor code part
			this.endEditing(true);
		},

		/**
		 * @param {String} html
		 */
		setValue: function (html) {
			// copy of dijit.Editor.setValue
			// with changed domNode, where innerHTML setted

			if (!this.isLoaded) {
				// try again after the editor is finished loading
				this.onLoadDeferred.then(
					function () {
						this.setValue(html);
					}.bind(this)
				);
				return;
			}

			this._cursorToStart = true;
			if (this.textarea && (this.isClosed || !this.isLoaded)) {
				this.textarea.value = html;
			} else {
				var node = this.isClosed
					? this.domNode
					: this.contentNode || this.editNode;

				html = this._preFilterContent(html);
				if (
					html &&
					this._environment.isFirefox &&
					html.toLowerCase() === '<p></p>'
				) {
					html = '<p>&#160;</p>'; // &nbsp;
				}

				// Use &nbsp; to avoid webkit problems where editor is disabled until the user clicks it
				if (!html && has('webkit')) {
					html = '&#160;'; // &nbsp;
				}

				node.innerHTML = html;
				this._preDomFilterContent(node);
			}

			this.onDisplayChanged();
			this._set('value', this.getValue(true));

			this._attachContentObservers();
		}
	});
});
