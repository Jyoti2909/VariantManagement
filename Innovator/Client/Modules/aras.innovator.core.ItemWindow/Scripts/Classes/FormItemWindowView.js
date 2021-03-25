ModulesManager.define(
	['aras.innovator.core.ItemWindow/DefaultItemWindowView'],
	'aras.innovator.core.ItemWindow/FormItemWindowView',
	function (DefaultItemWindowView) {
		function FormItemWindowView(inDom, inArgs) {
			this.inDom = inDom;
			this.inArgs = inArgs;
		}

		FormItemWindowView.prototype = new DefaultItemWindowView();

		FormItemWindowView.prototype.getWindowProperties = function () {
			var result;
			var topWindow = window;

			var screenHeight = topWindow.screen.availHeight;
			var screenWidth = topWindow.screen.availWidth;
			var mainWindowHeight = topWindow.outerHeight;
			var mainWindowWidth = topWindow.outerWidth;

			var sizeTrue = mainWindowHeight > 800 && mainWindowWidth > 1200;
			var tempHeight = sizeTrue ? screenHeight : 800; // 800*0.8= 640px
			var tempWidth = sizeTrue ? screenWidth : 1200; // 1200*0.8= 960px	960*640 is default size if the main window smaller than 1200*800

			var FormWindowHeight = tempHeight * 0.8;
			var FormWindowWidth = tempWidth * 0.8;

			// workflowMap window will be center-aligned
			var FormWindowTop = (screenHeight - FormWindowHeight) / 2;
			var FormWindowLeft = (screenWidth - FormWindowWidth) / 2;

			result = {
				height: FormWindowHeight,
				width: FormWindowWidth,
				x: FormWindowLeft,
				y: FormWindowTop
			};
			return result;
		};

		FormItemWindowView.prototype.getWindowUrl = function () {
			var result;
			var arasObj = aras;

			result =
				arasObj.getBaseURL() +
				'/Modules/aras.innovator.core.ItemWindow/formView';
			return result;
		};

		return FormItemWindowView;
	}
);
