var FilesDataCollector = function () {
	this.fileList = [
		new VC.Entities.CompareFileInfo(),
		new VC.Entities.CompareFileInfo()
	];

	var currentFileInfo = this.fileList[0];
	var self = this;

	this.applyData = function (dataArr) {
		self.fileList = dataArr;

		if (self.fileList[0].isEmpty) {
			currentFileInfo = self.fileList[0];
		} else if (self.fileList[1].isEmpty) {
			currentFileInfo = self.fileList[1];
		}
	};

	this.setFileProperty = function (property, value) {
		currentFileInfo[property] = value;
	};

	this.getFileProperty = function (property) {
		return currentFileInfo[property];
	};

	this.cleanFile = function (index) {
		this.fileList[index] = new VC.Entities.CompareFileInfo();
		var anotherFileIndex = 0;

		for (var i = 0; i <= this.fileList.length; i++) {
			if (this.fileList[i] && 1 !== index) {
				anotherFileIndex = i;
				break;
			}
		}
		if (this.fileList[0].isEmpty) {
			currentFileInfo = this.fileList[0];
		} else {
			currentFileInfo = this.fileList[anotherFileIndex];
		}
	};

	this.cleanFileByPropertyValue = function (property, value) {
		var file = this.fileList.FindAll(property, value);
		for (var i = 0; i < this.fileList.length; i++) {
			if (this.fileList[i][property] === value) {
				this.cleanFile(i);
				return;
			}
		}
	};

	this.cleanAll = function () {
		for (var i = 0; i < this.fileList.length; i++) {
			this.cleanFile(i);
		}
	};

	this.cleanCurrentFile = function () {
		currentFileInfo = new VC.Entities.CompareFileInfo();
	};

	this.initFileProperty = function () {
		this.fileList[0][property] = value;
	};

	this.getAnotherFileProperty = function (propName) {
		for (var i = 0; i < this.fileList.length; i++) {
			if (
				this.fileList[i].fileId &&
				currentFileInfo.fileId !== this.fileList[i].fileId
			) {
				return this.fileList[i][propName];
			}
		}

		return this.fileList[0][propName];
	};

	this.getAnotherFileInfo = function () {
		for (var i = 0; i < this.fileList.length; i++) {
			if (
				this.fileList[i].fileId &&
				currentFileInfo.fileId !== this.fileList[i].fileId
			) {
				return this.fileList[i];
			}
		}

		return null;
	};

	this.setCurrent = function (index) {
		currentFileInfo = this.fileList[index];
	};

	Object.defineProperty(this, 'currentFile', {
		set: function (val) {
			currentFileInfo = val;
		},
		get: function () {
			return currentFileInfo;
		}
	});

	this.isFileEmpty = function (index) {
		return this.fileList[index].isEmpty;
	};
};

dojo.setObject('VC.Entities.FilesDataCollector', FilesDataCollector);
