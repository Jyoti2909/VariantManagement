VC.Utils.Page.LoadWidgets(['ModelBrowser/BasicTreeNode']);

require([
	'dojo/_base/declare',
	'dojo/text!../Views/SavedViewTreeNodeTemplate.html'
], function (declare, treeNodeTemplate) {
	return dojo.setObject(
		'VC.Widgets.SavedViewTreeNodeBase',
		declare([VC.Widgets.BasicTreeNode], {
			templateString: '',

			onTreeNodeRendered: function () {},

			constructor: function () {
				this.templateString = treeNodeTemplate;

				Object.defineProperty(this, 'treeNodeId', {
					get: function () {
						return this.item.id;
					}
				});
			},

			postCreate: function () {
				this.inherited(arguments);
				this._onTreeNodeRendered(this.treeNodeId, this.id);
			},

			_onTreeNodeRendered: function (treeNodeId, id) {
				this.onTreeNodeRendered(treeNodeId, id);
			}
		})
	);
});
