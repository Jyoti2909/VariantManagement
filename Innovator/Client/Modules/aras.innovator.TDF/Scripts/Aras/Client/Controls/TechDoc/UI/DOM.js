define(['dojo/_base/declare'], function (declare) {
	return declare('Aras.Client.Controls.TechDoc.UI.DOM', null, {
		constructor: function (args) {
			this.document = args.document;
			this._structuredDocument = args.viewmodel;
		},

		_getNodeWithDataType: function (/*DomNode*/ currentNode) {
			if (currentNode) {
				if (currentNode.className) {
					return currentNode;
				} else if (currentNode.parentNode) {
					return this._getNodeWithDataType(currentNode.parentNode);
				}
			}

			return null;
		},

		_is: function (node, type) {
			var dataType = node.className;
			var typeArray = dataType.split(' ');
			return typeArray.indexOf(type) >= 0;
		},

		getNode: function (schemaElement) {
			return schemaElement && this.getNodeById(schemaElement.Id());
		},

		getNodeById: function (/*String*/ id) {
			return this.document.getElementById(id);
		},

		getObject: function (/*DomNode*/ node) {
			var nodeId = node.id;
			var parentNode = node.parentNode;
			var elementId;
			var typedNode;

			if (nodeId && node.className.indexOf('XmlSchemaNode') !== -1) {
				elementId = nodeId;
			} else if (node.nodeName == '#text') {
				if (parentNode.className.indexOf('XmlSchemaText') != -1) {
					elementId = parentNode.getAttribute('id');
				} else {
					// TODO  Next fix to remove this line (always up to root, if node not in arastext)
					typedNode =
						this.getParentNode(parentNode, 'ArasTextXmlSchemaElement') ||
						this.getParentNode(parentNode, 'XmlSchemaElement');

					if (typedNode) {
						elementId = typedNode.getAttribute('id');
					}
				}
			} else {
				if (parentNode && parentNode.className == 'InactiveContainer') {
					// if target node is a functional element of InactiveContainer
					elementId = parentNode.getAttribute('inactiveElementId');
				} else {
					typedNode = this.getParentNode(node, 'XmlSchemaElement');

					if (typedNode) {
						elementId = typedNode.getAttribute('id');
					}
				}
			}

			return this._structuredDocument.GetElementById(elementId);
		},

		getParentNode: function (currentNode, type) {
			var typedNode = this._getNodeWithDataType(currentNode);

			if (typedNode) {
				return this._is(typedNode, type)
					? typedNode
					: this.getParentNode(typedNode.parentNode, type);
			}

			return null;
		}
	});
});
