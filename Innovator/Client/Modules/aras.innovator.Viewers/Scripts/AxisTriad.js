require(['dojo/_base/declare'], function (declare) {
	return dojo.setObject(
		'VC.AxisTriad',
		declare(null, {
			viewer: null,
			triadId: 0,
			overlayIndex: 3, // the overlay index to add nodes into ("1" and "2" are used for original AxisTriad and NavCube classes respectively)
			instanceIds: [-1, -1, -1, -1],
			_stemHeight: 0.3,
			_capHeight: 0.05,

			constructor: function (viewer) {
				if (viewer) {
					var self = this;
					this.viewer = viewer;
					this.viewer.setCallbacks({
						camera: function () {
							self.onCameraUpdate();
						}
					});
					this.initTriad();
				}
			},

			initTriad: function () {
				this.enableTriad();
				this.createTriad();
			},

			recreateTriad: function () {
				this.viewer.getOverlayManager().destroy(this.overlayIndex);
				this.initTriad();
			},

			enableTriad: function () {
				this.viewer
					.getOverlayManager()
					.setViewport(
						this.overlayIndex,
						Communicator.OverlayAnchor.LowerLeftCorner,
						5,
						Communicator.OverlayUnit.Pixels,
						5,
						Communicator.OverlayUnit.Pixels,
						100,
						Communicator.OverlayUnit.Pixels,
						100,
						Communicator.OverlayUnit.Pixels
					);

				this.viewer.getOverlayManager().setVisibility(this.overlayIndex, true);
			},

			createTriad: function () {
				var self = this;
				var redColor = new Uint8Array([255, 0, 0, 255, 255, 0, 0, 255]);
				var greenColor = new Uint8Array([0, 255, 0, 255, 0, 255, 0, 255]);
				var blueColor = new Uint8Array([0, 0, 255, 255, 0, 0, 255, 255]);

				this.setupCamera();

				var ps = [];
				ps.push(this.createAxis(redColor, greenColor, blueColor, 0));
				ps.push(this.createX(0.06, 0.09, 0.0, 0.0, 0.0, redColor, 1));
				ps.push(this.createY(0.06, 0.09, 0.0, 0.0, 0.0, greenColor, 2));
				ps.push(this.createZ(0.06, 0.09, 0.0, 0.0, 0.0, blueColor, 3));

				Promise.all(ps);
			},

			setupCamera: function () {
				var camera = new Communicator.Camera();
				camera.setPosition(new Communicator.Point3(0, 0.5, 5));
				camera.setTarget(Communicator.Point3.zero());
				camera.setUp(new Communicator.Point3(0, 1, 0));
				camera.setProjection(Communicator.Projection.Orthographic);
				this.viewer.getOverlayManager().setCamera(this.overlayIndex, camera);
			},

			createAxis: function (colorX, colorY, colorZ, instanceIndex) {
				var meshData = new Communicator.MeshData();
				meshData.addPolyline([0.0, 0.0, 0.0, 0.25, 0.0, 0.0], colorX);
				meshData.addPolyline([0.0, 0.0, 0.0, 0.0, 0.25, 0.0], colorY);
				meshData.addPolyline([0.0, 0.0, 0.0, 0.0, 0.0, 0.25], colorZ);

				return this.createInstance(meshData, instanceIndex);
			},

			createX: function (
				width,
				height,
				centerX,
				centerY,
				centerZ,
				color,
				instanceIndex
			) {
				var meshData = new Communicator.MeshData();
				meshData.setFaceWinding(Communicator.FaceWinding.Clockwise);
				var inc = 0.001;
				for (var i = 0; i < 10; i++) {
					var x = width * 0.5 + i * inc;
					var y = height * 0.5;
					meshData.addPolyline(
						[
							x + centerX,
							y + centerY,
							centerZ,
							-x + centerX,
							-y + centerY,
							centerZ
						],
						color
					);
					meshData.addPolyline(
						[
							-x + centerX,
							y + centerY,
							centerZ,
							x + centerX,
							-y + centerY,
							centerZ
						],
						color
					);
				}
				return this.createInstance(meshData, instanceIndex);
			},

			createY: function (
				width,
				height,
				centerX,
				centerY,
				centerZ,
				color,
				instanceIndex
			) {
				var meshData = new Communicator.MeshData();
				meshData.setFaceWinding(Communicator.FaceWinding.Clockwise);
				var inc = 0.001;
				for (var i = 0; i < 10; i++) {
					var x = width * 0.5 + i * inc;
					var y = height * 0.5;
					meshData.addPolyline(
						[-x + centerX, y + centerY, centerZ, centerX, centerY, centerZ],
						color
					);
					meshData.addPolyline(
						[centerX, centerY, centerZ, x + centerX, y + centerY, centerZ],
						color
					);
					meshData.addPolyline(
						[centerX, centerY, centerZ, centerX, -y * 1.25 + centerY, centerZ],
						color
					);
				}
				return this.createInstance(meshData, instanceIndex);
			},

			createZ: function (
				width,
				height,
				centerX,
				centerY,
				centerZ,
				color,
				instanceIndex
			) {
				var meshData = new Communicator.MeshData();
				meshData.setFaceWinding(Communicator.FaceWinding.Clockwise);
				var inc = 0.001;
				for (var i = 0; i < 1; i++) {
					var x = width * 0.5 + i * inc;
					var y = height * 0.5;
					meshData.addPolyline(
						[
							-x + centerX,
							y + centerY,
							centerZ,
							x + centerX,
							y + centerY,
							centerZ
						],
						color
					);
					meshData.addPolyline(
						[
							x + centerX,
							y + centerY,
							centerZ,
							-x + centerX,
							-y + centerY,
							centerZ
						],
						color
					);
					meshData.addPolyline(
						[
							-x + centerX,
							-y + centerY,
							centerZ,
							x + centerX,
							-y + centerY,
							centerZ
						],
						color
					);
				}
				return this.createInstance(meshData, instanceIndex);
			},

			createInstance: function (meshData, instanceIndex) {
				var self = this;
				return this.viewer
					.getModel()
					.createMesh(meshData)
					.then(function (modelId) {
						var meshInstanceData = new Communicator.MeshInstanceData(modelId);
						meshInstanceData.setCreationFlags(
							Communicator.MeshInstanceCreationFlags.DoNotCut |
								Communicator.MeshInstanceCreationFlags.DoNotExplode |
								Communicator.MeshInstanceCreationFlags.AlwaysDraw
						);

						return self.viewer
							.getModel()
							.createMeshInstance(meshInstanceData, null, true, true)
							.then(function (instanceId) {
								self.instanceIds[instanceIndex] = instanceId;
								self.viewer
									.getOverlayManager()
									.addNodes(self.overlayIndex, [instanceId]);
								self.onCameraUpdate();
								return instanceId;
							});
					});
			},

			onCameraUpdate: function () {
				var viewMatrix = this.viewer.getView().getViewMatrix();
				viewMatrix.m[3] = 0.0;
				viewMatrix.m[7] = 0.0;
				viewMatrix.m[11] = 0.0;
				viewMatrix.m[12] = 0.0;
				viewMatrix.m[13] = 0.0;
				viewMatrix.m[14] = 0.0;
				viewMatrix.m[15] = 1.0;
				var triadMatrix = Communicator.Matrix.inverse(viewMatrix);
				this.viewer.getModel().setNodeMatrix(this.instanceIds[0], viewMatrix);

				this.updateAxisLetterMatrix();
			},

			updateAxisLetterMatrix: function () {
				var viewMatrix = this.viewer.getView().getViewMatrix();
				viewMatrix.m[3] = 0.0;
				viewMatrix.m[7] = 0.0;
				viewMatrix.m[11] = 0.0;
				viewMatrix.m[12] = 0.0;
				viewMatrix.m[13] = 0.0;
				viewMatrix.m[14] = 0.0;
				viewMatrix.m[15] = 1.0;
				var xLetterPos = new Communicator.Point3(
					this._stemHeight + this._capHeight * 0.5,
					0.0,
					0.0
				);
				var yLetterPos = new Communicator.Point3(
					0.0,
					this._stemHeight + this._capHeight * 0.5,
					0.0
				);
				var zLetterPos = new Communicator.Point3(
					0.0,
					0.0,
					this._stemHeight + this._capHeight * 0.5
				);
				var xform = new Communicator.Point3(0.0, 0.0, 0.0);
				var xLetterMatrix = new Communicator.Matrix();
				viewMatrix.transform(xLetterPos, xform);
				xLetterMatrix = xLetterMatrix.loadIdentity();
				xLetterMatrix.m[12] = xform.x;
				xLetterMatrix.m[13] = xform.y;
				xLetterMatrix.m[14] = xform.z;
				var yLetterMatrix = new Communicator.Matrix();
				viewMatrix.transform(yLetterPos, xform);
				yLetterMatrix = yLetterMatrix.loadIdentity();
				yLetterMatrix.m[12] = xform.x;
				yLetterMatrix.m[13] = xform.y;
				yLetterMatrix.m[14] = xform.z;
				var zLetterMatrix = new Communicator.Matrix();
				viewMatrix.transform(zLetterPos, xform);
				zLetterMatrix = zLetterMatrix.loadIdentity();
				zLetterMatrix.m[12] = xform.x;
				zLetterMatrix.m[13] = xform.y;
				zLetterMatrix.m[14] = xform.z;
				this.viewer
					.getModel()
					.setNodeMatrix(this.instanceIds[1], xLetterMatrix);
				this.viewer
					.getModel()
					.setNodeMatrix(this.instanceIds[2], yLetterMatrix);
				this.viewer
					.getModel()
					.setNodeMatrix(this.instanceIds[3], zLetterMatrix);
			}
		})
	);
});
