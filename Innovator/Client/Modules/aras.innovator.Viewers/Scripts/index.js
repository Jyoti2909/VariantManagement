import Dialog from '../../core/Dialog';
import preferencesModule from './Widgets/Dialogs/preferences';

window.ViewerModules = window.ViewerModules || {};
Dialog.preferences = preferencesModule;
const dialogs = {
	Dialog: Dialog
};

window.ViewerModules = Object.assign(window.ViewerModules, dialogs);
