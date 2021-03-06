/*
* SwiftV1 API:
* http://docs.openstack.org/api/openstack-object-storage/1.0/content/
*/
var SwiftV1 = {};
var recursiveDelete;

(function () {
	'use strict';

	var xStorageUrl = null;
	var xAuthToken = null;
	var account = '';
	var unauthorized = function () {};

	var METADATA_PREFIX = {
		ACCOUNT: 'X-Account-Meta-',
		CONTAINER: 'X-Container-Meta-',
		OBJECT: 'X-Object-Meta-'
	};

	var METADATA_REMOVE_PREFIX = {
		ACCOUNT: 'X-Remove-Account-Meta-',
		CONTAINER: 'X-Remove-Container-Meta-',
		OBJECT: 'X-Remove-Object-Meta-'
	};

	SwiftV1.Account = {};

	SwiftV1.Account.head = function (args) {
		var accountId = args.hasOwnProperty('account') ? args.account : account;
		var url = xStorageUrl + accountId;
		var xhr = new XMLHttpRequest();
		xhr.open('HEAD', url);
		if (xAuthToken !== null) {
			xhr.setRequestHeader('X-Auth-Token', xAuthToken);
		}
		xhr.addEventListener('load', function (e) {
			if (e.target.status == 401) {
				unauthorized();
			} else if (e.target.status >= 200 && e.target.status <= 299) {
				var headers = parseResponseHeaders(e.target.getAllResponseHeaders());
				var metadata = headersToMetadata(headers, METADATA_PREFIX.ACCOUNT);
				var containersCount = e.target.getResponseHeader('X-Account-Container-Count');
				var bytesUsed = e.target.getResponseHeader('X-Account-Bytes-Used');
				args.success(metadata, containersCount, bytesUsed);
			} else {
				args.error(e.target.status, e.target.statusText);
			}
		});
		xhr.send();
	};

	SwiftV1.Account.get = function (args) {
		var xhr = new XMLHttpRequest();
		var queryUrlObj = {};
		if (args.hasOwnProperty('limit')) {
			queryUrlObj.limit = args.limit;
		}
		if (args.hasOwnProperty('marker')) {
			queryUrlObj.marker = args.marker;
		}
		if (args.hasOwnProperty('end_marker')) {
			queryUrlObj.end_marker = args.end_marker;
		}
		if (args.hasOwnProperty('format')) {
			queryUrlObj.format = args.format;
		}
		var queryUrlArr = [];
		for (var p in queryUrlObj) {
			queryUrlArr.push(encodeURIComponent(p) + '=' + encodeURIComponent(queryUrlObj[p]));
		}
		var url;
		if (queryUrlArr.length) {
			var queryUrl = '?' + queryUrlArr.join('&');
			url = xStorageUrl + account + queryUrl;
		} else {
			url = xStorageUrl + account;
		}
		xhr.open('GET', url);
		if (xAuthToken !== null) {
			xhr.setRequestHeader('X-Auth-Token', xAuthToken);
		}
		xhr.addEventListener('load', function (e) {
			if (e.target.status == 401) {
				unauthorized();
			} else if (e.target.status >= 200 && e.target.status <= 299) {
				if (args.hasOwnProperty('format') && args.format == 'json') {
					args.success(JSON.parse(e.target.responseText));
				} else {
					args.success(e.target.responseText);
				}
			} else {
				args.error(e.target.status, e.target.statusText);
			}
		});
		xhr.send();

		return xhr;
	};

	SwiftV1.Account.post = function (args) {
		var xhr = new XMLHttpRequest();
		var url = xStorageUrl + account;
		xhr.open('POST', url);
		if (xAuthToken !== null) {
			xhr.setRequestHeader('X-Auth-Token', xAuthToken);
		}
		if (args.hasOwnProperty('metadata')) {
			setHeadersMetadata(xhr, args.metadata, METADATA_PREFIX.ACCOUNT);
		}
		if (args.hasOwnProperty('removeMetadata')) {
			setHeadersRemoveMetadata(xhr, args.removeMetadata, METADATA_REMOVE_PREFIX.ACCOUNT);
		}
		xhr.addEventListener('load', function (e) {
			if (e.target.status == 401) {
				unauthorized();
			} else if (e.target.status >= 200 && e.target.status <= 299) {
				args.updated();
			} else {
				args.error(e.target.status, e.target.statusText);
			}
		});
		xhr.send();
	};

	SwiftV1.Container = {};

	SwiftV1.Container.head = function (args) {
		var accountId = args.hasOwnProperty('account') ? args.account : account;
		var xhr = new XMLHttpRequest();
		var url = xStorageUrl + accountId + '/' + args.containerName;
		xhr.open('HEAD', url);
		if (xAuthToken !== null) {
			xhr.setRequestHeader('X-Auth-Token', xAuthToken);
		}
		xhr.addEventListener('load', function (e) {
			if (e.target.status == 401) {
				unauthorized();
			} else if (e.target.status == 404 && args.hasOwnProperty('notExist')) {
				args.notExist();
			} else if (e.target.status >= 200 && e.target.status <= 299) {
				var headers = parseResponseHeaders(e.target.getAllResponseHeaders());
				var metadata = headersToMetadata(headers, METADATA_PREFIX.CONTAINER);
				var objectCount = e.target.getResponseHeader('X-Container-Object-Count');
				var bytesUsed = e.target.getResponseHeader('X-Container-Bytes-Used');
				args.success(metadata, objectCount, bytesUsed, e.target);
			} else {
				args.error(e.target.status, e.target.statusText);
			}
		});
		xhr.send();
		return xhr;
	};

	SwiftV1.Container.get = function (args) {
		var xhr = new XMLHttpRequest();
		var queryUrlObj = {};
		if (args.hasOwnProperty('limit')) {
			queryUrlObj.limit = args.limit;
		}
		if (args.hasOwnProperty('marker')) {
			queryUrlObj.marker = args.marker;
		}
		if (args.hasOwnProperty('end_marker')) {
			queryUrlObj.end_marker = args.end_marker;
		}
		if (args.hasOwnProperty('format')) {
			queryUrlObj.format = args.format;
		}
		if (args.hasOwnProperty('prefix')) {
			queryUrlObj.prefix = args.prefix;
		}
		if (args.hasOwnProperty('delimiter')) {
			queryUrlObj.delimiter = args.delimiter;
		}
		if (args.hasOwnProperty('path')) {
			queryUrlObj.path = args.path;
		}
		var queryUrlArr = [];
		for (var p in queryUrlObj) {
			queryUrlArr.push(encodeURIComponent(p) + '=' + encodeURIComponent(queryUrlObj[p]));
		}
		var url;
		var accountId = args.hasOwnProperty('account') ? args.account : account;
		if (queryUrlArr.length) {
			var queryUrl = '?' + queryUrlArr.join('&');
			url = xStorageUrl + accountId + '/' + args.containerName + queryUrl;
		} else {
			url = xStorageUrl + accountId + '/' + args.containerName;
		}
		xhr.open('GET', url);
		if (xAuthToken !== null) {
			xhr.setRequestHeader('X-Auth-Token', xAuthToken);
		}
		xhr.addEventListener('load', function (e) {
			if (e.target.status == 401) {
				unauthorized();
			} else if (e.target.status == 404 && args.hasOwnProperty('notExist')) {
				args.notExist();
			} else if (e.target.status >= 200 && e.target.status <= 299) {
				if (args.hasOwnProperty('format') && args.format == 'json') {
					args.success(JSON.parse(e.target.responseText));
				} else {
					args.success(e.target.responseText);
				}
			} else {
				args.error(e.target.status, e.target.statusText);
			}
		});
		xhr.send();
	};

	SwiftV1.Container.post = function (args) {
		var xhr = new XMLHttpRequest();
		var url = xStorageUrl + account + '/' + args.containerName;
		xhr.open('POST', url);
		if (xAuthToken !== null) {
			xhr.setRequestHeader('X-Auth-Token', xAuthToken);
		}

		if (args.hasOwnProperty('metadata')) {
			setHeadersMetadata(xhr, args.metadata, METADATA_PREFIX.CONTAINER);
		}
		if (args.hasOwnProperty('removeMetadata')) {
			setHeadersRemoveMetadata(xhr, args.removeMetadata, METADATA_REMOVE_PREFIX.CONTAINER);
		}
		xhr.addEventListener('load', function (e) {
			if (e.target.status == 401) {
				unauthorized();
			} else if (e.target.status == 404 && args.hasOwnProperty('notExist')) {
				args.notExist();
			} else if (e.target.status >= 200 && e.target.status <= 299) {
				args.updated();
			} else {
				args.error(e.target.status, e.target.statusText);
			}
		});
		xhr.send();
	};

	SwiftV1.Container.put = function (args) {
		var xhr = new XMLHttpRequest();
		var url = xStorageUrl + account + '/' + args.containerName;
		xhr.open('PUT', url);
		if (xAuthToken !== null) {
			xhr.setRequestHeader('X-Auth-Token', xAuthToken);
		}
		if (args.hasOwnProperty('metadata')) {
			for (var metadataKey in args.metadata) {
				var header = 'X-Container-Meta-' + metadataKey;
				var value = args.metadata[metadataKey];
				xhr.setRequestHeader(header, value);
			}
		}
		xhr.addEventListener('load', function (e) {
			if (e.target.status == 401) {
				unauthorized();
			} else if (e.target.status == 201) {
				args.created();
			} else if (e.target.status == 202) {
				args.alreadyExists();
			} else {
				args.error(e.target.status, e.target.statusText);
			}
		});
		xhr.send();
	};

	SwiftV1.Container.delete = function (args) {
		var xhr = new XMLHttpRequest();
		var url = xStorageUrl + account + '/' + args.containerName;
		xhr.open('DELETE', url);
		if (xAuthToken !== null) {
			xhr.setRequestHeader('X-Auth-Token', xAuthToken);
		}
		xhr.addEventListener('load', function (e) {
			if (e.target.status == 401) {
				unauthorized();
			} else if (e.target.status == 404 && args.hasOwnProperty('notExist')) {
				args.notExist();
			} else if (e.target.status >= 200 && e.target.status <= 299) {
				args.deleted();
			} else {
				args.error(e.target.status, e.target.statusText);
			}
		});
		xhr.send();
	};

	SwiftV1.Container.getRights = function (args) {
		var newArgs = {};
		if (args.hasOwnProperty('account')) {
			newArgs.account = args.account;
		}
		newArgs.containerName = args.containerName;
		newArgs.error = args.error;
		newArgs.success = function (metadata, objectCount, bytesUsed, xhr) {
			args.success({
				read: xhr.getResponseHeader('X-Container-Read') || '',
				write: xhr.getResponseHeader('X-Container-Write') || ''
			})
		};
		SwiftV1.Container.head(newArgs);
	};

	SwiftV1.Container.updateRights = function (args) {
		var xhr = new XMLHttpRequest();
		var url = xStorageUrl + account + '/' + args.containerName;
		xhr.open('POST', url);
		xhr.setRequestHeader('X-Container-Read', args.readRights);
		xhr.setRequestHeader('X-Container-Write', args.writeRights);
		xhr.addEventListener('load', function (e) {
			if (e.target.status == 401) {
				unauthorized();
			} else if (e.target.status >= 200 && e.target.status <= 299) {
				args.updated();
			} else {
				args.error(e.target.status, e.target.statusText);
			}
		});
		xhr.send();
	};

	SwiftV1.File = {};

	SwiftV1.File.head = function (args) {
		var xhr = new XMLHttpRequest();
		var accountId = args.hasOwnProperty('account') ? args.account : account;
		var url = xStorageUrl + accountId + '/' + args.path;
		xhr.open('HEAD', url);
		if (xAuthToken !== null) {
			xhr.setRequestHeader('X-Auth-Token', xAuthToken);
		}
		xhr.addEventListener('load', function (e) {
			if (e.target.status == 401) {
				unauthorized();
			} else if (e.target.status == 404 && args.hasOwnProperty('notExist')) {
				args.notExist();
			} else if (e.target.status >= 200 && e.target.status <= 299) {
				var headers = parseResponseHeaders(e.target.getAllResponseHeaders());
				var metadata = headersToMetadata(headers, METADATA_PREFIX.OBJECT);
				var contentType = e.target.getResponseHeader('Content-Type');
				var contentLength = e.target.getResponseHeader('Content-Length');
				var lastModified = e.target.getResponseHeader('Last-Modified');
				args.success(metadata, contentType, contentLength, lastModified);
			} else {
				args.error(e.target.status, e.target.statusText);
			}
		});
		xhr.send();
	};

	SwiftV1.File.get = function (args) {
		var xhr = new XMLHttpRequest();
		var accountId = args.hasOwnProperty('account') ? args.account : account;
		var url = xStorageUrl + accountId + '/' + args.path;
		if (args.hasOwnProperty('ifMatch')) {
			xhr.setRequestHeader('If-Match', args.ifMatch);
		}
		if (args.hasOwnProperty('ifNoneMatch')) {
			xhr.setRequestHeader('If-None-Match', args.ifNoneMatch);
		}
		if (args.hasOwnProperty('ifModifiedSince')) {
			xhr.setRequestHeader('If-Modified-Since', args.ifModifiedSince);
		}
		if (args.hasOwnProperty('ifUnmodifiedSince')) {
			xhr.setRequestHeader('If-Unmodified-Since', args.ifUnmodifiedSince);
		}
		if (args.hasOwnProperty('range')) {
			xhr.setRequestHeader('Range', args.range);
		}
		xhr.open('GET', url);
		if (xAuthToken !== null) {
			xhr.setRequestHeader('X-Auth-Token', xAuthToken);
		}
		xhr.addEventListener('load', function (e) {
			if (e.target.status == 401) {
				unauthorized();
			} else if (e.target.status == 404) {
				args.notExist();
			} else if (e.target.status >= 200 && e.target.status <= 299) {
				args.success(e.target.responseText, e.target.getResponseHeader('Content-Type'));
			} else {
				args.error(e.target.status, e.target.statusText);
			}
		});
		if (args.hasOwnProperty('progress')) {
			xhr.addEventListener('progress', function (e) {
				args.progress(e.loaded);
			});
		}
		xhr.send();
		return xhr;
	};

	SwiftV1.File.post = function (args) {
		var xhr = new XMLHttpRequest();
		var accountId = args.hasOwnProperty('account') ? args.account : account;
		var url = xStorageUrl + accountId + '/' + args.path;
		xhr.open('POST', url);
		if (xAuthToken !== null) {
			xhr.setRequestHeader('X-Auth-Token', xAuthToken);
		}
		if (args.hasOwnProperty('metadata')) {
			setHeadersMetadata(xhr, args.metadata, METADATA_PREFIX.OBJECT);
		}
		if (args.hasOwnProperty('removeMetadata')) {
			setHeadersRemoveMetadata(xhr, args.removeMetadata, METADATA_REMOVE_PREFIX.OBJECT);
		}
		xhr.setRequestHeader('Content-Type', args.contentType);
		xhr.addEventListener('load', function (e) {
			if (e.target.status == 401) {
				unauthorized();
			} else if (e.target.status == 404 && args.hasOwnProperty('notExist')) {
				args.notExist();
			} else if (e.target.status >= 200 && e.target.status <= 299) {
				args.updated();
			} else {
				args.error(e.target.status, e.target.statusText);
			}
		});
		xhr.send();
	};

	SwiftV1.File.put = function (args) {
		var xhr = new XMLHttpRequest();
		var accountId = args.hasOwnProperty('account') ? args.account : account;
		var url = xStorageUrl + accountId + '/' + args.path;
		xhr.open('PUT', url, true);
		if (xAuthToken !== null) {
			xhr.setRequestHeader('X-Auth-Token', xAuthToken);
		}
		if (args.hasOwnProperty('metadata')) {
			setHeadersMetadata(xhr, args.metadata, METADATA_PREFIX.OBJECT);
		}
		if (args.hasOwnProperty('removeMetadata')) {
			setHeadersRemoveMetadata(xhr, args.removeMetadata, METADATA_REMOVE_PREFIX.OBJECT);
		}
		xhr.setRequestHeader('Content-Type', args.contentType);
		if (args.hasOwnProperty('progress')) {
			xhr.upload.addEventListener('progress', function (e) {
				if (e.lengthComputable) {
					var percentLoaded = Math.round((e.loaded / e.total) * 100);
					args.progress(percentLoaded, e.loaded, e.total);
				}
			});
		}
		xhr.addEventListener('load', function (e) {
			if (e.target.status == 401) {
				unauthorized();
			} else if (e.target.status == 201) {
				args.created();
			} else {
				args.error(e.target.status, e.target.statusText);
			}
		});
		xhr.send(args.data);

		return xhr;
	};

	SwiftV1.File.delete = function (args) {
		var xhr = new XMLHttpRequest();
		var accountId = args.hasOwnProperty('account') ? args.account : account;
		var url = xStorageUrl + accountId + '/' + args.path;
		xhr.open('DELETE', url);
		if (xAuthToken !== null) {
			xhr.setRequestHeader('X-Auth-Token', xAuthToken);
		}
		xhr.addEventListener('load', function (e) {
			if (e.target.status == 401) {
				unauthorized();
			} else if (e.target.status == 404) {
				args.notExist();
			} else if (e.target.status >= 200 && e.target.status <= 299) {
				args.deleted();
			} else {
				args.error(e.target.status, e.target.statusText);
			}
		});
		xhr.send();
	};

	SwiftV1.File.copy = function (args) {
		var xhr = new XMLHttpRequest();
		var accountId = args.hasOwnProperty('account') ? args.account : account;
		var url = xStorageUrl + accountId + '/' + args.path;
		xhr.open('PUT', url);
		if (xAuthToken !== null) {
			xhr.setRequestHeader('X-Auth-Token', xAuthToken);
		}
		xhr.setRequestHeader('X-Copy-From', args.copyFrom);
		xhr.addEventListener('load', function (e) {
			if (e.target.status == 401) {
				unauthorized();
			} else if (e.target.status == 201) {
				args.copied();
			} else {
				args.error(e.target.status, e.target.statusText);
			}
		});
		xhr.send();
	};

	SwiftV1.createDirectory = function (args) {
		SwiftV1.File.put({
			path: args.path,
			data: '',
			contentType: 'application/directory',
			created: args.created,
			error: args.error
		});
	};

	SwiftV1.delete = function (args) {
		if (args.path.split('/').length == 1) {
			SwiftV1.deleteContainer({
				containerName: args.path,
				deleted: args.deleted,
				error: args.error,
				notExist: args.notExist
			});
		} else {
			var accountId = args.hasOwnProperty('account') ? args.account : account;
			SwiftV1.deleteFile({
				account: accountId,
				path: args.path,
				deleted: args.deleted,
				error: args.error,
				notExist: args.notExist
			});
		}
	};

	SwiftV1.getAccountMetadata = SwiftV1.Account.head;
	SwiftV1.updateAccountMetadata = SwiftV1.Account.post;
	SwiftV1.listContainers = SwiftV1.Account.get;

	SwiftV1.getContainerMetadata = SwiftV1.Container.head;
	SwiftV1.checkContainerExist = SwiftV1.Container.head;
	SwiftV1.listFiles = SwiftV1.Container.get;
	SwiftV1.updateContainerMetadata = SwiftV1.Container.post;
	SwiftV1.createContainer = SwiftV1.Container.put;
	SwiftV1.deleteContainer = SwiftV1.Container.delete;

	SwiftV1.getFileMetadata = SwiftV1.File.head;
	SwiftV1.checkFileExist = SwiftV1.File.head;
	SwiftV1.checkDirectoryExist = SwiftV1.File.head;
	SwiftV1.getFile = SwiftV1.File.get;
	SwiftV1.updateFileMetadata = SwiftV1.File.post;
	SwiftV1.createFile = SwiftV1.File.put;
	SwiftV1.deleteFile = SwiftV1.File.delete;
	SwiftV1.copyFile = SwiftV1.File.copy;

	function parseResponseHeaders(headerStr) {
		var headers = {};
		if (!headerStr) {
			return headers;
		}
		var headerPairs = headerStr.split('\u000d\u000a');
		for (var i = 0; i < headerPairs.length; i++) {
			var headerPair = headerPairs[i];
			// Can't use split() here because it does the wrong thing
			// if the header value has the string ": " in it.
			var index = headerPair.indexOf('\u003a\u0020');
			if (index > 0) {
				var key = headerPair.substring(0, index);
				var val = headerPair.substring(index + 2);
				headers[key] = val;
			}
		}
		return headers;
	}

	function headersToMetadata(headers, prefix) {
		var metadata = {};
		for (var header in headers) {
			if (header.indexOf(prefix) === 0) {
				metadata[header.substr(prefix.length)] = headers[header];
			}
		}
		return metadata;
	}

	function setHeadersMetadata(xhr, metadata, prefix) {
		for (var metadataKey in metadata) {
			xhr.setRequestHeader(prefix + metadataKey, metadata[metadataKey]);
		}
	}

	function setHeadersRemoveMetadata(xhr, removeMetadataArr, prefixRemove) {
		for (var i = 0; i < removeMetadataArr.length; i++) {
			xhr.setRequestHeader(prefixRemove + removeMetadataArr[i], 'x');
		}
	}

	SwiftV1.retrieveTokens = function (args) {
		var xhr = new XMLHttpRequest();
		xhr.open('GET', args.v1AuthUrl);
		xhr.setRequestHeader('X-Auth-User', args.tenant + ':' + args.xAuthUser);
		SwiftV1.account = args.xAuthUser;
		xhr.setRequestHeader('X-Auth-Key', args.xAuthKey);
		xhr.addEventListener('load', function (e) {
			if (e.target.status >= 200 && e.target.status <= 299) {
				xAuthToken = e.target.getResponseHeader('X-Auth-Token');
				xStorageUrl = e.target.getResponseHeader('X-Storage-Url');

				// TODO: check if the following lines are okay, consult Swift V1 API
				account = xStorageUrl.split('/').pop();
				xStorageUrl = xStorageUrl.substring(0, xStorageUrl.lastIndexOf('/')) + '/';

				args.ok();
			} else {
				args.error(e.target.status, e.target.statusText);
			}
		});
		xhr.send();
	};

	SwiftV1.getAccount = function () {
		return account;
	};

	SwiftV1.setStorageUrl = function (url) {
		xStorageUrl = url;
	};

	SwiftV1.getStorageUrl = function () {
		return xStorageUrl;
	};

	SwiftV1.getAuthToken = function () {
		return xAuthToken;
	};

	SwiftV1.unauthorized = function () {
		unauthorized();
	};

	SwiftV1.setUnauthorizedCallback = function (callback) {
		unauthorized = callback;
	};

	SwiftV1.setAuthData = function (args) {
		if (args.xStorageUrl.lastIndexOf('/') == args.xStorageUrl.length - 1) {
			xStorageUrl = args.xStorageUrl;
		} else {
			xStorageUrl = args.xStorageUrl + '/';
		}
		account = args.account;
		unauthorized = args.unauthorized;
		if (args.hasOwnProperty('xAuthToken')) {
			xAuthToken = args.xAuthToken;
		}
	};

	recursiveDelete = function (args) {
		var accountId = args.hasOwnProperty('account') ? args.account : account;
		var levels = [];
		var files;
		var deleteCount = 0;
		var newArgs = {};
		var pathArr = args.path.split('/');
		newArgs.format = 'json';
		newArgs.notExist = args.hasOwnProperty('notExist') ? args.notExist : args.deleted;
		newArgs.error = args.error;
		newArgs.success = success;
		newArgs.containerName = pathArr[0];
		if (pathArr.length > 1) {
			newArgs.prefix = pathArr.splice(1).join('/');
		}
		SwiftV1.listFiles(newArgs);

		function success(response) {
			files = response;
			for (var i = 0; i < files.length; i++) {
				var level = files[i].name.split('/').length;
				if (typeof levels[level] === "undefined") {
					levels[level] = [];
				}
				levels[level].push(newArgs.containerName + '/' + files[i].name);
			}

			deleteLevel(levels.length);
		}

		function deleteLevel(level) {
			if (level == 0) {
				SwiftV1.delete({
					account: accountId,
					path: args.path,
					deleted: function () {
						args.progress(files.length, deleteCount, 'deleted');
						args.deleted();
					},
					error: function (status, statusText) {
						args.progress(files.length, deleteCount, 'error occurred');
						args.error(status, statusText);
					},
					notExist: function () {
						args.progress(files.length, deleteCount, 'not existed');
						newArgs.notExist();
					}
				});
				return;
			}
			if (typeof levels[level] === "undefined") {
				deleteLevel(level -  1);
				return;
			}

			var levelAmountLast = levels[level].length;

			for (var  i = 0; i < levels[level].length; i++) {
				SwiftV1.delete({
					account: accountId,
					path: levels[level][i],
					deleted: function () {
						levelAmountLast--;
						args.progress(files.length, deleteCount, 'deleted');
						deleteCount++;
						if (levelAmountLast == 0) {
							deleteLevel(level -  1);
						}
					},
					error: function () {
						levelAmountLast--;
						args.progress(files.length, deleteCount, 'error occurred');
						deleteCount++;
						if (levelAmountLast == 0) {
							deleteLevel(level -  1);
						}
					},
					notExist: function () {
						levelAmountLast--;
						args.progress(files.length, deleteCount, 'not existed');
						deleteCount++;
						if (levelAmountLast == 0) {
							deleteLevel(level -  1);
						}
					}
				});
			}
		}
	};

})();