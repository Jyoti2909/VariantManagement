define(['dojo/_base/declare', 'dojox/uuid/generateRandomUuid'], function (
	declare,
	generateRandomUuid
) {
	return declare(
		'Aras.Client.Controls.TechDoc.Helper._ExternalContentHelper.OriginExternalProvider',
		null,
		{
			referenceAttributeName: 'ref-id',

			constructor: function (args) {
				this._externalNodes = {};
				this._alternativeNodes = {};
				this._connectedIds = {};
				this._rootReferencesNode = null;
			},

			InsertExternal: function (newReferenceNode) {
				var referenceId = this._GetRefIdNode(newReferenceNode);

				this._rootReferencesNode.appendChild(newReferenceNode);
				this._externalNodes[referenceId] = newReferenceNode;
				this._connectedIds[referenceId] = {};

				return referenceId;
			},

			Update: function (documentXmlDom) {
				var idList;

				if (this._rootReferencesNode) {
					idList = this._MergeReferecencesNode(documentXmlDom);
				} else {
					this._ParseReferecencesNode(documentXmlDom);
					idList = [];
				}

				return idList;
			},

			GetExternalNodeByRefId: function (refId) {
				return this._externalNodes[refId] || this._alternativeNodes[refId];
			},

			GetExternalItemNodeByRefId: function (refId) {
				var referenceNode =
					this._externalNodes[refId] || this._alternativeNodes[refId];

				return referenceNode ? referenceNode.selectSingleNode('Item') : null;
			},

			GetRefIdByBlockId: function (blockId) {
				var blockReferenceNode = this._rootReferencesNode.selectSingleNode(
					"aras:block[@blockId='" + blockId + "']"
				);

				if (blockReferenceNode) {
					return blockReferenceNode.getAttribute(this.referenceAttributeName);
				}
			},

			GetRefIdByImageId: function (imageId) {
				var imageReferenceNode = this._rootReferencesNode.selectSingleNode(
					"aras:image[@imageId='" + imageId + "']"
				);

				if (imageReferenceNode) {
					return imageReferenceNode.getAttribute(this.referenceAttributeName);
				}
			},

			GetRefIdByItemId: function (itemId) {
				var itemReferenceNode = this._rootReferencesNode.selectSingleNode(
					"aras:item[Item[@id='" + itemId + "']]"
				);

				if (itemReferenceNode) {
					return itemReferenceNode.getAttribute(this.referenceAttributeName);
				}
			},

			Disconnect: function (id) {
				for (var referenceId in this._connectedIds) {
					if (this._connectedIds[referenceId][id]) {
						delete this._connectedIds[referenceId][id];
						break;
					}
				}
			},

			UpdateReferenceNode: function (/*XmlNode*/ referenceNode) {
				if (referenceNode) {
					var referenceId = this._GetRefIdNode(referenceNode);
					var existingReferenceNode = this._externalNodes[referenceId];

					if (existingReferenceNode) {
						if (
							referenceNode.xml.length != existingReferenceNode.xml.length ||
							referenceNode.xml != existingReferenceNode.xml
						) {
							this._rootReferencesNode.replaceChild(
								referenceNode,
								existingReferenceNode
							);
							this._externalNodes[referenceId] = referenceNode;
						}
					} else {
						this.InsertExternal(referenceNode);
					}
				}
			},

			Connect: function (refId, id) {
				if (this._connectedIds[refId]) {
					this._connectedIds[refId][id] = true;
				}
			},

			_ParseReferecencesNode: function (newReferences) {
				this._rootReferencesNode = newReferences;
				this._externalNodes = this._GetNodesHash(
					newReferences,
					this.referenceAttributeName
				);

				for (var refId in this._externalNodes) {
					this._connectedIds[refId] = {};
				}
			},

			SetAlternativeReferences: function (refenceHash) {
				if (refenceHash) {
					for (var referenceId in refenceHash) {
						this._alternativeNodes[referenceId] = refenceHash[referenceId];
					}
				}
			},

			ClearAlternativeReferences: function () {
				this._alternativeNodes = {};
			},

			_MergeReferecencesNode: function (newReferences) {
				var newReferencesHash = this._GetNodesHash(
					newReferences,
					this.referenceAttributeName
				);
				var thisReferencesHash = this._externalNodes;
				var connectedIds = this._connectedIds;
				var changedExternals = [];
				var refId;
				var newReferenceNode;
				var currentReferenceNode;
				var uidList;
				var uid;

				for (refId in newReferencesHash) {
					newReferenceNode = newReferencesHash[refId];
					currentReferenceNode = thisReferencesHash[refId];

					if (currentReferenceNode) {
						//  TODO  Bug - one block different refId
						//There is not places where MergeDocument is called after WrappedOBject parse
						//var thisReferenceNodeElemenet = this.GetElementsByOrigin(currentReferenceNode);

						if (
							newReferenceNode.xml.length != currentReferenceNode.xml.length ||
							newReferenceNode.xml != currentReferenceNode.xml
						) {
							this._rootReferencesNode.replaceChild(
								newReferenceNode,
								currentReferenceNode
							);
							thisReferencesHash[refId] = newReferenceNode;

							uidList = connectedIds[refId];
							for (uid in uidList) {
								changedExternals.push(uid);
							}
						}
					} else {
						this._rootReferencesNode.appendChild(newReferenceNode);
						thisReferencesHash[refId] = newReferenceNode;
						connectedIds[refId] = {};
					}
				}

				return changedExternals;
			},

			_GetRefIdNode: function (referenceNode) {
				var refId = referenceNode.getAttribute(this.referenceAttributeName);

				if (!refId) {
					refId = generateRandomUuid().replace(/-/g, '').toUpperCase();
					referenceNode.setAttribute(this.referenceAttributeName, refId);
				}

				return refId;
			},

			_GetNodesHash: function (xmlNodes, attrName) {
				var hash = {};
				var xmlNode;
				var referenceId;
				var i;

				for (i = 0; i < xmlNodes.childNodes.length; i++) {
					xmlNode = xmlNodes.childNodes[i];

					if (xmlNode.nodeType === document.ELEMENT_NODE) {
						referenceId = xmlNode.getAttribute(attrName);
						hash[referenceId] = xmlNode;
					}
				}
				return hash;
			}
		}
	);
});
