import showQueryBuilderDialog from '../../aras.innovator.MacPolicy/Scripts/MACQueryBuilderEditor/showQueryBuilderDialog';
import applyQueryDefinitionToAttrDefinition from '../../aras.innovator.MacPolicy/Scripts/MACQueryBuilderEditor/applyQueryDefinitionToAttrDefinition';

const policyAccessAttrDefinitionPlugin = {
	events: [
		{
			type: 'dblclick',
			element: 'cell',
			name: 'openDialog',
			method: function (payload) {
				const [headId, rowId, event] = payload.data;
				this.gridCellDblClick(headId, rowId, event);
			}
		}
	],
	gridCellDblClick: async function (headId, rowId, event) {
		if (headId !== 'leaf_item_D') {
			return;
		}

		const attrDefinition = aras.getItemRelationship(
			window.item,
			'ac_PolicyAccessAttrDefinition',
			rowId,
			false
		);
		const appliedToId = aras.getItemProperty(
			attrDefinition,
			'defined_on_itemtype_id'
		);
		const propertyDataType = aras.getItemProperty(window.item, 'type');

		const queryDefinition = await showQueryBuilderDialog(
			rowId,
			appliedToId,
			propertyDataType
		);
		const gridComponent = this.grid;
		applyQueryDefinitionToAttrDefinition(
			attrDefinition,
			queryDefinition,
			gridComponent
		);
	}
};

export default policyAccessAttrDefinitionPlugin;
