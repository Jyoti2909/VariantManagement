define(['dojo/_base/declare'], function (declare) {
	return declare('VC.ThreeDTreeGridView.DVDFormHelper', null, {
		constructor: function () {},

		disableTGVDField: function (context) {
			const tgvd = context.getFieldComponentByName('tgvd');
			const document = context.document;
			if (
				document.isEditMode &&
				document.thisItem.getId() === '9A9A0650A5364D6CBD0B9B3D2174F775'
			) {
				tgvd.setDisabled(true);
			}
		}
	});
});
