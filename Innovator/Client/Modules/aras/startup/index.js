/* eslint-disable no-unused-vars */
import HeaderTabs from './headerTabs';
import NavigationPanel from '../../NavigationPanel/NavigationPanel';
import UserNotificationsContainer from './userNotifications';
import FavoritesManager from '../FavoritesManager';
import mainPageEventHandlers from './mainPageEventHandlers';

window.mainPageEventHandlers = mainPageEventHandlers;
window.UserNotificationContainer = UserNotificationsContainer;
window.FavoritesManager = FavoritesManager;
HeaderTabs.define('aras-header-tabs');
