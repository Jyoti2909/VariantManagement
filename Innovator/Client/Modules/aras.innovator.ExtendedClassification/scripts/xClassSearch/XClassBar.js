function XClassBar(itemTypeName, xClassBarNode, relationshipItemTypeName) {
	this.itemTypeName = itemTypeName;
	this.container = xClassBarNode;
	if (relationshipItemTypeName) {
		this.relationshipItemTypeName = relationshipItemTypeName;
	}
}

XClassBar.prototype.toggle = function () {
	if (!this.container) {
		return;
	}
	this.container.classList.toggle('hidden');
};

XClassBar.prototype.updateXClassBar = function (itemId, relationshipItemId) {
	const showBar =
		this.container && !this.container.classList.contains('hidden');
	if (
		!showBar ||
		(this.previousSelect.itemId === itemId &&
			this.previousSelect.relationshipItemId === relationshipItemId)
	) {
		return;
	}

	const relationshipIdPrefix = 'R_';
	const relationshipNamePrefix = '[R]';

	let xClasses = [];
	let aml =
		'<AML>' +
		'<Item type="xClassifiableItem_xClass" action="get" select="itemtype,related_id(name, label)">' +
		'<OR>';
	let needToDoRequest = false;

	const dataArr = [
		{
			xTrees: columnSelectionControl.xClassTrees,
			itemId: itemId,
			itemTypeName: this.itemTypeName,
			isRelationship: false
		},
		{
			xTrees: columnSelectionControl.relationshipsXClassTrees,
			itemId: relationshipItemId,
			itemTypeName: this.relationshipItemTypeName,
			isRelationship: true
		}
	];

	let relItemTypeXClassName;
	dataArr.forEach(function (data) {
		if (
			data.xTrees &&
			data.xTrees.length > 0 &&
			data.itemId &&
			data.itemTypeName
		) {
			if (data.isRelationship) {
				relItemTypeXClassName = data.itemTypeName + '_xClass';
			}
			needToDoRequest = true;
			aml +=
				'<AND>' +
				'<itemtype condition="in" by="id">' +
				'<Item type="ItemType" action="get">' +
				'<name>' +
				data.itemTypeName +
				'_xClass</name>' +
				'</Item>' +
				'</itemtype>' +
				'<source_id>' +
				data.itemId +
				'</source_id>' +
				'</AND>';
		}
	});

	aml += '</OR>' + '</Item>' + '</AML>';

	if (needToDoRequest) {
		const relItemTypeXClassId = relItemTypeXClassName
			? aras.getItemTypeId(relItemTypeXClassName)
			: null;
		const responseItem = aras.IomInnovator.applyAML(aml);
		const xClassifiableItemXClassNodes = ArasModules.xml.selectNodes(
			responseItem.dom,
			aras.XPathResult() + '/Item[@type="xClassifiableItem_xClass"]'
		);
		xClasses = xClassifiableItemXClassNodes.map(function (
			xClassifiableItemXClass
		) {
			const isRelationship =
				relItemTypeXClassId &&
				relItemTypeXClassId ===
					aras.getItemProperty(xClassifiableItemXClass, 'itemtype');
			const xClass = ArasModules.xml.selectSingleNode(
				xClassifiableItemXClass,
				'related_id/Item[@type="xClass"]'
			);
			let name =
				aras.getItemProperty(xClass, 'label') ||
				aras.getItemProperty(xClass, 'name');
			let id = aras.getItemProperty(xClass, 'id');
			if (isRelationship) {
				name = relationshipNamePrefix + ' ' + name;
				id = relationshipIdPrefix + id;
			}
			return {
				name: name,
				id: id
			};
		});
	}

	this.setVisibleXClasses(xClasses);
	this.previousSelect = {
		itemId: itemId,
		relationshipItemId: relationshipItemId
	};
};

XClassBar.prototype.setVisibleXClasses = function (xClasses) {
	if (!this.container) {
		return;
	}
	this.clear();
	let xml =
		'<?xml version="1.0" encoding="utf-8"?>' +
		'<toolbarapplet buttonsize="26,25">' +
		'<toolbar id="xclassbar">';
	xClasses.forEach(function (xClass) {
		xml += '<text id="' + xClass.id + '" value="' + xClass.name + '" />';
	});
	xml += '</toolbar>' + '</toolbarapplet>';

	this.toolbar.loadToolbarFromStr(xml);
	this.toolbar.show();
};

XClassBar.prototype.clear = function () {
	if (this.toolbar && this.toolbar._toolbar) {
		this.toolbar._toolbar.destroy();
		this.toolbar._toolbar = null;
	}
};

XClassBar.prototype.setQueryText = function (criteriaTextHtml) {
	const criteriaTextNode = this.criteriaPane.querySelector('.criteria-text');
	if (criteriaTextNode.firstChild) {
		criteriaTextNode.removeChild(criteriaTextNode.firstChild);
	}

	const textContainer = document.createElement('span');
	criteriaTextNode.appendChild(textContainer);
	textContainer.innerHTML = criteriaTextHtml;
	if (criteriaTextHtml) {
		criteriaTextNode.setAttribute(
			'title',
			criteriaTextHtml.replace(/<mark>/g, '').replace(/<\/mark>/g, '')
		);
	}
	this.criteriaContainer.classList.toggle(
		'xclass-bar__container-hidden',
		!criteriaTextHtml
	);
};

Object.defineProperty(XClassBar.prototype, 'container', {
	get: function () {
		return this.htmlBlock;
	},
	set: function (container) {
		this.clear();
		container.innerHTML = '';
		this.previousSelect = {};
		this.htmlBlock = container;

		this.criteriaContainer = document.createElement('div');
		this.criteriaContainer.id = 'xClassCriteriaContainer';
		this.criteriaContainer.classList.add('xclass-bar__container');
		this.criteriaPane = document.createElement('div');
		this.criteriaPane.classList.add('xclass-criteria-panel');
		const criteriaTextNode = document.createElement('div');
		criteriaTextNode.classList.add('criteria-text');
		const clearCriteriaBtn = document.createElement('span');
		clearCriteriaBtn.classList.add('clear-xclass-criteria');
		clearCriteriaBtn.addEventListener(
			'click',
			function () {
				this.setQueryText();
				columnSelectionMediator.clearSearch();
			}.bind(this)
		);
		this.criteriaPane.appendChild(criteriaTextNode);
		this.criteriaPane.appendChild(clearCriteriaBtn);

		const toolbarBlock = document.createElement('div');
		toolbarBlock.id = 'toolbarXClassBarContainer';
		toolbarBlock.classList.add('xclass-bar__container');
		this.toolbar = new ToolbarWrapper({
			id: 'xClassBarContainer',
			connectId: toolbarBlock.id,
			useCompatToolbar: true
		});
		const infernoFlags = ArasModules.utils.infernoFlags;
		CompatToolbar.formatters.text = function (data) {
			const innerText = Inferno.createVNode(
				Inferno.getFlagsForElementVnode('span'),
				'span',
				'xclass-bar-name',
				Inferno.createTextVNode(data.item.value),
				infernoFlags.hasVNodeChildren
			);
			return Inferno.createVNode(
				Inferno.getFlagsForElementVnode('span'),
				'span',
				'xclass-bar-item',
				innerText,
				infernoFlags.hasVNodeChildren,
				{ 'data-id': data.item.id }
			);
		};

		this.criteriaContainer.appendChild(this.criteriaPane);
		this.htmlBlock.appendChild(this.criteriaContainer);
		this.htmlBlock.appendChild(toolbarBlock);
	}
});
