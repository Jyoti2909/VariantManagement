function RelationshipsWrapper(relationshipsControl) {
	this.relationshipsControl = relationshipsControl;
	this.contentWindow = this;
	this.frameElement = this;
	this.document = window.document;

	if (!document.frames) {
		document.frames = [];
	}
	document.frames.relationships = this;
}

RelationshipsWrapper.prototype = {
	getFirstEnabledTabID: function (ignoreParamTab) {
		return this.relationshipsControl.getFirstEnabledTabID(ignoreParamTab);
	},

	setViewMode: function (updatedItem) {
		return this.relationshipsControl.setViewMode(updatedItem);
	},

	setEditMode: function (updatedItem) {
		return this.relationshipsControl.setEditMode(updatedItem);
	},

	updateTabbarState: function (callerID) {
		return this.relationshipsControl.updateTabbarState(callerID);
	},

	startup: function () {
		return this.relationshipsControl.startup();
	},

	reload: function (queryStringData) {
		return this.relationshipsControl.reload(queryStringData);
	},

	get relTabbar() {
		return this.relationshipsControl.relTabbar;
	},

	get domNode() {
		return this.relationshipsControl.relTabbar.domNode;
	},

	get item() {
		return this.relationshipsControl.item;
	},

	get relTabbarReady() {
		return this.relationshipsControl.relTabbarReady;
	},

	get itemTypeName() {
		return this.relationshipsControl.itemTypeName;
	},

	get isEditMode() {
		return this.relationshipsControl.isEditMode;
	},

	get contentDijit() {
		return this.relationshipsControl.relTabbar;
	},

	get iframesCollection() {
		return this.relationshipsControl.iframesCollection;
	},

	get currTabID() {
		return this.relationshipsControl.currTabID;
	}
};
