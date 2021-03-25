// © Copyright by Aras Corporation, 2004-2009.

//////////////+++++++++  CacheResponse  +++++++++//////////////////////////
function CacheResponse(success, msg, item) {
	if (success === undefined) {
		success = false;
	}
	if (msg === undefined) {
		msg = '';
	}

	this.success = success;
	this.message = msg;
	this.item = item;
}
//////////////---------  CacheResponse  ---------//////////////////////////

//////////////+++++++++  ClientCache  +++++++++//////////////////////////
function ClientCache(arasObj) {
	this.arasObj = arasObj;
	this.dom = Aras.prototype.createXMLDocument();
	this.dom.loadXML('<Innovator><Items/></Innovator>');
	this.rootNode = this.dom.selectSingleNode('//Items');
	this.cacheMap = new Map();
}

ClientCache.prototype.makeResponse = function ClientCacheMakeResponse(
	success,
	msg,
	item
) {
	return new CacheResponse(success, msg, item);
};

ClientCache.prototype.addItem = function ClientCacheAddItem(item) {
	if (!item) {
		return;
	}
	this.dom.selectSingleNode('/Innovator/Items').appendChild(item);
	this.cacheMap.set(item.getAttribute('id'), item);
};

ClientCache.prototype.updateItem = function ClientCacheUpdateItem(
	item,
	isMergeItems
) {
	const itemID = item.getAttribute('id');

	if (this.hasItem(itemID)) {
		const prevItem = this.getItem(itemID);
		if (isMergeItems) {
			this.arasObj.mergeItem(prevItem, item);
		} else {
			const newItem = item.cloneNode(true);
			prevItem.parentNode.replaceChild(newItem, prevItem);
			this.cacheMap.delete(prevItem.getAttribute('id'));
			this.cacheMap.set(newItem.getAttribute('id'), newItem);
		}
	} else {
		this.addItem(item);
	}
};

ClientCache.prototype.updateItemEx = function ClientCacheUpdateItemEx(
	oldItm,
	newItm
) {
	var oldID = oldItm.getAttribute('id');
	var newID = newItm.getAttribute('id');

	if (this.hasItem(oldID)) {
		const prevItem = this.getItem(oldID);
		const newItem = newItm.cloneNode(true);
		prevItem.parentNode.replaceChild(newItem, prevItem);
		this.cacheMap.delete(oldID);
		this.cacheMap.set(newID, newItem);
	} else if (!oldItm.parentNode) {
		this.addItem(newItm);
	}

	//BUGBUG: Situation when versionable item is in root of cache is not handled.
	//TODO: Remove update of cache from RefreshWindows
	if (oldItm.parentNode) {
		if (
			oldItm.parentNode.nodeName == 'related_id' &&
			!this.arasObj.isTempEx(oldItm)
		) {
			var relNd = oldItm.parentNode.parentNode;
			var relNdBehaviour = this.arasObj.getItemProperty(relNd, 'behavior');
			if (
				relNdBehaviour &&
				relNdBehaviour != 'float' &&
				relNdBehaviour != 'hard_float'
			) {
				var strBody =
					'<Item action="get" type="' +
					relNd.getAttribute('type') +
					'" id="' +
					relNd.getAttribute('id') +
					'" select="related_id" />';
				var res = this.arasObj.soapSend('ApplyItem', strBody);
				if (res.getFaultCode().toString() === '0') {
					var tmpItm = res.results.selectSingleNode(
						this.arasObj.XPathResult('/Item/related_id/Item')
					);
					if (tmpItm) {
						newItm = tmpItm;
					}
				}
			}
		}

		var newItmCloned = newItm.cloneNode(true);
		oldItm.parentNode.replaceChild(newItmCloned, oldItm);
	}

	var oldItms = oldItm.selectNodes('.//Item[@isTemp="1" or @isDirty="1"]');
	for (var i = 0; i < oldItms.length; i++) {
		var oldItmID = oldItms[i].getAttribute('id');
		if (oldItmID == newID) {
			continue;
		}
		var newOldItm = newItm.selectSingleNode('.//Item[@id="' + oldItmID + '"]');

		//both updateItem and deleteItem affect only root level of cache.
		if (newOldItm) {
			this.updateItem(newOldItm);
		} else {
			this.deleteItem(oldItmID);
		}
	}

	//update configurations in cache
	if (oldID == newID) {
		//to not touch behaviours of corresponding properties
		var nodesInsideConfigurations = this.dom.selectNodes(
			'/Innovator/Items/Item/*//Item[ancestor::*[local-name()!="related_id"] and @id="' +
				oldID +
				'"]'
		);
		for (i = 0, L = nodesInsideConfigurations.length; i < L; i++) {
			var nd = nodesInsideConfigurations[i];
			nd.parentNode.replaceChild(newItm.cloneNode(true), nd);
		}
	}
};

ClientCache.prototype.deleteItem = function ClientCacheDeleteItem(itemID) {
	if (this.hasItem(itemID)) {
		const item = this.cacheMap.get(itemID);
		this.cacheMap.delete(itemID);
		item.parentNode.removeChild(item);
		return item;
	}

	return null;
};

ClientCache.prototype.deleteItems = function ClientCacheDeleteItems(xpath) {
	var nodes = this.getItemsByXPath(xpath);
	for (var i = 0; i < nodes.length; i++) {
		var parentNode = nodes[i].parentNode;
		if (parentNode) {
			parentNode.removeChild(nodes[i]);
			if (this.hasItem(nodes[i].getAttribute('id'))) {
				this.cacheMap.delete(nodes[i].getAttribute('id'));
			}
		}
	}
};

ClientCache.prototype.getItem = function ClientCacheGetItem(itemID) {
	if (this.hasItem(itemID)) {
		return this.cacheMap.get(itemID);
	}
	return null;
};

ClientCache.prototype.getItemByXPath = function ClientCacheGetItemByXPath(
	xpath
) {
	return this.dom.selectSingleNode(xpath);
};

ClientCache.prototype.getItemsByXPath = function ClientCacheGetItemsByXPath(
	xpath
) {
	return this.dom.selectNodes(xpath);
};

ClientCache.prototype.hasItem = function ClientCacheHasItem(itemID) {
	if (this.cacheMap.has(itemID)) {
		const item = this.cacheMap.get(itemID);
		if (item.parentNode === this.rootNode) {
			return true;
		}
		this.cacheMap.delete(itemID);
	}
	return false;
};
//////////////---------  ClientCache  ---------//////////////////////////
