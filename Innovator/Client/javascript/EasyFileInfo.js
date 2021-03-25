function EasyFileInfo(vault) {
	this._vault = vault;
}

EasyFileInfo.prototype.getFileChecksum = function EasyFileInfoGetFileChecksum(
	fileName
) {
	return this._vault.getFileChecksum(fileName);
};

EasyFileInfo.prototype.getFileSize = function EasyFileInfoGetFileSize(
	fileName
) {
	return this._vault.getFileSize(fileName);
};
