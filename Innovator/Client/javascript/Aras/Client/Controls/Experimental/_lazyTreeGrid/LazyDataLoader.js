define(function () {
	function _LazyDataLoader(args) {
		var _data = {} /* collection of items' data (by itemId) */,
			_loadItemData = args.loadItemData /* arguments: itemId, itemData */,
			_getItemId = args.getItemId; /* arguments: rowIndex */

		if (!_loadItemData || !_getItemId) {
			throw new Error(
				'Not all required arguments were passed to LazyDataLoader-constructor!'
			);
		}

		return {
			removeData: function (itemId) {
				if (itemId) {
					delete _data[itemId];
				} else {
					_data = {};
				}
			},
			deferItemDataLoading: function (itemId, itemData) {
				_data[itemId] = itemData;
			},
			fillRowWithData: function (rowIndex) {
				var itemId = _getItemId(rowIndex),
					itemData = _data[itemId];
				if (itemData) {
					_loadItemData(itemId, itemData);
					delete _data[itemId];
				}
			},
			fillRowsWithData: function (firstRowIndex, lastRowIndex) {
				var rowIndex;
				for (rowIndex = firstRowIndex; rowIndex < lastRowIndex; rowIndex++) {
					this.fillRowWithData(rowIndex);
				}
			}
		};
	}

	return dojo.declare('LazyDataLoader', null, {
		constructor: function (args) {
			var publicAPI = _LazyDataLoader.call(this, args),
				propName;
			for (propName in publicAPI) {
				this[propName] = publicAPI[propName];
			}
		}
	});
});
