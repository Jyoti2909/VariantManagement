const showQueryBuilderDialog = function (relId, appliedToId, propertyDataType) {
	if (!appliedToId) {
		return Promise.resolve();
	}

	const dialogParameters = {
		aras: aras,
		title: aras.getResource(
			'../Modules/aras.innovator.MacPolicy',
			'query_builder_dialog.title'
		),
		content:
			aras.getBaseURL() +
			'/Modules/aras.innovator.MacPolicy/Views/MacQueryBuilderEditor.html',
		isEditMode: window.isEditMode,
		relId: relId,
		appliedToId: appliedToId,
		propertyDataType: propertyDataType,
		dialogWidth: 700,
		dialogHeight: 500
	};

	return window.parent.ArasModules.MaximazableDialog.show(
		'iframe',
		dialogParameters
	).promise;
};

export default showQueryBuilderDialog;
