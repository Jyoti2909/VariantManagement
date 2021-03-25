function DefaultParametersProvider() {
	var parameters = {};

	this.getParameters = function () {
		return parameters;
	};

	this.setParameter = function (name, value) {
		parameters[name] = value;
	};
}
