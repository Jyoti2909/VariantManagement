define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/Action/ActionBase'
], function (declare, ActionBase) {
	return declare(
		'Aras.Client.Controls.TechDoc.Action.RemoveElementAction',
		ActionBase,
		{
			constructor: function (args) {},

			Execute: function (/*Object*/ args) {
				var selectedItems = args.selectedItems;
				var externalLinksCheck = this.isExternalLinksExist(selectedItems);

				if (
					!externalLinksCheck.isExist ||
					this.aras.confirm(
						this.aras.getResource(
							'../Modules/aras.innovator.TDF',
							'action.removeelementprocesseeddeletion'
						)
					)
				) {
					var selectedIds = {};
					var isParentDeleted;
					var currentItem;
					var currentParent;
					var childIndex;
					var childItems;
					var schemaCheckResult;
					var elementCheckResult;
					var i;

					for (i = 0; i < selectedItems.length; i++) {
						selectedIds[selectedItems[i].Id()] = true;
					}

					for (i = 0; i < selectedItems.length; i++) {
						currentItem = selectedItems[i];
						currentParent = currentItem.Parent;
						isParentDeleted = false;

						while (currentParent) {
							if (selectedIds[currentParent.Id()]) {
								isParentDeleted = true;
								break;
							}

							currentParent = currentParent.Parent;
						}

						if (!isParentDeleted) {
							schemaCheckResult = this.checkSchemaRestrictions(currentItem);
							elementCheckResult = this.checkElementRestrictions(currentItem);

							if (schemaCheckResult.isValid && elementCheckResult.isValid) {
								childItems = currentItem.Parent.ChildItems();
								childIndex = childItems.index(currentItem);
								childItems.splice(childIndex, 1);
							} else {
								var alertMessage = !schemaCheckResult.isValid
									? this.aras.getResource(
											'../Modules/aras.innovator.TDF',
											'action.schemarestriction',
											schemaCheckResult.errorList.join(', ')
									  )
									: elementCheckResult.errorList.join(', ');

								this.aras.AlertWarning(alertMessage);
								return;
							}
						}
					}
				}
			},

			isExternalLinksExist: function (selectedItems) {
				var checkResult = { isExist: false, externalLinks: [] };

				if (selectedItems.length) {
					var deleteCandidates;
					var schemaElement;
					var elementUid;
					var i;

					for (i = 0; i < selectedItems.length; i++) {
						deleteCandidates = this.getChildElementsHash(
							selectedItems[i],
							deleteCandidates
						);
					}

					for (elementUid in deleteCandidates) {
						schemaElement = deleteCandidates[elementUid];

						if (schemaElement.isExternallyLinked()) {
							checkResult.isExist = true;
							checkResult.externalLinks.concat(schemaElement.ExternalLinks());
						}
					}
				}

				return checkResult;
			},

			checkElementRestrictions: function (/*WrappedObject*/ targetElement) {
				if (targetElement && targetElement.isRegistered()) {
					if (targetElement.is('ArasRowXmlSchemaElement')) {
						var parentTable = targetElement.GetTable();

						if (parentTable && parentTable.RowCount() == 1) {
							return {
								isValid: false,
								errorList: [
									this.aras.getResource(
										'../Modules/aras.innovator.TDF',
										'viewmodel.tablecannotbeempty'
									)
								]
							};
						}
					}
				}

				return {
					isValid: true,
					errorList: []
				};
			},

			checkSchemaRestrictions: function (/*WrappedObject*/ targetElement) {
				var checkResult = [];
				var i;

				// 2nd condition:
				// if target of removing is block, it means that it had access to creation
				if (!targetElement.Parent) {
					return {
						isValid: true,
						errorList: []
					};
				}
				var that = this;
				function isDeleteAllowedImpl(currentItem, deletedCount) {
					var res = { isValid: true, errorList: [] };
					if (currentItem.is('ArasBlockXmlSchemaElement')) {
						var childItems = currentItem.ChildItems();
						for (i = 0; i < childItems._array.length; i++) {
							isDeleteAllowedImpl(childItems._array[i], deletedCount);
							deletedCount++;
						}
						deletedCount = 0;
					}

					var ownerElement = currentItem.Parent;

					while (
						ownerElement.is('ArasBlockXmlSchemaElement') &&
						ownerElement.Parent
					) {
						ownerElement = ownerElement.Parent;
					}

					var expectedChildsTypes = that._viewmodel
						.Schema()
						.GetSchemaExpectedElementChilds(ownerElement);
					var existingChildsTypes = that._viewmodel.getAllChildElementsByType(
						ownerElement,
						{}
					);

					var deletedElements = {};
					deletedElements[currentItem.nodeName] = {
						elements: [currentItem],
						count: 1
					};

					for (i = 0; i < expectedChildsTypes.length; i++) {
						var childDescriptor = expectedChildsTypes[i];
						var typeName = childDescriptor.name;

						if (deletedElements[typeName] && childDescriptor.minOccurs) {
							// if "minOccurs" attribute is set for this child type, then we need to check that after deletion childs count wouldn't be lower of that value
							if (
								existingChildsTypes[typeName].count -
									deletedCount -
									deletedElements[typeName].count <
								childDescriptor.minOccurs
							) {
								res.isValid = false;
								res.errorList.push(typeName);
							}
						}
					}

					checkResult.push(res);
				}

				isDeleteAllowedImpl(targetElement, 0);

				for (i = 0; i < checkResult.length; i++) {
					if (!checkResult[i].isValid) {
						return { isValid: false, errorList: checkResult[i].errorList };
					}
				}

				return { isValid: true, errorList: [] };
			},

			getChildElementsHash: function (targetElement, elementsHash) {
				elementsHash = elementsHash || {};

				if (targetElement) {
					var childItems = targetElement.ChildItems();
					var childsCount = childItems.length();
					var childElement;
					var i;

					for (i = 0; i < childsCount; i++) {
						childElement = childItems.get(i);

						if (childElement.is('XmlSchemaElement')) {
							elementsHash[childElement.Uid()] = childElement;

							this.getChildElementsHash(childElement, elementsHash);
						}
					}

					elementsHash[targetElement.Uid()] = targetElement;
				}

				return elementsHash;
			}
		}
	);
});
