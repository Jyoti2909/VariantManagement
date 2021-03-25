ModulesManager.define(
	['aras.innovator.core.ItemWindow/DefaultItemWindowView'],
	'aras.innovator.core.ItemWindow/ContentTypeItemWindowView',
	function (DefaultItemWindowView) {
		function ContentTypeItemWindowView(inDom, inArgs) {
			this.inDom = inDom;
			this.inArgs = inArgs;
		}

		ContentTypeItemWindowView.prototype = new DefaultItemWindowView();

		// ovveride default size of window, because it's very small
		ContentTypeItemWindowView.prototype.getWindowProperties = function () {
			var result = null;
			var topWindow = window;

			var screenHeight = topWindow.screen.availHeight;
			var screenWidth = topWindow.screen.availWidth;
			var mainWindowHeight = topWindow.outerHeight;
			var mainWindowWidth = topWindow.outerWidth;
			var tempHeight;
			var tempWidth;
			var percentOfScreen =
				(mainWindowHeight * mainWindowWidth) / (screenWidth * screenHeight);

			//until the main window is more than 80% of the screen square, we calculate the size of the LifeCycle map as 80 percent of the screen size;
			tempHeight = percentOfScreen > 0.8 ? screenHeight : mainWindowHeight;
			tempWidth = percentOfScreen > 0.8 ? screenWidth : mainWindowWidth;

			var sizeTrue = tempHeight > 800 && tempWidth > 1200;
			tempHeight = sizeTrue ? tempHeight : 800; // 800*0.8= 640px
			tempWidth = sizeTrue ? tempWidth : 1200; // 1200*0.8= 960px	960*640 is default size if the main window smaller than 1200*800

			var cmfWindowHeight = tempHeight * 0.8;
			var cmfWindowWidth = tempWidth * 0.8;

			// workflowMap window will be center-aligned
			var cmfWindowTop = (screenHeight - cmfWindowHeight) / 2;
			var cmfWindowLeft = (screenWidth - cmfWindowWidth) / 2;

			result = {
				height: cmfWindowHeight,
				width: cmfWindowWidth,
				x: cmfWindowLeft,
				y: cmfWindowTop
			};
			return result;
		};

		ContentTypeItemWindowView.prototype.getWindowUrl = function () {
			return (
				aras.getBaseURL() +
				'/Modules/aras.innovator.core.ItemWindow/ContentTypeView'
			);
		};

		return ContentTypeItemWindowView;
	}
);
