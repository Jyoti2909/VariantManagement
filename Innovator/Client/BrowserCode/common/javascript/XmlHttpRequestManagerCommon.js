function XmlHttpRequestManager() {}

XmlHttpRequestManager.prototype.CreateRequest = function () {
	return new XMLHttpRequest();
};
