var CompareFileInfo = function () {
	var retutnObj = {
		mhitemType: null,
		mhitemId: null,
		mhitemConfigId: null,
		fileSelectorId: null,
		fileId: null,
		fileName: null,
		filePage: null,
		fileCopy: null,
		fileVersion: null,
		documentName: null,
		fileUrl: null,
		percents: null,
		dpi: null,
		angle: null,
		rectX: null,
		rectY: null,
		rectW: null,
		rectH: null,
		layers: null,
		pageW: null,
		pageH: null
	};

	Object.defineProperty(retutnObj, 'isEmpty', {
		get: function () {
			if (this.fileId === null) {
				return true;
			} else {
				return false;
			}
		}
	});

	return retutnObj;
};
dojo.setObject('VC.Entities.CompareFileInfo', CompareFileInfo);
