// © Copyright by Aras Corporation, 2004-2007.

/*----------------------------------------
 * FileName: clipboard.js
 *
 *
 */

function Clipboard(arasObj) {
	this.aras = arasObj;
	this.clItems = [];

	/*
	  clipboardItem.source_id = sourceID;
	  clipboardItem.source_itemtype = sourceType;
	  clipboardItem.source_keyedname = sourceKeyedName;
	  clipboardItem.relationship_id = relationshipID;
	  clipboardItem.relationship_itemtype = relationshipType;
	  clipboardItem.related_id = relatedID;
	  clipboardItem.related_itemtype = relatedType;
	  clipboardItem.related_keyedname = relatedKeyedName;
	*/

	/*
	  clipboardItem.groupIndex - defines the index of group of copied items
	*/

	this.lastCopyIndex = 0;
}

Clipboard.prototype.copy = function Clipboard_Copy(itemArr) {
	if (itemArr.length <= 0) {
		return;
	}
	this.lastCopyIndex++;
	for (var i = 0; i < itemArr.length; i++) {
		var item = itemArr[i];
		item.groupIndex = this.lastCopyIndex;
		this.clItems.push(item);
	}
};

Clipboard.prototype.paste = function Clipboard_Paste() {
	var itemArr = [];
	for (var i = 0; i < this.clItems.length; i++) {
		if (this.clItems[i].groupIndex == this.lastCopyIndex) {
			itemArr.push(this.clItems[i]);
		}
	}
	return itemArr;
};

Clipboard.prototype.getLastCopyIndex = function Clipboard_GetLastCopyIndex() {
	return this.lastCopyIndex;
};

Clipboard.prototype.isEmpty = function Clipboard_IsEmpty() {
	return this.clItems.length === 0;
};

Clipboard.prototype.getLastCopyCount = function Clipboard_GetLastCopyCount() {
	var copyCount = 0;
	for (var i = 0; i < this.clItems.length; i++) {
		if (this.clItems[i].groupIndex == this.lastCopyIndex) {
			copyCount++;
		}
	}
	return copyCount;
};

Clipboard.prototype.getLastCopyRelatedItemTypeName = function Clipboard_GetLastCopyRelatedItemTypeName() {
	if (this.isEmpty()) {
		return '';
	}
	return this.clItems[this.clItems.length - 1].related_itemtype;
};

Clipboard.prototype.getLastCopyRTName = function Clipboard_GetLastCopyRTName() {
	if (this.isEmpty()) {
		return '';
	}
	return this.clItems[this.clItems.length - 1].relationship_itemtype;
};

Clipboard.prototype.getLastCopyItem = function Clipboard_GetLastCopyItem() {
	if (this.isEmpty()) {
		return '';
	}
	return this.clItems[this.clItems.length - 1];
};

Clipboard.prototype.clear = function Clipboard_Clear() {
	this.clItems = [];
	this.lastCopyIndex = 0;
};

Clipboard.prototype.removeItem = function Clipboard_RemoveItem(index) {
	index = parseInt(index);
	if (index >= this.clItems.length) {
		return;
	}
	var needUpdateLastIndex =
		this.clItems[index].groupIndex == this.lastCopyIndex;
	var i;
	for (i = index; i < this.clItems.length - 1; i++) {
		this.clItems[i] = this.clItems[i + 1];
	}
	this.clItems.pop();

	if (needUpdateLastIndex) {
		this.lastCopyIndex = 0;
		for (i = 0; i < this.clItems.length; i++) {
			if (this.clItems[i].groupIndex > this.lastCopyIndex) {
				this.lastCopyIndex = this.clItems[i].groupIndex;
			}
		}
	}
};

Clipboard.prototype.getItem = function Clipboard_GetItem(relId) {
	for (var i = 0; i < this.clItems.length; i++) {
		if (this.clItems[i].relationship_id == relId) {
			return this.clItems[i];
		}
	}
	return null;
};
