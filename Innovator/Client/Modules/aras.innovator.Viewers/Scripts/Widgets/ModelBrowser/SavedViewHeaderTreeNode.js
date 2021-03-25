VC.Utils.Page.LoadWidgets(['ModelBrowser/SavedViewTreeNodeBase']);
VC.Utils.Page.LoadModules(['Controls/mtButton']);

require(['dojo/_base/declare'], function (declare) {
	return dojo.setObject(
		'VC.Widgets.SavedViewHeaderTreeNode',
		declare([VC.Widgets.SavedViewTreeNodeBase], {
			createSavedViewButton: null,

			postCreate: function () {
				this.inherited(arguments);
				this.createButton(this.item);
				VC.Utils.addClass(this.btnSavedView, 'createSavedView');
			},

			createButton: function (item) {
				this.savedViewIcon.setAttribute(
					'src',
					'../../../images/Saved3DViewNew.svg'
				);
				this.createSavedViewButton = new VC.UI.mtButton({}, this.btnSavedView);
				this.createSavedViewButton.treeNodeId = item.id;
				this.createSavedViewButton.domNode
					.getElementsByClassName('savedViewIcon')[0]
					.setAttribute('title', VC.Utils.GetResource('newSavedView'));
				this.contentNode.appendChild(this.createSavedViewButton.domNode);
			}
		})
	);
});
