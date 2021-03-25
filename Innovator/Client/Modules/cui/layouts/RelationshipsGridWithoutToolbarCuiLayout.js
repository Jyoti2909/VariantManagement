import RelationshipsGridCuiLayout from './RelationshipsGridCuiLayout';

export default class RelationshipsGridWithoutToolbarCuiLayout extends RelationshipsGridCuiLayout {
	async _getCuiControls() {
		return [];
	}
}
