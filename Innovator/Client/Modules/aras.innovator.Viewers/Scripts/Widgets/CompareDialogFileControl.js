VC.Utils.Page.LoadWidgets(['Dialog']);
//todo: add for button tooltip
require([
	'dojo/_base/declare',
	'dojo/text!../Views/CompareDialogFileControl.html'
], function (declare, dialogContent) {
	return dojo.setObject(
		'VC.Widgets.CompareDialogFileControl',
		declare(null, {
			imgIcon: null,
			dvInfo: null,
			btnAction: null,

			parent: null,
			markedAsDelete: false,
			fileInfo: null,
			id: null,

			constructor: function (parentNode, showActionButton) {
				var self = this;
				Object.defineProperty(this, 'numberImageUrl', {
					set: function (value) {
						this.imgIcon.src = value;
					},
					get: function () {
						return this.imgIcon.src;
					}
				});

				Object.defineProperty(this, 'buttonTooltip', {
					set: function (value) {
						this.btnAction.title = value;
					},
					get: function () {
						return this.btnAction.title.alt;
					}
				});

				function createControl() {
					var outerDiv = document.createElement('div');
					outerDiv.innerHTML = dialogContent;

					self.parent.appendChild(outerDiv);
					self.headerTitle = 'Compare Files';

					self.imgIcon = document.getElementById('numberImg');
					self.dvInfo = document.getElementById('fileInfoNode');
					self.btnAction = document.getElementById('actionButton');

					self.imgIcon.id = self.imgIcon.id + VC.Utils.getTimestampString();
					self.dvInfo.id = self.dvInfo.id + VC.Utils.getTimestampString();
					self.btnAction.id = self.btnAction.id + VC.Utils.getTimestampString();

					self.btnAction.onclick = dojo.hitch(self, self._onButtonClick);
				}

				this.parent = parentNode;
				createControl();
			},

			onButtonClick: function (event, args) {},

			_onButtonClick: function () {
				if (this.markedAsDelete) {
					this.unmarkAsDeleted();
				} else {
					this.markAsDeleted();
				}

				this.onButtonClick(this, arguments);
			},

			applyFieldsData: function (
				iconUrl,
				fileName,
				filePage,
				documentName,
				fileVersion
			) {
				this.fileName = fileName;
				this.fileInfo = VC.Utils.GetResource('compDialFileInfoTemplate').Format(
					fileName,
					filePage,
					documentName,
					fileVersion
				);

				this.dvInfo.innerHTML = this.fileInfo;
				this.imgIcon.src = iconUrl;
			},

			markAsDeleted: function () {
				VC.Utils.addClass(this.dvInfo, 'DeletedFileInfo');
				VC.Utils.removeClass(this.dvInfo, 'CompareFileInfo');
				VC.Utils.addClass(this.btnAction, 'CompareRevert');
				VC.Utils.removeClass(this.btnAction, 'CompareDelete');
				this.markedAsDelete = true;

				var filePathInfo = VC.Utils.parseFileUrl(this.imgIcon.src);
				var deletedFileUrl =
					filePathInfo.pathString +
					filePathInfo.fileName +
					'Removed.' +
					filePathInfo.fileExtension;

				this.imgIcon.src = deletedFileUrl;
				this.dvInfo.innerHTML = 'Deleted &#34;' + this.fileInfo + '&#34;';
			},

			unmarkAsDeleted: function () {
				VC.Utils.removeClass(this.dvInfo, 'DeletedFileInfo');
				VC.Utils.addClass(this.dvInfo, 'CompareFileInfo');
				VC.Utils.addClass(this.btnAction, 'CompareDelete');
				VC.Utils.removeClass(this.btnAction, 'CompareRevert');
				this.markedAsDelete = false;

				var filePathInfo = VC.Utils.parseFileUrl(this.imgIcon.src);
				var postfixRemovedIndex = filePathInfo.fileName.lastIndexOf('Removed');
				var fileName = filePathInfo.fileName.substring(0, postfixRemovedIndex);
				var revetedFileUrl =
					filePathInfo.pathString + fileName + '.' + filePathInfo.fileExtension;

				this.imgIcon.src = revetedFileUrl;
				this.dvInfo.innerHTML = this.fileInfo;
			},

			hideButton: function () {
				this.btnAction.visible(false);
			},

			showButton: function () {
				this.btnAction.visible(true);
			}
		})
	);
});
