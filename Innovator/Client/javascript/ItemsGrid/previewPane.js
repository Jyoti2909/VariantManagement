var previewPane = (function () {
	var previewPaneType = null;
	var lastItemId = null;

	function hideProperties() {
		if (document.querySelector('#formpreview_container')) {
			var elem = document.getElementById('itemProperties');
			elem.classList.add('hideImportant');
		}
	}

	function hideForm() {
		if (document.querySelector('#formpreview_container')) {
			document.getElementById('formpreview_container').style.display = 'none';
			document.getElementById('formpreview_splitter').style.display = 'none';
			document.getElementById('formpreview_container').style.height = '0';
			document.getElementById('gridTD').style.height = 'calc(100% - 46px)';
			document.getElementById('grid_container').style.height = '100%';
		}
		lastItemId = null;
	}
	var showTypeFunctions = {
		Form: function () {
			hideProperties();
			var frame = document.getElementById('formpreview_container');
			if (frame) {
				frame.style.display = 'block';
				document.getElementById('formpreview_splitter').style.display = 'block';
				document.getElementById('grid_container').style.height =
					document.body.offsetHeight / 2 + 'px';

				var iframe = document.querySelector('#formpreview_container iframe');
				if (!iframe.src) {
					iframe.addEventListener('load', function listener() {
						iframe.contentWindow.formPreview.errorMessage = aras.getResource(
							'',
							'itemsgrid.error_open_form_preview'
						);
						iframe.contentWindow.formPreview.defaultMessage = aras.getResource(
							'',
							'itemsgrid.no_preview_available'
						);
						iframe.contentWindow.formPreview.clearForm();
						iframe.removeEventListener('load', listener);
					});
					iframe.src = '../Modules/formPreview/formPreview.html';
				}
			}

			if (document.querySelector('#formpreview_container')) {
				var selectItems = grid.getSelectedItemIDs();
				if (selectItems && selectItems[selectItems.length - 1]) {
					onClickRow(selectItems[selectItems.length - 1]);
				}
			}
		},
		Properties: function () {
			hideForm();
			if (document.getElementById('itemProperties')) {
				var elem = document.getElementById('itemProperties');
				elem.classList.remove('hideImportant');
			}
		},
		Off: function () {
			hideForm();
			hideProperties();
		}
	};

	return {
		getType: function () {
			return previewPaneType;
		},

		setType: function (newPreviewPaneType) {
			if (showTypeFunctions[newPreviewPaneType]) {
				previewPaneType = newPreviewPaneType;
				showTypeFunctions[newPreviewPaneType]();
			}
		},

		showFormByItemId: function (itemId, itemTypeName) {
			if (
				!itemTypeName ||
				!itemId ||
				itemId === lastItemId ||
				!document.querySelector('#formpreview_container')
			) {
				return;
			}
			lastItemId = itemId;
			var formFrame = document.querySelector('#formpreview_container iframe');
			if (formFrame && formFrame.contentWindow.formPreview) {
				formFrame.contentWindow.formPreview.showItem(
					itemTypeName,
					itemId,
					aras
				);
			} else if (formFrame) {
				lastItemId = null;
				formFrame.addEventListener(
					'load',
					function listener() {
						formFrame.removeEventListener('load', listener);
						this.showFormByItemId(itemId, itemTypeName);
					}.bind(this)
				);
			}
		},

		clearForm: function (itemId) {
			if (itemId && itemId !== lastItemId) {
				return;
			}
			var formFrame = document.querySelector('#formpreview_container iframe');
			if (
				formFrame &&
				formFrame.contentWindow &&
				formFrame.contentWindow.formPreview
			) {
				formFrame.contentWindow.formPreview.clearForm();
			}
		},

		updateForm: function (itemId, itemTypeName) {
			if (itemId === lastItemId) {
				var formFrame = document.querySelector('#formpreview_container iframe');
				if (formFrame && formFrame.contentWindow.formPreview) {
					formFrame.contentWindow.formPreview.showItem(
						itemTypeName,
						itemId,
						aras
					);
				}
			}
		}
	};
})();
