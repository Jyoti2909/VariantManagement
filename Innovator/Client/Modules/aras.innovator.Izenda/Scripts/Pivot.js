function PivotsDataGot(returnObj, id) {
	if (id != 'getpivotguidata' || !returnObj || !returnObj) {
		return;
	}

	var pivotTab;
	if (!returnObj.CurrentField || !returnObj.FieldNames) {
		pivotTab = document.getElementById('pivots_tab');
		if (pivotTab) {
			pivotTab.style.display = 'none';
		}
		return;
	}
	if (!nrvConfig.ReportIsLocked) {
		pivotTab = document.getElementById('pivots_tab');
		if (pivotTab) {
			pivotTab.style.display = 'list-item';
		}
	}

	var baseItemType = aras.getItemById(
		'ItemType',
		aras.getItemProperty(report, 'base_item_type'),
		0
	);
	var label = aras.getItemProperty(baseItemType, 'label');
	if (!label) {
		label = aras.getItemProperty(baseItemType, 'name');
	}

	var pivotHtml =
		'<div style="text-align: left; font-style: italic;">' +
		label +
		'</div><div class="pivot_label">' +
		aras.getResource(
			'../Modules/aras.innovator.Izenda/',
			'servicereporting.pivot_column'
		) +
		'</div>';
	pivotHtml +=
		'<div class="ssvc-toolbar-mode sys_f_div_select" ellipsis_select="1">' +
		'<select id="pivot-field" class="sys_f_select" style="visibility: hidden;" onchange="SetPivotField();">';
	var value = '';
	var selected = '';
	var i = 0;
	for (i = 0; i < returnObj.FieldNames.length; i++) {
		selected = '';
		if (returnObj.CurrentField == returnObj.FieldIds[i]) {
			selected = ' selected="selected"';
			value = returnObj.FieldNames[i];
		}

		if (returnObj.FieldIds[i] === '') {
			if (returnObj.FieldNames[i] == '------') {
				pivotHtml += '<option disabled="">------</option>';
			} else {
				if (returnObj.FieldNames[i] === '') {
					pivotHtml += '</optgroup>';
				} else {
					pivotHtml += '<optgroup label="' + returnObj.FieldNames[i] + '">';
				}
			}
			continue;
		}
		pivotHtml +=
			'<option value="' +
			returnObj.FieldIds[i] +
			'"' +
			selected +
			'>' +
			returnObj.FieldNames[i] +
			'</option>';
	}

	pivotHtml +=
		'</select><span class="sys_f_span_select" id="pivot_column_span">' +
		value +
		'</span></div><br />';
	pivotHtml +=
		'<div class="pivot_label">' +
		aras.getResource(
			'../Modules/aras.innovator.Izenda/',
			'servicereporting.pivot_function'
		) +
		'</div>';
	pivotHtml += '<select id="pivot-function" onchange="SetPivotFunction();">';
	value = '';
	for (i = 0; i < returnObj.FunctionNames.length; i++) {
		selected = '';
		if (returnObj.CurrentFunction == returnObj.FunctionIds[i]) {
			selected = ' selected="selected"';
			value = returnObj.FunctionNames[i];
		}
		pivotHtml +=
			'<option value="' +
			returnObj.FunctionIds[i] +
			'"' +
			selected +
			'>' +
			returnObj.FunctionNames[i] +
			'</option>';
	}
	pivotHtml += '</select><br />';
	var pivotSelector = document.getElementById('pivot-selector');
	pivotSelector.innerHTML = pivotHtml;

	function htmlToTree(html) {
		return (
			'<table enablehtml="false" icon0="" icon1="" treelines="1" thinborder="true" id="selectionData">' +
			html
				.replaceAll('<div', '<tr')
				.replaceAll('</div>', '</tr>')
				.replace(/<span\>(.*?)<\/span\>/gim, '<td>$1</td>')
				.replaceAll('<label', '<userdata')
				.replaceAll('</label>', '</userdata>')
				.replaceAll('data-key', 'key')
				.replaceAll('data-value', 'value')
				.replace(/(\r\n|\n|\r)/gm, '') +
			'</table>'
		);
	}
	var selectedItemTypes = htmlToTree(unescape(getSelectedItemTypes(report)));

	var callback = function (properties) {
		if (properties && properties.selectedPropertyName) {
			var pivotField = document.getElementById('pivot-field');
			var opts = pivotField.options;
			for (var j = 0; j < opts.length; j++) {
				var opt = opts[j];
				if (opt.value == properties.selectedPropertyName) {
					pivotField.selectedIndex = j;
					break;
				}
			}
		}
	};

	var pivotColumnSpan = document.getElementById('pivot_column_span');
	if (pivotColumnSpan && pivotColumnSpan.parentNode) {
		pivotColumnSpan.parentNode.addEventListener(
			'click',
			function (e) {
				var inputEl = document.getElementById('pivot-field');
				if (inputEl) {
					Izenda.Utils.clientUrl = getClientUrl();
					Izenda.Utils.showReportingStructurePopup(
						aras.getResource(
							'../Modules/aras.innovator.Izenda/',
							'servicereporting.select_pivot_column'
						),
						selectedItemTypes,
						inputEl,
						callback
					);
				}
			},
			false
		);
	}
}

function getLocalizedLabelByItemId(itemTypeId, defValue) {
	const item = aras.getItemTypeForClient(itemTypeId, 'id');
	const name = item.getProperty('name');
	const label = item.getProperty('label');
	return label || name || defValue || '';
}

function getSelectedItemTypes(report) {
	const node = ArasModules.xml.selectSingleNode(report, 'extension');
	let selectedItemTypes = '';
	if (node) {
		const extension = ArasModules.xml.getText(node);
		if (extension) {
			const clientData = ArasModules.xmlToJson(extension).ReportSetExtension
				.ClientData;
			if (clientData) {
				const rawSelectedItemTypes = clientData.SelectedItemTypes;
				const xmlDoc = ArasModules.xml.parseString(rawSelectedItemTypes);
				if (ArasModules.xml.getError(xmlDoc).errorCode === 0) {
					selectedItemTypes = Izenda.Utils.selectedItemTypeLocalization(
						xmlDoc.documentElement,
						getLocalizedLabelByItemId
					);
				}
			}
		}
	}
	return selectedItemTypes;
}
