require(['dojo/_base/declare', 'dojo/_base/lang'], function (declare, lang) {
	return dojo.setObject(
		'VC.Widgets.CuttingPlaneControl',
		declare(null, {
			constructor: function (cuttingPlaneController) {
				this.controller = cuttingPlaneController;
			},

			onAxisToggle: function (planeAxis) {
				var self = this;
				var axis = this.getAxis(planeAxis);
				var faceSelection = false;
				if (axis == VC.Utils.Enums.AxisIndex.Face) {
					var selectionItem = this.controller._viewer
						.getSelectionManager()
						.getLast();
					faceSelection =
						selectionItem !== null && selectionItem.isFaceSelection();
					if (faceSelection) {
						this.controller._faceSelection = selectionItem;
					}
				}
				var ps = [];
				switch (this.getAxisStatus(axis)) {
					case VC.Utils.Enums.CuttingPlaneStatuses.Hidden:
						if (axis == VC.Utils.Enums.AxisIndex.Face) {
							if (faceSelection) {
								ps.push(
									this.controller._cuttingSections[axis]
										.clear()
										.then(function () {
											self.controller._setStatus(
												axis,
												VC.Utils.Enums.CuttingPlaneStatuses.Visible
											);
											return self.controller.setCuttingPlaneVisibility(
												true,
												axis
											);
										})
								);
							}
						} else {
							this.controller._setStatus(
								axis,
								VC.Utils.Enums.CuttingPlaneStatuses.Visible
							);
							ps.push(this.controller.setCuttingPlaneVisibility(true, axis));
						}
						break;
					case VC.Utils.Enums.CuttingPlaneStatuses.Visible:
					case VC.Utils.Enums.CuttingPlaneStatuses.Inverted:
						if (axis == VC.Utils.Enums.AxisIndex.Face) {
							ps.push(
								this.controller._cuttingSections[axis]
									.clear()
									.then(function () {
										self.controller._setStatus(
											axis,
											VC.Utils.Enums.CuttingPlaneStatuses.Hidden
										);
										return self.controller
											.setCuttingPlaneVisibility(false, axis)
											.then(function () {
												self.toDefaultState(axis);
											});
									})
							);
						} else {
							this.controller._setStatus(
								axis,
								VC.Utils.Enums.CuttingPlaneStatuses.Hidden
							);
							ps.push(this.controller.setCuttingPlaneVisibility(false, axis));
						}
						break;
				}
				return Promise.all(ps);
			},

			toDefaultState: function (axis) {
				this.controller._planeInfo.delete(axis);
				this.controller._ensurePlaneInfo(axis).referenceGeometry = null;
				this.controller._ensurePlaneInfo(axis).updateReferenceGeometry = false;
				this.controller._faceSelection = null;
			},

			onAxisInvert: function (planeAxis) {
				var self = this;
				var axis = this.getAxis(planeAxis);
				var ps = [];

				if (
					this.getAxisStatus(axis) ==
					VC.Utils.Enums.CuttingPlaneStatuses.Inverted
				) {
					this.controller._setStatus(
						axis,
						VC.Utils.Enums.CuttingPlaneStatuses.Visible
					);
				} else {
					this.controller._setStatus(
						axis,
						VC.Utils.Enums.CuttingPlaneStatuses.Inverted
					);
				}

				ps.push(
					this.controller.setCuttingPlaneInverted(axis).then(function () {
						self.updateFaceSelection(axis);
					})
				);

				return Promise.all(ps);
			},

			updateFaceSelection: function (axis) {
				if (axis == VC.Utils.Enums.AxisIndex.Face) {
					var selectionItem = this.controller._viewer
						.getSelectionManager()
						.getLast();
					var faceSelection =
						selectionItem !== null && selectionItem.isFaceSelection();
					if (faceSelection) {
						selectionItem.getFaceEntity()._normal = selectionItem
							.getFaceEntity()
							._normal.negate();
						this.controller._faceSelection = selectionItem;
					}
				}
			},

			onCuttingPlaneVisibilityToggle: function () {
				this.controller.toggleReferenceGeometry();
			},

			onCuttingPlaneSectionToggle: function () {
				this.controller.toggleCuttingMode();
			},

			setCuttingPlaneVisibility: function (visible) {
				this.controller._showReferenceGeometry = visible;
			},

			setCuttingPlaneSectionMode: function (useIndividual) {
				this.controller._useIndividualCuttingSections = useIndividual;
			},

			getAxis: function (planeAxis) {
				switch (planeAxis) {
					case 'x':
						return VC.Utils.Enums.AxisIndex.X;
					case 'y':
						return VC.Utils.Enums.AxisIndex.Y;
					case 'z':
						return VC.Utils.Enums.AxisIndex.Z;
					case 'face':
						return VC.Utils.Enums.AxisIndex.Face;
					default:
						return null;
				}
			},

			setAxisStatus: function (axisIndex, status) {
				this.controller._setStatus(axisIndex, status);
			},

			setCadViewActivated: function (status) {
				this.controller._cadViewActivated = status;
			},

			setCuttingPlaneVisible: function (status, axisIndex) {
				this.controller.setCuttingPlaneVisibility(status, axisIndex);
			},

			getAxisStatus: function (axis) {
				return this.controller._ensurePlaneInfo(axis).status;
			},

			resetCuttingPlanes: function () {
				var self = this;
				return this.controller._updateBoundingBox().then(function () {
					return self.controller.resetCuttingPlanes();
				});
			}
		})
	);
});
