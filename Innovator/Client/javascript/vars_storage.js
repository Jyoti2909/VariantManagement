function VarsStorageClass() {
	this.unknownStorage = {};
}

VarsStorageClass.prototype.getVariable = function VarsStorageClassGetVariable(
	varName
) {
	var res = this.unknownStorage[varName];
	return res;
};

VarsStorageClass.prototype.setVariable = function VarsStorageClassSetVariable(
	varName,
	varValue
) {
	if (typeof varValue != 'string' && varValue !== null) {
		varValue = varValue.toString();
	}
	this.unknownStorage[varName] = varValue;
};
