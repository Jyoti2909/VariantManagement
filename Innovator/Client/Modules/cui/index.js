import CuiLayout from './layouts/CuiLayout';
import cuiToc from './cuiToc';
import cuiToolbar from './cuiToolbar';
import cuiItemViewTabs from '../cui/cuiItemViewTabs';
import cuiContextMenu from './cuiContextMenu';
import CuiObserver from './CuiObserver';
import RelationshipsGridCuiLayout from './layouts/RelationshipsGridCuiLayout';
import SearchViewCuiLayout from './layouts/SearchViewCuiLayout';
import ItemViewCuiLayout from './layouts/ItemViewCuiLayout';
import cuiGrid from './cuiGrid';
import SearchDialogCuiLayout from './layouts/SearchDialogCuiLayout';
import ItemViewToolbarsCuiLayout from './layouts/ItemViewToolbarsCuiLayout';
import { adaptGridRowsFromXml, adaptGridRowFromStore } from './adaptGridRows';
import itemTypeGridPlugin from './plugins/itemTypeGridPlugin';
import cuiGridPluginsFactory from './cuiGridPluginsFactory';
import relatedItemTypeGridPlugin from './plugins/relatedItemTypeGridPlugin';
import searchDialogGridPlugin from './plugins/searchDialogGridPlugin';
import RelationshipsGridWithoutToolbarCuiLayout from './layouts/RelationshipsGridWithoutToolbarCuiLayout';

window.CuiLayout = CuiLayout;
window.cuiToc = cuiToc;
window.cuiToolbar = cuiToolbar;
window.cuiItemViewTabs = cuiItemViewTabs;
window.cuiContextMenu = cuiContextMenu;
window.cuiGrid = cuiGrid;
window.cuiGridPluginsFactory = cuiGridPluginsFactory;
window.cuiGridPlugins = {
	itemTypeGridPlugin,
	relatedItemTypeGridPlugin,
	searchDialogGridPlugin
};
window.CuiObserver = CuiObserver;
window.RelationshipsGridCuiLayout = RelationshipsGridCuiLayout;
window.RelationshipsGridWithoutToolbarCuiLayout = RelationshipsGridWithoutToolbarCuiLayout;
window.SearchViewCuiLayout = SearchViewCuiLayout;
window.SearchDialogCuiLayout = SearchDialogCuiLayout;
window.ItemViewToolbarsCuiLayout = ItemViewToolbarsCuiLayout;
window.ItemViewCuiLayout = ItemViewCuiLayout;
window.adaptGridRowsFromXml = adaptGridRowsFromXml;
window.adaptGridRowFromStore = adaptGridRowFromStore;
