function ConfigurableUI(
	Utils,
	CuiDataLoader,
	CompatCuiToolbar,
	CuiShortcuts,
	CuiContextMenu,
	CuiMenu,
	CuiTooltip
) {
	function ConfigurableUI() {
		this.dataLoader = new CuiDataLoader();
		this.utils = new Utils();
		var self = this;
		this.private = {
			declare: function (fieldName, func) {
				var boundFunc = func.bind(self);
				this[fieldName] = boundFunc;
			}
		};
		if (this.super && this.super.length > 0) {
			for (var i = 0; i < this.super.length; i++) {
				var superClass = this.super[i];
				if (superClass.constructor) {
					superClass.constructor.call(this);
				}
			}
		}
	}

	ConfigurableUI.prototype.callInitHandlers = function (eventType) {
		var eventState = {};
		this.callInitHandlersForToolbar(eventState, eventType);
		this.callInitHandlersForMenu(eventState, eventType);
	};

	ConfigurableUI.prototype.super = [];
	function inherit(child, parents) {
		for (var i = 0; i < parents.length; i++) {
			var F = function () {};
			F.prototype = parents[i].prototype;
			var f = new F();
			for (var prop in child.prototype) {
				f[prop] = child.prototype[prop];
			}
			child.prototype = f;
			child.prototype.super.push(parents[i].prototype);
		}
	}

	inherit(ConfigurableUI, [
		CompatCuiToolbar,
		CuiShortcuts,
		CuiContextMenu,
		CuiMenu,
		CuiTooltip
	]);
	return ConfigurableUI;
}
window.CUI_ConfigurableUI = ConfigurableUI(
	CuiUtils,
	CuiDataLoader,
	CompatCuiToolbar,
	CuiShortcuts,
	CuiContextMenu,
	CuiMenu,
	CuiTooltip
);
