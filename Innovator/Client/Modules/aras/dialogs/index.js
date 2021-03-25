import polySources from './polySources';
import multiLingual from './multiLingual';
import changePassword from './changePassword';
import activationError from './activationError';
import activationSuccessful from './activationSuccessful';
import about from './about';
import datePicker from './datePicker';

const dialogs = {
	about,
	polySources,
	multiLingual,
	changePassword,
	activationError,
	activationSuccessful,
	datePicker
};

((externalParent) => {
	externalParent.Dialogs = externalParent.Dialogs || {};
	Object.assign(externalParent.Dialogs, dialogs);
	window.ArasCore = window.ArasCore || externalParent;
})(window.ArasCore || {});
