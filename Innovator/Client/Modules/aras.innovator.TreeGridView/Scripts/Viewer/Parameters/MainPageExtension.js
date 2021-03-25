define([
	'dojo/_base/declare',
	'dojo/_base/connect',
	'./GridXmlGenerator'
], function (declare, connect, ParametersGridXmlGenerator) {
	var aras = parent.aras;

	return declare([], {
		_parametersAttributesForGrid: {},

		_tgvParameterItems: {},

		_parametersGridXmlGenerator: new ParametersGridXmlGenerator(),

		_parametersProvider: null,

		load: function () {
			this._getParameterItemsFromServer();
			this._populateParametersByEmptyAndDefaultValues();

			this.inherited(arguments);
		},

		_getParametersValueByName: function () {
			return this._parametersProvider.getParameters();
		},

		_getRequestParametersForTreeGridData: function () {
			var requestParameters = this.inherited(arguments);
			var parametersValueByName = this._getParametersValueByName();
			requestParameters.qb_parameters_value_by_name = JSON.stringify(
				parametersValueByName
			);
			return requestParameters;
		},

		_getParameterItemsFromServer: function () {
			var tgvItemRequest = aras.newIOMItem('rb_TreeGridViewDefinition', 'get');
			tgvItemRequest.setID(this._treeGridViewDefinitionNode.getAttribute('id'));
			var parametersItemTypeName = 'rb_QueryDefinitionParameterMap';
			var tgvItemParametersRequest = tgvItemRequest.newItem(
				parametersItemTypeName,
				'get'
			);
			tgvItemRequest.addRelationship(tgvItemParametersRequest);
			var tgvItem = tgvItemRequest.apply();
			this._tgvParameterItems = tgvItem.getRelationships(
				parametersItemTypeName
			);
		},

		_populateParametersByEmptyAndDefaultValues: function () {
			var tgvParameterItemsCount = this._tgvParameterItems.getItemCount();
			for (var i = 0; i < tgvParameterItemsCount; i++) {
				var tgvParameterItem = this._tgvParameterItems.getItemByIndex(i);
				var paramName = tgvParameterItem.getProperty('qd_parameter_name');
				this._parametersProvider.setParameter(
					paramName,
					tgvParameterItem.getProperty('user_input_default_value')
				);
			}
		},
		_modifyParameters: function () {
			var tgvParameterItemsCount = this._tgvParameterItems.getItemCount();
			var propertyItemsArray = [];
			var parametersNames = [];
			for (var i = 0; i < tgvParameterItemsCount; i++) {
				var tgvParameterItem = this._tgvParameterItems.getItemByIndex(i);
				var paramName = tgvParameterItem.getProperty('qd_parameter_name');
				parametersNames.push(paramName);

				var propertyItem = aras.newIOMItem('Property');
				propertyItem.setNewID();
				propertyItem.setProperty('stored_length', '128'); //for now no setting in data model, decided to use a length of a property user_input_default_value.
				propertyItem.setProperty('name', paramName);
				propertyItem.setProperty(
					'data_type',
					tgvParameterItem.getProperty('user_input_data_type')
				);
				propertyItem.setProperty(
					'data_source',
					tgvParameterItem.getProperty('user_input_data_source')
				);
				propertyItem.setProperty(
					'label',
					tgvParameterItem.getProperty('label')
				);
				propertyItem.setProperty(
					'default_value',
					this._parametersProvider.getParameters()[paramName]
				);
				propertyItem.setProperty(
					'data_source_name',
					tgvParameterItem.getPropertyAttribute(
						'user_input_data_source',
						'keyed_name'
					)
				);
				propertyItem.setProperty(
					'pattern',
					tgvParameterItem.getProperty('user_input_pattern')
				);
				propertyItemsArray.push(propertyItem);
			}
			this._showParametersDialog(propertyItemsArray, parametersNames);
		},

		_showParametersDialog: function (propertyItemsArray, parametersNames) {
			var propertyItem;
			var fakeItemType = aras.newIOMItem('ItemType');
			var parameterAttributes;

			fakeItemType.setNewID();
			var fakeItemTypeName = 'fake_TgvParameterMaps_' + fakeItemType.getID();
			fakeItemType.setProperty('name', fakeItemTypeName);

			for (var i = 0; i < propertyItemsArray.length; i++) {
				propertyItem = propertyItemsArray[i];
				fakeItemType.addRelationship(propertyItem);
			}

			var self = this;
			var fakeItem = aras.newIOMItem(fakeItemTypeName, 'add');
			var paramName;
			for (paramName in this._parametersAttributesForGrid) {
				if (this._parametersAttributesForGrid.hasOwnProperty(paramName)) {
					parameterAttributes = this._parametersAttributesForGrid[paramName];
					propertyItem = this._getParametersPropertyItemByName(
						propertyItemsArray,
						paramName
					);
					if (propertyItem.getProperty('data_type') === 'item') {
						fakeItem.setPropertyAttribute(
							paramName,
							'keyed_name',
							parameterAttributes.keyedName
						);
						fakeItem.setPropertyAttribute(
							paramName,
							'type',
							parameterAttributes.type
						);
					}
				}
			}
			var parametersFromProvider = this._parametersProvider.getParameters();
			for (paramName in parametersFromProvider) {
				if (parametersFromProvider.hasOwnProperty(paramName)) {
					fakeItem.setProperty(paramName, parametersFromProvider[paramName]);
				}
			}
			fakeItem.setNewID();
			var resultXml = this._parametersGridXmlGenerator.getParametersGridXml(
				propertyItemsArray,
				fakeItem
			);
			var resDom = aras.createXMLDocument();
			resDom.loadXML(resultXml);
			//we need to remove type because we have not saved itemType (only at Client-side) and if user clicks '...' for a value
			//of data type 'item': error occurs that item type cannot be found.
			fakeItem.node.removeAttribute('type');
			var arasModules = parent.ArasModules || parent.parent.ArasModules;
			const parametersGridUrl = aras.getBaseURL(
				'/scripts/parametersGrid.html?' +
					'db=' +
					aras.getDatabase() +
					'&ITName=' +
					fakeItemTypeName +
					'&editMode=1'
			);
			var dialog = arasModules.Dialog.show('iframe', {
				aras: aras,
				title: aras.getResource(
					'../Modules/aras.innovator.TreeGridView/',
					'parameters'
				),
				dialogWidth: 700,
				dialogHeight: 428,
				content: parametersGridUrl,
				itemTypeNodeArg: fakeItemType.node,
				itemNodeArg: fakeItem.node,
				isForceEscapeHTMLInData: true,
				getGridContainerXmlCallback: function () {
					return resDom;
				},
				beforeOnload: this._addParametersToolbar.bind(this)
			});
			dialog.promise
				.then(function (result) {
					if (result && result.isApplyClicked) {
						self._replaceParameters(
							fakeItem,
							parametersNames,
							propertyItemsArray
						);
					}
				})
				.catch(function (ex) {
					if (ex) {
						aras.AlertError(ex.message);
					}
				});
		},

		_replaceParameters: function (
			parametersItem,
			parametersNames,
			propertyItemsArray
		) {
			var i;
			var propertyItem;
			var parameterName;
			for (i = 0; i < parametersNames.length; i++) {
				parameterName = parametersNames[i];
				this._parametersProvider.setParameter(
					parameterName,
					parametersItem.getProperty(parameterName)
				);
				propertyItem = this._getParametersPropertyItemByName(
					propertyItemsArray,
					parameterName
				);
				if (propertyItem.getProperty('data_type') === 'item') {
					var id = parametersItem.getProperty(parameterName);
					var defaultPropertyValue = propertyItem.getProperty('default_value');
					if (id === defaultPropertyValue) {
						//this._parametersAttributesForGrid is already populated in this case
						continue;
					}

					var propertyType = '';
					var propertyKeyedName = '';

					if (id) {
						propertyType = propertyItem.getProperty('data_source_name');
						propertyKeyedName = aras.getKeyedName(id, propertyType);
					}

					this._parametersAttributesForGrid[parameterName] = {
						keyedName: propertyKeyedName,
						type: propertyType
					};
				}
			}
			this.reload();
		},

		_getParametersPropertyItemByName: function (
			propertyItemsArray,
			propertyName
		) {
			return propertyItemsArray.filter(function (propItem) {
				return propItem.getProperty('name') === propertyName;
			})[0];
		},

		_addParametersToolbar: function (dialogWindow) {
			var divElement = dialogWindow.document.createElement('div');
			divElement.id = 'toolbarContainer';
			divElement.width = '100%';
			divElement.height = '28px';
			dialogWindow.document.getElementById('gridTD').style.height =
				'calc(100% - ' + divElement.height + ')';
			dialogWindow.document.body.insertBefore(
				divElement,
				dialogWindow.document.body.childNodes[0]
			);
			var script = dialogWindow.document.createElement('script');
			script.src =
				'../Modules/aras.innovator.TreeGridView/Scripts/Viewer/Parameters/ToolbarScripts.js';
			dialogWindow.document.head.appendChild(script);
		}
	});
});
