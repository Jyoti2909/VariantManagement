const d3 = window.d3;
const forceSettings = {
	alphaMin: 0.1,
	charge: -1000,
	theta: 2,
	nodeDistanceMin: 100
};
const nodeDistance = (nodeData = {}) => {
	return (
		Math.max(nodeData.width, nodeData.height) || forceSettings.nodeDistanceMin
	);
};
const connectorDistance = (connectorData = {}) => {
	return (
		nodeDistance(connectorData.source) + nodeDistance(connectorData.target)
	);
};
const force = d3
	.forceSimulation()
	.alphaMin(forceSettings.alphaMin)
	.force('collide', d3.forceCollide().radius(nodeDistance))
	.force(
		'link',
		d3
			.forceLink()
			.id((d) => d.id)
			.distance(connectorDistance)
	)
	.force(
		'charge',
		d3.forceManyBody().strength(forceSettings.charge).theta(forceSettings.theta)
	)
	.force('center', d3.forceCenter())
	.stop();

export default (nodes, connectors) => {
	force.alpha(1).nodes(nodes).force('link').links(connectors);

	for (
		let i = 0,
			n = Math.ceil(
				Math.log(force.alphaMin()) / Math.log(1 - force.alphaDecay())
			);
		i < n;
		++i
	) {
		force.tick();
	}
};
