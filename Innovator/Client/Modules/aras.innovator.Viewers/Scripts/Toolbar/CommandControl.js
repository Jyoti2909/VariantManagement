var CommandControl = function (commandBarItem) {
	this.id = commandBarItem.getId();
	this.commandBarItem = commandBarItem;
	this.eventName = null;
	this.commandBarEventName = null;
};

CommandControl.prototype.bindEvent = function (eventHandler) {
	this[this.eventName] = dojo.partial(eventHandler, this.commandBarEventName);
};

dojo.setObject('VC.Toolbar.CommandControl', CommandControl);
