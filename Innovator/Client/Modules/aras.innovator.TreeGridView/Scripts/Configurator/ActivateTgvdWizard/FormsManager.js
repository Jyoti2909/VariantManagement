define(['dojo/_base/declare', 'dojo/text!./defaultShowMainPage.js'], function (
	declare,
	defaultShowMainPageText
) {
	return declare(
		'TreeGridView.Configurator.TooltipDialog.ActivateTgvdWizard.FormsManager',
		[],
		{
			initialFormId: 'C55ACD3818F645EB954AEB1E5C7FD924', //initial form (rb_Wizard_targetUsage)

			chooseRelationshipFormId: '9B9E11CF43F34650BF5E60DE3D90E1F8',

			addRelationshipFormId: '5CCDC781160541FE8ABD0AECA70D9659',

			existingRelationshipFormId: '38BAE2AD6F4A4F29BDF78EF6F8C0F39F',

			startConditionsFormId: 'A89FF49B966C466C8A6F1E1808BEBEF4',

			previewNewRelationshipFormId: 'C2A166DEB6F448F28DB256C2633E62B6',

			generateRelationshipFormId: 'C2A166DEB6F448F28DB256C2633E62B6',

			_currentState: null,

			_wizardItem: null,

			_queryDefinitionId: null,

			_tgvItemName: null,

			_tgvItemId: null,

			constructor: function (
				wizardItem,
				queryDefinitionId,
				tgvItemName,
				tgvItemId
			) {
				this._currentState = {};
				this._wizardItem = wizardItem;
				this._queryDefinitionId = queryDefinitionId;
				this._tgvItemName = tgvItemName;
				this._tgvItemId = tgvItemId;
			},

			_getQbRootItemTypeItem: function () {
				var qdItem = this._wizardItem
					.getInnovator()
					.newItem('qry_QueryDefinition', 'get');
				qdItem.setID(this._queryDefinitionId);
				qdItem.setAttribute('select', 'id, name');
				var referenceItem = qdItem.createRelationship(
					'qry_QueryReference',
					'get'
				);
				referenceItem.setAttribute('select', 'parent_ref_id, child_ref_id');
				referenceItem.setPropertyCondition('parent_ref_id', 'is null');
				var queryItem = qdItem.createRelationship('qry_QueryItem', 'get');
				queryItem.setAttribute('select', 'ref_id, item_type(id, name, label)');

				qdItem = qdItem.apply();
				if (qdItem.isError()) {
					aras.AlertError(qdItem);
					return;
				}

				referenceItem = qdItem.getItemsByXPath(
					'Relationships/Item[@type="qry_QueryReference"]'
				);
				var rootItemType = qdItem.getItemsByXPath(
					'Relationships/Item[@type="qry_QueryItem" and ref_id="' +
						referenceItem.getProperty('child_ref_id') +
						'"]/item_type/Item'
				);

				return rootItemType;
			},

			getNextPrevFormData: function (isNext, isRecursiveCall) {
				var formData = {};
				var isLast;
				var isGenerate;

				if (isNext) {
					formData.isPrevFormFirst =
						this._currentState.currentFormId === this.initialFormId;
					switch (this._currentState.currentFormId) {
						case this.initialFormId:
							if (
								this._wizardItem
									.getProperty('target_usage', '')
									.toLowerCase() === 'Relationship Tab'.toLowerCase()
							) {
								this._currentState.currentFormId = this.chooseRelationshipFormId;
								this._wizardItem.setPropertyItem(
									'item_type',
									this._getQbRootItemTypeItem()
								);
							} else {
								//target - JavaScript
								var newMethodNode = aras.newItem('Method');
								var worldIdentityId = 'A73B655731924CD0B027E4F4D5FCC0A9';
								aras.setItemProperty(
									newMethodNode,
									'execution_allowed_to',
									worldIdentityId
								);
								aras.setItemProperty(
									newMethodNode,
									'name',
									'rb_showTGV_' + this._tgvItemName
								);
								defaultShowMainPageText = defaultShowMainPageText.replace(
									'TGVD_ITEM_ID',
									this._tgvItemId
								);
								aras.setItemProperty(
									newMethodNode,
									'method_code',
									defaultShowMainPageText
								);
								aras.uiShowItemEx(newMethodNode, 'new');
							}
							break;
						case this.chooseRelationshipFormId:
							if (
								this._wizardItem
									.getProperty('new_exist_list', '')
									.toLowerCase() === 'New'.toLowerCase()
							) {
								this._currentState.currentFormId = this.addRelationshipFormId;
							} else {
								//existing rel-ship
								this._currentState.currentFormId = this.existingRelationshipFormId;
							}
							break;
						case this.addRelationshipFormId:
						case this.existingRelationshipFormId:
							if (this._wizardItem.getProperty('is_startcondition') === '1') {
								this._currentState.currentFormId = this.startConditionsFormId;
							} else {
								this._currentState.currentFormId = this.previewNewRelationshipFormId;
								isGenerate = true;
							}
							break;
						case this.startConditionsFormId:
							this._currentState.currentFormId = this.previewNewRelationshipFormId;
							isGenerate = true;
							break;
						case this.previewNewRelationshipFormId:
							isLast = true;
							this._currentState.currentFormId = this.generateRelationshipFormId;
							break;
					}

					if (!this._currentState.currentFormId) {
						this._currentState.currentFormId = this.initialFormId;
					}
					formData.isPrevFormWithBtnGenerate = false;
				} else {
					//user clicks Back
					formData.isPrevFormWithBtnGenerate =
						this._currentState.currentFormId ===
							this.previewNewRelationshipFormId || isRecursiveCall;
					switch (this._currentState.currentFormId) {
						case this.chooseRelationshipFormId:
							this._currentState.currentFormId = this.initialFormId;
							break;
						case this.addRelationshipFormId:
						case this.existingRelationshipFormId:
							this._currentState.currentFormId = this.chooseRelationshipFormId;
							break;
						case this.startConditionsFormId:
							if (
								this._wizardItem
									.getProperty('new_exist_list', '')
									.toLowerCase() === 'New'.toLowerCase()
							) {
								this._currentState.currentFormId = this.addRelationshipFormId;
							} else {
								//existing rel-ship
								this._currentState.currentFormId = this.existingRelationshipFormId;
							}
							break;
						case this.previewNewRelationshipFormId:
							this._currentState.currentFormId = this.startConditionsFormId;
							if (this._wizardItem.getProperty('is_startcondition') !== '1') {
								return this.getNextPrevFormData(false, true);
							}
							break;
					}
				}

				formData.isFirstForm =
					this._currentState.currentFormId === this.initialFormId;
				formData.isFormWithBtnGenerate = !!isGenerate;
				//note that at the last form user cannot click back button.
				formData.isLastForm = !!isLast;
				formData.formId = this._currentState.currentFormId;
				formData.isSummaryForm =
					formData.formId === this.previewNewRelationshipFormId ||
					formData.formId === this.generateRelationshipFormId;
				return formData;
			}
		}
	);
});
