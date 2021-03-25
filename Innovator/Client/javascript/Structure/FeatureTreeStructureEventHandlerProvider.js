function FeatureTreeStructureEventHandlerProvider(objectId) {
	this.objectId = objectId;
	this.arasObject = getArasObject();
}

FeatureTreeStructureEventHandlerProvider.prototype = new StructureEventHandlerProvider();

FeatureTreeStructureEventHandlerProvider.prototype.OnLoad = function FeatureTreeStructureEventHandlerProviderOnLoad() {
	this.Structure = document.getElementById(this.objectId);
	var featureTreeXml = getItems();
	if (featureTreeXml) {
		this.Structure.initXML(featureTreeXml);
		this.Structure.GetRootItem().expand(true);
	} else {
		return;
	}
};
