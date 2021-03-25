require(['dojo/_base/declare'], function (declare) {
	var compareClientCacheId = 'compareClientCacheId';
	var compareFile1Tag = 'compareFile1';
	var compareFile2Tag = 'compareFile2';

	function getCompareInfoFromCacheData(data) {
		var fileData = new VC.Entities.CompareFileInfo();
		var childElements = null;
		var nodeName = null;
		var nodeValue = null;
		if (data && data !== null) {
			childElements = data.childNodes;

			for (var i = 0; i < childElements.length; i++) {
				nodeName = childElements[i].nodeName;
				nodeValue = childElements[i].text;

				fileData[nodeName] = nodeValue;
			}
		}
		return fileData;
	}

	return dojo.setObject(
		'VC.Widgets.CompareCacheManager',
		declare(null, {
			domParser: new DOMParser(),
			xmlSerializer: new XMLSerializer(),
			compareFiles: null,
			isPostBack: false,

			constructor: function () {
				Object.defineProperty(this, 'cacheData', {
					get: function () {
						//if (this.compareFiles === null) {
						var cachedItem = top.aras.itemsCache.getItem(compareClientCacheId);

						if (cachedItem) {
							var compareFile1 = cachedItem.getElementsByTagName(
								compareFile1Tag
							)[0];
							var compareFile2 = cachedItem.getElementsByTagName(
								compareFile2Tag
							)[0];

							this.compareFiles = new VC.Entities.FilesDataCollector();
							this.compareFiles.applyData([
								getCompareInfoFromCacheData(compareFile1),
								getCompareInfoFromCacheData(compareFile2)
							]);
						} else {
							this.compareFiles = new VC.Entities.FilesDataCollector();
						}
						//}

						return this.compareFiles;
					}
				});
				this.isPostBack = true;
			},

			restoreCompareData: function (fileInfo1, fileInfo2) {
				var xmlDocument = top.aras.createXMLDocument();

				xmlDocument.loadXML('<Item>' + fileInfo1 + fileInfo2 + '</Item>');
				var compareFile1 = xmlDocument.getElementsByTagName('fileInfo1')[0];
				var compareFile2 = xmlDocument.getElementsByTagName('fileInfo2')[0];

				this.compareFiles.applyData([
					getCompareInfoFromCacheData(compareFile1),
					getCompareInfoFromCacheData(compareFile2)
				]);
			},

			storeCompareData: function () {
				var oldItem = top.aras.itemsCache.getItem(compareClientCacheId);
				var xmlDocument = top.aras.createXMLDocument();
				var cacheableItem = xmlDocument.createElement('Item');
				var currentField = null;
				var currentValue = null;
				var currentElement = null;

				for (var i = 0; i < this.compareFiles.fileList.length; i++) {
					if (!this.compareFiles.fileList[i].isEmpty) {
						var compareFileFields = Object.keys(this.compareFiles.fileList[i]);
						var compareFile1Element = xmlDocument.createElement(
							compareFile1Tag
						);

						for (var j = 0; j < compareFileFields.length; j++) {
							currentField = compareFileFields[j];

							currentValue = this.compareFiles.fileList[i][currentField];
							if (currentValue !== null) {
								currentElement = xmlDocument.createElement(currentField);
								currentElement.text = currentValue;
								compareFile1Element.appendChild(currentElement);
							}
						}

						cacheableItem.appendChild(compareFile1Element);
					}
				}

				cacheableItem.setAttribute('id', compareClientCacheId);

				if (oldItem !== null) {
					top.aras.itemsCache.updateItemEx(oldItem, cacheableItem);
				} else {
					top.aras.itemsCache.addItem(cacheableItem);
				}
			},

			clearCompareData: function () {
				top.aras.itemsCache.deleteItem(compareClientCacheId);
				this.compareFiles = null;
			},

			clearFileData: function (name) {
				var oldItem = top.aras.itemsCache.getItem(compareClientCacheId);
				//var compareFile1 = oldItem.getElementsByTagName(compareFile1Tag)[0],
				//	compareFile2 = oldItem.getElementsByTagName(compareFile2Tag)[0];
				var deletedNode = null;
				for (var i = 0; i < oldItem.childNodes.length; i++) {
					if (oldItem.childNodes[i].xml.indexOf(name) > -1) {
						deletedNode = oldItem.childNodes[i];
						break;
					}
				}
				if (deletedNode === null) {
					return;
				}
				var cacheableItem = oldItem.removeChild(deletedNode);
				top.aras.itemsCache.updateItemEx(oldItem, cacheableItem);
			}
		})
	);
});
