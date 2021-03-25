define(['dojo/_base/declare'], function (declare) {
	return declare(
		'TreeGridView.Configurator.TooltipDialog.ActivateTgvdWizard.StartingConditionsScript',
		[],
		{
			_scriptThisObj: null,

			constructor: function (scriptThisObj) {
				this._scriptThisObj = scriptThisObj;
			},

			run: function () {
				this._scriptThisObj.onload = function () {
					document.getElementById('header_label').innerText = aras.getResource(
						'../Modules/aras.innovator.TreeGridView',
						'tgvd_activate_wizard.conditions_header_label'
					);
					var selectPropertyPlaceholder = aras.getResource(
						'../Modules/aras.innovator.TreeGridView',
						'tgvd_activate_wizard.conditions_select_property_placeholder'
					);
					document.getElementById(
						'option_placeholder_query_item'
					).innerText = selectPropertyPlaceholder;
					document.getElementById(
						'option_placeholder_used_on'
					).innerText = selectPropertyPlaceholder;
					var propertyLabel = aras.getResource(
						'../Modules/aras.innovator.TreeGridView',
						'tgvd_activate_wizard.conditions_property_label'
					);
					var queryItemLabel = aras.getResource(
						'../Modules/aras.innovator.TreeGridView',
						'tgvd_activate_wizard.conditions_query_item_label'
					);
					document.getElementById('root_query_item_property_label').innerText =
						queryItemLabel + ' ' + propertyLabel;
					var itemTypeForClientUsedOn = aras.getItemTypeForClient(
						parent.wizard.getWizardItem().getProperty('item_type'),
						'id'
					);
					var itemTypeUsedOnLabel =
						itemTypeForClientUsedOn.getProperty('label') ||
						itemTypeForClientUsedOn.getProperty('name');
					document.getElementById('used_on_property_label').innerText =
						itemTypeUsedOnLabel + ' ' + propertyLabel;

					var startConditionItem = document.querySelector(
						'.configuring-form__item'
					);
					var queryItemProperty = {
						element: startConditionItem.querySelector('select:first-child'),
						selected: false
					};
					var contextItemProperty = {
						element: startConditionItem.querySelector('select:last-child'),
						selected: false
					};
					var count = 0;

					var resetStartConditionItem = function () {
						queryItemProperty.element.selectedIndex = '0';
						contextItemProperty.element.selectedIndex = '0';
						queryItemProperty.selected = false;
						contextItemProperty.selected = false;
						count = 0;
					};
					var createNewItem = function () {
						var node = this.cloneNode(true);
						var selects = node.querySelectorAll('select');
						var img = document.createElement('img');

						this.parentNode.insertBefore(node, this);

						img.src = '../images/Delete.svg';
						node.appendChild(img);

						selects[0].selectedIndex = queryItemProperty.element.selectedIndex;
						selects[1].selectedIndex =
							contextItemProperty.element.selectedIndex;

						resetStartConditionItem();
					};
					var getContextItemProperties = function () {
						var contextItemTypeId = document.thisItem.getProperty('item_type');
						var node = aras.getItemTypeForClient(contextItemTypeId, 'id').node;
						var properties = node.selectNodes(
							"Relationships/Item[@type='Property']"
						);

						return properties;
					};

					var getQueryItemProperties = function () {
						var contextItemTypeId = document.thisItem.getProperty('item_type');
						var queryDefinitionId = this.parent.wizard._thisMethod.getProperty(
							'query_definition'
						);
						var rootQueryReference = aras.newIOMItem(
							'qry_QueryReference',
							'get'
						);

						rootQueryReference.setAttribute('select', 'child_ref_id');
						rootQueryReference.setProperty('source_id', queryDefinitionId);

						rootQueryReference.setPropertyAttribute(
							'parent_ref_id',
							'condition',
							'is null'
						);
						rootQueryReference = rootQueryReference.apply();
						var rootQueryItemRefId = rootQueryReference.getProperty(
							'child_ref_id'
						);

						var availablePropertyRequest = aras.newIOMItem(
							'Method',
							'qry_GetAvailableProperties'
						);
						availablePropertyRequest.setProperty(
							'item_type',
							parent.wizard
								.getWizardItem()
								.getProperty('root_query_item_item_type')
						);
						availablePropertyRequest.setProperty('ref_id', rootQueryItemRefId);
						var availablePropertyItems = availablePropertyRequest.apply();

						return availablePropertyItems.nodeList;
					};

					var fillData = function () {
						var createOption = function (property, element, index) {
							var option = document.createElement('option');
							var name = aras.getItemProperty(property, 'name');
							var text = aras.getItemProperty(property, 'label') || name;

							option.textContent = text;
							option.value = name;
							option.setAttribute('num', index + 1);

							element.appendChild(option);
						};

						var contextItemProperties = getContextItemProperties();
						var queryItemProperties = getQueryItemProperties();
						var i;
						var len;
						var option;

						for (i = 0, len = contextItemProperties.length; i < len; i++) {
							createOption(
								contextItemProperties[i],
								contextItemProperty.element,
								i
							);
						}

						for (i = 0, len = queryItemProperties.length; i < len; i++) {
							createOption(
								queryItemProperties[i],
								queryItemProperty.element,
								i
							);
						}
					};

					fillData();
					startConditionItem.addEventListener('change', function (event) {
						var target = event.target;
						var obj =
							target === queryItemProperty.element
								? queryItemProperty
								: contextItemProperty;

						if (!obj.selected) {
							obj.selected = true;
							count += obj.selected;
						}

						if (count === 2) {
							createNewItem.call(this);
						}
					});
				};
			}
		}
	);
});
