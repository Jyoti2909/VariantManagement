define(['dojo/_base/declare', './FormsManager'], function (
	declare,
	FormsManager
) {
	var instance;
	var aras = parent.aras;
	var formWidth = 418;
	var iframeFormId = 'wizard_form';
	var conditionData = {
		list: []
	};

	return declare(
		'TreeGridView.Configurator.TooltipDialog.ActivateTgvdWizard.TgvWizard',
		[],
		{
			_wizardItem: null,

			_formsManager: null,

			_formData: null,

			_formWindow: null,

			_formDialogWindow: null,

			_labelBtnNext: null,

			_thisMethod: null,

			_nextBtnDefaultStyle: null,

			constructor: function (thisMethod) {
				if (!instance) {
					conditionData.list.length = 0;
					instance = this;
					this._thisMethod = thisMethod;
					this._init();
				}

				return instance;
			},

			_init: function () {
				this._wizardItem = aras.newIOMItem('rb_UI_ActivateTgvdWizard', 'add');
				this._wizardItem.setProperty('target_usage', 'Relationship Tab');
				this._wizardItem.setProperty('new_exist_list', 'New');
				var worldIdentityId = 'A73B655731924CD0B027E4F4D5FCC0A9';
				this._wizardItem.setProperty('access_identity', worldIdentityId);
				this._wizardItem.setProperty('is_startcondition', '1');
				this._formsManager = new FormsManager(
					this._wizardItem,
					this._thisMethod.getProperty('query_definition'),
					this._thisMethod.getProperty('name'),
					this._thisMethod.getID()
				);

				this._formData = this._formsManager.getNextPrevFormData(true);
				this._showFormDialog();
				this.disableEnableNextButton(false);
			},
			getStartConditionsArray: function () {
				return conditionData.list;
			},

			setFormWindow: function (formWindow) {
				this._formWindow = formWindow;
			},

			getThisMethodItem: function () {
				return this._thisMethod;
			},

			getWizardItem: function () {
				return this._wizardItem;
			},
			_toggleLabel: function () {
				var checked = this._wizardItem
					.getProperty('new_exist_list', '')
					.toLowerCase();
				var doc = this._formDialogWindow.document;
				var wizardFrame = doc.getElementById(iframeFormId);
				var self = this;

				wizardFrame.onload = function () {
					var form = this.contentWindow.document.querySelector('form');

					if (!self._formData.isLastForm) {
						var successfullyLabel = form.querySelector(
							'div[name=genSuccessfullyLabel]'
						);
						successfullyLabel.style.display = 'none';
					}

					if (checked === 'existing') {
						var labelContainer = form.querySelector('div[name=labelContainer]');
						var positionedContainer = form.querySelector('div[name=container]');
						var top = labelContainer.offsetTop;

						labelContainer.style.display = 'none';
						positionedContainer.style.top = top + 'px';
					}
				};
			},
			_saveStartingConditionsState: function () {
				var doc = this._formDialogWindow.document;
				var wizardDoc = doc.getElementById(iframeFormId).contentWindow.document;
				var itemsForm = wizardDoc.querySelector('.configuring-form');

				if (itemsForm) {
					var itemTypeId = this._wizardItem.getProperty('item_type');
					var items = itemsForm.querySelectorAll(
						'.configuring-form__item:not(:last-child)'
					);

					conditionData.usedOn = itemTypeId;
					conditionData.list.length = 0;

					for (var i = 0; i < items.length; i++) {
						var queryItemHtmlSelectElement = items[i].querySelector(
							'select:first-of-type'
						);
						var usedOnHtmlSelectElement = items[i].querySelector(
							'select:last-of-type'
						);

						conditionData.list.push({
							queryItemIndex: queryItemHtmlSelectElement.selectedIndex,
							contextItemIndex: usedOnHtmlSelectElement.selectedIndex,
							queryItemPropName: queryItemHtmlSelectElement.value,
							contextItemPropName: usedOnHtmlSelectElement.value
						});
					}
				} else {
					if (this._wizardItem.getProperty('is_startcondition') !== '1') {
						conditionData.list.length = 0;
					}
				}
			},
			_restoreStartingConditionsState: function () {
				var doc = this._formDialogWindow.document;
				var wizardFrame = doc.getElementById(iframeFormId);
				var self = this;
				this._wizardItem.setProperty(
					'root_query_item_item_type',
					this._formsManager._getQbRootItemTypeItem().getID()
				);

				wizardFrame.onload = function () {
					var form = this.contentWindow.document.querySelector(
						'.configuring-form'
					);
					var itemTypeId = self._wizardItem.getProperty('item_type');
					var len = conditionData.list.length;
					var conditionItem = form.querySelector('.configuring-form__item');
					var node;
					var img;
					var observer = new MutationObserver(
						self.disableEnableNextButton.bind(self, false, form)
					);
					observer.observe(form, {
						childList: true
					});

					if (itemTypeId === conditionData.usedOn && len) {
						var fragment = document.createDocumentFragment();

						for (var i = 0; i < len; i++) {
							node = conditionItem.cloneNode(true);
							img = document.createElement('img');

							img.src = '../images/Delete.svg';
							node.appendChild(img);
							node.querySelector('select:first-of-type').selectedIndex =
								conditionData.list[i].queryItemIndex;
							node.querySelector('select:last-of-type').selectedIndex =
								conditionData.list[i].contextItemIndex;

							fragment.appendChild(node);
						}

						conditionItem.parentNode.insertBefore(fragment, conditionItem);
					} else {
						var id = self
							.getWizardItem()
							.getProperty('root_query_item_item_type');

						if (id === itemTypeId) {
							node = conditionItem.cloneNode(true);
							img = document.createElement('img');

							img.src = '../images/Delete.svg';
							node.appendChild(img);
							conditionItem.parentNode.insertBefore(node, conditionItem);

							var queryItemPropertySelect = node.querySelector(
								'select:first-of-type'
							);
							var contextItemPropertySelect = node.querySelector(
								'select:last-of-type'
							);

							queryItemPropertySelect.selectedIndex = queryItemPropertySelect
								.querySelector('option[value=id]')
								.getAttribute('num');
							contextItemPropertySelect.selectedIndex = contextItemPropertySelect
								.querySelector('option[value=id]')
								.getAttribute('num');
						} else {
							self.disableEnableNextButton(false, form);
						}
					}

					form.addEventListener('click', function (event) {
						var target = event.target;

						if (target.tagName.toLowerCase() === 'img') {
							this.removeChild(target.parentNode);
						}
					});
				};
			},
			show: function (isNext) {
				this._formData = this._formsManager.getNextPrevFormData(isNext);

				if (
					isNext &&
					this._formData.formId ===
						this._formsManager.generateRelationshipFormId
				) {
					this._saveStartingConditionsState();
				} else if (
					!isNext &&
					(this._formData.formId ===
						this._formsManager.existingRelationshipFormId ||
						this._formsManager.addRelationshipFormId === this._formData.formId)
				) {
					this._saveStartingConditionsState();
				} else if (
					this._formData.formId === this._formsManager.startConditionsFormId
				) {
					this._showFormDialog();
					return this._restoreStartingConditionsState();
				} else if (
					this._formData.formId === this._formsManager.addRelationshipFormId
				) {
					if (!this._wizardItem.getProperty('relationship_name')) {
						this._wizardItem.setProperty(
							'relationship_name',
							'tgv_' + this._thisMethod.getProperty('name')
						);
					}
				}

				this._showFormDialog();
				this.disableEnableNextButton(!isNext);

				if (
					this._formData.formId ===
					this._formsManager.generateRelationshipFormId
				) {
					this._toggleLabel();
				}
			},

			isFormWithBtnGenerate: function () {
				return this._formData.isFormWithBtnGenerate;
			},
			disableEnableNextButton: function (isForceEnable, form) {
				var button = this._getButtonByName('btn_Next', true);

				if (!button) {
					return;
				}

				var isDisable = false;
				if (!isForceEnable) {
					switch (this._formData.formId) {
						case this._formsManager.chooseRelationshipFormId:
							isDisable = !this._wizardItem.getProperty('item_type');
							break;
						case this._formsManager.addRelationshipFormId:
							isDisable =
								!this._wizardItem.getProperty('relationship_name') ||
								!this._wizardItem.getProperty('access_identity');
							break;
						case this._formsManager.existingRelationshipFormId:
							isDisable =
								!this._wizardItem.getProperty('relationship_names') ||
								!this._wizardItem.getProperty('access_identity');
							break;
						case this._formsManager.startConditionsFormId:
							var items = form.querySelectorAll(
								'.configuring-form__item:not(:last-child)'
							);
							isDisable = items.length === 0;
					}
				}

				this._setButtonStyle(button, isDisable);
			},
			_setButtonStyle: function (button, isDisable) {
				if (isDisable) {
					if (!this._nextBtnDefaultStyle) {
						this._nextBtnDefaultStyle = {
							opacity: button.style.opacity,
							backgroundColor: button.style.backgroundColor,
							color: button.style.color
						};
					}

					button.disabled = true;
					button.style.opacity = '0.5';
					button.style.backgroundColor = '#3668b1';
					button.style.color = '#fff';
				} else {
					if (this._nextBtnDefaultStyle) {
						button.disabled = false;
						button.style.opacity = this._nextBtnDefaultStyle.opacity;
						button.style.backgroundColor = this._nextBtnDefaultStyle.backgroundColor;
						button.style.color = this._nextBtnDefaultStyle.color;
					}
				}
			},

			_renameButtonNext: function (newName) {
				var button = this._getButtonByName('btn_Next', true);
				if (!this._labelBtnNext) {
					this._labelBtnNext = button.value;
				}
				button.value = newName;
			},

			_changeVisabilityOfButton: function (btnName, isVisible) {
				this._getButtonByName(btnName, false).style.display = isVisible
					? 'inline-block'
					: 'none';
			},

			_getButtonByName: function (btnName, isToGetInput) {
				if (!this._formWindow) {
					return;
				}
				var elements = this._formWindow.document.getElementsByName(btnName);
				for (var i = 0; i < elements.length; i++) {
					if (
						elements[i].tagName.toLowerCase() ===
						(isToGetInput ? 'input' : 'div')
					) {
						return elements[i];
					}
				}
			},

			_setFieldLabel: function (fieldName, newLabelOrLabelsArr) {
				var formWithDataFrame = this._formDialogWindow.document.getElementById(
					iframeFormId
				);
				formWithDataFrame.addEventListener('load', function () {
					var elements = this.contentWindow.document.getElementsByName(
						fieldName
					);
					for (var i = 0; i < elements.length; i++) {
						if (elements[i].tagName.toLowerCase() === 'span') {
							if (fieldName === 'startingConditionValue') {
								for (var j = 0; j < newLabelOrLabelsArr.length; j++) {
									var p = document.createElement('p');
									p.className = 'condition';
									p.textContent = newLabelOrLabelsArr[j];
									elements[i].appendChild(p);
								}
							} else {
								elements[i].textContent = newLabelOrLabelsArr || '';
							}
						}
					}
				});
			},

			_showFormDialog: function () {
				var formButtonsId = '09B52DE01AC9471C918881FC192F0A72'; // id of Form rb_Wizard_Buttons.
				var formDisplay;
				var formNd;

				if (this._formData.isFirstForm && this._formWindow) {
					this._changeVisabilityOfButton('btn_Back', false);
				}
				if (this._formDialogWindow) {
					var oldIframe = this._formDialogWindow.document.getElementById(
						iframeFormId
					);
					var newIframe = this._createWizardFormIframe();
					this._formDialogWindow.document.body.replaceChild(
						newIframe,
						oldIframe
					);

					if (this._formData.isPrevFormFirst) {
						this._changeVisabilityOfButton('btn_Back', true);
					}
					if (this._formData.isFormWithBtnGenerate) {
						this._renameButtonNext(
							aras.getResource(
								'../Modules/aras.innovator.TreeGridView',
								'tgvd_activate_wizard.form_btn_generate_label'
							)
						);
					}
					if (this._formData.isLastForm) {
						this._changeVisabilityOfButton('btn_Back', false);
						this._changeVisabilityOfButton('btn_Next', false);
						this._changeVisabilityOfButton('btn_Done', true);
					}
					if (this._formData.isPrevFormWithBtnGenerate) {
						this._renameButtonNext(this._labelBtnNext);
					}
					if (this._formData.isSummaryForm) {
						var isCreateNewRelationshipType =
							this._wizardItem
								.getProperty('new_exist_list', '')
								.toLowerCase() === 'New'.toLowerCase();
						if (isCreateNewRelationshipType) {
							this._setFieldLabel(
								'relationshipNameValue',
								this._wizardItem.getProperty('relationship_name')
							);
							this._setFieldLabel(
								'labelValue',
								this._wizardItem.getProperty('label')
							);
						} else {
							var relationshipTypeId = this._wizardItem.getProperty(
								'relationship_names'
							);
							var relationshipTypeItem = aras.getRelationshipType(
								relationshipTypeId
							);
							this._setFieldLabel(
								'relationshipNameValue',
								relationshipTypeItem.getProperty('label') ||
									relationshipTypeItem.getProperty('name')
							);
						}

						this._setFieldLabel(
							'tgvDefinitionValue',
							this._thisMethod.getProperty('name')
						);
						var identityItem = this._wizardItem.getPropertyItem(
							'access_identity'
						);
						var identityName =
							(identityItem && identityItem.getProperty('keyed_name')) ||
							'World';
						this._setFieldLabel('accesIdentityValue', identityName);
						var usedOnItemTypeName = aras.getItemTypeName(
							this._wizardItem.getProperty('item_type')
						);
						var queryItemLabel = aras.getResource(
							'../Modules/aras.innovator.TreeGridView',
							'tgvd_activate_wizard.conditions_query_item_label_on_summary_form'
						);
						var condition;
						var conditions = [];
						for (var i = 0; i < conditionData.list.length; i++) {
							condition =
								'[' +
								queryItemLabel +
								'].[' +
								conditionData.list[i].queryItemPropName +
								'] = [' +
								usedOnItemTypeName +
								'].[' +
								conditionData.list[i].contextItemPropName +
								']';
							conditions.push(condition);
						}
						if (conditionData.list.length === 0) {
							conditions.push(
								aras.getResource(
									'../Modules/aras.innovator.TreeGridView',
									'tgvd_activate_wizard.none'
								)
							);
						}
						this._setFieldLabel('startingConditionValue', conditions);
					}

					return;
				}

				formDisplay = aras.getFormForDisplay(formButtonsId);
				formNd = formDisplay.node;

				var dialogParams = {
					title: aras.getResource(
						'../Modules/aras.innovator.TreeGridView',
						'tgvd_activate_wizard.form_title'
					),
					aras: aras,
					isEditMode: true,
					editType: 'add',
					formNd: formNd,
					item: this._wizardItem,
					dialogWidth: formWidth,
					dialogHeight: 350,
					resizable: true,
					content: 'ShowFormAsADialog.html',
					beforeOnload: this._showInitialForm.bind(this)
				};

				new aras.getMostTopWindowWithAras().ArasModules.Dialog.show(
					'iframe',
					dialogParams
				).promise.then(function () {
					instance = null;
				});
			},

			_showInitialForm: function (dialogWindow) {
				var formFrame = dialogWindow.document.getElementById('formFrame');
				formFrame.scrolling = 'no';
				formFrame.style.height = '50px';

				this._formDialogWindow = dialogWindow;
				dialogWindow.wizard = this;

				var iframe = this._createWizardFormIframe();
				dialogWindow.document.body.insertBefore(
					iframe,
					dialogWindow.document.body.childNodes[0]
				);
			},

			_createWizardFormIframe: function () {
				var formDisplay = aras.getFormForDisplay(this._formData.formId);
				var formNode = formDisplay.node;
				var itemTypeNd = aras.getItemTypeDictionary(
					this._wizardItem.getAttribute('type')
				).node;

				aras.uiPopulatePropertiesOnWindow(
					this._formDialogWindow,
					this._wizardItem.node,
					itemTypeNd,
					formNode,
					true
				);
				var formUrl = aras.uiDrawFormEx(formNode, 'add', itemTypeNd);

				var iframe = this._formDialogWindow.document.createElement('iframe');
				iframe.id = iframeFormId;
				iframe.width = formWidth;
				iframe.height = aras.getItemProperty(formNode, 'height');
				iframe.frameBorder = '0';
				iframe.src = formUrl;
				return iframe;
			}
		}
	);
});
