define([], function () {
	function WidgetLoader(root) {
		this.root = root || {
			startup: function () {},
			layout: function () {}
		};

		this.sequence = [];

		this.startupsDictionary = {};
	}

	WidgetLoader.prototype.start = function () {
		return new Promise(
			function (resolve) {
				var widgetIndex;
				var widgetLength;
				var widget;
				for (
					widgetIndex = 0, widgetLength = this.sequence.length;
					widgetIndex < widgetLength;
					widgetIndex++
				) {
					widget = this.startupsDictionary[this.sequence[widgetIndex]];
					widget._started = true;
				}

				var rootWidget = this.root;
				rootWidget.startup();

				function getOnLoadedHandler(currentWidget, nextWidget) {
					return function () {
						currentWidget.onloaded = function () {};
						nextWidget.startup();
					};
				}

				if (this.sequence.length > 0) {
					for (
						widgetIndex = 0, widgetLength = this.sequence.length - 1;
						widgetIndex < widgetLength;
						widgetIndex++
					) {
						widget = this.startupsDictionary[this.sequence[widgetIndex]];
						widget.onloaded = getOnLoadedHandler(
							widget,
							this.startupsDictionary[this.sequence[widgetIndex + 1]]
						);
					}

					var lastWidget = this.startupsDictionary[
						this.sequence[this.sequence.length - 1]
					];
					lastWidget.onloaded = function () {
						lastWidget.onloaded = function () {};
						rootWidget.layout();
						resolve();
					};

					for (
						widgetIndex = 0, widgetLength = this.sequence.length;
						widgetIndex < widgetLength;
						widgetIndex++
					) {
						widget = this.startupsDictionary[this.sequence[widgetIndex]];
						widget._started = false;
					}
					var firstWidget = this.startupsDictionary[this.sequence[0]];
					firstWidget.startup();
				} else {
					rootWidget.layout();
					resolve();
				}
			}.bind(this)
		);
	};

	WidgetLoader.prototype.register = function (widget) {
		if (!widget.isLazyLoaderWidget) {
			alert(
				'Widget with id={' +
					widget.id +
					"} doesn't implement interface Aras.Client.Controls.Experimental.LazyLoaderBase"
			);
		}

		this.startupsDictionary[widget.id] = widget;
		this.sequence.push(widget.id);
	};

	return WidgetLoader;
});
