define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/Editor',
	'RE/Scripts/UI/RequirementDOM',
	'RE/Scripts/Model/Aras/_ArasTableXmlSchemaElement/editor/plugins/ResizeTableColumn'
],
function(declare, TechDocEditor, DOMapi) {
	return declare('Aras.Client.Controls.Requirement.RequirementEditor', [TechDocEditor], {
		constructor: function(args) {
			this.plugins = [{
				name: 'Aras.Client.Controls.Requirement.ViewModel.Aras._ArasTableXmlSchemaElement.editor.plugins.ResizeTableColumn',
				command: 'ResizeTableColumn'
			}];
		},

		_attachSearchEventListeners: function() {
			const searchControl = this._searchControl;

			this.inherited(arguments);

			if (this._searchControl) {
				searchControl.removeEventListener({
					eventName: 'onActiveMatchChanged',
					owner: this
				});

				searchControl.addEventListener(this, this, 'onActiveMatchChanged', function(matchIndex, activeMatch) {
					const searchData = this._searchData;
					const allMatches = searchData.matches;
					let currentMatch = searchData.activeMatch;
					let textSchemaElement;
					let elementDomNode;
					let highlightNodes;

					if (currentMatch) {
						textSchemaElement = currentMatch.matchInfo.schemaElement;
						elementDomNode = this.domapi.getNode(textSchemaElement);
						highlightNodes = elementDomNode.querySelectorAll('hlr[active]');

						for (let i = 0; i < highlightNodes.length; i++) {
							highlightNodes[i].removeAttribute('active');
						}
					}

					currentMatch = allMatches[matchIndex];
					searchData.activeMatch = currentMatch;

					textSchemaElement = currentMatch.matchInfo.schemaElement;
					// Should here to select and scroll to element, that causes rendering if it was not rendered yet
					this.viewmodel.SetSelectedItems(textSchemaElement);

					elementDomNode = this.domapi.getNode(textSchemaElement);
					highlightNodes = elementDomNode.querySelectorAll('hlr[rangeId="' + currentMatch.id + '"]');

					for (let i = 0; i < highlightNodes.length; i++) {
						highlightNodes[i].setAttribute('active', true);
					}

					this.scrollToSelection(highlightNodes);
				}.bind(this));
			}
		},

		onLoad: function(html) {
			this.inherited(arguments);
			this.domapi = new DOMapi({document: this.document, viewmodel: this.viewmodel});
			//prevent context menu in ownerDocument, because javascript error that was in IE9 is absent in IE11
			this.domNode.ownerDocument.oncontextmenu = function(e) {
				e.preventDefault();
				e.stopPropagation();
			};
			const topWnd = aras.getMostTopWindowWithAras(window);
			this.aras.browserHelper.toggleSpinner(topWnd.document, false);
		},

		onContextMenuShow: function(e) {
			var targetObject = this.domapi.getObject(e.target);
			targetObject = targetObject && this.viewmodel.GetAncestorOrSelfElement(targetObject);

			if (targetObject) {
				this.inherited(arguments);
			} else {
				var currentSelectedItem = this.viewmodel.getLastElement();
				if (currentSelectedItem) {
					var menuModel = this.actionsHelper.GetActionsMenuModel();
					var selectedItems = this.viewmodel.GetSelectedItems();
					var coord = this._calcContextMenuCoordinates(selectedItems, e);
					this.actionsHelper.showContextMenu(this._contextMenu, this, menuModel, currentSelectedItem.Id(), {
						x: coord.x,
						y: coord.y,
					});
				}
			}

			this._contextMenuKey = 0;
			this._stopEvent(e);
		},

		handleAllowedKey: function(e) {
			const viewCursor = this.viewmodel.Cursor();
			const selectedItems = this.viewmodel.GetSelectedItems();
			const selectedItem = selectedItems.length ? selectedItems[selectedItems.length - 1] : viewCursor.commonAncestor;
			if (this.viewmodel.isImmutableElement(selectedItem)) {
				return;
			}
			this.inherited(arguments);
		},

		onClick: function(e) {
			this.inherited(arguments);
			e.stopPropagation();
		},

		selectionChangeHandler: function(sender, selectedItems) {
			this.inherited(arguments);
			if (!selectedItems.length) {
				this._currentSelection = [];
			}
		}
	});
});
