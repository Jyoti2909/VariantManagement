define([
	'dojo/_base/declare',
	'MassPromote/Scripts/Classes/Components/BannerModule',
	'MassPromote/Scripts/Classes/Components/ExecuteModule',
	'MassPromote/Scripts/Classes/Components/GridModule',
	'MassPromote/Scripts/Classes/Components/LifeCycleMapModule',
	'MassPromote/Scripts/Classes/Components/ResolveConflictModule',
	'MassPromote/Scripts/Classes/Components/StatusModule',
	'MassPromote/Scripts/Classes/Components/TargetStateModule',
	'MassPromote/Scripts/Classes/Components/TransitionCommentModule',
	'MassPromote/Scripts/Classes/DataProvider',
	'MassPromote/Scripts/Classes/ValidationModule',
	'MassPromote/Scripts/Classes/lifeCycleMapProvider'
], function (
	declare,
	BannerModule,
	ExecuteModule,
	GridModule,
	LifeCycleMapModule,
	ResolveConfilictModule,
	StatusModule,
	TargetStateModule,
	TransitionCommentModule,
	DataProvider,
	ValidationModule,
	lifeCycleMapProvider
) {
	return declare(null, {
		constructor: function () {
			const validationModule = new ValidationModule();
			const dataProvider = new DataProvider(
				window.item,
				validationModule,
				lifeCycleMapProvider
			);

			this._bannerModule = new BannerModule();
			this._executeModule = new ExecuteModule(this, window.itemID);
			this._gridModule = new GridModule(this, dataProvider, window.statusbar);
			this._lifeCycleMapModule = new LifeCycleMapModule(
				this,
				dataProvider.getLifecycleMapProvider()
			);
			this._resolveConfilictModule = new ResolveConfilictModule(this);
			this._targetStateModule = new TargetStateModule(this);
			this._transitionCommentModule = new TransitionCommentModule(this);
			this._statusModule = new StatusModule(this);

			this._gridModule.loadFromXml();
		},

		onGridChanged: function (args) {
			this._bannerModule.update(args.items, args.promoteType);

			this._lifeCycleMapModule.update(args.items);

			const lifeCycleInfo = this._lifeCycleMapModule.getCurrent();
			this._targetStateModule.update(lifeCycleInfo);

			const targetState = this._targetStateModule.getCurrent();
			this._transitionCommentModule.update(lifeCycleInfo, targetState);

			this._resolveConfilictModule.update(args.items, targetState);
			this._executeModule.update(args.items, lifeCycleInfo, targetState);
			this._statusModule.update(args.items, lifeCycleInfo, targetState);
		},

		onTargeStateChanged: function (args) {
			this._gridModule.onTargetStateChanged(args.selectedItem);
		},

		onLifeCycleChanged: function (args) {
			this._gridModule.onLifecycleMapChanged(args.selectedItem);
			this._targetStateModule.update(args.selectedItem);
		},

		onAddItemButtonClick: function () {
			this._gridModule.onAddItemButtonClick();
		},

		onResolveConflicts: function (args) {
			this._gridModule.resolveConflicts(args.resolveConflictsMethod);
		},

		onRemoveItemButtonClick: function () {
			this._gridModule.onRemoveItemButtonClick();
		},

		onUnlockItemButtonClick: function () {
			this._gridModule.onUnlockItemButtonClick();
		},

		onSelectAllButtonClick: function () {
			this._gridModule.selectAll();
		},

		onPromoteButtonClick: function () {
			this._gridModule.onPromoteButtonClick();
		},

		onExecuteStarted: function () {
			this._freezeModules();
			this._gridModule.onPromotionStarted();
			this._statusModule.onPromotionStarted();
		},

		onRefreshItemsButtonClick: function () {
			this._gridModule.refreshItems();
		},

		getDataForExecution: function () {
			const lifeCycleInfo = this._lifeCycleMapModule.getCurrent();
			const targetState = this._targetStateModule.getCurrent();
			const promoteItemTypeName = this._gridModule.getPromoteType();

			return {
				itemIds: this._gridModule.getItemIds(),
				itemTypeName: promoteItemTypeName,
				itemTypeId: aras.getItemTypeId(promoteItemTypeName),
				lifeCycleMapName: lifeCycleInfo.name,
				lifeCycleMapId: lifeCycleInfo.id,
				targetStateName: targetState.name,
				comment: this._transitionCommentModule.getComment()
			};
		},

		getStatusOfPromotion: function () {
			return this._statusModule.getStatusOfPromotion();
		},

		onItemPromoted: function (itemId, status) {
			this._gridModule.onItemPromoted(itemId, status);
		},

		onItemsPromoted: function (status) {
			this._gridModule.onItemsPromoted(status);
		},

		_freezeModules: function () {
			this._bannerModule.freeze();
			this._lifeCycleMapModule.freeze();
			this._targetStateModule.freeze();
			this._transitionCommentModule.freeze();
			this._resolveConfilictModule.freeze();
		},

		onViewLifeCycleMapTrigger: function () {
			const items = this._gridModule.getSelectedItems();

			if (items.length === 1) {
				const params = {
					item: items[0] ? items[0].node.cloneNode(true) : null,
					disabledPromotion: false
				};
				this._lifeCycleMapModule.onViewLifeCycleMapTrigger(params);
			}
		},

		onCloseButtonClick: function () {
			return this._executeModule.onCloseButtonClick();
		},

		getResource: function getResource(name, argsForResources) {
			let args = ['../Modules/aras.innovator.MassPromote/', name];
			args = args.concat(argsForResources || []);

			return aras.getResource.apply(aras, args);
		}
	});
});
