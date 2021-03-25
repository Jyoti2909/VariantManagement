define([
	'dojo/_base/declare',
	'RE/Scripts/Classes/RequirementEditor',
	'RE/Scripts/UI/RequirementsDocumentDOM'
],
function(declare, RequirementEditor, DOMapi) {
	return declare('Aras.Client.Controls.Requirement.Editor', [RequirementEditor], {
		contentManager: null,
		constructor: function(args) {
			this.contentManager = args.contentManager;
		},

		onLoad: function(html) {
			this.inherited(arguments);
			this.domapi = new DOMapi({document: this.document, viewmodel: this.viewmodel});
			this.contentManager.init({
				scrollNode: this.scrollNode,
				document: this.document
			});

			const scrollHandler = this._debounce(this.contentManager.scrollHandler, this.contentManager);
			this.scrollNode.addEventListener('scroll', scrollHandler);
		},

		_debounce: function(func, context) {
			let timeout;
			return function() {
				const args = arguments;
				const later = function() {
					timeout = null;
					func.apply(context, args);
				};
				clearTimeout(timeout);
				timeout = setTimeout(later, 20);
			};
		},

		_setInitialValue: function() {
			/*
			 * Create deferred execution RenderHtml method to call it in the end,
			 * because after the first editor appearance, method onload calls before
			 * startup and elements not paint in the editor.
			*/
			setTimeout(function() {
				this.set('value', this.contentManager.renderRootNode());
				this.editNode.classList.add('controlInited');
				this.contentManager.fillRootNode();
			}.bind(this), 0);
		},

		_onViewModelInvalidate: function(sender, earg) {
			if (!this.contentManager.rootNode) {
				return;
			}

			let originContentHeight = this.contentNode.scrollHeight;
			let originScrollTop = this.scrollNode.scrollTop;
			let incompleteImages = [];
			let invalidationList = earg.invalidationList || [];
			let modelCursor = earg.cursor;
			let imageNodes;
			let imageNode;
			let invalidObject;
			let i;

			for (i = 0; i < invalidationList.length; i++) {
				invalidObject = invalidationList[i];
				this.contentManager.invalidate(invalidObject);
			}

			this._savedScrollPosition = originScrollTop;
			this.setExplicitContentHeight(originContentHeight);

			this.contentManager.refresh();
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

			this._isContentLoaded = (incompleteImages.length === 0);
			this._waitLoadCounter = incompleteImages.length;

			if (!this._isContentLoaded) {
				let iterationNumber = this._invalidateIteration;
				let imageLoadHandler = function() {
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
				this.domRange.setCursorTo(modelCursor.start, modelCursor.startOffset, modelCursor.end, modelCursor.endOffset);

				// during setCursorTo call content can be scrolled
				if (this.scrollNode.scrollTop != originScrollTop) {
					this.scrollNode.scrollTop = originScrollTop;
				}
			}
		},

		selectionChangeHandler: function(sender, selectedItems) {
			if (this.contentManager.rootNode) {
				if (selectedItems.length && this.viewmodel.isImmutableElement(selectedItems[0])) {
					selectedItems[0] = this.viewmodel._getClassifiedParentElement(selectedItems[0]);
				}
				if (selectedItems.length && !this.contentManager.isElementPresentInDom(selectedItems[0])) {
					this.contentManager.updateEditorDom(selectedItems[0]);
				}
				this.inherited(arguments);
			}
		},

		onContextMenuShow: function(e) {
			const targetObject = this.domapi.getObject(e.target);
			if (targetObject) {
				this.inherited(arguments);
			} else {
				const menuModel = this.actionsHelper.getNoActionMenu();
				const coord = this._calcContextMenuCoordinates([], e);
				this.actionsHelper.showContextMenu(this._contextMenu, this, menuModel, null, {
					x: coord.x,
					y: coord.y,
				});
			}

			this._stopEvent(e);
		}
	});
});
