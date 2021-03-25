// eslint-disable-next-line no-unused-vars
function initExternalImageViewerToolbar(container) {
	const fileBase = container.aras.getScriptsURL() + 'ImageBrowser/';
	container.selectedFile = '';
	container.isFileName = function (s) {
		const regexp = /^(?:[\w]:|\\|\/[a-z_\-\s0-9.]+)((\\|\/)[a-z_\-\s0-9.]+)+/i;
		return regexp.test(s);
	};

	container.isUrl = function (s) {
		const regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-/]))?/;
		return regexp.test(s);
	};

	container.saveFileAndGetRef = function (pathFromToolbar) {
		const innovator = container.aras.IomInnovator;
		const file = container.aras.newFileItem(pathFromToolbar);
		if (!file) {
			container.parent.closeWindow('focus');
			return null;
		}
		const fileId = file.getAttribute('id');
		const fileItem = innovator.newItem();
		fileItem.loadAML(file.xml);
		return fileItem.apply().isError() ? '' : 'vault:///?fileId=' + fileId;
	};

	container.onToolbarBtnClick = function (clickedBtn) {
		switch (clickedBtn.getId()) {
			case 'set_nothing':
				container.parent.closeWindow('set_nothing');
				break;
			case 'ready_btn': {
				let returnValue = container.toolbar.getItem('filename').getText();
				if (container.selectedFile) {
					returnValue = container.saveFileAndGetRef(container.selectedFile);
				} else if (returnValue.toLowerCase().indexOf('file:///') == 0) {
					returnValue = container.saveFileAndGetRef(
						returnValue.replace(/file:\/\/\//i, '')
					);
				} else if (container.isFileName(returnValue)) {
					returnValue = container.saveFileAndGetRef(returnValue);
				}
				returnValue && container.parent.closeWindow(returnValue);
				break;
			}
			case 'open':
				container.document.getElementById('inputFiles').click();
				break;
			case 'refresh':
				container.refreshPicture();
				break;
		}
	};

	container.changePictureSrc = function () {
		function processFileSelection(fileName) {
			if (fileName) {
				container.document.getElementById('imageViewer').style.visibility =
					'visible';
				if (typeof fileName === 'string') {
					container.toolbar.getItem('filename').setText('file:///' + fileName);
				} else {
					container.toolbar.getItem('filename').setText(fileName.name);
					container.selectedFile = fileName;
				}
				container.refreshPicture();
			}
		}
		const fileName = container.aras.vault.selectFile();
		if (fileName.then) {
			fileName.then(processFileSelection.bind(this));
		} else {
			processFileSelection.call(this, fileName);
		}
	};

	container.refreshPicture = function () {
		const setBase64ToImageSrc = function (uri) {
			const base64Res = uri ? container.aras.vault.readBase64(uri) : '';
			imageViewer.src = 'data:image;base64,' + base64Res;
		};

		let fileName = container.toolbar.getItem('filename').getText();
		const imageViewer = container.document.getElementById('imageViewer');
		imageViewer.src = null;
		imageViewer.style.visibility = 'hidden';
		if (fileName.toLowerCase().indexOf('vault://?fileid=') == 0) {
			const innovator = container.aras.IomInnovator;
			const fileId = fileName.replace(/vault:\/\/\/\?fileid=/i, '');
			fileName = innovator.getFileUrl(
				fileId,
				container.aras.Enums.UrlType.SecurityToken
			);
			imageViewer.src = fileName;
		} else {
			if (fileName.toLowerCase().indexOf('file:///') == 0) {
				fileName = fileName.replace(/file:\/\/\//i, '');
				setBase64ToImageSrc(fileName);
			} else if (container.isUrl(fileName)) {
				imageViewer.src = fileName;
			} else {
				if (container.isFileName(fileName)) {
					setBase64ToImageSrc(fileName);
				} else {
					if (container.selectedFile) {
						const url = window.URL.createObjectURL(container.selectedFile);
						imageViewer.src = url;
					}
				}
			}
		}
		imageViewer.style.visibility = imageViewer.src ? 'visible' : 'hidden';
		container.fixPictureSize();
	};

	container.fixPictureSize = function () {
		const el = container.document.getElementById('pict');
		el.style.height = window.innerHeight - 30 + 'px'; // 30px - tabbar
		el.style.width = window.dialogWidth;
	};

	container.addEventListener('resize', container.fixPictureSize, false);

	container.clientControlsFactory.createControl(
		'Aras.Client.Controls.Public.ToolBar',
		{ id: 'top_toolbar', connectId: 'toolbarContainer' },
		function (control) {
			container.toolbar = control;
			container.clientControlsFactory.on(container.toolbar, {
				onClick: container.onToolbarBtnClick
			});
			container.document.toolbar = container.toolbar;
			container.toolbar.loadXml(
				container.aras.getI18NXMLResource(
					'imgviewer_toolbar_external.xml',
					fileBase + '../../'
				)
			);
			container.toolbar.show();
		}
	);

	container.onload = function onloadHandler() {
		container.document.body.addEventListener('keypress', function (e) {
			if (e.keyCode == 13) {
				container.refreshPicture();
			}
		});
	};
}
