function Path() {}
Path.lastException = '';

Path.combinePath = function (dirPath, fileName) {
	var result = '';

	if (this.isMac()) {
		if (this.isValidFileName(fileName)) {
			result = dirPath + '/' + fileName;
		} else {
			throw this.lastException;
		}
	} else if (this.isWindows()) {
		if (this.isValidFileName(fileName)) {
			result = dirPath + '\\' + fileName;
		} else {
			throw this.lastException;
		}
	}
	return result;
};

Path.isValidFileName = function (filename) {
	if (this.isWindows()) {
		var cannotStartWithDotRegEx = /^\./;
		if (cannotStartWithDotRegEx.test(filename)) {
			this.lastException = 'File name cannot start with dot: ' + filename;
			return false;
		}

		var winReservedNamesRegEx = /^(con|prn|aux|nul|com[0-9]|lpt[0-9]|)(\.|$)/i;
		if (winReservedNamesRegEx.test(filename)) {
			this.lastException = 'File name is reserved by OS: ' + filename;
			return false;
		}

		/*
			The following reserved characters:
			< (less than)
			> (greater than)
			: (colon)
			" (double quote)
			/ (forward slash)
			\ (backslash)
			| (vertical bar or pipe)
			? (question mark)
			* (asterisk)
		*/
		var reservedCharactersRegEx = /^[^\\/:\*\?"<>\|]{0,255}$/;
		if (!reservedCharactersRegEx.test(filename)) {
			this.lastException =
				'Invalid file name for ' + navigator.platform + ' OS: ' + filename;
			return false;
		}

		return true;
	} else if (this.isMac()) {
		var fileExp = /^([^:]){1,255}$/;
		if (fileExp.test(filename)) {
			return true;
		} else {
			this.lastException =
				'invalid file name for ' + navigator.platform + ' OS: ' + filename;
			return false;
		}
	}
};

Path.isMac = function () {
	/*
	Mac - Macintosh
	Win -Windows
	X11 -Unix
	*/
	var regExp = /^Mac/;
	if (regExp.test(navigator.platform)) {
		return true;
	} else {
		return false;
	}
};

Path.isWindows = function () {
	var regExp = /^Win/;
	if (regExp.test(navigator.platform)) {
		return true;
	} else {
		return false;
	}
};

Path.isMacPath = function (path) {
	var pathExp = /^(\/{1}[^:]{0,255}[^\:\/]{1})$/;
	if (pathExp.test(path)) {
		return true;
	} else {
		return false;
	}
};

Path.isWinPath = function (path) {
	var pathExp = /^[a-zA-Z]{1}:((\\[^:<>\\\/\?\*\|\"\^\s]){1}[^:<>\\\/\?\*\|\"\^]{0,255})*$/;
	if (pathExp.test(path)) {
		return true;
	} else {
		return false;
	}
};

Path.isValidFilePath = function (path) {
	if (this.isMac()) {
		if (this.isMacPath(path)) {
			return true;
		} else {
			return false;
		}
	} else if (this.isWindows()) {
		if (this.isWinPath(path)) {
			return true;
		} else {
			return false;
		}
	} else {
		return false;
	}
};

Path.getInvalidFileNameChars = function () {
	var result = [];
	if (this.isMac()) {
		result.push(':');
	} else if (this.isWindows()) {
		result.push(':');
		result.push('\\');
		result.push('/');
		result.push('?');
		result.push('^');
		result.push('"');
		result.push('*');
		result.push('>');
		result.push('<');
		result.push('|');
	}
	return result;
};

Path.getFileName = function (filePath) {
	if (filePath) {
		var pathSeparator = Path.isWindows() ? '\\' : '/';
		return filePath.substring(
			filePath.lastIndexOf(pathSeparator) + 1,
			filePath.length
		);
	}
};

Path.getDirectoryName = function (filePath) {
	if (filePath) {
		var pathSeparator = Path.isWindows() ? '\\' : '/';
		return filePath.substring(0, filePath.lastIndexOf(pathSeparator) + 1);
	}
};
