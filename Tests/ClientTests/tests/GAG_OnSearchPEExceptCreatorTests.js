describe('Test GAG_OnSearchPEExceptCreator', function () {
	debugger;
	const creatorId = 'E797DFCBAFB64C72B4DB7FE159A27BA7';
	const relatedIds = [
		'6B14D33C4A7D41C188CCF2BC15BD01A3',
		'A288CB9A179C4B81B9BB3C130A515A29',
	];
	let innovator = new Aras.IOM.Innovator('server_connection');
	let oldAras;

	afterEach(() => {
		inArgsMock = null;
		window.aras = oldAras;
	});

	it("Checks that filter wasn't added when instead members are returned as error", function () {
		const expectedCriteria = '';

		const inArgsMock = getInArgsMock('add');
		const aliasItem = getAliasMockItem(true, false, creatorId);
		const memberItem = getMemberMockItem(false, false, relatedIds);
		const mockAras = getMockAras(memberItem, aliasItem, innovator);
		mockAras.getCurrentUserID = () => '';
		const stubError = sinon.stub(mockAras, 'AlertError');
		replaceAras(mockAras);
		GAG_OnSearchPEExceptCreator(null, inArgsMock);

		expect(inArgsMock.QryItem.criteria).to.be.equal(expectedCriteria);
		assert(stubError.called);
	});

	it('Checks that filter was added as empty when instead members are returned as empty', function () {
		const expectedCriteria = 'eq';

		const inArgsMock = getInArgsMock('add');
		const aliasItem = getAliasMockItem(true, true, creatorId);
		const memberItem = getMemberMockItem(true, true, relatedIds);
		const mockAras = getMockAras(memberItem, aliasItem, innovator);
		mockAras.getCurrentUserID = () => '';
		const stubError = sinon.stub(mockAras, 'AlertError');
		replaceAras(mockAras);
		GAG_OnSearchPEExceptCreator(null, inArgsMock);

		expect(inArgsMock.QryItem.criteria).to.be.equal(expectedCriteria);
		assert(!stubError.called);
	});

	it("Checks that filter wasn't added when instead alias is returned as error and should call getCurrentUserID because current action of an item is add", function () {
		const expectedCriteria = '';

		const inArgsMock = getInArgsMock('add');
		const memberItem = getMemberMockItem(false, false, relatedIds);
		const aliasItem = getAliasMockItem(true, false, creatorId);
		const mockAras = getMockAras(memberItem, aliasItem, innovator);
		mockAras.getCurrentUserID = () => {};
		const stubGetCurrentUserID = sinon.stub(mockAras, 'getCurrentUserID');
		const stubError = sinon.stub(mockAras, 'AlertError');
		replaceAras(mockAras);
		GAG_OnSearchPEExceptCreator(null, inArgsMock);

		expect(inArgsMock.QryItem.criteria).to.be.equal(expectedCriteria);
		assert(stubError.called);
		assert(stubGetCurrentUserID.called);
	});

	it("Checks that filter wasn't added when instead alias is returned as error and should get current user of an item because current action of the item is update", function () {
		const expectedCriteria = '';

		const inArgsMock = getInArgsMock('update');
		inArgsMock.itemContext.selectSingleNode = () => {};
		const selectSingleNodeStub = sinon.stub(
			inArgsMock.itemContext,
			'selectSingleNode'
		);
		selectSingleNodeStub.onCall(0).returns({
			innerHTML: '',
		});
		const memberItem = getMemberMockItem(false, false, relatedIds);
		const aliasItem = getAliasMockItem(true, false, creatorId);
		const mockAras = getMockAras(memberItem, aliasItem, innovator);
		mockAras.getCurrentUserID = () => {};
		const stubError = sinon.stub(mockAras, 'AlertError');
		replaceAras(mockAras);
		GAG_OnSearchPEExceptCreator(null, inArgsMock);

		expect(inArgsMock.QryItem.criteria).to.be.equal(expectedCriteria);
		assert(stubError.called);
		assert(selectSingleNodeStub.called);
	});

	it('Checks that filter was added without creator', function () {
		const expectedCriteria = `in${relatedIds.join(',')}`;
		relatedIds.push(creatorId);

		const inArgsMock = getInArgsMock('update');
		inArgsMock.itemContext.selectSingleNode = () => {};
		const selectSingleNodeStub = sinon.stub(
			inArgsMock.itemContext,
			'selectSingleNode'
		);
		selectSingleNodeStub.onCall(0).returns({
			innerHTML: creatorId,
		});
		const memberItem = getMemberMockItem(false, false, relatedIds);
		const aliasItem = getAliasMockItem(false, false, creatorId);
		const mockAras = getMockAras(memberItem, aliasItem, innovator);
		mockAras.getCurrentUserID = () => {};
		const stubError = sinon.stub(mockAras, 'AlertError');
		replaceAras(mockAras);
		GAG_OnSearchPEExceptCreator(null, inArgsMock);

		expect(inArgsMock.QryItem.criteria).to.be.equal(expectedCriteria);
		assert(!stubError.called);
		assert(selectSingleNodeStub.called);
	});

	function replaceAras(mockAras) {
		oldAras = window.aras;
		window.aras = mockAras;
	}

	function getMockAras(memberItem, aliasItem, innovator) {
		return {
			IomInnovator: innovator,

			newIOMItem(name, action) {
				if (name === 'Member') {
					return memberItem;
				} else if (name === 'Alias') {
					return aliasItem;
				}

				throw new Error(`Unknown ${name} item type`);
			},

			AlertError(error) {
				return error;
			},
			evalMethod(methodName, inDom, inArgs) {
				if (methodName === 'GAG_SetOnSearchCriteria') {
					return GAG_SetOnSearchCriteria(inDom, inArgs);
				}

				throw Error(`Unknown ${methodName} method.`);
			},
		};
	}

	function getInArgsMock(itemContexAction) {
		return {
			itemContext: {
				getAttribute(attributeName) {
					if (attributeName === 'action') {
						return itemContexAction;
					}

					throw Error(`Unknow ${attributeName} attribute.`);
				},
			},
			QryItem: {
				criteria: '',
				setCriteria: function (prop, value, criteria) {
					this.criteria += criteria + value;
				},
			},
		};
	}

	function getAliasMockItem(isError, isEmpty, relatedId) {
		const item = getMockItem(isError, isEmpty);
		item.getProperty = () => relatedId;
		return item;
	}

	function getMemberMockItem(isError, isEmpty, relatedIds) {
		const item = getMockItem(isError, isEmpty);
		item.getItemCount = () => {
			return relatedIds.length;
		};
		item.getItemByIndex = (index) => {
			return {
				getProperty(propertyName) {
					if (propertyName === 'related_id') {
						return relatedIds[index];
					}

					throw Error(`Unknown ${propertyName} property`);
				},
			};
		};

		return item;
	}

	function getMockItem(isError, isEmpty) {
		return {
			isError() {
				return isError;
			},
			isEmpty() {
				return isEmpty;
			},
			setAttribute() {},
			setProperty() {},
			apply() {
				return this;
			},
		};
	}
});
