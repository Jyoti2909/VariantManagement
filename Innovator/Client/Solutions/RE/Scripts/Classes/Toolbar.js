define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/Toolbar',
	'TechDoc/Aras/Client/Controls/TechDoc/Helper/CharacterHelper',
	'dojo/aspect'
],

function(declare, TechDocToolbar, CharacterHelper, aspect) {
	return declare('Aras.Client.Controls.TechDoc.Toolbar', [TechDocToolbar], {
		initToolbar: function() {
			this._characterHelper = new Aras.Client.Controls.TechDoc.Helper.CharacterHelper({viewmodel: this.viewmodel});
			aspect.after(this.viewmodel, 'onSelectionChanged', this._updateToolbarHandler.bind(this), true);
			aspect.after(this.viewmodel, 'OnInvalidate', this._updateToolbarHandler.bind(this), true);
			this._updateToolbarHandler(this.viewmodel);
		},

		_updateToolbarHandler: function(sender) {
			const topWindow = sender._aras.getMostTopWindowWithAras(window);
			topWindow.cui.updateToolbarItems(this, {}, 'UpdateToolbarEvent', true, {
				sender: sender
			});
			this._setSeparatorsVisibility();
		},

		ExecuteToolbarAction: function(controlId) {
			var toolbarActions = this.viewmodel.ActionsHelper().viewActions;
			var action = controlId.replace('re_', '');

			switch (action) {
				case 'bold':
				case 'italic':
				case 'strike':
				case 'sub':
				case 'sup':
				case 'under':
					toolbarActions.arastextactions.handler.Execute({'actionName': action});
					break;
				case 'bottom':
				case 'middle':
				case 'top':
				case 'left':
				case 'right':
				case 'center':
				case 'justify':
					toolbarActions.tableactions.handler.Execute({'action': action});
					break;
				case 'bullet':
				case 'numeric':
				case 'alpha':
					toolbarActions.listaction.handler.Execute({'listtype': action});
					break;
				case 'char_table':
					var control = this.GetItem(controlId);
					var btnNode = control['_item_Experimental'].domNode;
					this._characterHelper.ShowCharacterTable(btnNode);
					break;
			}
		},

		getRelatedDropDownValue: function() {
			var dropDown = this.GetItem('re_selectRelatedType');
			return dropDown ? dropDown.GetSelectedItem() : '';
		},

		_copyVisibilityStyle: function(sourceElementId, destElemmentId) {
			let display = 'none';
			const sourceItem = this.GetItem(sourceElementId);
			if (sourceItem) {
				const sourceWidget = sourceItem._item_Experimental;
				display = sourceWidget.domNode.style.display;
			}

			const destWidget = this.GetItem(destElemmentId)._item_Experimental;
			destWidget.domNode.style.display = display;
		},

		_setSeparatorsVisibility: function() {
			//CUI Toolbar does not provide API to reinit separators when toolbar is updated.
			//If you decide to add new button after re_sup buttons you shout fix this code.
			var allElements = this.getButtons();
			allElements = allElements.split(',');
			for (var i = 0; i < allElements.length; i++) {
				switch (allElements[i]) {
					case 're_moveDown':
						// Need to copy styles from element after re_moveDown separator.
						// Because if elements after are hidden - no need to show separator.
						this._copyVisibilityStyle('re_bold', allElements[i + 1]);
						break;
					case 're_sup':
						this._copyVisibilityStyle('re_sup', allElements[i + 1]);
						break;
				}
			}
		}
	});
});
