define(['Vendors/xmlParser'], function () {
	return {
		execute(queryDefinitionItem) {
			var documentItem = aras.newIOMItem();
			documentItem.loadAML(queryDefinitionItem.xml);

			documentItem.setAttribute('action', 'qry_ExecuteQueryDefinition');
			var deletedNodes = documentItem.node.selectNodes(
				'//Item[@action="delete"]'
			);
			for (var i = 0; i < deletedNodes.length; i++) {
				var nodeToDelete = deletedNodes[i];
				nodeToDelete.parentNode.removeChild(nodeToDelete);
			}

			return ArasModules.soap(documentItem.node.xml, { async: true })
				.catch((obj) => obj.response)
				.then((result) => {
					let xmlToFormat =
						typeof result === 'string' ? result : result && result.xml;
					return formatXml(xmlToFormat);
				});
		}
	};
});
