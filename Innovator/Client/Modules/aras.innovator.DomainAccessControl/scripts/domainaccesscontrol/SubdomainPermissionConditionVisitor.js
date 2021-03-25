define([], function () {
	'use strict';

	const SubdomainPermissionConditionVisitor = function () {
		this.result = [];
	};

	SubdomainPermissionConditionVisitor.prototype.accept = function (
		conditionNode
	) {
		if (!conditionNode) {
			return;
		}
		for (let i = 0; i < conditionNode.childNodes.length; i++) {
			if (conditionNode.childNodes[i].nodeType != 1) {
				conditionNode.removeChild(conditionNode.childNodes[i]);
			}
		}
		switch (conditionNode.nodeName) {
			case 'condition':
			case 'and': {
				for (let i = 0; i < conditionNode.childNodes.length; i++) {
					if (conditionNode.childNodes[i].nodeType == 1) {
						this.accept(conditionNode.childNodes[i]);
					}
				}
				return;
			}
			case 'eq': {
				if (conditionNode.childNodes.length === 2) {
					let propertyNode;
					let constantNode;
					for (let i = 0; i < conditionNode.childNodes.length; i++) {
						if (conditionNode.childNodes[i].nodeName === 'property') {
							propertyNode = conditionNode.childNodes[i];
						}
						if (conditionNode.childNodes[i].nodeName === 'constant') {
							constantNode = conditionNode.childNodes[i];
						}
					}
					if (propertyNode && constantNode) {
						const propertyName = propertyNode.getAttribute('name');
						const propertyValue = constantNode.text;
						this.result[propertyName] = propertyValue;
					}
				}
				return;
			}
		}
	};

	return SubdomainPermissionConditionVisitor;
});
