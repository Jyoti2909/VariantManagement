//List of parameters points what the actions should be executed later.
var ActionsPointer = function () {
	var returnObject = {
		applyViewStateData: false,
		fireWindowEvent: false
	};

	return returnObject;
};

dojo.setObject('VC.Entities.ActionsPointer', ActionsPointer);
