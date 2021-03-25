// to synchronize grid with saving of Workflow Process

function Synchronizer() {
	this.lastValue = this.getCurrentFlag();
	this.newValue = this.lastValue;
}

Synchronizer.prototype.lastValue;
Synchronizer.prototype.newValue;

Synchronizer.prototype.getCurrentFlag = function Synchronizer_getCurrentFlag() {
	var itmNd = parent.item;
	if (!itmNd || !itmNd.xml) return null;
	var res;

	var flagPropName = 'modified_on';
	var flagPropNd = itmNd.selectSingleNode(flagPropName);
	res = flagPropNd ? flagPropNd.text : '';

	var flagPropName2 = 'locked_by_id';
	var flagPropNd2 = itmNd.selectSingleNode(flagPropName2);
	res += flagPropNd2 ? flagPropNd2.text : '';
	return res;
};

Synchronizer.prototype.isParentItemSaved = function Synchronizer_isParentItemSaved() {
	this.newValue = this.getCurrentFlag();
	var res = this.lastValue == this.newValue ? false : true;
	if (res) {
		this.lastValue = this.newValue;
	}
	return res;
};

Synchronizer.prototype.synch = function Synchronizer_synch() {
	var oldSelectedActID =
		mainActivityHandler && mainActivityHandler.selectedActivity
			? mainActivityHandler.selectedActivity.id
			: '';
	onload_handler4assignments(true); //do not show active activity

	if (oldSelectedActID && mainActivityHandler) {
		mainActivityHandler.selectActivity(oldSelectedActID);
	}
};
