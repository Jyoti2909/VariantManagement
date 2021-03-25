function ItemDefault(inputConditionsJson) {
	//TODO: check in case of empty string or nothing
	var inputConditions = JSON.parse(inputConditionsJson);
	var outputConditions = {};
	var outputCondition;
	var inputCondition;
	var i;

	for (i in inputConditions) {
		if (!inputConditions.hasOwnProperty(i)) {
			continue;
		}
		inputCondition = inputConditions[i].toLowerCase();
		outputCondition =
			inputCondition !== 'id'
				? parent.aras.getItemProperty(parent.item, inputCondition)
				: parent.item.getAttribute('id');
		outputConditions[i.toLowerCase()] = outputCondition;
	}

	this._outputConditions = outputConditions;
}

ItemDefault.prototype.getCondition = function () {
	return this._outputConditions;
};
