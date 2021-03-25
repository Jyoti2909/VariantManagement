define(function () {
	// Inspired by https://stackoverflow.com/a/43595019
	function ParsingError(message, location) {
		const instance = new Error(message);
		instance.location = location;
		Object.setPrototypeOf(instance, Object.getPrototypeOf(this));

		return instance;
	}
	ParsingError.prototype = Object.create(Error.prototype, {
		constructor: {
			value: Error,
			enumerable: false,
			writable: true,
			configurable: true
		}
	});
	Object.setPrototypeOf(ParsingError, Error);

	return ParsingError;
});
