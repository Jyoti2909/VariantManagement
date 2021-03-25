define([
	'dojo/_base/declare',
	'TDF/Scripts/Aras/Client/Controls/TechDoc/Action/BaseItemInitializer'
], function (declare, BaseItemInitializer) {
	return declare(BaseItemInitializer, {
		constructor: function (initialParameters) {
			initialParameters = initialParameters || {};

			this._initializersSequence = initialParameters.initializersSequence;
		},

		_processInitialization: function (targetItem, optionalParameters) {
			let initializersSequence =
				optionalParameters.initializersSequence || this._initializersSequence;
			let initPromise = Promise.resolve(targetItem, optionalParameters);

			initializersSequence = initializersSequence
				? Array.isArray(initializersSequence)
					? initializersSequence
					: [initializersSequence]
				: [];

			initializersSequence.forEach(
				(itemInitializer) =>
					(initPromise = initPromise.then((initedItem) =>
						itemInitializer.initItem(initedItem, optionalParameters)
					))
			);

			return initPromise;
		}
	});
});
