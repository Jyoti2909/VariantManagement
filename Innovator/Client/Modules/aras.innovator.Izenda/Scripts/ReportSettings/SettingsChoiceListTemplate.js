let SettingsChoiceControl;
var returnValue; //return value for callback

window.onload = function onLoadHandler() {
	const argsWindow = window.frameElement.dialogArguments;
	const treeId = argsWindow.treeId;
	const allItems = argsWindow.items;
	const isProps = argsWindow.type === 'excluded_properties';
	returnValue = argsWindow.forced || [];

	let leftTreeControl;
	let rightTreeControl;
	let leftSearch;
	let rightSearch;

	function setLabel(id, pos) {
		const labelItem = document.getElementById(id);
		if (labelItem) {
			labelItem.innerHTML = argsWindow.labels[pos];
		}
	}

	//0 - left side, 1 - right side
	setLabel('left_title', 0);
	setLabel('right_title', 1);
	setupTree();

	function setupTree() {
		createTreeControl();

		function createTreeControl() {
			clientControlsFactory.createControl(
				'Aras.Client.Controls.Public.TreeGridContainer',
				{ id: treeId + '_left', connectId: 'left_tree' },
				function (leftControl) {
					leftTreeControl = leftControl;

					clientControlsFactory.createControl(
						'Aras.Client.Controls.Public.TreeGridContainer',
						{ id: treeId + '_right', connectId: 'right_tree' },
						function (rightControl) {
							rightTreeControl = rightControl;

							leftSearch = new Izenda.UI.Tree.Search({
								control: leftTreeControl,
								id: 'left_searchBox'
							});
							leftSearch.setEvents('left_searchBox', 'searchBtn_left');

							rightSearch = new Izenda.UI.Tree.Search({
								control: rightTreeControl,
								id: 'right_searchBox'
							});
							rightSearch.setEvents('right_searchBox', 'searchBtn_right');

							SettingsChoiceControl = new Izenda.UI.SettingsChoiceControl({
								leftTreeControl: leftTreeControl,
								rightTreeControl: rightTreeControl,
								leftSearch: leftSearch,
								rightSearch: rightSearch,
								allItems: allItems,
								isProps: isProps,
								returnValue: returnValue
							});

							require(['dojo/query'], function (query) {
								const moveRight = {
									id: 'moveRight',
									onClick: isProps
										? SettingsChoiceControl.onMoveRightClick
										: SettingsChoiceControl.onMoveRightClickItemsOnly
								};
								const moveLeft = {
									id: 'moveLeft',
									onClick: isProps
										? SettingsChoiceControl.onMoveLeftClick
										: SettingsChoiceControl.onMoveLeftClickItemsOnly
								};

								query('#move_right').on('click', moveRight.onClick);
								query('#move_left').on('click', moveLeft.onClick);
							});

							if (isProps) {
								clientControlsFactory.on(leftTreeControl, {
									onGetChildren_Experimental:
										SettingsChoiceControl.onGetLeftChildren
								});
								clientControlsFactory.on(rightTreeControl, {
									onGetChildren_Experimental:
										SettingsChoiceControl.onGetRightChildren
								});
							}
							SettingsChoiceControl.initializeLeftTree(leftTreeControl);
							SettingsChoiceControl.initializeRightTree(rightTreeControl);
						}
					);
				}
			);
		}
	}
};

//call from Izenda.UI.Tree.Search
function initializeTree(tree, fromSearch) {
	if (tree.connectId === 'left_tree') {
		SettingsChoiceControl.initializeLeftTree(tree, '', fromSearch);
	} else {
		SettingsChoiceControl.initializeRightTree(tree, '', fromSearch);
	}
}
