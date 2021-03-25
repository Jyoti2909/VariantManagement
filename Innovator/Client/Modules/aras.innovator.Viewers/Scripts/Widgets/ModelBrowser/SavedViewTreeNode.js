VC.Utils.Page.LoadWidgets(['ModelBrowser/SavedViewTreeNodeBase']);
VC.Utils.Page.LoadModules(['Controls/mtButton']);

require(['dojo/_base/declare'], function (declare) {
	var OriginEventType = { originHoverEvent: 'originHoverEvent' };
	return dojo.setObject(
		'VC.Widgets.SavedViewTreeNode',
		declare([VC.Widgets.SavedViewTreeNodeBase], {
			deleteSavedViewButton: null,

			postCreate: function () {
				this.inherited(arguments);
				this.createButton(this.item);
				this.iconNode.setAttribute('src', this.item.openIcon);
				this.savedViewIcon.setAttribute('src', '../../../images/Close.svg');
				VC.Utils.addClass(this.btnSavedView, 'deleteSavedView');
				this.contentNode.parentElement.onmouseover = this.showButton.bind(this);
				this.contentNode.parentElement.onmouseout = this.hideButton.bind(this);
			},

			showButton: function (event) {
				this.deleteSavedViewButton.domNode.style.display = 'inline-block';
			},

			hideButton: function (event) {
				this.deleteSavedViewButton.domNode.style.display = 'none';
			},

			createButton: function (item) {
				this.deleteSavedViewButton = new VC.UI.mtButton({}, this.btnSavedView);
				this.deleteSavedViewButton.treeNodeId = item.id;
				this.deleteSavedViewButton.domNode.setAttribute(
					'title',
					VC.Utils.GetResource('deleteSavedView')
				);
				this.deleteSavedViewButton.domNode.style.display = 'none';

				this.contentNode.appendChild(this.deleteSavedViewButton.domNode);
			}
		})
	);
});
