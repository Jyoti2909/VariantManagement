define([
	'dojo/_base/declare',
	'dojox/uuid/generateRandomUuid',
	'TechDoc/Aras/Client/Controls/TechDoc/Action/VersionElementAction',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/DocumentationEnums'
],
function(declare, generateRandomUuid, TechDocVersionElementAction, Enums) {
	return declare('Aras.Client.Controls.Requirement.Action.VersionElementAction', [TechDocVersionElementAction], {
		updateReferenceItem: function(/*WrappedObject*/ targetElement, updatedProperties) {
			if (targetElement && updatedProperties) {
				var referenceId = targetElement ? targetElement.getReferenceProperty('referenceId') : '';

				if (referenceId) {
					var referenceItem = this.aras.newIOMItem('re_ImageReference', 'update');
					var propertiesCount = 0;
					var propertyName;

					for (propertyName in updatedProperties) {
						referenceItem.setProperty(propertyName, updatedProperties[propertyName]);
						propertiesCount++;
					}

					// if updated properties exists, then apply changes
					if (propertiesCount) {
						referenceItem.setID(referenceId);
						referenceItem.setProperty('reference_id', targetElement.ReferenceId());
						referenceItem.apply();

						if (!referenceItem.isError()) {
							return true;
						} else {
							this.aras.AlertError(queryResult, window);
						}
					}
				}
			}

			return false;
		},

		updateToLatest: function(/*WrappedObject*/ targetItem, targetVersionId) {
			var viewmodel = this._viewmodel;
			var externalProvider = viewmodel.OriginExternalProvider();
			var isBlockItem = targetItem.is('ArasBlockXmlSchemaElement');
			var latestVersionReferenceId = isBlockItem ? externalProvider.GetRefIdByBlockId(targetVersionId)
				: externalProvider.GetRefIdByItemId(targetVersionId);
			var isPreparationPassed = true;

			if (!latestVersionReferenceId) {
				if (isBlockItem) {
					var documentXml = viewmodel.GetDocumentBlockXml(targetVersionId, viewmodel.DefaultLanguageCode(), Enums.ByReferenceType.External);

					// documentXml can be empty, if current user have no permissions on lastVersion item
					if (documentXml) {
						var documentXmlDom = new XmlDocument();
						var rootNode;
						var newBlockNode;

						// preserve whitespace = true IR-029141
						documentXmlDom.preserveWhiteSpace = true;
						documentXmlDom.loadXML(documentXml);
						rootNode = documentXmlDom.documentElement;

						if (this.aras.Browser.isIe()) {
							documentXmlDom.setProperty('SelectionNamespaces', 'xmlns:aras=\'http://aras.com/ArasTechDoc\'');
						} else {
							rootNode.setAttribute('xmlns:aras', 'http://aras.com/ArasTechDoc');
						}

						//we need to merge reference blocks of new block first for furthure CreateElement, it will resolve external refs in new block
						externalProvider.Update(rootNode.selectSingleNode('aras:references'));
						newBlockNode = rootNode.selectSingleNode('aras:content/aras:block');
						latestVersionReferenceId = newBlockNode.getAttribute('ref-id');
					}
				} else {
					// here must be code for Item's update
					var isImage = targetItem.is('ArasImageXmlSchemaElement');
					var lastVersionItem = this.aras.newIOMItem(isImage ? 'tp_Image' : targetItem.ItemType(), 'get');

					lastVersionItem.setID(targetVersionId);
					lastVersionItem = lastVersionItem.apply();

					if (!lastVersionItem.isError()) {
						var newItemReference = viewmodel.ContentGeneration().ConstructElementOrigin(isImage ? 'aras:image' : 'aras:item');
						var referenceProperties = {
							isCurrent: lastVersionItem.getProperty('is_current'),
							majorVersion: lastVersionItem.getProperty('major_rev'),
							minorVersion: lastVersionItem.getProperty('generation')
						};
						var itemNode = viewmodel.origin.ownerDocument.importNode(lastVersionItem.node, true);

						latestVersionReferenceId = generateRandomUuid().replace(/-/g, '').toUpperCase();
						newItemReference.setAttribute('ref-id', latestVersionReferenceId);
						newItemReference.setAttribute('referenceProperties', JSON.stringify(referenceProperties));

						if (isImage) {
							newItemReference.setAttribute('src', lastVersionItem.getProperty('src'));
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
				var updatedElements = viewmodel.GetElementsByReferenceId(targetItem.ReferenceId());
				var targetElement;
				var i;

				viewmodel.SuspendInvalidation();
				for (i = 0; i < updatedElements.length; i++) {
					targetElement = updatedElements[i];
					targetElement.ReferenceId(latestVersionReferenceId);
					targetElement.parseOrigin();
					targetElement.NotifyChanged();
				}
				viewmodel.ResumeInvalidation();
			}
		}
	});
});
