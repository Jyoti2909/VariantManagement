ModulesManager.define(
	[],
	'aras.innovator.core.ItemWindow/DefaultItemWindowCreator',
	function () {
		function DefaultItemWindowCreator(view) {
			this.view = view;
			this._windowReadyObject = new Promise(
				function (resolve) {
					this._windowReadyObjectResolve = resolve;
				}.bind(this)
			);
		}

		DefaultItemWindowCreator.prototype = {};

		DefaultItemWindowCreator.prototype.CreateWindow = function () {
			var arasObj = aras;
			var itemID = this.itemId || this.view.inDom.getAttribute('id');

			var win = arasObj.uiFindAndSetFocusWindowEx(itemID);
			if (win !== null) {
				this._windowReadyObjectResolve(win);
				return null;
			}

			var winProperties = this.view.getWindowProperties();
			var params =
				'width=1,height=1,top=' +
				winProperties.y +
				',left=' +
				winProperties.x +
				',scrollbars=yes,resizable=yes,status=no';
			params += ',isOpenInTearOff=' + this.view.inArgs.isOpenInTearOff;
			params += ',isUnfocused=' + this.view.inArgs.isUnfocused;
			win = arasObj.uiOpenWindowEx(itemID, params);

			if (win === null) {
				return null;
			}

			try {
				var maxWindowHeight = screen.availHeight;
				win.resizeTo(
					winProperties.width,
					winProperties.height > maxWindowHeight
						? maxWindowHeight
						: winProperties.height
				);
				win.formHeight = winProperties.formHeight;
				win.formWidth = winProperties.formWidth;
			} catch (excep) {}

			arasObj.uiRegWindowEx(itemID, win);

			return win;
		};

		DefaultItemWindowCreator.prototype.SetArguments = function (win) {
			var arasObj = aras;
			var winArguments = this.view.getWindowArguments();
			winArguments.formHeight = win.formHeight;
			winArguments.formWidth = win.formWidth;

			win.itemTypeName = winArguments.itemTypeName;
			win.isEditMode = winArguments.isEditMode;

			var paramVarName = 'opener.' + win.name + '_params';
			/* jshint ignore:start */
			eval(
				'win.' +
					paramVarName +
					' = winArguments;var winParams = win.' +
					paramVarName +
					';'
			);
			/* jshint ignore:end */
			winParams.isTearOff = true;
			winParams.aras = arasObj;
			winParams.windowReadyObjectResolve = this._windowReadyObjectResolve;
		};

		DefaultItemWindowCreator.prototype.SetLocation = function (win) {
			var winLocation = this.view.getWindowUrl(win.formHeight);
			win.location = winLocation;
		};

		DefaultItemWindowCreator.prototype.ShowView = function () {
			var win = this.CreateWindow();

			if (!win) {
				return this._windowReadyObject;
			}

			this.SetArguments(win);
			this.SetLocation(win);

			return this._windowReadyObject;
		};

		DefaultItemWindowCreator.prototype.SetWindowId = function (windowId) {
			this.itemId = windowId;
		};

		return DefaultItemWindowCreator;
	}
);
