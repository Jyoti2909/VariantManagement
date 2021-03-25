VC.Utils.Page.LoadModules(['ImageViewer']);

require(['dojo/_base/declare'], function (declare) {
	return dojo.setObject(
		'VC.SketchViewer',
		(function () {
			return declare('SketchViewer', VC.ImageViewer, {
				constructor: function (args) {
					this.type = 'sketch';
				},

				getSnapshotFileName: function () {
					const tooltipTemplate = VC.Utils.GetResource(
						'sketch_downloaded_snapshot_filename_template'
					);

					return tooltipTemplate.Format(
						VC.Utils.getItemTypeLabelbyName(this.args.markupHolderItemtypeName),
						VC.Utils.getItemNameById(
							this.args.markupHolderItemtypeName,
							this.args.markupHolderId
						)
					);
				},

				setupViewerInOutOfContextMode: function (message) {
					this.setupViewer(message);
				},

				setupViewer: function (message) {
					this.displayMarkup(message.markup.getSnapshot());
					this.setViewState(message.markup.getViewData());
				},

				OnLoaded: function () {
					this.fileUrl = null;
					this.toolbarContainer.btnView.enable(false);
				}
			});
		})()
	);
});
