function GUIDManager(aras) {
	this.aras = aras;
	this.storage = [];
	// count of guids that request from server by default
	this.count = 100;
}

//calls guid service method that return new guid
GUIDManager.prototype.GetGUID = function GUIDManagerGetGUID() {
	if (!this.storage.length) {
		GetGuidsFromServer(this, this.count);
		this.count = this.count * 2;
	}
	return this.storage.pop();
};
//gets new GUIDs for InnovatorServer
function GetGuidsFromServer(guidMgr, count) {
	var res = guidMgr.aras.soapSend(
		'generateNewGUIDEx',
		"<Item quantity='" + count + "'/>"
	);
	if (0 !== res.getFaultCode()) {
		guidMgr.aras.AlertError(res);
		var resIOMError = guidMgr.aras
			.newIOMInnovator()
			.newError(res.getFaultString());
		return resIOMError;
	}
	res = res.getResult();
	guidMgr.RefreshDataInStorage(res);
}

//adds new GUIDs in storage
GUIDManager.prototype.RefreshDataInStorage = function GUIDManagerRefreshDataInStack(
	source
) {
	if (!source) {
		return;
	}
	var propIds = source.selectSingleNode('ids').text;
	var guids = propIds.split(';');
	this.storage = this.storage.concat(guids);
};
