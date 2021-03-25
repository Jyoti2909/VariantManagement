/* global define */
define(['dojo/dom', 'dojo/json', 'dojo/store/Memory'], function (
	dom,
	json,
	Memory
) {
	return {
		parsedData: {},
		memStore: null,
		dataStore: null,

		getMemStore: function () {
			return this.memStore;
		},

		loadItems: function (dataStore) {
			this.setData(dataStore);
			this.dataStore = dataStore;
		},

		setData: function (dataStore) {
			this.parsedData = dataStore.treeModelCollection[0];
			this.memStore = new Memory({
				id: 'id',
				data: [this.parsedData],

				getChildren: function (element) {
					return dataStore.getChildren(element);
				},

				mayHaveChildren: function (element) {
					var children = dataStore.getChildren(element);
					return children.length > 0;
				},

				getNextChild: function (newNode) {
					return null;
				},

				getDataStore: function () {
					return dataStore;
				},

				resortColumnNodes: function (
					sourceElement,
					nextElement,
					parentElement
				) {
					return dataStore.insertExistingTabularColumn(
						sourceElement,
						nextElement,
						parentElement
					);
				}
			});
		},

		getIcon: function (element) {
			return this.dataStore.getIconPath(element);
		},

		clear: function () {
			this.parsedData = {};
			this.memStore = null;
			this.dataStore = null;
		},

		getTreeNodeById: function (id) {
			return this.dataStore.getElementById(id);
		}
	};
});
