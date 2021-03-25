ModulesManager.define(
	['aras.innovator.core.ItemWindow/DefaultItemWindowView'],
	'aras.innovator.core.ItemWindow/WorkflowItemWindowView',
	function (DefaultItemWindowView) {
		function WorkflowItemWindowView(inDom, inArgs) {
			this.inDom = inDom;
			this.inArgs = inArgs;
		}

		WorkflowItemWindowView.prototype = new DefaultItemWindowView();

		WorkflowItemWindowView.prototype.getWindowProperties = function () {
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

			sizeTrue = tempHeight > 800 && tempWidth > 1200;
			tempHeight = sizeTrue ? tempHeight : 800; // 800*0.8= 640px
			tempWidth = sizeTrue ? tempWidth : 1200; // 1200*0.8= 960px	960*640 is default size if the main window smaller than 1200*800

			var WFMapWindowHeight = tempHeight * 0.8;
			var WFMapWindowWidth = tempWidth * 0.8;

			// workflowMap window will be center-aligned
			var WFMapWindowTop = (screenHeight - WFMapWindowHeight) / 2;
			var WFMapWindowLeft = (screenWidth - WFMapWindowWidth) / 2;

			result = {
				height: WFMapWindowHeight,
				width: WFMapWindowWidth,
				x: WFMapWindowLeft,
				y: WFMapWindowTop
			};
			return result;
		};

		WorkflowItemWindowView.prototype.getWindowUrl = function () {
			var arasObj = aras;
			return (
				arasObj.getBaseURL() +
				'/Modules/aras.innovator.core.ItemWindow/workflowView'
			);
		};

		return WorkflowItemWindowView;
	}
);
