define([
	'dojo/_base/declare',
	'dojox/uuid/generateRandomUuid',
	'TechDoc/Aras/Client/Controls/TechDoc/Action/ActionBase',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/DocumentationEnums'
], function (declare, generateRandomUuid, ActionBase, Enums) {
	return declare(
		'Aras.Client.Controls.TechDoc.Action.VersionElementAction',
		ActionBase,
		{
			constructor: function (args) {},

			Execute: function (/*Object*/ args) {
				var action = args.action;
				var selectedItem = args.selectedItem;
				var latestVersionId = selectedItem.getReferenceProperty(
					'latestVersionId'
				);
				var referenceId = selectedItem.getReferenceProperty('referenceId');
				var isBlockElement = selectedItem.is('ArasBlockXmlSchemaElement');
				var isImage = selectedItem.is('ArasImageXmlSchemaElement');

				switch (action) {
					case 'update':
						this.updateToLatest(selectedItem, latestVersionId);
						break;
					case 'viewlatest':
						var itemTypeName = isBlockElement
							? this._viewmodel.getDocumentItem().getAttribute('type')
							: isImage
							? 'tp_Image'
							: selectedItem.ItemType();

						this.aras.uiShowItem(itemTypeName, latestVersionId);
						break;
					case 'ignore':
						if (
							this.updateReferenceItem(selectedItem, {
								ignored_version_id: latestVersionId
							})
						) {
							selectedItem.setReferenceProperty(
								'ignoredVersionId',
								latestVersionId
							);
							selectedItem.NotifyChanged();
						}
						break;
					case 'ignoreall':
						if (
							this.updateReferenceItem(selectedItem, {
								ignore_all_versions: '1'
							})
						) {
							selectedItem.setReferenceProperty('ignoreAllVersions', '1');
							selectedItem.NotifyChanged();
						}
						break;
					case 'restoretracking':
						if (
							this.updateReferenceItem(selectedItem, {
								ignore_all_versions: '0',
								ignored_version_id: ''
							})
						) {
							selectedItem.setReferenceProperty('ignoreAllVersions', '0');
							selectedItem.setReferenceProperty('ignoredVersionId', '');
							selectedItem.NotifyChanged();
						}
						break;
				}
			},

			updateReferenceItem: function (
				/*WrappedObject*/ targetElement,
				updatedProperties
			) {
				if (targetElement && updatedProperties) {
					var referenceId = targetElement
						? targetElement.getReferenceProperty('referenceId')
						: '';

					if (referenceId) {
						var referenceTypes = this._viewmodel.getDataRequestSetting(
							'referenceRelationshipNames'
						);
						var referenceType = targetElement.is('ArasBlockXmlSchemaElement')
							? referenceTypes.documentReference
							: targetElement.is('ArasImageXmlSchemaElement')
							? referenceTypes.imageReference
							: referenceTypes.itemReference;
						var referenceItem = this.aras.newIOMItem(referenceType, 'update');
						var propertiesCount = 0;
						var propertyName;

						for (propertyName in updatedProperties) {
							referenceItem.setProperty(
								propertyName,
								updatedProperties[propertyName]
							);
							propertiesCount++;
						}
						// if updated properties exists, then apply changes
						if (propertiesCount) {
							referenceItem.setID(referenceId);
							referenceItem.setProperty(
								'reference_id',
								targetElement.ReferenceId()
							);
							referenceItem = referenceItem.apply();

							if (!referenceItem.isError()) {
								return true;
							} else {
								this.aras.AlertError(referenceItem);
							}
						}
					}
				}

				return false;
			},

			updateToLatest: function (/*WrappedObject*/ targetItem, targetVersionId) {
				var viewmodel = this._viewmodel;
				var externalProvider = viewmodel.OriginExternalProvider();
				var isBlockItem = targetItem.is('ArasBlockXmlSchemaElement');
				var latestVersionReferenceId = isBlockItem
					? externalProvider.GetRefIdByBlockId(targetVersionId)
					: externalProvider.GetRefIdByItemId(targetVersionId);
				var isPreparationPassed = true;

				if (!latestVersionReferenceId) {
					if (isBlockItem) {
						var documentXml = viewmodel.GetDocumentBlockXml(
							targetVersionId,
							viewmodel.DefaultLanguageCode(),
							Enums.ByReferenceType.External
						);

						// documentXml can be empty, if current user have no permissions on lastVersion item
						if (documentXml) {
							var documentXmlDom = new XmlDocument();
							var rootNode;
							var newReferencesNode;
							var newBlockNode;

							// preserve whitespace = true IR-029141
							documentXmlDom.preserveWhiteSpace = true;
							documentXmlDom.loadXML(documentXml);
							rootNode = documentXmlDom.documentElement;

							if (this.aras.Browser.isIe()) {
								documentXmlDom.setProperty(
									'SelectionNamespaces',
									"xmlns:aras='http://aras.com/ArasTechDoc'"
								);
							} else {
								rootNode.setAttribute(
									'xmlns:aras',
									'http://aras.com/ArasTechDoc'
								);
							}

							//we need to merge reference blocks of new block first for furthure CreateElement, it will resolve external refs in new block
							externalProvider.Update(
								rootNode.selectSingleNode('aras:references')
							);
							newBlockNode = rootNode.selectSingleNode(
								'aras:content/aras:block'
							);
							latestVersionReferenceId = newBlockNode.getAttribute('ref-id');
						}
					} else {
						// here must be code for Item's update
						var isImage = targetItem.is('ArasImageXmlSchemaElement');
						var lastVersionItem = this.aras.newIOMItem(
							isImage ? 'tp_Image' : targetItem.ItemType(),
							'get'
						);

						lastVersionItem.setID(targetVersionId);
						lastVersionItem = lastVersionItem.apply();

						if (!lastVersionItem.isError()) {
							var newItemReference = viewmodel
								.ContentGeneration()
								.ConstructElementOrigin(isImage ? 'aras:image' : 'aras:item');
							var referenceProperties = {
								isCurrent: lastVersionItem.getProperty('is_current'),
								majorVersion: lastVersionItem.getProperty('major_rev'),
								minorVersion: lastVersionItem.getProperty('generation')
							};
							var itemNode = viewmodel.origin.ownerDocument.importNode(
								lastVersionItem.node,
								true
							);

							latestVersionReferenceId = generateRandomUuid()
								.replace(/-/g, '')
								.toUpperCase();
							newItemReference.setAttribute('ref-id', latestVersionReferenceId);
							newItemReference.setAttribute(
								'referenceProperties',
								JSON.stringify(referenceProperties)
							);

							if (isImage) {
								newItemReference.setAttribute(
									'src',
									lastVersionItem.getProperty('src')
								);
								newItemReference.setAttribute('imageId', targetVersionId);
							} else {
								newItemReference.appendChild(itemNode);
							}

							externalProvider.InsertExternal(newItemReference);
						} else {
							this.aras.AlertError(lastVersionItem.getErrorString());
							isPreparationPassed = false;
						}
					}
				}

				// updating references on items
				if (isPreparationPassed) {
					viewmodel.SuspendInvalidation();

					targetItem.ReferenceId(latestVersionReferenceId);
					targetItem.parseOrigin();
					targetItem.NotifyChanged();

					viewmodel.ResumeInvalidation();
				}
			}
		}
	);
});
