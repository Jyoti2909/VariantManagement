var expandFromHereCMDId = 'expand_from_here';
var openitemCMDId = 'show_item';
var propertiesCMDId = 'properties';
var lastOpenedNode = null;
var controlReady = false;

function initStructure(structure, structureXml) {
	structure.setLayout(
		aras.getPreferenceItemProperty(
			'Core_GlobalLayout',
			null,
			'core_structure_layout'
		)
	);
	var rootNdXml = structureXml;
	if (!rootNdXml) {
		rootNdXml = parent.loadChildItems(
			itemTypeName,
			itemId,
			null,
			levelsToSelect
		);
		if (!rootNdXml) {
			return false;
		}
	}
	structure.initXML(rootNdXml);
}

function hasStub(node) {
	if (!node) {
		return false;
	}

	var stub = node.getItem(node.getUserData('stubID'));
	return stub !== null;
}

function removeStub(node) {
	if (!node) {
		return;
	}

	var stub = node.getItem(node.getUserData('stubID'));
	if (stub) {
		stub.remove();
	}
}

function onOpenItem2(typeName, itemId, notShowStatusMessage) {
	if (!lastOpenedNode) {
		return;
	}
	var node = lastOpenedNode;
	lastOpenedNode = null;
	var rootItemXml = parent.loadChildItems(
		typeName,
		itemId,
		null,
		levelsToSelect,
		notShowStatusMessage
	);

	if (!rootItemXml) {
		return false;
	}

	if (hasStub(node)) {
		removeStub(node);
	}
	node.addChildItemsFromXML(rootItemXml);
	node.expand(false);
}

function StructureBrowserEventHandlerProvider(objectId) {
	this.objectId = objectId;
	this.aras = aras;
}

StructureBrowserEventHandlerProvider.prototype = new StructureEventHandlerProvider();

StructureBrowserEventHandlerProvider.prototype.OnLoad = function StructureBrowserEventHandlerProviderOnLoad(
	structureContainer
) {
	this.Structure = structureContainer;
	structureContainer.setEventHandler(this);
	controlReady = true;
	initStructure(this.Structure);
};

StructureBrowserEventHandlerProvider.prototype.OnMenuShow = function StructureBrowserEventHandlerProviderOnMenuShow(
	item
) {
	if (!item) {
		return false;
	}

	window.focus();
	var menu = this.Structure.getMenu();
	var hideExpandFromHere =
		item.isExpanded && (!item.childrens || item.childrens.length === 0);
	if (!hideExpandFromHere) {
		menu.add(
			expandFromHereCMDId,
			this.aras.getResource('', 'structurebrowser.expand_from_here')
		);
	}
	menu.add(
		openitemCMDId,
		this.aras.getResource('', 'structurebrowser.show_item')
	);
	menu.add(
		propertiesCMDId,
		this.aras.getResource('', 'itemsgrid.cntxt_menu.properties')
	);
	return true;
};

StructureBrowserEventHandlerProvider.prototype.OnOpenItem = function StructureBrowserEventHandlerProviderOnOpenItem(
	item
) {
	if (!item) {
		return;
	}

	lastOpenedNode = item;
	if (hasStub(item)) {
		//not loaded yet
		var itemId = item.getId();
		var typeName = item.getUserData('itemTypeName');

		onOpenItem2(typeName, itemId);
	}
};
