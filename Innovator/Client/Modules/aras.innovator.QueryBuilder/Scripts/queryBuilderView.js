var baseSave = window.onSaveCommand;
var baseLock = window.onLockCommand;
var baseUnlock = window.onUnlockCommand;

window.onSaveCommand = function () {
	var thisItem = getThisItem();
	if (thisItem.getAction() === 'add') {
		if (!aras.checkItem(thisItem.node)) {
			return;
		}
		if (!setAlias()) {
			return;
		}
	}
	return baseSave().then(function (res) {
		reload();
		return true;
	});
};

window.onLockCommand = function (lockOptions) {
	var baseLockResult = baseLock(lockOptions);
	reload();
	return baseLockResult;
};

window.onUnlockCommand = function (saveChanges) {
	var baseUnlockResult = baseUnlock(saveChanges);
	reload();
	return baseUnlockResult;
};

onload = function () {
	onloadHandler();
};
