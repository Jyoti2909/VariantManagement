require(['dojo/_base/declare'], function (declare) {
	return dojo.setObject(
		'VC.ViewerSpinner',
		declare(null, {
			viewerSpinnerElement: null,
			isViewerSpinnerVisible: false,

			onAfterShowViewerSpinner: null,
			onAfterHideViewerSpinner: null,

			constructor: function () {
				this.viewerSpinnerElement = this.createViewerSpinner();
			},

			createViewerSpinner: function () {
				const loadElement = document.createElement('iframe');
				loadElement.setAttribute('class', 'ViewerSpinner');
				loadElement.setAttribute('src', '../../../scripts/spinner.html');
				loadElement.setAttribute('scrolling', 'no');

				return loadElement;
			},

			showViewerSpinner: function (parentNode) {
				if (!this.isViewerSpinnerVisible) {
					parentNode.appendChild(this.viewerSpinnerElement);
					this.isViewerSpinnerVisible = !this.isViewerSpinnerVisible;

					if (this.onAfterShowViewerSpinner) {
						this.onAfterShowViewerSpinner();
					}
				}
			},

			hideViewerSpinner: function (parentNode) {
				if (this.isViewerSpinnerVisible) {
					parentNode.removeChild(this.viewerSpinnerElement);
					this.isViewerSpinnerVisible = !this.isViewerSpinnerVisible;

					if (this.onAfterHideViewerSpinner) {
						this.onAfterHideViewerSpinner();
					}
				}
			}
		})
	);
});
