define(['dstore/Memory', 'dstore/Trackable', 'dojo/_base/declare'], function (
	Memory,
	Trackable,
	declare
) {
	var _memStore;
	var _columnGroupCollection;

	function setData(commonData) {
		var MemoryTrackable = declare([Memory, Trackable]);
		_memStore = new MemoryTrackable({ data: commonData.data });
		_columnGroupCollection = commonData.columnGroupCollection;
	}

	return {
		addItem: function (item, sourceId) {
			_memStore.addSync(item, { beforeId: sourceId });
		},

		updateItem: function (item) {
			_memStore.putSync(item);
		},

		getItem: function (id) {
			return _memStore.getSync(id);
		},

		deleteItem: function (id) {
			_memStore.removeSync(id);
		},

		getMemStore: function () {
			return _memStore;
		},

		setData: function (commonData) {
			setData(commonData);
		},

		getColumnGroupCollection: function () {
			return _columnGroupCollection;
		}
	};
});
