require(['dojo/_base/declare'], function (declare) {
	return dojo.setObject(
		'VC.Viewers.TreeNodeIdToModelNodeIdDictionary',
		declare(null, {
			_dictionary: null,

			constructor: function () {
				this._dictionary = [];
			},

			addPair: function (nodeId, treeNodeId, cadId) {
				var nodeIdCadIdPair = {
					nodeId: nodeId,
					treeNodeId: treeNodeId,
					cadId: cadId
				};
				this._dictionary.push(nodeIdCadIdPair);
			},

			getNodeIds: function (treeNodeId) {
				var returnedValue = null;

				if (treeNodeId && this._dictionary.length > 0) {
					var nodeIdToCadIdPairs = this._dictionary.FindAll(
						'treeNodeId',
						treeNodeId
					);

					returnedValue = nodeIdToCadIdPairs.map(function (value, index, str) {
						return value.nodeId;
					});
				}

				return returnedValue;
			},

			getTreeNodeId: function (nodeId) {
				var returnedValue = null;

				if (nodeId && this._dictionary.length > 0) {
					var result = this._dictionary.Find('nodeId', nodeId);
					if (result) {
						returnedValue = result.treeNodeId;
					}
				}

				return returnedValue;
			},

			getCadId: function (key, value) {
				var returnedValue = null;

				if (value && this._dictionary.length > 0) {
					var result = this._dictionary.Find(key, value);
					if (result) {
						returnedValue = result.cadId;
					}
				}

				return returnedValue;
			},

			clearDictinary: function () {
				while (this._dictionary.length) {
					this._dictionary.pop();
				}
			}
		})
	);
});
