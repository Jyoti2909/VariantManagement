define(['dojo/_base/declare'], function (declare) {
	var preferenceTableName = 'cmf_ContentTypeGridLayout';
	var aras = parent.aras;

	return declare(null, {
		constructor: function (viewId) {
			this._viewId = viewId;
		},
		getColumnWidth: function (columnName, defaultValue) {
			var columnNames = aras
				.getPreferenceItemProperty(
					preferenceTableName,
					this._viewId,
					'column_names'
				)
				.split(';');
			var columnWidth = aras
				.getPreferenceItemProperty(
					preferenceTableName,
					this._viewId,
					'column_width'
				)
				.split(';');
			var nameIndex = columnNames.indexOf(columnName);
			if (nameIndex < 0 || nameIndex >= columnWidth.length) {
				return defaultValue;
			}
			var width = parseInt(columnWidth[nameIndex], 10);
			return isNaN(width) ? defaultValue : width;
		},
		setColumnWidth: function (columnName, value) {
			var columnNames = aras
				.getPreferenceItemProperty(
					preferenceTableName,
					this._viewId,
					'column_names'
				)
				.split(';');
			var columnWidth = aras
				.getPreferenceItemProperty(
					preferenceTableName,
					this._viewId,
					'column_width'
				)
				.split(';');

			while (columnNames.length > columnWidth.length) {
				columnWidth.push('');
			}
			columnWidth = columnWidth.splice(0, columnNames.length);

			var nameIndex = columnNames.indexOf(columnName);
			if (nameIndex < 0) {
				columnNames.push(columnName);
				columnWidth.push(value);
			} else {
				columnWidth[nameIndex] = value;
			}
			aras.setPreferenceItemProperties(preferenceTableName, this._viewId, {
				column_names: columnNames.join(';'),
				column_width: columnWidth.join(';')
			});
		},
		getCollapsedColumnGroups: function () {
			return aras
				.getPreferenceItemProperty(
					preferenceTableName,
					this._viewId,
					'collapsed_column_groups'
				)
				.split(';')
				.filter(function (item) {
					return item !== '';
				});
		},
		collapseColumnGroup: function (columnId) {
			var collapsedGroups = this.getCollapsedColumnGroups();
			if (collapsedGroups.indexOf(columnId) >= 0) {
				return;
			}
			collapsedGroups.push(columnId);
			aras.setPreferenceItemProperties(preferenceTableName, this._viewId, {
				collapsed_column_groups: collapsedGroups.join(';')
			});
		},
		expandColumnGroup: function (columnId) {
			var collapsedGroups = this.getCollapsedColumnGroups()
				.filter(function (item) {
					return item !== columnId;
				})
				.join(';');
			aras.setPreferenceItemProperties(preferenceTableName, this._viewId, {
				collapsed_column_groups: collapsedGroups
			});
		}
	});
});
