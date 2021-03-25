function SearchParameterizedHelper(tmpXmlDocument) {
	this.tmpXmlDocument = tmpXmlDocument
		? tmpXmlDocument
		: aras.createXMLDocument();
}

SearchParameterizedHelper.prototype.replaceParametersInQuery = function (
	searchAml,
	isForProjectTree,
	callback
) {
	const searchFormParams = this.prepareSearchFormParametersInQuery(
		searchAml,
		isForProjectTree
	);
	if (searchFormParams) {
		this.showSearchForm(
			searchAml,
			isForProjectTree,
			callback,
			searchFormParams
		);
	} else {
		callback(searchAml);
	}
};

SearchParameterizedHelper.prototype.prepareSearchFormParametersInQuery = function (
	searchAml,
	isForProjectTree
) {
	const tmpXmlDocument = this.tmpXmlDocument;
	let fakeForm;
	let fakeItemType;
	function appendParamIntoParamsArray(
		nodeName,
		nodeValue,
		labelTextToAdd,
		addAsText
	) {
		const matches = isForProjectTree
			? nodeValue.replace(/,text="[^"]*"/, '').match(/@{(\d+)}/g)
			: nodeValue.match(/@{(\d+)}/g);
		let i;

		if (matches) {
			for (i = 0; i < matches.length; i++) {
				const paramNumber = /@{(\d+)}/g.exec(matches[i])[1];

				// If parameter occured more that once - set field type to text.
				if (addAsText || parametersArray[paramNumber]) {
					parametersArray[paramNumber] = {
						param_number: paramNumber,
						propertyItem: undefined
					};
				} else {
					let propertyItem;
					let oldPropertyItemId;
					const xPath = '//' + nodeName + "[.='" + nodeValue + "']";
					let nd = tmpXmlDocument.selectSingleNode(xPath);

					while (nd) {
						if (nd.nodeName == 'Item') {
							const type = nd.getAttribute('type');
							const typeId = nd.getAttribute('typeId');
							if (type || typeId) {
								const itemTypeForClient = aras.getItemTypeForClient(
									type ? type : typeId,
									type ? 'name' : 'id'
								);
								if (itemTypeForClient && itemTypeForClient.node) {
									propertyItem = itemTypeForClient.getItemsByXPath(
										"Relationships/Item[@type='Property' and name='" +
											nodeName +
											"']"
									);
									oldPropertyItemId = propertyItem.getID();
									propertyItem = propertyItem.clone(true);
									propertyItem.setNewID();
								}

								break;
							} else if (!nd.parentNode) {
								break;
							} else {
								if (nodeName == 'keyed_name') {
									const parentNodeName = nd.parentNode.nodeName;
									if (
										parentNodeName != 'related_id' &&
										parentNodeName != 'source_id'
									) {
										nodeName = parentNodeName;
										nd = nd.parentNode;
									} else {
										break;
									}
								} else {
									break;
								}
							}
						} else {
							nd = nd.parentNode;
						}
					}

					parametersArray[paramNumber] = {
						param_number: paramNumber,
						propertyItem: propertyItem,
						oldPropertyItemId: oldPropertyItemId,
						labelTextToAdd: labelTextToAdd
					};
				}
			}
		}
	}

	function generateFormToPopulateParams() {
		const bodyNd = fakeForm.selectSingleNode(
			'Relationships/Item[@type="Body"]'
		);
		let i;
		let propertyItem;
		let fieldType;
		let inputProperty;

		for (i = 0; i < parametersArray.length; i++) {
			const cur_param = parametersArray[i];
			if (!cur_param) {
				continue;
			}

			if (!cur_param.propertyItem) {
				cur_param.propertyItem = aras.newIOMItem('Property');
				cur_param.propertyItem.setNewID();
				cur_param.propertyItem.setProperty('data_type', 'string');
			}

			propertyItem = cur_param.propertyItem;
			fieldType = aras.uiGetFieldType4Property(propertyItem.node);
			const propertyDataType = propertyItem.getProperty('data_type');
			if ('sequence' === propertyDataType) {
				propertyItem.setProperty('data_type', 'string');
				propertyItem.removeProperty('data_source');
				propertyItem.setProperty('data_source', '');
				propertyItem.setPropertyAttribute('data_source', 'is_null', '1');
			}
			propertyItem.setProperty('name', 'parameter' + i);
			propertyItem.setProperty('readonly', '0');
			fakeItemType.addRelationship(propertyItem);
			inputProperty = insertNewField(
				fieldType,
				cur_param.param_number,
				propertyItem,
				cur_param.oldPropertyItemId,
				cur_param.labelTextToAdd
			);
		}

		const btnOk = insertNewField('button', i, null);
		btnOk.setProperty('label', aras.getResource('', 'common.ok'));
		i++;
		const btnCancel = insertNewField('button', i, null);
		btnCancel.setProperty('label', aras.getResource('', 'common.cancel'));
		btnCancel.setProperty('x', parseInt(btnOk.getProperty('x'), 10) + 100);
		btnCancel.setProperty('y', btnOk.getProperty('y'));
		const htmlField = insertNewField('html', 'html1', null);
		htmlField.setProperty('is_visible', 0);
		htmlField.setProperty(
			'html_code',
			'<script type="text/javascript">' +
				'var okButton,cancelButton;  \n' +
				'function onload_handler()\n' +
				'{\n' +
				'	var parametersArray = (parent.dialogArguments || parent.parent.dialogArguments).parametersArray;\n' +
				'	if (!parametersArray || parametersArray.length == 0)\n' +
				'		closeWindow(null);\n' +
				'	okButton = document.getElementById("' +
				btnOk.GetId() +
				'");\n' +
				'	okButton.addEventListener("click", getResult, false);\n' +
				'	cancelButton = document.getElementById("' +
				btnCancel.GetId() +
				'");\n' +
				'	cancelButton.addEventListener("click", onCancelClicked, false);\n' +
				'	document.body.addEventListener("keypress", onKeyPressHandler, false); // 4 ie \n' +
				'	parent.addEventListener("keypress", onKeyPressHandler, false); // 4 ff \n' +
				'	function getResult() {\n' +
				'		if (isAllParametersFilled(document.item)) {\n' +
				'			closeWindow(document.item);\n' +
				'		}\n' +
				'	}\n' +
				'	function onKeyPressHandler(e)\n' +
				'	{\n' +
				'		var evnt = e || event;\n' +
				'		if (evnt.keyCode == 27)\n' +
				'			closeWindow(null);\n' +
				'	}\n' +
				'	function isAllParametersFilled(resultItem) {\n' +
				'		var i,\n' +
				'			paramValue;\n' +
				'		for (i = 0; i < parametersArray.length; i++) {\n' +
				'			if (!parametersArray[i]) {\n' +
				'				continue;\n' +
				'			}\n' +
				'			paramValue = parent.aras.getItemProperty(resultItem, parametersArray[i].propertyItem.getProperty("name"))\n' +
				'			if (paramValue === undefined ||paramValue === null || paramValue === "") {\n' +
				'				parent.aras.AlertWarning(parent.aras.getResource("", "search.not_all_parameters_filled"), parent.aras.getMostTopWindowWithAras(parent))\n' +
				'				return false;\n' +
				'			}\n' +
				'		}\n' +
				'		return true;' +
				'	}\n' +
				'	function onCancelClicked() {\n' +
				'		closeWindow(null);\n' +
				'	}\n' +
				'	function closeWindow(returnValue)\n' +
				'	{\n' +
				'		parent.returnValue = returnValue;\n' +
				'		parent.close();\n' +
				'	}\n' +
				'}\n' +
				'window.addEventListener("load", onload_handler, false);\n' +
				'</script>'
		);

		function insertNewField(
			fieldType,
			paramNumber,
			propertyItem,
			oldPropertyItemId,
			labelTextToAdd
		) {
			const fieldNds = bodyNd.selectNodes(
				'Relationships/Item[@type="Field" and (not(@action) or (@action!="delete" and @action!="purge"))]'
			);
			let yForNewField = 10;
			let i;
			let fieldY;
			let labelNd;
			const propertyItemId = propertyItem ? propertyItem.getID() : '';

			for (i = 0; i < fieldNds.length; i++) {
				fieldY = parseInt(aras.getItemProperty(fieldNds[i], 'y'), 10);
				if (!isNaN(fieldY)) {
					yForNewField = fieldY + 60;
				}
			}

			const newFieldNd = aras.newIOMItem('Field');
			newFieldNd.setProperty('name', paramNumber);
			newFieldNd.setProperty('field_type', fieldType);
			newFieldNd.setAttribute('id', aras.generateNewGUID());

			let newLabel =
				aras.getResource('', 'search.parameter_label') + ' ' + paramNumber;
			const sessionLanguageCode = aras.getSessionContextLanguageCode();

			if (oldPropertyItemId) {
				const tmpItem = aras.getItemById(
					'Property',
					oldPropertyItemId,
					0,
					undefined,
					'label'
				);
				if (tmpItem) {
					const propLabelNds = tmpItem.selectNodes("*[local-name()='label']");
					for (i = 0, length = propLabelNds.length; i < length; i++) {
						labelNd = newFieldNd.node.appendChild(
							propLabelNds[i].cloneNode(true)
						);
						if (labelNd.text.length === 0) {
							labelNd.text = paramNumber;
						}
					}
					labelNd = newFieldNd.node.selectSingleNode(
						"*[local-name()='label' and @xml:lang='" +
							sessionLanguageCode +
							"']"
					);
					if (labelNd) {
						newLabel = labelNd.text;
						newFieldNd.node.removeChild(labelNd);
					}
				}
			}

			newFieldNd.setProperty('label', newLabel + (labelTextToAdd || ''));
			newFieldNd.setPropertyAttribute('label', 'xml:lang', sessionLanguageCode);

			newFieldNd.setProperty('label_position', 'top');
			newFieldNd.setProperty('x', '20');
			newFieldNd.setProperty('y', yForNewField);
			newFieldNd.setProperty('is_visible', 1);
			newFieldNd.setProperty('border_width', '0');
			newFieldNd.setProperty('font_family', 'arial, helvetica, sans-serif');
			newFieldNd.setProperty('font_size', '8pt');
			newFieldNd.setProperty('font_weight', 'bold');
			newFieldNd.setProperty('font_align', 'right');
			newFieldNd.setProperty('font_color', '#000000');
			newFieldNd.setProperty('tab_stop', '1');
			newFieldNd.setProperty('tab_index', parseInt(paramNumber, 10) + 1);
			newFieldNd.setProperty('propertytype_id', propertyItemId);

			let bodyRelshipsNd = bodyNd.selectSingleNode('Relationships');
			if (!bodyRelshipsNd) {
				bodyRelshipsNd = bodyNd.appendChild(
					bodyNd.ownerDocument.createElement('Relationships')
				);
			}

			bodyRelshipsNd.appendChild(newFieldNd.node);

			return newFieldNd;
		}
	}

	// Search for any @{n} parameter in Aml.
	if (!/@{(\d+)}/g.test(searchAml)) {
		//only if isForProjectTree is truthy then test if we have {d+,text=""} not to degrade perfomance all over the Innovator Searches.
		if (!isForProjectTree || !/@{(\d+,text="[^"]*")}/g.test(searchAml)) {
			return;
		}
	}

	// If parameter represents the whole criteria value for a property.
	//<Item type="Action" action="get">
	//  <name condition="like">@{1}</name>
	//</Item>
	const parametersArray = [];

	this.tmpXmlDocument.loadXML(searchAml);

	let regExp = />(@{\d+})<\/(\w*)>/g;
	let wholeCriteria = regExp.exec(searchAml);

	while (wholeCriteria != null) {
		appendParamIntoParamsArray(wholeCriteria[2], wholeCriteria[1], '', false);

		wholeCriteria.lastIndex = 0;
		wholeCriteria = regExp.exec(searchAml);
	}

	if (isForProjectTree) {
		regExp = />(@{\d+,text="([^"]*)"})<\/(\w*)>/g;
		wholeCriteria = regExp.exec(searchAml);
		while (wholeCriteria != null) {
			appendParamIntoParamsArray(
				wholeCriteria[3],
				wholeCriteria[1],
				wholeCriteria[2],
				false
			);

			wholeCriteria.lastIndex = 0;
			wholeCriteria = regExp.exec(searchAml);
		}
	}

	// If parameter represents a portion of the criteria value for a property.
	//<Item type="Action" action="get">
	//  <OR>
	//    <size>@{0}</size>
	//    <weight condition="eq">my weight is @{4}</weight>
	//    <age condition="like">@{3} is my age</age>
	//    <name condition="like">first name is @{1} and second is @{2}</name>
	//  </OR>
	//</Item>
	regExp = new RegExp(
		'<(\\w+)[^>]*>([^>]+@{\\d+}[^>]*|[^>]*@{\\d+}[^>]+)</\\w+>',
		'g'
	);
	let portionOfTheCriteria = regExp.exec(searchAml);
	while (portionOfTheCriteria != null) {
		appendParamIntoParamsArray(
			portionOfTheCriteria[1],
			portionOfTheCriteria[2],
			'',
			true
		);

		portionOfTheCriteria.lastIndex = 0;
		portionOfTheCriteria = regExp.exec(searchAml);
	}

	// If parameter is encountered in the where attribute of the search AML.
	const whereAttr = this.tmpXmlDocument.documentElement.getAttribute('where');
	if (whereAttr) {
		appendParamIntoParamsArray('', whereAttr, '', true);
	}

	let param;
	if (parametersArray.length > 0) {
		fakeForm = aras.newItem('Form');
		fakeItemType = aras.newIOMItem('ItemType');

		fakeItemType.setNewID();
		const fakeItemTypeName = 'fake_SearchContainer_' + fakeItemType.getID();
		fakeItemType.setProperty('name', fakeItemTypeName);
		const fakeItem = aras.newIOMItem(fakeItemTypeName, 'add');
		fakeItem.setNewID();
		generateFormToPopulateParams();

		if (fakeForm) {
			param = {};
			param.title = aras.getResource('', 'search.set_parameter_value');
			param.formNd = fakeForm;
			param.item = fakeItem;
			param.itemTypeNd = fakeItemType.node;
			param.parametersArray = parametersArray;
			param.aras = aras;

			let width = aras.getItemProperty(fakeForm, 'width');
			let height = aras.getItemProperty(fakeForm, 'height');
			if (!width) {
				width = 300;
			}
			if (!height) {
				height = 400;
			}
			param.dialogWidth = width;
			param.dialogHeight = height;
			param.resizable = true;
			param.content = 'ShowFormAsADialog.html';
		}
	}
	return param;
};

SearchParameterizedHelper.prototype.showSearchForm = function (
	searchAml,
	isForProjectTree,
	callback,
	param
) {
	const win = aras.getMostTopWindowWithAras(window);
	win.ArasModules.Dialog.show('iframe', param).promise.then(function (
		resultItem
	) {
		if (!resultItem) {
			return undefined;
		}

		let resultValue;
		let i;
		let dataType;

		for (i = 0; i < param.parametersArray.length; i++) {
			const parameter = param.parametersArray[i];
			if (!parameter) {
				continue;
			}

			regExp = new RegExp('@\\{' + i + '\\}', 'g');
			resultValue = aras.getItemProperty(
				resultItem,
				parameter.propertyItem.getProperty('name')
			);

			if (isForProjectTree) {
				dataType = parameter.propertyItem.getProperty('data_type');
				if (
					dataType === 'string' ||
					dataType === 'text' ||
					dataType === 'ml_string'
				) {
					resultValue = resultValue.replace(/\*/g, '%');
				}
			}

			searchAml = searchAml.replace(regExp, resultValue);

			if (isForProjectTree) {
				regExp = new RegExp('@\\{' + i + ',text="[^"]*"\\}', 'g');
				searchAml = searchAml.replace(regExp, resultValue);
			}
		}
		callback(searchAml);
	});
};
