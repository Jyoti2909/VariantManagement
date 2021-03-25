// © Copyright by Aras Corporation, 2011-2013
const MethodCompatibilityMode = function (
	currentServerVersion,
	currentClientRevision,
	arasObj
) {
	var serverVersion = currentServerVersion.substring(
		0,
		currentServerVersion.lastIndexOf('.')
	);
	var clientVersion = currentClientRevision.substring(
		0,
		currentClientRevision.lastIndexOf('.')
	);
	if (clientVersion !== serverVersion) {
		throw new Error(
			1,
			arasObj.getResource('', 'sp_functions.incompatible_functions')
		);
	}
};
