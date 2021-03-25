define(['dojo/_base/declare'], function (declare) {
	return declare(null, {
		aras: null,
		_initData: null,

		constructor: function (initialParameters) {
			initialParameters = initialParameters || {};
			this.aras = initialParameters.aras;
		},

		initItem: function (targetItem, optionalParameters) {
			optionalParameters = optionalParameters || {};

			this._prepareInitData(targetItem, optionalParameters);

			const initializationResult = Promise.resolve(
				this._callEventMethod('onBeforeInit', targetItem, optionalParameters)
			)
				.then(
					function (resultItem) {
						return this._processInitialization(resultItem, optionalParameters);
					}.bind(this)
				)
				.then(
					function (resultItem) {
						return this._callEventMethod(
							'onAfterInit',
							resultItem,
							optionalParameters
						);
					}.bind(this)
				);

			return Promise.resolve(initializationResult);
		},

		_processInitialization: function (targetItem, optionalParameters) {
			return targetItem;
		},

		_prepareInitData: function (targetItem, optionalParameters) {
			this._initData = Object.assign(
				{
					item: targetItem
				},
				optionalParameters
			);
		},

		_executeClientMethod: function (methodName, itemNode, contentParameters) {
			if (methodName && itemNode) {
				return this.aras.evalItemMethod(
					methodName,
					itemNode,
					contentParameters
				);
			}

			return itemNode;
		},

		_callEventMethod: function (eventName, targetItem, executionParameters) {
			executionParameters = executionParameters || {};

			if (targetItem) {
				const originItemNode = targetItem.node;
				const methodName = executionParameters[eventName];

				return Promise.resolve(
					this._executeClientMethod(
						methodName,
						targetItem.node,
						executionParameters.contextParameters
					)
				).then(
					function (resultItemNode) {
						return (
							resultItemNode &&
							(resultItemNode === originItemNode
								? targetItem
								: this._createIOMItemFromNode(resultItemNode))
						);
					}.bind(this)
				);
			}
		}
	});
});
