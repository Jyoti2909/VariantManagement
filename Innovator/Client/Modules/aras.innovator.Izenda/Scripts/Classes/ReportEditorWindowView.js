ModulesManager.define(
	['aras.innovator.core.ItemWindow/DefaultItemWindowView'],
	'aras.innovator.Izenda/ReportEditorWindowView',
	function (DefaultItemWindowView) {
		function ReportEditorWindowView(inDom, inArgs) {
			this.inDom = inDom;
			this.inArgs = inArgs;
		}

		ReportEditorWindowView.prototype = new DefaultItemWindowView();

		ReportEditorWindowView.prototype.getViewUrl = function () {
			return '/Modules/aras.innovator.Izenda/ReportItemEditorView';
		};

		ReportEditorWindowView.prototype.getWindowProperties = function () {
			var itemNd = this.inDom;

			var itemTypeName = itemNd.getAttribute('type');
			var scrH = screen.availHeight;
			var scrW = screen.availWidth;
			var itemTypeNd = aras.getItemTypeDictionary(itemTypeName).node;
			if (!itemTypeNd) {
				aras.AlertError(
					aras.getResource(
						'',
						'ui_methods_ex.item_type_not_found',
						itemTypeName
					)
				);
				return null;
			}

			var formH = 735;
			var formW = 1350;

			var winBorderH = window.outerHeight - window.innerHeight;
			var winBorderW = window.outerWidth - window.innerWidth;
			if (window === aras.getMainWindow()) {
				winBorderH += aras.browserHelper.getHeightDiffBetweenTearOffAndMainWindow();
			}

			//calculate window size based on a form size, window borders size and other components
			var winH = formH + winBorderH + 23; /*status bar*/
			var winW = formW + winBorderW;

			var x = (scrW - winW) / 2;
			if (x < 0) {
				x = 0;
			}
			var y = (scrH - winH) / 2;
			if (y < 0) {
				y = 0;
			}

			var result = { height: winH, width: winW, x: x, y: y };
			return result;
		};

		return ReportEditorWindowView;
	}
);
