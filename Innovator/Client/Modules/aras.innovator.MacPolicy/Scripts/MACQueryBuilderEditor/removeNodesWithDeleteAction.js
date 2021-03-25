const removeNodesWithDeleteAction = function (queryDefinition) {
	const nodesToRemove = queryDefinition.selectNodes('//Item[@action="delete"]');

	nodesToRemove.forEach((node) => {
		node.remove();
	});
};

export default removeNodesWithDeleteAction;
