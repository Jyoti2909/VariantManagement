const searchDialogGridPlugin = {
	events: [
		{
			type: 'dblclick',
			element: 'cell',
			name: 'onRowDblClick',
			method(payload) {
				payload.break();
				const [, rowId] = payload.data;

				window.exit(rowId, 'doubleclick');
			}
		}
	]
};

export default searchDialogGridPlugin;
