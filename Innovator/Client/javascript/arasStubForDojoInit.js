//tmp stub
var aras = {
	isTmpStubToMakeDojoWorking: true,
	getLanguageDirection: function () {
		return 'ltr';
	},
	getResource: function () {
		return '';
	},
	Browser: {
		isIe: function () {
			return 'true';
		},
		getMajorVersionNumber: function () {
			return 10;
		}
	},
	convertToNeutral: function (value, dataType, pattern) {
		return value;
	},
	convertFromNeutral: function (value, dataType, pattern) {
		return value;
	},
	getResources: function (solution, keys) {
		var tempArr = new Array(keys.length);
		for (var i = 0; i < tempArr.length; i++) {
			tempArr[i] = '';
		}
		return tempArr;
	}
};
