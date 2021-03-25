import CuiLayout from './CuiLayout';
import getResource from '../../core/resources';

export default class ItemViewToolbarsCuiLayout extends CuiLayout {
	async _getCuiControls() {
		return [
			{
				control_type: 'ToolbarControl',
				'location@keyed_name': 'ItemView.TitleBar',
				name: 'ItemView.TitleBar',
				additional_data: {
					cssClass: 'aras-titlebar',
					attributes: { role: 'heading', 'aria-level': '1' }
				}
			},
			{
				aria_label: getResource('aria_label.ItemView.Toolbar'),
				control_type: 'ToolbarControl',
				'location@keyed_name': 'ItemView.ItemCommandBar',
				name: 'ItemView.Toolbar',
				additional_data: {
					cssClass: 'aras-commandbar aras-commandbar_bordered'
				}
			}
		];
	}
}
