function ItemsGridAsyncController(arasObj, windowObj) {
	this.aras = arasObj;
	this._soaps = {}; //collection of soap wrapper controllers, saved by itemId
	(windowObj || window).addEventListener(
		'unload',
		this.abortRequests.bind(this, null)
	);
}

ItemsGridAsyncController.prototype = {
	_getSoap: function ItemsGridAsyncControllerGetSoap(itemId, requestId) {
		return (this._soaps[itemId] && this._soaps[itemId][requestId]) || null;
	},

	_addSoap: function ItemsGridAsyncControllerAddSoap(
		itemId,
		requestId,
		customCallback
	) {
		var soap = new ItemsGridAsyncSoap(this, itemId, requestId, customCallback);
		this._soaps[itemId] = this._soaps[itemId] || {};
		this._soaps[itemId][requestId] = soap;
		return soap;
	},

	removeSoaps: function ItemsGridAsyncControllerRemoveSoaps(removeFilter) {
		var itemId;
		var itemSoaps;
		var requestId;
		var doRemove;
		for (itemId in this._soaps) {
			itemSoaps = this._soaps[itemId];
			for (requestId in itemSoaps) {
				doRemove = !removeFilter || removeFilter(itemId, requestId);
				if (doRemove) {
					delete itemSoaps[requestId];
				}
			}
		}
	},

	sendRequest: function ItemsGridAsyncControllerSendRequest(
		itemId,
		requestId,
		soapBody,
		customCallback
	) {
		var abortAndRemoveFilter = function (tmpItemId) {
			return itemId !== tmpItemId;
		};
		var soap;
		var syncRequestResult;
		this.abortRequests(abortAndRemoveFilter);
		this.removeSoaps(abortAndRemoveFilter);

		soap = this._getSoap(itemId, requestId);
		if (!soap) {
			//soap is not sent yet, so, let's send it immediately!
			soap = this._addSoap(itemId, requestId, customCallback);

			syncRequestResult = this.aras.soapSend(
				'GetItem',
				soapBody,
				'',
				false,
				soap.soapController
			);

			if (!soap.soapController) {
				soap.commonCallback(syncRequestResult);
			}
		}
	},

	abortRequests: function ItemsGridAsyncControllerAbortRequests(soapFilter) {
		var itemId;
		var requestId;
		var itemSoaps;
		var itemSoapController;
		var doStop;
		for (itemId in this._soaps) {
			itemSoaps = this._soaps[itemId];
			for (requestId in itemSoaps) {
				itemSoapController = itemSoaps[requestId].soapController;
				doStop = !soapFilter || soapFilter(itemId, requestId);
				if (
					itemSoapController &&
					doStop &&
					'function' === typeof itemSoapController.stop
				) {
					itemSoapController.stop();
				}
			}
		}
	}
};
