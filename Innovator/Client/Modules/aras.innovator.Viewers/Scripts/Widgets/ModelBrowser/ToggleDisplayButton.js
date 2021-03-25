VC.Utils.Page.LoadModules(['Controls/mtButton']);

require(['dojo/_base/declare', 'dojo/_base/lang', 'dojo/on'], function (
	declare,
	lang,
	on
) {
	var ToggleDisplayStates = { Shown: 'show', Hidden: 'hidden' };

	return dojo.setObject(
		'VC.Widgets.ToggleDisplayButton',
		declare(VC.UI.mtButton, {
			treeNodeId: null,
			showStateTitle: null,
			hideStateTitle: null,

			_state: null,

			onShowPart: function (treeNodeId) {},
			onHidePart: function (treeNodeId) {},
			onAfterShow: function () {},
			onAfterHide: function () {},

			constructor: function (args, srcNodeRef) {
				Object.defineProperty(this, 'isVisible', {
					get: function () {
						return !this.IsDisable;
					}
				});

				Object.defineProperty(this, 'state', {
					get: function () {
						return this._state;
					},
					set: function (value) {
						this._state = value;
					}
				});
			},

			postCreate: function () {
				this.inherited(arguments);
				this.state = ToggleDisplayStates.Shown;
				this.domNode
					.getElementsByTagName('div')[0]
					.setAttribute(
						'title',
						VC.Utils.GetResource('toggleDisplayButtonTitle')
					);
			},

			_onClick: function (event) {
				this.onClick();
				this.onInnerClick();

				switch (this.state) {
					case ToggleDisplayStates.Shown:
						this.hidePart();
						break;
					case ToggleDisplayStates.Hidden:
						this.showPart();
						break;
				}
			},

			_onAfterShow: function () {
				this.onAfterShow();
			},

			_onAfterHide: function () {
				this.onAfterHide();
			},

			showPart: function () {
				if (this.state !== ToggleDisplayStates.Shown) {
					this.onShowPart(this.treeNodeId);
					this.Enable();
					this._onAfterShow();
				}
			},

			hidePart: function () {
				if (this.state !== ToggleDisplayStates.Hidden) {
					this.onHidePart(this.treeNodeId);
					this.Disable();
					this._onAfterHide();
				}
			},

			Disable: function () {
				this.inherited(arguments);
				this.state = ToggleDisplayStates.Hidden;
			},

			Enable: function () {
				this.inherited(arguments);
				this.state = ToggleDisplayStates.Shown;
			},

			show: function () {
				this.domNode.style.display = 'inline-block';
			},

			hide: function () {
				this.domNode.style.display = 'none';
			}
		})
	);
});
