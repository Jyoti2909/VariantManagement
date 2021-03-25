VC.Utils.Page.LoadWidgets(['Dialog']);

require([
	'dojo/_base/declare',
	'dojo/text!../Views/CompareDialog.html'
], function (declare, dialogContent) {
	var fileInfoStruct = [];

	fileInfoStruct.current = fileInfoStruct[0];

	var baseIconImageUrl = top.aras.getBaseURL() + '/images/File{0}Indicator.svg';

	return dojo.setObject(
		'VC.Widgets.CompareDialog',
		declare(VC.Widgets.Dialog, {
			dialogName: 'compareFiles',
			fileInfoControls: null,
			fileInfoContent: null,
			compareContent: null,
			anotherItem: null,
			buttonsContainer: null,
			dvStartComparison: null,
			startComparison: null,
			cancel: null,
			selectPlaceHolder: null,
			_differentVertionsSelect: null,

			showComparisonContent: true,

			onCancelClick: function (event, args) {},
			onStartComparison: function (event, args) {},
			onStartComparisonDiffVersion: function (event, args) {},
			onSelectAnotherItem: function (event, args) {},

			constructor: function () {
				this.fileInfoControls = [];
				this.replaceDialogTemplate(dialogContent);
			},

			postCreate: function () {
				this.inherited(arguments);

				this._differentVertionsSelect = new VC.Widgets.DropDownList();
				this._differentVertionsSelect.onChange = dojo.hitch(
					this,
					this._onSelectDiffVersion
				);
				this.selectPlaceHolder.appendChild(
					this._differentVertionsSelect.domNode
				);

				this.cancel.onclick = dojo.hitch(this, this._cancelClick);
				this.dvStartComparison.onclick = dojo.hitch(
					this,
					this._startComparisonDiffVersionClick
				);
				this.startComparison.onclick = dojo.hitch(
					this,
					this._startComparisonClick
				);
				this.anotherItem.onclick = dojo.hitch(this, this._onSelectAnotherItem);
			},

			_cancelClick: function (event, args) {
				this.onCancelClick(event, args);
				this._onCrossClick();
			},

			_startComparisonClick: function () {
				this.hide();
				this.onStartComparison();
			},

			_startComparisonDiffVersionClick: function () {
				var result = this.onStartComparisonDiffVersion();

				if (result !== false) {
					this.hide();
				}
			},

			_onSelectAnotherItem: function () {
				this.hide();
				this.onSelectAnotherItem();
			},

			_onSelectDiffVersion: function () {
				if (this._differentVertionsSelect.selectedValue === '') {
					this.dvStartComparison.disable(true);
				} else {
					this.dvStartComparison.disable(false);
				}

				this.onSelectDiffVersion(
					this._differentVertionsSelect.selectedValue,
					this._differentVertionsSelect.selectedOption.additionalData.fileName
				);
			},

			addFileInfo: function (fileName, filePage, documentName, fileVersion) {
				VC.Utils.Page.LoadWidgets(['CompareDialogFileControl']);

				var fileInfoControl = new VC.Widgets.CompareDialogFileControl(
					this.fileInfoContent
				);
				fileInfoControl.applyFieldsData(
					baseIconImageUrl.Format(this.fileInfoControls.length + 1),
					fileName,
					filePage,
					documentName,
					fileVersion
				);
				fileInfoControl.onButtonClick = dojo.hitch(this, this.startup);
				this.fileInfoControls.push(fileInfoControl);
			},

			updateFileInfoPage: function (fileName, filePage) {
				for (var i = 0; i < this.fileInfoControls.length; i++) {
					if (this.fileInfoControls[i].fileName === fileName) {
						var info = this.fileInfoControls[i].fileInfo;
						this.fileInfoControls[i].fileInfo = info.replace(
							/page \d+/,
							'page ' + filePage
						);
						this.fileInfoControls[i].dvInfo.innerHTML = this.fileInfoControls[
							i
						].fileInfo;
					}
				}
			},

			cleanFileInfo: function () {
				this.fileInfoContent.innerHTML = '';
				this.fileInfoControls = [];
			},

			addVersionsDefinition: function (data) {
				var versions = JSON.parse(data);
				var dropDownListOption = null;
				var dropDownListOptions = [];
				if (versions !== null && versions.length > 0) {
					for (var i = 0; i < versions.length; i++) {
						dropDownListOption = {
							text: versions[i].generation,
							value: versions[i].generation,
							additionalData: { fileName: versions[i].fileName }
						};
						dropDownListOptions.push(dropDownListOption);
					}
					this._differentVertionsSelect.bindOptions(dropDownListOptions, true);

					if (this._differentVertionsSelect.selectedValue === null) {
						this.dvStartComparison.disable(true);
					}
				} else {
					this.disableVersionArea();
				}
			},

			disableVersionArea: function () {
				this.dvStartComparison.disable(true);
				this._differentVertionsSelect.disable();
			},

			showComparisonArea: function () {
				this.compareContent.visible(true);
			},

			hideComparisonArea: function () {
				this.compareContent.visible(false);
			},

			showStartComparisonArea: function (showButtons) {
				this.buttonsContainer.visible(showButtons);
			},

			getMarkedAsDelete: function () {
				return this.fileInfoControls.FindAll('markedAsDelete', true);
			},

			startup: function () {
				if (this.fileInfoControls === null) {
					return;
				}

				var list = this.getMarkedAsDelete();
				var showComparisonButton = false;

				if (this.fileInfoControls.length >= 2 && list.length === 0) {
					this.showComparisonContent = false;
					showComparisonButton = true;
				} else if (list.length > 1) {
					this.showComparisonContent = false;
				} else {
					this.showComparisonContent = true;
				}

				if (!this.showComparisonContent) {
					this.hideComparisonArea();
				} else {
					this.showComparisonArea();
				}

				this.showStartComparisonArea(showComparisonButton);
			}
		})
	);
});
