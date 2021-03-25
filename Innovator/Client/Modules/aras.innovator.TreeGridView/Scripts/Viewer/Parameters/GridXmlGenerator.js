define(['dojo/_base/declare', 'dojo/domReady!'], function (declare) {
	var aras = parent.aras;

	return declare([], {
		constructor: function () {},

		getParametersGridXml: function (propertyItemsArray, parametersItem) {
			var result =
				'<table delim="|" editable="true" font="Arial-8" ' +
				'       draw_grid="true" enableHtml="false" ' +
				'       enterAsTab="false"  bgInvert="false" ' +
				'       onStart="onGridLoad" onEditCell="onParamsGridCellEdit" onXMLLoaded="onXmlLoaded" ' +
				'       onKeyPressed="onGridKeyPressed">';

			result += this._getHeader();
			result += this._getRows(propertyItemsArray, parametersItem);

			result += '</table>';
			return result;
		},

		_getHeader: function () {
			var result =
				'<thead>' +
				'\t<th align="center">Property</th>' +
				'\t<th align="center">Value</th></thead>' +
				'<columns>' +
				'\t<column width="50%" edit="NOEDIT" align="left" order="0"/>' +
				'\t<column width="50%" edit="FIELD" align="left" order="1"/></columns>';

			return result;
		},

		_getRow: function (propertyItem, dataType, parametersItem) {
			var result =
				'<tr id="' +
				propertyItem.getID() +
				'" action="' +
				propertyItem.getProperty('name') +
				'">';
			//prop label
			result += '<td>';
			result += aras.escapeXMLAttribute(
				propertyItem.getProperty('label') || propertyItem.getProperty('name')
			);
			result += '</td>';
			//prop value
			result += '<td fdt="' + dataType + '">';
			result += aras.escapeXMLAttribute(
				parametersItem.getProperty(propertyItem.getProperty('name'))
			);
			result += '</td>';

			result += '</tr>';
			return result;
		},

		_getRows: function (propertyItemsArray, parametersItem) {
			var result = '';
			var i;
			var j;
			var isListsInfoTagAdded = false;
			var listsInfoResult = '';
			var currentListNumber = 0;
			for (i = 0; i < propertyItemsArray.length; i++) {
				var propertyItem = propertyItemsArray[i];
				var dataSource = propertyItem.getProperty('data_source');
				var propType = propertyItem.getProperty('data_type');
				var listTypes = ['list', 'color list', 'mv_list'];

				var isList = listTypes.indexOf(propType) > -1 && dataSource;
				if (isList) {
					if (!isListsInfoTagAdded) {
						isListsInfoTagAdded = true;
						listsInfoResult += '<listsInfo>';
					}
					listsInfoResult +=
						'<list listNumber="' +
						currentListNumber +
						'" rowID="' +
						propertyItem.getID() +
						'"/>';
					result += '<list id="' + currentListNumber + '">';
					var listValues = aras.getListValues(dataSource);

					for (j = 0; j < listValues.length; j++) {
						var listValue = listValues[j];
						result +=
							'<listitem label="' +
							aras.escapeXMLAttribute(
								aras.getItemProperty(listValue, 'label')
							) +
							'" value="' +
							aras.escapeXMLAttribute(
								aras.getItemProperty(listValue, 'value')
							) +
							'"/>';
					}
					result += '</list>';
					currentListNumber++;
				}

				result += this._getRow(
					propertyItem,
					propertyItem.getProperty('data_type'),
					parametersItem
				);
			}
			if (isListsInfoTagAdded) {
				listsInfoResult += '</listsInfo>';
			}
			result += listsInfoResult;
			return result;
		}
	});
});
