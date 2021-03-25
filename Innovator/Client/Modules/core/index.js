import aml from './aml';
import copyTextToBuffer from './copyTextToBuffer';
import Dialog from './Dialog';
import intl from './intl';
import MaximazableDialog from './MaximazableDialog';
import { SyncPromise, soap } from './Soap';
import { sessionSoap, alertSoapError } from './SessionSoap';
import SvgManager from './SvgManager';
import utils from './utils';
import vaultUploader from './vaultUploader';
import xml from './Xml';
import { xmlToJson, jsonToXml } from './XmlToJson';
import { xmlToODataJson, xmlToODataJsonAsCollection } from './XmlToODataJson';
import fetch from './sessionFetch';

import Sidebar from '../components/sidebar';
import alertModule from '../components/alert';
import ContextMenu from '../components/contextMenu';
import confirmModule from '../components/confirm';
import promptModule from '../components/prompt';
import notify from '../components/notify';
import Dropdown from '../components/dropdown';
import dropdownButton from '../components/dropdownButton';
import Tabs from '../components/tabs';
import ViewersTabs from '../components/viewersTabs';
import Calendar from '../components/calendar';
import TimePicker from '../components/timePicker';
import Toolbar from '../components/toolbar';
import Form from '../components/form';
import CompatToolbar from '../components/compatToolbar';
import {
	toolbarTemplates as compatToolbarTemplates,
	toolbarFormatters as compatToolbarFormatters
} from '../components/compatToolbarTemplates';
import BaseTypeahead from '../components/baseTypeahead';
import FilterList from '../components/filterList';
import ItemProperty from '../components/itemProperty';
import ClassificationProperty from '../components/classificationProperty';
import Nav from '../components/nav/nav';
import navTemplates from '../components/nav/navTemplates';
import Menu from '../components/menu';

import { HeadWrap, RowsWrap } from '../components/grid/utils';
import Keyboard from '../components/grid/keyboard';
import GridActions from '../components/grid/actions';
import GridActionsCE from '../components/grid/hacks/ActionsCE';
import gridTemplates from '../components/grid/templates';
import GridView from '../components/grid/view';
import GridViewCE from '../components/grid/hacks/ViewCE';
import gridEditors from '../components/grid/editors';
import gridFormatters from '../components/grid/formatters';
import { extend as extendGridSorters } from '../components/grid/sorters';
import dataTypeFormatters from '../components/grid/dataTypeFormatters';
import GridSearch from '../components/grid/search';
import Grid from '../components/grid/grid';
import GridCE from '../components/grid/hacks/GridCE';

import TreeGrid from '../components/treeGrid/treeGrid';
import TreeGridActions from '../components/treeGrid/treeGridActions';
import treeGridTemplates from '../components/treeGrid/treeGridTemplates';
import TreeGridView from '../components/treeGrid/treeGridView';
import Accordion from '../components/accordion';
import Scroller from '../components/scroller';
import Switcher from '../components/switcher';
import Pagination from '../components/pagination/pagination';
import Splitter, { splitter } from '../components/splitter';

import ignoreUpdateItemTypes from '../cui/ignoreUpdateItemTypes';

gridFormatters.extend(dataTypeFormatters);

window.Toolbar = Toolbar;
window.Form = Form;
window.CompatToolbar = CompatToolbar;
window.CompatToolbar.formatters = compatToolbarFormatters;
window.CompatToolbar.toolbarTemplates = compatToolbarTemplates;
window.Pagination = Pagination;

window.BaseTypeahead = BaseTypeahead;
window.FilterList = FilterList;
window.ItemProperty = ItemProperty;
window.ClassificationProperty = ClassificationProperty;
window.Nav = Nav;
window.NavTemplates = navTemplates;

window.GridActions = GridActions;
window.Keyboard = Keyboard;
window.GridTemplates = gridTemplates;
window.HeadWrap = HeadWrap;
window.RowsWrap = RowsWrap;
window.GridView = GridView;

// Special workaround for CE Application
if (window.location.pathname.includes('Solutions/CE/scripts/Tabs')) {
	window.Grid = GridCE;
	window.GridView = GridViewCE;
	window.GridActions = GridActionsCE;
} else {
	window.Grid = Grid;
	window.GridView = GridView;
	window.GridActions = GridActions;
}

window.Grid.editors = gridEditors;
window.Grid.formatters = gridFormatters;
window.Grid.sorters = {
	extend: extendGridSorters
};
window.Grid.search = GridSearch;

window.TreeGrid = TreeGrid;
window.TreeGridActions = TreeGridActions;
window.TreeGridTemplates = treeGridTemplates;
window.TreeGridView = TreeGridView;

Dialog.alert = alertModule;
Dialog.confirm = confirmModule;
Dialog.prompt = promptModule;

window.ArasModules = window.ArasModules || {};
const core = {
	aml: aml,
	copyTextToBuffer: copyTextToBuffer,
	Dialog: Dialog,
	nativSoap: soap,
	soap: sessionSoap,
	alertSoapError: alertSoapError,
	intl: intl,
	jsonToXml: jsonToXml,
	MaximazableDialog: MaximazableDialog,
	SyncPromise: SyncPromise,
	SvgManager: SvgManager,
	utils: utils,
	vault: vaultUploader,
	xml: xml,
	xmlToJson: xmlToJson,
	ContextMenu: ContextMenu,
	splitter: splitter,
	notify: notify,
	dropdownButton: dropdownButton,
	xmlToODataJson: xmlToODataJson,
	xmlToODataJsonAsCollection: xmlToODataJsonAsCollection,
	fetch: fetch
};

const webComponents = {
	'aras-filter-list': FilterList,
	'aras-item-property': ItemProperty,
	'aras-classification-property': ClassificationProperty,
	'aras-nav': Nav,
	'aras-sidebar': Sidebar,
	'aras-toolbar': Toolbar,
	'aras-form': Form,
	'aras-accordion': Accordion,
	'aras-scroller': Scroller,
	'aras-switcher': Switcher,
	'aras-tabs': Tabs,
	'aras-viewers-tabs': ViewersTabs,
	'aras-calendar': Calendar,
	'aras-time-picker': TimePicker,
	'aras-dropdown': Dropdown,
	'aras-pagination': Pagination,
	'aras-menu': Menu,
	'aras-grid': Grid,
	'aras-tree-grid': TreeGrid,
	'aras-splitter': Splitter
};

Object.keys(webComponents).forEach(function (name) {
	if (!customElements.get(name)) {
		if ('define' in webComponents[name]) {
			webComponents[name].define(name);
		} else {
			customElements.define(name, webComponents[name]);
		}
	}
});

window.ArasModules = Object.assign(window.ArasModules, core);

window.ignoreUpdateItemTypes = ignoreUpdateItemTypes;
