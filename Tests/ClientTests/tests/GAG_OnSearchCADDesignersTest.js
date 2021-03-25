describe('Test GAG_OnSearchCADDesigners', function () {
	let innovator = new Aras.IOM.Innovator('server_connection');
	let oldAras;

	afterEach(() => {
		inArgsMock = null;
		window.aras = oldAras;
	});

	it("Checks that filter wasn't added when instead members are returned as error", function () {
		const expectedCriteria = '';

		const inArgsMock = getInArgsMock();
		const item = getMockItem(true, false);
		const mockAras = getMockAras(item, innovator);
		const stubError = sinon.stub(mockAras, 'AlertError');
		replaceAras(mockAras);
		GAG_OnSearchCADDesigners(null, inArgsMock);

		expect(inArgsMock.QryItem.criteria).to.be.equal(expectedCriteria);
		assert(stubError.called);
	});

	it('Checks that filter was added as empty when instead members are returned as empty', function () {
		const expectedCriteria = 'eq';

		const inArgsMock = getInArgsMock();
		const item = getMockItem(true, true);
		const mockAras = getMockAras(item, innovator);
		const stubError = sinon.stub(mockAras, 'AlertError');
		replaceAras(mockAras);
		GAG_OnSearchCADDesigners(null, inArgsMock);

		expect(inArgsMock.QryItem.criteria).to.be.equal(expectedCriteria);
		assert(!stubError.called);
	});

	it('Checks that filter was added when members are returned', function () {
		const relatedIds = [
			'6B14D33C4A7D41C188CCF2BC15BD01A3',
			'A288CB9A179C4B81B9BB3C130A515A29',
		];
		const expectedCriteria = `in${relatedIds.join(',')}`;

		const inArgsMock = getInArgsMock();
		const item = getMockItem(false, false, relatedIds);
		const mockAras = getMockAras(item, innovator);
		const stubError = sinon.stub(mockAras, 'AlertError');
		replaceAras(mockAras);
		GAG_OnSearchCADDesigners(null, inArgsMock);

		expect(inArgsMock.QryItem.criteria).to.be.equal(expectedCriteria);
		assert(!stubError.called);
	});

	function replaceAras(mockAras) {
		oldAras = window.aras;
		window.aras = mockAras;
	}

	function getMockAras(item, innovator) {
		return {
			IomInnovator: innovator,

			newIOMItem(name, action) {
				return item;
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

	function getInArgsMock() {
		return {
			QryItem: {
				criteria: '',
				setCriteria: function (prop, value, criteria) {
					this.criteria += criteria + value;
				},
			},
		};
	}

	function getMockItem(isError, isEmpty, relatedIds) {
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
			getItemCount() {
				return relatedIds.length;
			},
			getItemByIndex(index) {
				return {
					getProperty(propertyName) {
						if (propertyName === 'related_id') {
							return relatedIds[index];
						}

						throw Error(`Unknown ${propertyName} property`);
					},
				};
			},
		};
	}
});
