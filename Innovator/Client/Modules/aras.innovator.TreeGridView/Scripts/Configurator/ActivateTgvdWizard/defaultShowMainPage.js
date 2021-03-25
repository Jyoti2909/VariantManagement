var topWindow = aras.getMostTopWindowWithAras(window);
var tgvdIdParam;
var startConditionProviderParam;
var parametersProviderParam;

tgvdIdParam = 'tgvdId=TGVD_ITEM_ID';

/* Uncomment and customize the code below to customize startConditionProvider */
/*
topWindow.CustomStartConditionProvider = function(arg) {
	this.getCondition = function() {
		var idlist = ['ID1', 'ID2'];
		var managerId = arg; //"Innovator Admin" ID comes from the startConditionProviderParam args
		//id IN (idlist) AND managed_by_id = managerId
		return {
			'id': idlist,
			'managed_by_id': managerId
		};
	};
}
var managerIdentityId = 'DBA5D86402BF43D5976854B8B48FCDD1'; // "Innovator Admin" ID is for example
var managerIdentityIdUriEncoded = encodeURIComponent(managerIdentityId);
startConditionProviderParam = 'startConditionProvider=parent.CustomStartConditionProvider(' + managerIdentityIdUriEncoded + ')';
*/

/* Uncomment and modify the code below to customize parametersProvider */
/*
topWindow.CustomParametersProvider = function(arg) {
	var parameters = {
		'param1Name': 'param1Value',
		'param2Name': arg //'param2Value' comes from the parametersProviderParam args
	};

	this.getParameters = function() {
		return parameters;
	};
	this.setParameter = function(name, value) {
		//for the case if a parameter is updated by enduser in TGV UI.
		parameters[name] = value;
	};
}
var param2ValueUriEncoded = encodeURIComponent('param2Value');
parametersProviderParam = 'parametersProvider=parent.CustomParametersProvider(' + param2ValueUriEncoded + ')';
*/

// see more examples in Innovator\Client\Modules\aras.innovator.TreeGridView\Examples

var tgvUrl = aras.getBaseURL(
	'/Modules/aras.innovator.TreeGridView/Views/MainPage.html?'
);
var allParams = [
	tgvdIdParam,
	startConditionProviderParam,
	parametersProviderParam
];
for (var i = 0; i < allParams.length; i++) {
	if (allParams[i]) {
		tgvUrl += (i === 0 ? '' : '&') + allParams[i];
	}
}

var dialogParameters = {
	dialogWidth: 800,
	dialogHeight: 600,
	title: 'Tree Grid View Sample',
	content: tgvUrl
};

topWindow.ArasModules.MaximazableDialog.show(
	'iframe',
	dialogParameters
).promise.then(function () {
	delete topWindow.CustomStartConditionProvider;
	delete topWindow.CustomParametersProvider;
});
