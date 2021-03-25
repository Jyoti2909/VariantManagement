require(['dojo/_base/declare'], function (declare) {
	return dojo.setObject(
		'VC.Interfaces.ITContainer',
		declare(null, {
			//ViewerViewMode
			activeMode: null,
			containerName: null,

			// IButtons
			btnMarkup: null,
			btnView: null,
			btnSwitch: null,

			//IViewerToolbar
			markupToolbar: null,
			viewToolbar: null,

			onBtnMarkupClick: function () {},
			onBtnViewClick: function () {},
			onBtnSwitchClick: function () {},

			_palettes: null,

			constructor: function (parentContainerName) {
				this._createSelfContainer(parentContainerName);
			},

			createViewToolbar: function (/*string*/ toolbarTypeName) {
				throw new Error('ITContainer: createViewToolbar must be overloaded');
			},

			createMarkupToolbar: function (/*string*/ toolbarTypeName) {
				throw new Error('ITContainer: createMarkupToolbar must be overloaded');
			},

			createPallete: function (/*string*/ palleteName) {},

			hide: function () {
				throw new Error('ITContainer: hide must be overloaded');
			},

			show: function () {
				throw new Error('ITContainer: show must be overloaded');
			},

			toggleToolbar: function () {
				throw new Error('ITContainer: toggleToolbar must be overloaded');
			},

			setActiveMode: function (/*ViewerViewMode*/ mode) {
				throw new Error('ITContainer: setActiveMode must be overloaded');
			},

			refresh: function () {
				throw new Error('ITContainer: refresh must be overloaded');
			},

			palettes: function () {
				return this._palettes;
			},

			assignElementStatesTo: function (targetContainer) {
				var currentPalette = null;
				var currentTargetPalette = null;
				var paletteNames = Object.keys(this._palettes);

				targetContainer.activeMode = this.activeMode;

				switch (this.activeMode) {
					case VC.Utils.Enums.ViewerViewMode.View:
						targetContainer.btnView.select(true);
						this.viewToolbar.assignElementStatesTo(targetContainer.viewToolbar);
						break;
					case VC.Utils.Enums.ViewerViewMode.Markup:
						targetContainer.btnMarkup.select(true);
						this.markupToolbar.assignElementStatesTo(
							targetContainer.markupToolbar
						);

						for (var i = 0; i < paletteNames.length; i++) {
							currentPalette = this._palettes[paletteNames[i]];
							currentTargetPalette = targetContainer.createPalette(
								currentPalette.name
							);
							if (currentTargetPalette) {
								currentPalette.assignElementStatesTo(currentTargetPalette);
							}
						}
						break;
				}
			},

			_createSelfContainer: function (parentContainerName) {
				var selfContainer = document.createElement('div');
				var parentContainer = document.getElementById(parentContainerName);

				this.containerName = selfContainer.id =
					'ToolbarContainer' + VC.Utils.getTimestampString();
				parentContainer.appendChild(selfContainer);
			}
		})
	);
});
