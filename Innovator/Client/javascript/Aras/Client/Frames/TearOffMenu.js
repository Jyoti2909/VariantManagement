define(['dojo/_base/declare'], function (declare) {
	return declare('Aras.Client.Frames.TearOffMenu', null, {
		controller: null,
		style: null,

		constructor: function (args) {
			this.controller = args.tearOffMenuController;
			this.contentWindow = this;
			this.style = {};

			if (!document.frames) {
				document.frames = [];
			}

			document.frames.tearoff_menu = this;

			Object.defineProperty(this, 'toolbarApplet', {
				get: function () {
					return this.controller.toolbarApplet;
				},
				set: function (value) {
					this.controller.toolbarApplet = value;
				}
			});

			Object.defineProperty(this, 'toolbar', {
				get: function () {
					return this.controller.toolbar;
				},
				set: function (value) {
					this.controller.toolbar = value;
				}
			});

			Object.defineProperty(this, 'menuApplet', {
				get: function () {
					return this.controller.menuApplet;
				},
				set: function (value) {
					this.controller.menuApplet = value;
				}
			});

			Object.defineProperty(this, 'menuFrameReady', {
				get: function () {
					return this.controller.menuFrameReady;
				},
				set: function (value) {
					this.controller.menuFrameReady = value;
				}
			});

			Object.defineProperty(this, 'activeToolbar', {
				get: function () {
					return this.controller.activeToolbar;
				},
				set: function (value) {
					this.controller.activeToolbar = value;
				}
			});

			Object.defineProperty(this, '__tabsShowStr', {
				get: function () {
					return this.controller.__tabsShowStr;
				},
				set: function (value) {
					this.controller.__tabsShowStr = value;
				}
			});

			Object.defineProperty(this, 'rm', {
				get: function () {
					return this.controller.rm;
				},
				set: function (value) {
					this.controller.rm = value;
				}
			});

			Object.defineProperty(this, 'allowPrivatePermission', {
				get: function () {
					return this.controller.allowPrivatePermission;
				},
				set: function (value) {
					this.controller.allowPrivatePermission = value;
				}
			});

			Object.defineProperty(this, 'prevLY', {
				get: function () {
					return this.controller.prevLY;
				},
				set: function (value) {
					this.controller.prevLY = value;
				}
			});

			Object.defineProperty(this, 'isMenuActivated', {
				get: function () {
					return this.controller.isMenuActivated;
				},
				set: function (value) {
					this.controller.isMenuActivated = value;
				}
			});
		},

		onPreferenceValueChanged: function (params) {
			return this.controller.onPreferenceValueChanged(params);
		},

		loadToolbar: function () {
			return this.controller.loadToolbar();
		},

		setViewMode: function () {
			return this.controller.setViewMode();
		},

		setEditMode: function () {
			return this.controller.setEditMode();
		},

		setControlEnabled: function (ctrlId, state) {
			return this.controller.setControlEnabled(ctrlId, state);
		},

		setControlState: function (ctrlId, state) {
			return this.controller.setControlState(ctrlId, state);
		},

		addActionEntry: function (name, actionId, active, bAddActionMenuLength) {
			return this.controller.addActionEntry(
				name,
				actionId,
				active,
				bAddActionMenuLength
			);
		},

		addActionSeparator: function (bAddActionMenuLength) {
			return this.controller.addActionSeparator(bAddActionMenuLength);
		},

		addReportEntry: function (name, reportId, active, bAddReportMenuLength) {
			return this.controller.addReportEntry(
				name,
				reportId,
				active,
				bAddReportMenuLength
			);
		},

		addReportSeparator: function (bAddReportMenuLength) {
			return this.controller.addReportSeparator(bAddReportMenuLength);
		},

		initToolbar: function () {
			return this.controller.showToolbar();
		},

		initMenu: function () {
			return this.controller.initMenu();
		},

		populateAccessMenuLazyStart: function (isEditMode, item) {
			return this.controller.populateAccessMenuLazyStart(isEditMode, item);
		},

		onCheckMenu: function (menuItem) {
			return this.controller.onCheckMenu(menuItem);
		},

		onClickItem: function (tbItem) {
			return this.controller.onClickItem(tbItem);
		},

		onAbout: function () {
			return this.controller.onAbout();
		},

		onClickMenuItem: function (cmdID, param) {
			return this.controller.onClickMenuItem(cmdID, param);
		},

		onShowAccess: function () {
			return this.controller.onShowAccess();
		},

		onShowHistory: function () {
			return this.controller.onShowHistory();
		},

		onShowWorkflow: function () {
			return this.controller.onShowWorkflow();
		},

		onShowLifeCycle: function () {
			return this.controller.onShowLifeCycle();
		},

		ViewAccess: function () {
			return this.controller.ViewAccess();
		},

		CreatePrivateAccess: function () {
			return this.controller.CreatePrivateAccess();
		},

		SetAllowedAccess: function (cmdID) {
			return this.controller.SetAllowedAccess(cmdID);
		},

		setEnableAccessMenu: function (isEditMode) {
			return this.controller.setEnableAccessMenu(isEditMode);
		},

		menuOnActivateHandler: function () {
			return this.controller.menuOnActivateHandler();
		}
	});
});
