ModulesManager.define(
	['aras.innovator.core.ItemWindow/DefaultItemWindowView'],
	'aras.innovator.core.ItemWindow/LifeCycleItemWindowView',
	function (DefaultItemWindowView) {
		function LifeCycleItemWindowView(inDom, inArgs) {
			this.inDom = inDom;
			this.inArgs = inArgs;
		}

		LifeCycleItemWindowView.prototype = new DefaultItemWindowView();

		LifeCycleItemWindowView.prototype.getWindowProperties = function () {
			var result = null;
			var topWindow = window;

			var screenHeight = topWindow.screen.availHeight;
			var screenWidth = topWindow.screen.availWidth;
			var mainWindowHeight = topWindow.outerHeight;
			var mainWindowWidth = topWindow.outerWidth;
			var tempHeight;
			var tempWidth;

			tempHeight = mainWindowHeight * 0.8;
			tempWidth = mainWindowWidth * 0.8;

			sizeTrue = tempHeight > 800 && tempWidth > 1200;
			tempHeight = sizeTrue ? tempHeight : 800; // 800*0.8= 640px
			tempWidth = sizeTrue ? tempWidth : 1200; // 1200*0.8= 960px	960*640 is default size if the main window smaller than 1200*800

			var LCMapWindowHeight = tempHeight * 0.8;
			var LCMapWindowWidth = tempWidth * 0.8;

			// window will be center-aligned
			var LCMapWindowTop = (screenHeight - LCMapWindowHeight) / 2;
			var LCMapWindowLeft = (screenWidth - LCMapWindowWidth) / 2;

			result = {
				height: LCMapWindowHeight,
				width: LCMapWindowWidth,
				x: LCMapWindowLeft,
				y: LCMapWindowTop
			};
			return result;
		};

		LifeCycleItemWindowView.prototype.getWindowUrl = function () {
			var result;
			var arasObj = aras;

			result =
				arasObj.getBaseURL() +
				'/Modules/aras.innovator.core.ItemWindow/lifecycleView';
			return result;
		};

		return LifeCycleItemWindowView;
	}
);
