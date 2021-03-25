function Utils() {
	/// <summary>
	/// "aras.utils" instance of the class can be used in custom JavaScript code.
	/// Provides a set of useful methods.
	/// </summary>

	this.utils = {};

	for (var funcName in this) {
		var obj = this[funcName];
		var firstChar = funcName.charAt(0);

		if (
			typeof obj == 'function' &&
			!this.hasOwnProperty(funcName) &&
			firstChar.toLowerCase() == firstChar
		) {
			var newFuncName = firstChar.toUpperCase() + funcName.slice(1);
			this[newFuncName] = obj;
		}
	}

	this.utils.isClipboardSupported = function () {
		//it's the only way to check whether a browser supports clipboard operations or not
		//for those browsers that do not support clipboard operations the queryCommandEnabled throws an exception
		try {
			document.queryCommandEnabled('copy');
			return true;
		} catch (e) {
			return false;
		}
	};
	this.utils.setClipboardData = function (dataType, value, aWindow) {
		aWindow = aWindow || window;
		if (dataType === 'Text') {
			var textArea = aWindow.document.createElement('textarea');
			aWindow.document.body.appendChild(textArea);
			textArea.style.position = 'absolute';
			textArea.style.left = '-9999px';
			textArea.value = value;
			aWindow.getSelection().removeAllRanges();
			textArea.select();
			aWindow.document.execCommand('copy');
			aWindow.getSelection().removeAllRanges();
			textArea.parentNode.removeChild(textArea);
		}
	};
}

Utils.prototype.setClipboardData = function Utils_setClipboardData(
	dataType,
	value,
	aWindow
) {
	/// <summary>
	/// Set content, thats stored in clipboard
	/// </summary>
	this.utils.setClipboardData(dataType, value, aWindow);
};

Utils.prototype.isClipboardSupported = function Utils_isClipboardSupported() {
	/// <summary>
	/// Checks if clipboard operations are supported
	/// </summary>
	return this.utils.isClipboardSupported();
};

Utils.prototype.stopHookingMouseInputInScript = function () {};
Utils.prototype.startHookingMouseInputInScript = function () {};

Utils.prototype.openIEWindowInNewProcess = function Utils_openIEWindowInNewProcess(
	sURL,
	sName,
	sFeatures,
	bReplace
) {
	/// <summary>
	/// OpenIEWindowInNewProcess is the analogue of the window.open()
	/// </summary>
	/// <param name="sURL" type="string">String that specifies the URL of the document to display</param>
	/// <param name="sName" type="string">String that specifies the name of the window. String is ignored when used as TARGET</param>
	/// <param name="sFeatures" type="string">String that contains a list of items separated by commas. Each item consists of an option and a value, separated by an equals sign</param>
	/// <param name="bReplace" type="string">Ignorable, just to save window.open analogue</param>
	/// <returns>window</returns>
	return window.open(sURL, sName, sFeatures, bReplace);
};
