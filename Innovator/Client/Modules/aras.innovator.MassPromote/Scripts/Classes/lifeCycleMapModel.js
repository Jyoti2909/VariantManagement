define(function () {
	function LifeCycleMapModel(lifeCycleMapNode, itemTypeId) {
		var lifeCycleMapName = lifeCycleMapNode.selectSingleNode('name').text;
		this.id = lifeCycleMapNode.getAttribute('id');
		this.name = lifeCycleMapName;
		this.transitions = this.getTransitionModels(
			lifeCycleMapNode.selectNodes('Relationships/Item')
		);
		this.itemTypeId = itemTypeId;
	}

	LifeCycleMapModel.prototype.getTransitionModels = function (
		transitionsNodes
	) {
		var res = [];
		for (var i = 0; i < transitionsNodes.length; i++) {
			var fromStateNode = transitionsNodes[i].selectSingleNode('from_state');
			var toStateNode = transitionsNodes[i].selectSingleNode('to_state');
			var fromState = fromStateNode.getAttribute('keyed_name');
			var toState = toStateNode.getAttribute('keyed_name');
			const fromStateItemNode = fromStateNode.selectSingleNode('Item');
			const toStateItemNode = toStateNode.selectSingleNode('Item');
			res.push({
				id: transitionsNodes[i].getAttribute('id'),
				getComment:
					transitionsNodes[i].selectSingleNode('get_comment').text === '1',
				fromState: {
					id: fromStateItemNode.getAttribute('id'),
					name: fromState,
					label: aras.getItemProperty(fromStateItemNode, 'label') || fromState
				},
				toState: {
					id: toStateItemNode.getAttribute('id'),
					name: toState,
					label: aras.getItemProperty(toStateItemNode, 'label') || toState
				}
			});
		}
		return res;
	};

	LifeCycleMapModel.prototype.getAllTargetStates = function () {
		var allPossibleStates = this.transitions.reduce(function (res, el) {
			res.push(el.fromState);
			res.push(el.toState);
			return res;
		}, []);

		return this._getUniqueTargetState(allPossibleStates);
	};

	LifeCycleMapModel.prototype.getTransitionsByStateId = function (stateId) {
		return this.transitions.filter(function (el) {
			return el.toState.id === stateId;
		});
	};

	LifeCycleMapModel.prototype._getUniqueTargetState = function (targetStates) {
		var targetStateIds = new Set();
		return targetStates.filter(function (targetState) {
			if (!targetStateIds.has(targetState.id)) {
				targetStateIds.add(targetState.id);
				return true;
			}
			return false;
		});
	};

	return LifeCycleMapModel;
});
