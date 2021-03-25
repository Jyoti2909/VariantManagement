define([
	'dojo/_base/declare',
	'dojo/aspect',
	'RE/Scripts/Classes/Helper/ContentManager',
	'RE/Scripts/Classes/ReqDocActionStateController',
],
function(declare, aspect, ContentManager, ReqDocActionStateController) {
	return declare('Aras.Client.Controls.RE.Helper.LazyContentManager', [ContentManager], {
		scrollNode: null,
		lastRenderedElementIndex: 0,
		firstRenderedElementIndex: 0,
		previousScrollPosition: 0,
		_minItemCount: 5,
		_multiScrollPromise: null,

		init: function(args) {
			this.inherited(arguments);
			aspect.after(this._viewmodel, 'selectiveSectionsInvalidate', this._invalidateVisibleSections.bind(this), true);
			this.scrollNode = args.scrollNode;
			this.actionStateController = this._viewmodel.getActionStateController();
		},

		renderRootNode: function() {
			return this.domRenderer.RenderHtml(this._viewmodel.Dom(), {skipChildRendering: true});
		},

		_setRootNode: function(node) {
			this.rootNode = node;
		},

		fillRootNode: function() {
			this._setRootNode(this.scrollNode.firstChild.firstChild);
			this.appendNodesBelow(this.rootNode);
		},

		appendNodesBelow: function(parentNode) {
			let elementsCount = this._getFirstLevelElementCount();
			if (elementsCount) {
				do {
					let renderedNode = this._renderOneElement(this.lastRenderedElementIndex);
					parentNode.appendChild(renderedNode);
					this.lastRenderedElementIndex++;
				} while ((parentNode.childNodes.length < this._minItemCount || parentNode.offsetHeight < this.scrollNode.offsetHeight * 3) &&
					this.lastRenderedElementIndex < elementsCount);
			}
		},

		appendNodesAbove: function(parentNode) {
			do {
				let renderedNode = this._renderOneElement(this.firstRenderedElementIndex);
				parentNode.insertBefore(renderedNode, parentNode.firstChild);
				this.firstRenderedElementIndex--;
			} while (parentNode.offsetHeight < this.scrollNode.offsetHeight && this.firstRenderedElementIndex >= 0);
			if (this.firstRenderedElementIndex == -1) {
				this.firstRenderedElementIndex++;
			}
		},

		_renderOneElement: function(index) {
			let childItems = this._viewmodel.Dom().ChildItems();
			let element = childItems.get(index);

			this._setChapterToElement(element);

			return element && this.domRenderer.render(element);
		},

		_setChapterToElement: function(element) {
			const reqId = element.origin.getAttribute('reqId');
			const chapter = this._viewmodel.getUpdatedChapterByRequirementId(reqId);

			if (chapter) {
				this._viewmodel.SuspendInvalidation();

				const chapterElement = this._getChapterElement(element);
				const chapterEmphObj = chapterElement.getEmphObjectByIndex(0);
				chapterEmphObj.Text(chapter + ' - ');

				this._viewmodel.ResumeInvalidation();
			}
		},

		_invalidateVisibleSections: function(invalidationList) {
			this._viewmodel.SuspendInvalidation();

			const childItems = this._viewmodel.Dom().ChildItems();
			for (let index = this.firstRenderedElementIndex; index <= this.lastRenderedElementIndex; index++) {
				const element = childItems.get(index);
				if (element) {
					const reqId = element.origin.getAttribute('reqId');
					const newChapter = invalidationList[reqId];
					if (newChapter) {
						const chapterElement = this._getChapterElement(element);
						const chapterEmphObj = chapterElement.getEmphObjectByIndex(0);
						const emphId = chapterEmphObj.Id();

						chapterElement.selection.From(emphId, 0);
						chapterElement.selection.To(emphId, chapterEmphObj.Text().length);
						chapterElement.InsertText(newChapter + ' - ');
						chapterElement.parseOrigin();
					}
				}
			}

			this._viewmodel.ResumeInvalidation();
		},

		_getChapterElement: function(element) {
			// "element" has structure as - Requirement/Requirement-Info/Requirement-Chapter
			const reqChildren = element.ChildItems();
			const reqInfo = reqChildren.get(0);
			const infoChildren = reqInfo.ChildItems();
			return infoChildren.get(0);
		},

		_getFirstLevelElementCount: function() {
			let dom = this._viewmodel.Dom();
			let childrens = dom.ChildItems();
			return childrens.length();
		},

		scrollHandler: function(e) {
			if (!this._multiScrollPromise) {
				this._multiScrollPromise = Promise.resolve();
			}

			// Promise is required for resolving FF problem with optimization
			// FF will try to parallel handling of scroll event as result need to create
			// queue to handle events properly.
			return this._multiScrollPromise.then(function() {
				this._scrollHandler(e);
			}.bind(this));
		},

		_scrollHandler: function(scrollEvent) {
			const currentScrollPosition = this.scrollNode.scrollTop;
			const downHiddenAreaSize = this.scrollNode.scrollHeight - this.scrollNode.scrollTop - this.scrollNode.offsetHeight;
			const upHiddenAreaSize = this.scrollNode.scrollTop;
			if (currentScrollPosition !== this.previousScrollPosition) {
				if (currentScrollPosition > this.previousScrollPosition) {
					this._scrollDown(downHiddenAreaSize, upHiddenAreaSize);
				} else {
					this._scrollUp(downHiddenAreaSize, upHiddenAreaSize);
				}

				this.previousScrollPosition = currentScrollPosition;
				this._highlightSelectedNode();
			} else if ((upHiddenAreaSize < this.scrollNode.offsetHeight / 2) && (this.firstRenderedElementIndex > 0)) {
				this._scrollUp(downHiddenAreaSize, upHiddenAreaSize);
				this.previousScrollPosition = currentScrollPosition;
				this._highlightSelectedNode();
			}
		},

		_scrollDown: function(downHiddenAreaSize, upHiddenAreaSize) {
			while (this.rootNode.childNodes.length < this._minItemCount && this.lastRenderedElementIndex < this._getFirstLevelElementCount() ||
				(downHiddenAreaSize < this.scrollNode.offsetHeight / 2) && this.lastRenderedElementIndex < this._getFirstLevelElementCount()) {
				const renderedNode = this._renderOneElement(this.lastRenderedElementIndex);
				this.rootNode.appendChild(renderedNode);
				this.lastRenderedElementIndex++;
				let nextRemoveCandidateHeight = this.rootNode.firstChild.offsetHeight;

				while (nextRemoveCandidateHeight < upHiddenAreaSize && upHiddenAreaSize > this.scrollNode.offsetHeight &&
						this.firstRenderedElementIndex !== this.lastRenderedElementIndex ) {
					const removedElementHeight = this.rootNode.firstChild.offsetHeight;
					this.rootNode.removeChild(this.rootNode.firstChild);
					upHiddenAreaSize -= removedElementHeight;
					this.firstRenderedElementIndex++;

					nextRemoveCandidateHeight = this.rootNode.firstChild.offsetHeight;
				}
				downHiddenAreaSize = this.scrollNode.scrollHeight - upHiddenAreaSize - this.scrollNode.offsetHeight;
			}

			this.scrollNode.scrollTop = upHiddenAreaSize;
		},

		_scrollUp: function(downHiddenAreaSize, upHiddenAreaSize) {
			while ((upHiddenAreaSize < this.scrollNode.offsetHeight / 2) && this.firstRenderedElementIndex > 0) {
				const renderedNode = this._renderOneElement(this.firstRenderedElementIndex - 1);

				this.firstRenderedElementIndex--;

				if (renderedNode) {
					this.rootNode.insertBefore(renderedNode, this.rootNode.firstChild);
					upHiddenAreaSize += this.rootNode.firstChild.offsetHeight;
					let nextRemoveCandidateHeight = this.rootNode.lastChild.offsetHeight;

					while (this.rootNode.childNodes.length > this._minItemCount &&
							nextRemoveCandidateHeight && nextRemoveCandidateHeight < downHiddenAreaSize &&
							downHiddenAreaSize > this.scrollNode.offsetHeight && this.firstRenderedElementIndex !== this.lastRenderedElementIndex) {
						this.rootNode.removeChild(this.rootNode.lastChild);
						downHiddenAreaSize = this.scrollNode.scrollHeight - upHiddenAreaSize - this.scrollNode.offsetHeight;
						this.lastRenderedElementIndex--;

						nextRemoveCandidateHeight = this.rootNode.lastChild && this.rootNode.lastChild.offsetHeight;
					}
				}
			}

			this.scrollNode.scrollTop = upHiddenAreaSize;
		},

		_highlightSelectedNode: function() {
			let selectedItem = this._viewmodel.GetSelectedItems()[0];
			if (selectedItem) {
				let selectedNode = this._domapi.getNode(selectedItem);
				if (selectedNode && !selectedNode.classList.contains('TechDocElementSelection')) {
					selectedNode.classList.add('TechDocElementSelection');
					selectedNode.focus();
				}
			}
		},

		isElementPresentInDom: function(targetElement) {
			return this._domapi && this._domapi.getNode(targetElement);
		},

		updateEditorDom: function(targetElement) {
			if (this.rootNode) {
				this.removeChildren(this.rootNode);
				let currentIndex;
				if (targetElement) {
					let requirementElement = this._viewmodel._getClassifiedParentElement(targetElement);
					let elementId = requirementElement.Id();
					currentIndex = this._viewmodel.Dom()._childItems._indexHash[elementId];
				}
				if (currentIndex || currentIndex == 0) {
					this.lastRenderedElementIndex = this.firstRenderedElementIndex = currentIndex;
					if (this.firstRenderedElementIndex != 0) {
						this.firstRenderedElementIndex--;
						this.appendNodesAbove(this.rootNode);
					}
				} else {
					this.lastRenderedElementIndex = this.firstRenderedElementIndex;
				}
				let scrollPosition = this.scrollNode.scrollHeight;
				this.appendNodesBelow(this.rootNode);
				this.scrollNode.scrollTop = scrollPosition;
			}
		},

		removeChildren: function(node) {
			while (node.firstChild) {
				node.removeChild(node.firstChild);
			}
		},

		_refreshElement: function(targetElement) {
			if (targetElement.nodeName == 'aras:block') {
				let scrollPos = this.scrollNode.scrollTop;
				let selectedItem = this._viewmodel.GetSelectedItems()[0];
				if (!this.actionStateController.getState()) {
					this.updateEditorDom(selectedItem);
				}
				this.scrollNode.scrollTop = scrollPos;
			} else {
				this.inherited(arguments);
			}
		}
	});
});
