const levelSeparationSize = 500;
const nodeSeparationSize = 50;
const nodeNeighbours = new Map();

export default (nodes, connectors, isVertical) => {
	let roots = buildDirectedAcyclicGraph(nodes);
	roots = assignLayerToGraphNodes(roots);
	let layers = createLayers(roots);
	layers = reduceConnectorCrossing(layers);
	return assignNodePositions(layers, isVertical);
};

const processGraphInDepth = (roots, callback) => {
	const queue = [...roots];
	const seen = new Set();
	const isParentSeen = (p) => seen.has(p.id);
	const hasUnprocessedParent = (child) =>
		!seen.has(child.id) &&
		nodeNeighbours.get(child.id).parents.every(isParentSeen);
	let node;
	while ((node = queue.pop())) {
		seen.add(node.id);

		callback(node);

		queue.push(
			...nodeNeighbours.get(node.id).children.filter(hasUnprocessedParent)
		);
	}
};

const assignLayerToGraphNodes = (roots) => {
	processGraphInDepth(
		roots,
		(n) =>
			(n.layer = Math.max(
				0,
				...nodeNeighbours.get(n.id).parents.map((c) => 1 + c.layer)
			))
	);
	processGraphInDepth(roots, (n) => {
		const nodeChildren = nodeNeighbours.get(n.id).children;
		if (nodeChildren.length) {
			n.layer = Math.min(...nodeChildren.map((c) => c.layer)) - 1;
		}
	});
	return roots;
};

const buildDirectedAcyclicGraph = (nodes) => {
	const cycleDetectStack = new Set();
	const processedNodesSet = new Set();
	nodes.forEach((node) =>
		processRecursive(node, cycleDetectStack, processedNodesSet)
	);
	return nodes.filter(
		(node) => nodeNeighbours.get(node.id).parents.length === 0
	);
};

const processRecursive = (node, cycleDetectStack, processedNodesSet) => {
	if (processedNodesSet.has(node.id)) {
		return;
	}
	processedNodesSet.add(node.id);

	cycleDetectStack.add(node.id);
	nodeNeighbours.set(node.id, {
		children: [],
		parents: []
	});
	node.children.forEach((n) => {
		if (cycleDetectStack.has(n.id)) {
			return;
		}

		nodeNeighbours.get(node.id).children.push(n);
		if (!processedNodesSet.has(n.id)) {
			processRecursive(n, cycleDetectStack, processedNodesSet);
		}
		nodeNeighbours.get(n.id).parents.push(node);
	});
	cycleDetectStack.delete(node.id);
};

const createLayers = (roots) => {
	const layers = [];
	processGraphInDepth(roots, (node) => {
		const layer = layers[node.layer] || (layers[node.layer] = []);
		layer.push(node);
		const nodeData = nodeNeighbours.get(node.id);
		nodeData.children = nodeData.children.map((child) => {
			if (child.layer - node.layer <= 1) {
				return child;
			}

			let last = child;
			for (let i = child.layer - 1; i > node.layer; i--) {
				const id = `${node.id}-${child.id}-${i}`;
				nodeNeighbours.set(id, {
					children: [last],
					parents: [node]
				});
				const dummy = {
					id,
					width: 0,
					height: 0,
					isDummy: true
				};
				(layers[i] || (layers[i] = [])).push(dummy);
				last = dummy;
			}
			return last;
		});
	});
	return layers;
};

const nodeSeparation = (prev, next, isVertical) => {
	const prevNodeSize = (isVertical ? prev.width : prev.height) || 0;
	const nextNodeSize = (isVertical ? next.width : next.height) || 0;
	return (prevNodeSize + nextNodeSize) / 2 + nodeSeparationSize;
};

const assignNodePositions = (layers, isVertical) => {
	layers.forEach((layer, i) => {
		layer[0].x = 0;
		layer.slice(1).forEach((node, i) => {
			const prev = layer[i];
			node.x = prev.x + nodeSeparation(prev, node, isVertical);
		});

		const halfWidth = layer[layer.length - 1].x / 2;
		layer.forEach((node) => {
			const x = node.x - halfWidth;
			const y = levelSeparationSize * i;

			node.x = isVertical ? x : y;
			node.y = isVertical ? y : x;
		});
	});
	return layers;
};

const median = (values) => {
	if (values.length === 0) {
		return 0;
	}
	if (values.length === 1) {
		return values[0];
	}

	values = values.sort((a, b) => a - b);

	const i = (values.length - 1) / 2;
	const i0 = Math.floor(i);
	const value0 = values[i0];
	const value1 = values[i0 + 1];
	return value0 + (value1 - value0) * (i - i0);
};

const twoLayersMedian = (topLayer, bottomLayer) => {
	bottomLayer.forEach((n) => (n._median = []));
	topLayer.forEach((n, i) => {
		const children = nodeNeighbours.get(n.id).children;
		children.forEach((c) => c._median.push(i));
	});
	bottomLayer.forEach((n) => (n._median = median(n._median)));
	bottomLayer.sort((a, b) => a._median - b._median);
	bottomLayer.forEach((n) => delete n._median);
};

const reduceConnectorCrossing = (layers) => {
	layers
		.slice(0, layers.length - 1)
		.forEach((layer, i) => twoLayersMedian(layer, layers[i + 1]));
	return layers;
};
