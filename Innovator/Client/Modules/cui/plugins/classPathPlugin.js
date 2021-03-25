const classPathPlugin = {
	classifiactionPropertyName: 'class_path',
	getCellMetadata: function (cellMetadata, headId, rowId) {
		const head = this.grid.head;
		const propertyName = head.get(headId, 'name');
		if (propertyName === this.classifiactionPropertyName) {
			return Object.assign(cellMetadata, {
				list: window.getClassificationArray(propertyName)
			});
		}

		return cellMetadata;
	},
	getCellType: function (result, headId, rowId) {
		const head = this.grid.head;
		const propertyName = head.get(headId, 'name');
		if (propertyName === this.classifiactionPropertyName) {
			return 'classification';
		}
		return result;
	}
};

export default classPathPlugin;
