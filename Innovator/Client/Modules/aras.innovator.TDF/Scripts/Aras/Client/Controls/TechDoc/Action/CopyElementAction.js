define([
	'dojo/_base/declare',
	'TDF/Scripts/Aras/Client/Controls/TechDoc/Action/ActionBase'
], function (declare, ActionBase) {
	return declare(ActionBase, {
		Execute: function (executionArguments) {
			const selectedItems = executionArguments.selectedItems;
			const clipboard = executionArguments.clipboard;
			const externalReferences = {};
			const externalProvider = this._viewmodel.OriginExternalProvider();
			const originXmls = selectedItems.map((selectedItem) => {
				const clonedObject = selectedItem.Clone();
				const clonedXmlNode = clonedObject.Origin();
				const elementExternalReferences = this._findElementExternalReferences(
					clonedXmlNode,
					externalProvider
				);

				for (let referenceId in elementExternalReferences) {
					if (!externalReferences[referenceId]) {
						externalReferences[referenceId] = elementExternalReferences[
							referenceId
						].cloneNode(true);
					}
				}

				return clonedXmlNode;
			});

			clipboard.setData('StructureXml', {
				content: originXmls,
				references: externalReferences
			});

			this.OnExecuted(selectedItems);
		},

		_findElementExternalReferences: function (
			targetNode,
			externalProvider,
			excludeSelfNode
		) {
			const resultHash = {};

			if (targetNode) {
				const nodesWithReference = targetNode.selectNodes(
					excludeSelfNode
						? './/*[@ref-id]'
						: 'descendant-or-self::node()[@ref-id]'
				);

				nodesWithReference.forEach((currentNode) => {
					const referenceId = currentNode.getAttribute('ref-id');
					const referenceNode = externalProvider.GetExternalNodeByRefId(
						referenceId
					);
					const innerReferences = this._findElementExternalReferences(
						referenceNode,
						externalProvider,
						true
					);

					resultHash[referenceId] = referenceNode;

					for (let innerReferenceId in innerReferences) {
						if (!resultHash[innerReferenceId]) {
							resultHash[innerReferenceId] = innerReferences[innerReferenceId];
						}
					}
				});
			}

			return resultHash;
		}
	});
});
