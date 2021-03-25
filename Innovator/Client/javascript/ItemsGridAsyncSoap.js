function ItemsGridAsyncSoap(
	asyncController,
	itemId,
	requestId,
	customCallback
) {
	this._itemId = itemId;
	this._requestId = requestId;
	this._asyncController = asyncController;
	this._customCallback = customCallback;
	var browser = this._asyncController.aras.Browser;
	this.soapController = new SoapController(this.commonCallback.bind(this));
}

ItemsGridAsyncSoap.prototype.commonCallback = function ItemsGridAsyncSoapCommonCallback(
	response
) {
	var callbackArgument;
	try {
		if (this._customCallback) {
			callbackArgument = response.results.selectNodes('.//Result/Item');
			this._customCallback(callbackArgument);
		}
	} finally {
		this._asyncController.removeSoaps(
			function (inItemId, inRequestId) {
				return inItemId === this._itemId && inRequestId === this._requestId;
			}.bind(this)
		);
	}
};
