var TopWindowHelper;
(function (TopWindowHelper) {
	// Duplicated in dialog.js
	TopWindowHelper.getMostTopWindowWithAras = function (windowObj) {
		var win = windowObj ? windowObj : window;
		var prevWin = win;
		var winWithAras;
		while (win !== win.parent) {
			try {
				// Try access to any property with permission denied.
				var t = win.parent.name;
			} catch (excep) {
				break;
			}
			prevWin = win;
			win = win.parent;
			winWithAras = typeof win.aras !== 'undefined' ? win : winWithAras;
		}
		return winWithAras ? winWithAras : prevWin; // for work Innovator working in iframe case
	};
})(TopWindowHelper || (TopWindowHelper = {}));
