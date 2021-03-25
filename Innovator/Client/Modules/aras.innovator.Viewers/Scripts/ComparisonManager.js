require(['dojo/_base/declare'], function (declare) {
	VC.Utils.Page.LoadModules(['Entities/CompareFileInfo']);
	VC.Utils.Page.LoadModules(['Entities/FilesDataCollector']);
	VC.Utils.Page.LoadWidgets(['CompareCacheManager']);
	var compareCacheManager = null;
	var cacheData = null;
	return dojo.setObject(
		'VC.ComparisonManager',
		declare(null, {
			constructor: function () {
				compareCacheManager = new VC.Widgets.CompareCacheManager();
				cacheData = compareCacheManager.cacheData;

				Object.defineProperty(this, 'currentFile', {
					set: function (val) {
						cacheData.currentFile = val;
					},
					get: function () {
						return cacheData.currentFile;
					}
				});

				Object.defineProperty(this, 'fileList', {
					set: function (val) {
						cacheData.fileList = val;
					},
					get: function () {
						return cacheData.fileList;
					}
				});
			},

			setProperties: function (prpsObj) {
				for (var prop = 1; prop < prpsObj.length; prop++) {
					this.setFileProperty(prop, prpsObj[prop]);
				}
			},

			setFileProperty: function (prop, value) {
				if (value === null) {
					return;
				}
				cacheData.setFileProperty(prop, value);
			},

			clearCacheData: function () {
				compareCacheManager.clearCompareData();
			},

			clearFileData: function () {
				cacheData.cleanAll();
			},

			updateData: function () {
				compareCacheManager.storeCompareData();
			},

			restoreData: function (fileInfo1, fileInfo2) {
				if (fileInfo1 !== '' && fileInfo2 !== '') {
					compareCacheManager.restoreCompareData(fileInfo1, fileInfo2);

					this.setCurrent(0);
					var curFile = cacheData.currentFile;
					var fileUrl = top.aras.IomInnovator.getFileUrl(
						curFile.fileId,
						top.aras.Enums.UrlType.SecurityToken
					);
					this.setFileProperty('fileUrl', fileUrl);

					this.setCurrent(1);
					curFile = cacheData.currentFile;
					fileUrl = top.aras.IomInnovator.getFileUrl(
						curFile.fileId,
						top.aras.Enums.UrlType.SecurityToken
					);
					this.setFileProperty('fileUrl', fileUrl);
				}
			},

			setDefaultDataInfo: function (index) {
				cacheData.setCurrent(index);
			},

			isFileEmpty: function (index) {
				return cacheData.fileList[index].isEmpty;
			},

			getAnotherFileProperty: function (propName) {
				return cacheData.getAnotherFileProperty(propName);
			},

			getAnotherFileInfo: function () {
				return cacheData.getAnotherFileInfo();
			},

			setCurrent: function (index) {
				cacheData.setCurrent(index);
			},

			cleanFileInfoByName: function (name) {
				cacheData.cleanFileByPropertyValue('fileName', name);
			}
		})
	);
});
