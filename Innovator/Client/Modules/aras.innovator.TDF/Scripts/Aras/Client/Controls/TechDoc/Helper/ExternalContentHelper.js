define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/Helper/_ExternalContentHelper/OriginExternalProvider'
], function (declare, OriginExternalProvider) {
	return declare(
		'Aras.Client.Controls.TechDoc.Helper.ExternalContentHelper',
		null,
		{
			constructor: function (args) {
				this._viewmodel = args.viewmodel;
				this._providers = {};
			},

			UpdateProvider: function (langCode, originXmlDocument) {
				var referenceNodes = originXmlDocument.selectSingleNode(
					'aras:document//aras:references'
				);
				var externalProvider = this.GetProvider(langCode);
				var updatedElementHash = {};

				var updatedElementIds = externalProvider.Update(referenceNodes);

				if (updatedElementIds.length) {
					var schemaElement;
					var parentElement;
					var isParentUpdated;
					var i;

					for (i = 0; i < updatedElementIds.length; i++) {
						updatedElementHash[updatedElementIds[i]] = true;
					}

					this._viewmodel.SuspendInvalidation();
					for (i = 0; i < updatedElementIds.length; i++) {
						schemaElement = this._viewmodel.GetElementById(
							updatedElementIds[i]
						);

						if (schemaElement) {
							isParentUpdated = false;

							// check that one of parents also updated
							parentElement = schemaElement.Parent;
							while (parentElement) {
								if (updatedElementHash[parentElement.Id()]) {
									isParentUpdated = true;
									break;
								}

								parentElement = parentElement.Parent;
							}

							if (isParentUpdated) {
								// if parent updated, then current element will be recreated after _parseOriginInternal on the parent
								// because of that we need to remove element from structureDocument
								externalProvider.Disconnect(schemaElement.Id());
								schemaElement.unregisterDocumentElement();
							} else {
								schemaElement.parseOrigin();
							}
						}
					}

					this._viewmodel.ResumeInvalidation();
				}
			},

			DropProvider: function (langCode) {
				this._providers[langCode] = new OriginExternalProvider();
			},

			GetProvider: function (langCode) {
				this._providers[langCode] =
					this._providers[langCode] || new OriginExternalProvider();
				return this._providers[langCode];
			},

			getDocumentExternalLinks: function (originXmlDocument) {
				var linkNodes = originXmlDocument.selectNodes(
					'//aras:externalLinks/aras:link'
				);
				var currentBlockId = this._viewmodel
					.getDocumentItem()
					.getAttribute('id');
				var linkHash = {};
				var currentNode;
				var linkInfo;
				var elementLinks;
				var targetElementId;
				var i;

				for (i = 0; i < linkNodes.length; i++) {
					currentNode = linkNodes[i];

					targetElementId = currentNode.getAttribute('targetElement');
					sourceBlockId = currentNode.getAttribute('sourceBlock');

					linkInfo = {
						linkId: currentNode.getAttribute('linkId'),
						sourceBlock: sourceBlockId,
						blockName: currentNode.getAttribute('blockName'),
						targetElement: targetElementId,
						path: currentNode.getAttribute('path'),
						isExternal: sourceBlockId !== currentBlockId
					};

					linkHash[targetElementId] = linkHash[targetElementId] || [];
					linkHash[targetElementId].push(linkInfo);
				}

				return linkHash;
			}
		}
	);
});
