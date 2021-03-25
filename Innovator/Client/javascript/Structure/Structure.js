function StructureObject(id, offsetToCbinParent) {
	this.id = id;
	this.offsetToCbinParent = offsetToCbinParent;
}

StructureObject.prototype.WriteObject = function StructureObjectWriteObject() {
	dojo.require('Aras.Client.Controls.Experimental.Structure');
	var objectHtml =
		'<div data-dojo-type="Aras.Client.Controls.Experimental.Structure" id="' +
		this.id +
		'"></div>';
	document.write(objectHtml);
};

StructureObject.prototype.WriteEventHandlers = function StructureObjectWriteEventHandlers(
	providerTypeName
) {
	if (!providerTypeName) {
		throw new Error('providerTypeName is undefined');
	}

	window.eventHandlerProvider = new window[providerTypeName](this.id);
	require(['dojo/_base/connect']);

	dojo.subscribe(this.id + '_OnLoad', function (data) {
		return eventHandlerProvider.OnLoad(data.sender);
	});
	dojo.subscribe(this.id + '_OnDbClick', function (item) {
		return eventHandlerProvider.OnDbClick(item);
	});
	dojo.subscribe(this.id + '_OnNameEdit', function (mode, structNd) {
		return eventHandlerProvider.OnNameEdit(mode, structNd);
	});
	dojo.subscribe(this.id + '_OnMenuClick', function (menuText, item) {
		return eventHandlerProvider.OnMenuClick(menuText, item);
	});
};
