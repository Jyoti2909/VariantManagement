function IOMCache(parentArasObj) {
	this.arasObj = parentArasObj;
}

IOMCache.prototype.apply = function IOMCacheApply(itemNd, async) {
	var $Promise = async ? Promise : ArasModules.SyncPromise;

	if (!itemNd) {
		return $Promise.resolve(null);
	}
	var itemID = itemNd.getAttribute('id');
	var itemTypeName = itemNd.getAttribute('type');
	var itemAction = itemNd.getAttribute('action');
	if (itemAction === null) {
		itemAction = '';
	}

	var win = this.arasObj.uiFindWindowEx2(itemNd);

	//special checks for the item of ItemType type
	// <name> tag in itemNd required for next call
	var res;
	if (itemTypeName == 'ItemType') {
		res = this.arasObj.checkItemType(itemNd, win);
	} else {
		res = true;
	}

	if (!res) {
		return $Promise.resolve(null);
	}

	if (itemTypeName) {
		if (itemAction == 'delete') {
			this.arasObj.deleteItem(itemTypeName, itemID, true);
			return $Promise.resolve(null);
		} else if (itemAction == 'purge') {
			this.arasObj.purgeItem(itemTypeName, itemID, true);
			return $Promise.resolve(null);
		}
	}

	//general checks for the item to be saved: all required parameters should be set
	if (itemTypeName) {
		res = this.arasObj.checkItem(itemNd, win);
	} else {
		res = true;
	}

	if (!res) {
		return $Promise.resolve(null);
	}

	res = null;

	var backupCopy = itemNd;
	var oldParent = backupCopy.parentNode;
	itemNd = itemNd.cloneNode(true);
	this.arasObj.prepareItem4Save(itemNd);

	var isTemp = this.arasObj.isTempEx(itemNd);

	if (itemNd.getAttribute('action') == 'add') {
		if (itemTypeName == 'RelationshipType') {
			if (!itemNd.selectSingleNode('relationship_id/Item')) {
				var rsItemNode = itemNd.selectSingleNode('relationship_id');
				if (rsItemNode) {
					var rs = this.arasObj.getItemById('', rsItemNode.text, 0);
					if (rs) {
						rsItemNode.text = '';
						rsItemNode.appendChild(rs.cloneNode(true));
					}
				}
			}
			var tmp001 = itemNd.selectSingleNode('relationship_id/Item');
			if (tmp001 && this.arasObj.getItemProperty(tmp001, 'name') === '') {
				this.arasObj.setItemProperty(
					tmp001,
					'name',
					this.arasObj.getItemProperty(itemNd, 'name')
				);
			}
		}
	}

	var files = itemNd.selectNodes(
		'descendant-or-self::Item[@type="File" and (@action="add" or @action="update")]'
	);

	var promise;
	if (files.length === 0) {
		promise = (async
			? ArasModules.soap(itemNd.xml, { method: 'ApplyItem', async: true })
			: $Promise.resolve(this.arasObj.soapSend('ApplyItem', itemNd.xml))
		).then(
			function (res) {
				if (async) {
					res = new SOAPResults(this.arasObj, res.ownerDocument.xml);
				}

				if (res.getFaultCode() !== 0) {
					return null;
				}

				return res.results.selectSingleNode(this.arasObj.XPathResult('/Item'));
			}.bind(this)
		);
	} else {
		var statusMsg = 'Sending of File to Vault...';
		if (async) {
			promise = this.arasObj.sendFilesWithVaultAppletAsync(itemNd, statusMsg);
		} else {
			promise = $Promise.resolve(
				this.arasObj.sendFilesWithVaultApplet(itemNd, statusMsg)
			);
		}
	}

	return promise.then(
		function (res) {
			if (!res) {
				return null;
			}

			res.setAttribute('levels', '0');

			var newID = res.getAttribute('id');
			this.arasObj.updateInCacheEx(backupCopy, res);

			if (itemTypeName == 'RelationshipType') {
				var relationshipId = this.arasObj.getItemProperty(
					itemNd,
					'relationship_id'
				);
				if (relationshipId) {
					this.arasObj.removeFromCache(relationshipId);
				}
				this.arasObj.commonProperties.formsCacheById = this.arasObj.newObject();
			} else if (itemTypeName == 'ItemType') {
				var itemName = this.arasObj.getItemProperty(itemNd, 'name');
				this.arasObj.deletePropertyFromObject(
					this.arasObj.sGridsSetups,
					itemName
				);
				this.arasObj.commonProperties.formsCacheById = this.arasObj.newObject();
			}

			if (oldParent) {
				res = oldParent.selectSingleNode('Item[@id="' + newID + '"]');
			} else {
				res = this.arasObj.getFromCache(newID);
			}

			if (!res) {
				return null;
			}

			if (newID != itemID) {
				var itms = this.arasObj.getAffectedItems(
					itemNd.getAttribute('type'),
					newID
				);

				if (itms) {
					for (var i = 0; i < itms.length; i++) {
						var itm = itms[i];
						var itmID = itm.getAttribute('id');
						var affectedItm = this.arasObj.getItemById('', itmID, 0);
						if (affectedItm) {
							if (affectedItm.getAttribute('levels') === null) {
								affectedItm.setAttribute('levels', 1);
							}
							var tmpRes = this.arasObj.loadItems(
								itm.getAttribute('type'),
								'id="' + itmID + '"',
								affectedItm.getAttribute('levels')
							);
							if (!tmpRes) {
								continue;
							}
							if (this.arasObj.uiFindWindowEx[itmID]) {
								setTimeout(
									"TopWindowHelper.getMostTopWindowWithAras(window).aras.uiReShowItem('" +
										itmID +
										"','" +
										itmID +
										"');",
									100
								);
							}
						}
					}
				}
			}

			return res;
		}.bind(this)
	);
};

function Innovator() {
	return TopWindowHelper.getMostTopWindowWithAras(
		window
	).aras.newIOMInnovator();
}

function Item(itemTypeName, action, mode) {
	return TopWindowHelper.getMostTopWindowWithAras(
		window
	).aras.IomInnovator.newItem(itemTypeName, action);
}

function AuthenticationBrokerClient() {}

AuthenticationBrokerClient.prototype.GetFileDownloadToken = function AuthenticationBrokerClientGetFileDownloadToken(
	fileId
) {
	var innovatorUrl = TopWindowHelper.getMostTopWindowWithAras(
		window
	).aras.getServerBaseURL();
	var result = GetSynchronousJSONResponse(
		innovatorUrl + 'AuthenticationBroker.asmx/GetFileDownloadToken',
		'{"param":{"fileId":"' + fileId + '"}}'
	);
	result = JSON.parse(result);

	// If we happen to catch any error messages, then throw error
	if (result.Message) {
		throw result.Message;
	} else {
		return result.d;
	}
};

AuthenticationBrokerClient.prototype.GetFilesDownloadTokens = function AuthenticationBrokerClientGetFilesDownloadTokens(
	fileIds
) {
	var body = '{"parameters":[';
	for (var i = 0; i < fileIds.count; i++) {
		body +=
			'{"__type":"FileDownloadParameters","fileId":"' + fileIds(i) + '"},';
	}

	body = body.slice(0, body.length - 1) + ']}';

	var innovatorUrl = TopWindowHelper.getMostTopWindowWithAras(
		window
	).aras.getServerBaseURL();
	var result = GetSynchronousJSONResponse(
		innovatorUrl + 'AuthenticationBroker.asmx/GetFilesDownloadTokens',
		body
	);
	result = JSON.parse(result);

	// If we happen to catch any error messages, then throw error
	if (result.Message) {
		throw result.Message;
	} else {
		result = result.d;
	}

	var list = TopWindowHelper.getMostTopWindowWithAras(
		window
	).aras.IomFactory.CreateArrayList();
	for (var j = 0, count = result.length - 1; j < count; j++) {
		list.Add(result[j]);
	}
	return list;
};

function LicenseManagerWebServiceClient() {
	this.aras = TopWindowHelper.getMostTopWindowWithAras(window).aras;
	this.actionNamespace = this.aras.arasService.actionNamespace;
	this.iServiceName = this.aras.arasService.serviceName;
	this.licenseServiceUrl = this.aras.getServerBaseURL() + 'Licensing.asmx/';
}

LicenseManagerWebServiceClient.prototype.ConsumeLicense = function (
	featureName
) {
	// don't used soap because request body isn't XML
	var xhr = new XMLHttpRequest();
	var methodName = 'ConsumeLicense';
	var url = this.licenseServiceUrl + methodName;
	xhr.open('POST', url, false);

	var additionalHeaders = this.aras.getHttpHeadersForSoapMessage(methodName);
	Object.keys(additionalHeaders).forEach(function (header) {
		xhr.setRequestHeader(header, additionalHeaders[header]);
	});
	xhr.setRequestHeader(
		'Content-type',
		'application/x-www-form-urlencoded; charset=utf-8'
	);

	xhr.withCredentials = true;

	xhr.send('featureName=' + encodeURIComponent(featureName));

	if (xhr.status !== 200) {
		throw new Error(xhr.responseText);
	}

	var doc = this.aras.createXMLDocument();
	doc.loadXML(xhr.responseText);
	return doc.documentElement.text;
};

function GetSynchronousJSONResponse(url, postData) {
	var xmlhttp = new XMLHttpRequest();

	url = url + '?rnd=' + Math.random(); // to be ensure non-cached version

	xmlhttp.open('POST', url, false);
	xmlhttp.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
	var headers = TopWindowHelper.getMostTopWindowWithAras(
		window
	).aras.getHttpHeadersForSoapMessage('GetFileDownloadToken');
	for (var hName in headers) {
		xmlhttp.setRequestHeader(hName, headers[hName]);
	}

	// Include credentials so that Innovator server has an access to session (session cookie must be passed).
	// This method is to be used only for sending requests to Innovator server endpoint (AuthenticationBroker.asmx),
	// so it is safe to always set withCredentials = true.
	xmlhttp.withCredentials = true;
	xmlhttp.send(postData);
	return xmlhttp.responseText;
}
