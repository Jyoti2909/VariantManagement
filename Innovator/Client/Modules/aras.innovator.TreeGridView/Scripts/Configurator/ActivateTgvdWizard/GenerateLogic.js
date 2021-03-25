define(['dojo/_base/declare'], function (declare) {
	return declare(
		'TreeGridView.Configurator.TooltipDialog.ActivateTgvdWizard.GenerateLogic',
		[],
		{
			_wizardItem: null,

			_thisMethodItem: null,

			_innovator: null,

			constructor: function (wizardItem, thisMethodItem) {
				this._wizardItem = wizardItem;
				this._thisMethodItem = thisMethodItem;
				this._innovator = thisMethodItem.getInnovator();
			},

			generate: function (startConditionsArray) {
				var startPage =
					'../Modules/aras.innovator.TreeGridView/Views/MainPage.html';
				var parametersTemplate = "'tgvdId={tgvdId}";
				if (this._wizardItem.getProperty('is_startcondition') === '1') {
					parametersTemplate +=
						'&startConditionProvider=ItemDefault({startConditions})';
				}
				parametersTemplate += "'";

				var relationshipName = this._wizardItem.getProperty(
					'relationship_name'
				);
				var tgvName = this._thisMethodItem.getProperty('name');

				var activatedStatus = this._isAlreadyActivated(relationshipName);
				if (activatedStatus.error === true) {
					return false;
				} else if (activatedStatus.result === true) {
					aras.AlertWarning(
						aras.getResource(
							'../Modules/aras.innovator.TreeGridView/',
							'tgvd_already_activated',
							tgvName,
							activatedStatus.itemTypeLabel,
							relationshipName
						)
					);
					return false;
				}

				var usedOnItemTypeId = this._wizardItem.getProperty('item_type');
				var relationshipType;
				var relationshipView;
				var isCreateNewRelationshipType =
					this._wizardItem.getProperty('new_exist_list', '').toLowerCase() ===
					'New'.toLowerCase();
				if (isCreateNewRelationshipType) {
					relationshipType = this._innovator.newItem('RelationshipType', 'add');
					relationshipType.setProperty('name', relationshipName);
					relationshipType.setProperty(
						'label',
						this._wizardItem.getProperty('label')
					);
					relationshipType.setProperty('source_id', usedOnItemTypeId);
					relationshipView = relationshipType.createRelationship(
						'Relationship View',
						'add'
					);
				} else {
					relationshipView = this._innovator.newItem(
						'Relationship View',
						'add'
					);
					var relationshipTypeId = this._wizardItem.getProperty(
						'relationship_names'
					);
					relationshipView.setProperty('source_id', relationshipTypeId);
				}

				relationshipView.setProperty(
					'related_id',
					this._wizardItem.getProperty('access_identity')
				);
				relationshipView.setProperty('start_page', startPage);
				var parameters = parametersTemplate.replace(
					'{tgvdId}',
					this._thisMethodItem.getID()
				);

				var startConditions = '{';
				for (var i = 0; i < startConditionsArray.length; i++) {
					var condition = startConditionsArray[i];
					startConditions +=
						'"' +
						condition.queryItemPropName +
						'":"' +
						condition.contextItemPropName +
						'"';
					if (i !== startConditionsArray.length - 1) {
						startConditions += ',';
					}
				}
				startConditions += '}';

				parameters = parameters.replace('{startConditions}', startConditions);
				relationshipView.setProperty('parameters', parameters);

				if (isCreateNewRelationshipType) {
					relationshipType = relationshipType.apply();
					if (relationshipType.isError()) {
						aras.AlertError(relationshipType);
						return false;
					}
				} else {
					relationshipView = relationshipView.apply();
					if (relationshipView.isError()) {
						aras.AlertError(relationshipView);
						return false;
					}
				}

				const itemTypeNode = aras.getItemTypeNodeForClient(
					usedOnItemTypeId,
					'id'
				);
				window.parent.parent.ClearDependenciesInMetadataCache(
					aras,
					itemTypeNode
				);
				return true;
			},

			_isAlreadyActivated: function (relationshipName) {
				var relationshipType = this._innovator.newItem(
					'RelationshipType',
					'get'
				);
				relationshipType.setAttribute(
					'select',
					'name, source_id(id, name, label)'
				);
				relationshipType.setProperty('name', relationshipName);
				relationshipType = relationshipType.apply();
				if (relationshipType.isError()) {
					if (relationshipType.getErrorCode() === '0') {
						return { result: false };
					}
					aras.AlertError(relationshipType);
					return { error: true };
				} else {
					var activatedItemType = relationshipType.getItemsByXPath(
						'source_id/Item'
					);
					var activatedItemTypeName = activatedItemType.getProperty('name');
					var activatedItemTypeLabel = activatedItemType.getProperty('label');
					if (!activatedItemTypeLabel) {
						activatedItemTypeLabel = activatedItemTypeName;
					}
					return { result: true, itemTypeLabel: activatedItemTypeLabel };
				}
			}
		}
	);
});
