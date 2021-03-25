require(['dojo/_base/declare'], function (declare) {
	return dojo.setObject('VC.TreeNodeToTreeConnector', {
		onProcessNodeInTree: function (nodeId, widgetId) {},

		onTreeNodeRendered: function (nodeId, widgetId) {
			this.onProcessNodeInTree(nodeId, widgetId);
		}
	});
});
