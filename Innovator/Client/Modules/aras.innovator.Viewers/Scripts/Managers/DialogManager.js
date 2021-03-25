require(['dojo/_base/declare', 'dojo/aspect'], function (declare, aspect) {
	return dojo.setObject(
		'VC.DialogManager',
		declare(null, {
			dialogs: null,
			viewerType: null,
			ViewStateManager: null,
			needRestoreMeasureDialog: false,

			constructor: function () {
				VC.Utils.Page.LoadModules(['Managers/ViewStateManager']);

				this.dialogs = {};
				this.ViewStateManager = new VC.ViewStateManager();
			},

			getExistingOrNewDialog: function (dialogName, dialogParameters) {
				var dialog = this.dialogs[dialogName];

				if (dialog === undefined) {
					dialog = this._initDialog(dialogName, dialogParameters);
					this.dialogs[dialogName] = dialog;
				}

				return dialog;
			},

			getExistingDialog: function (dialogName) {
				return this.dialogs[dialogName];
			},

			getOpenedDialogs: function () {
				var openedDialogs = [];
				for (var dialog in this.dialogs) {
					if (this.dialogs[dialog].isOpened) {
						openedDialogs.push(this.dialogs[dialog]);
					}
				}
				return openedDialogs;
			},

			disableOpenedDialogs: function () {
				var openedDialogs = this.getOpenedDialogs();
				openedDialogs.forEach(function (dialog) {
					dialog.disable();
				});
			},

			enableOpenedDialogs: function () {
				var openedDialogs = this.getOpenedDialogs();
				openedDialogs.forEach(function (dialog) {
					dialog.enable();
				});
			},

			closeDialog: function (dialogName) {
				if (this.dialogs[dialogName] !== undefined) {
					this.dialogs[dialogName].hide();
				}
			},

			openDialog: function (dialogName) {
				if (this.dialogs[dialogName] !== undefined) {
					this.dialogs[dialogName].show();
				}
			},

			repositionAllDialogs: function () {
				for (var dialog in this.dialogs) {
					if (this.dialogs[dialog].reposition) {
						this.dialogs[dialog].reposition();
					}
				}
			},

			closeAllDialogsButThis: function (dialogId) {
				for (var dialog in this.dialogs) {
					if (this.dialogs[dialog].id === dialogId) {
						continue;
					}
					this.dialogs[dialog].hide();
				}
			},

			_initDialog: function (dialogName, dialogParameters) {
				var returnedDialog = {};

				switch (dialogName) {
					case VC.Utils.Enums.Dialogs.Find:
						VC.Utils.Page.LoadModules(['Widgets/FindDialog']);
						returnedDialog = new VC.Widgets.FindDialog();
						break;
					case VC.Utils.Enums.Dialogs.Measure:
						VC.Utils.Page.LoadModules(['Widgets/MeasureDialog']);
						returnedDialog = new VC.Widgets.MeasureDialog();
						break;
					case VC.Utils.Enums.Dialogs.Exploded:
						VC.Utils.Page.LoadModules(['Widgets/ExplodedDialog']);
						returnedDialog = new VC.Widgets.ExplodedDialog();
						break;
					case VC.Utils.Enums.Dialogs.CrossSection:
						VC.Utils.Page.LoadModules(['Widgets/CrossSectionDialog']);
						returnedDialog = new VC.Widgets.CrossSectionDialog(
							dialogParameters
						);
						break;
					case VC.Utils.Enums.Dialogs.ModelBrowser:
						VC.Utils.Page.LoadWidgets(['ModelBrowser/ModelBrowserPanel']);
						returnedDialog = new VC.Widgets.ModelBrowserPanel(dialogParameters);
						break;
					case VC.Utils.Enums.Dialogs.DynamicModelBrowser:
						VC.Utils.Page.LoadWidgets([
							'DynamicModelBrowser/DynamicModelBrowserPanel'
						]);
						returnedDialog = new VC.Widgets.DynamicModelBrowserPanel(
							dialogParameters
						);
						break;
					case VC.Utils.Enums.Dialogs.Layers:
						VC.Utils.Page.LoadWidgets(['LayersDialog']);
						returnedDialog = new VC.Widgets.LayersDialog(dialogParameters);
						break;
					case VC.Utils.Enums.Dialogs.Measurement:
						VC.Utils.Page.LoadWidgets(['DropDownList', 'PDFMeasureDialog']);
						returnedDialog = new VC.Widgets.PDFMeasureDialog();
						break;
					case VC.Utils.Enums.Dialogs.CompareFiles:
						VC.Utils.Page.LoadWidgets(['DropDownList', 'CompareDialog']);
						returnedDialog = new VC.Widgets.CompareDialog();
						break;
					case VC.Utils.Enums.Dialogs.Preferences:
						VC.Utils.Page.LoadWidgets(['PreferencesDialog']);
						returnedDialog = new VC.Widgets.PreferencesDialog();
						break;
					case VC.Utils.Enums.Dialogs.ComparePallete:
						VC.Utils.Page.LoadWidgets(['ComparePalleteDialog']);
						returnedDialog = new VC.Widgets.ComparePalleteDialog();
						break;
					case VC.Utils.Enums.Dialogs.DisplayStyle:
						VC.Utils.Page.LoadWidgets(['DisplayStyleDialog']);
						returnedDialog = new VC.Widgets.DisplayStyleDialog();
						break;
					default:
						throw new Error('Could not init dialog ' + dialogName);
				}

				this.bindViewStateProcessing(
					this.viewerType,
					dialogName,
					returnedDialog
				);

				return returnedDialog;
			},

			addToDialogs: function (dialogName, dialog) {
				this.bindViewStateProcessing(this.viewerType, dialogName, dialog);
				this.dialogs[dialogName] = dialog;
			},

			bindViewStateProcessing: function (viewerType, dialogName, dialog) {
				if (viewerType === null) {
					throw new Error("Viewer type of dialog manager wasn't set in viewer");
				}

				var self = this;

				aspect.after(dialog, 'onOpen', function () {
					var restoredValue = self.ViewStateManager.restoreViewStateParameter(
						viewerType +
							'.' +
							dialogName +
							'.' +
							VC.Utils.Enums.ViewStateParameters.Position
					);

					if (restoredValue !== null && restoredValue !== '') {
						dialog.position = JSON.parse(restoredValue);

						if (
							dialog.position.x > dialog.owner.clientWidth - dialog.width ||
							dialog.position.y > dialog.owner.clientHeight - dialog.height
						) {
							dialog.reposition();
						}
					}
				});

				aspect.after(dialog, 'onMoveEnd', function () {
					var storedValue = JSON.stringify(dialog.position);

					self.ViewStateManager.saveViewStateParameter(
						viewerType +
							'.' +
							dialogName +
							'.' +
							VC.Utils.Enums.ViewStateParameters.Position,
						storedValue
					);
				});
			},

			setVisibilityOfMeasureButtons: function (existMeasurements) {
				var measureDialog = this.getExistingDialog(
					VC.Utils.Enums.Dialogs.Measure
				);
				if (measureDialog) {
					var explodedDialog = this.getExistingDialog(
						VC.Utils.Enums.Dialogs.Exploded
					);
					if (explodedDialog) {
						if (explodedDialog.sliderValue > 0) {
							measureDialog.disableButtons();
						} else {
							measureDialog.enableButtons(existMeasurements);
						}
					}
				}
			}
		})
	);
});
