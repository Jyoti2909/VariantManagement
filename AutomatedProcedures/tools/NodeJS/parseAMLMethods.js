var parser = (new (require('xml2js')).Parser({explicitArray: false})).parseString;
var fs = require('fs');
var path = require('path');

var wrapFunc = function(funcName, script) {
	return 'function ' + funcName + '(inDom, inArgs) {\r\n\t' + script + '\r\n}\r\n';
};

var paths = {
	core: path.resolve('..//..//..//AML-packages//com//aras//innovator'),
	solutions: path.resolve('..//..//..//AML-packages'),
	destination: path.resolve('..//..//..//Tests//PackageMethods//JavascriptMethods')
};

var readFolder = function(path) {
	return new Promise(function(resolve, reject) {
		fs.readdir(path, function(err, paths) {
			if (err) {
				reject(err);
			}
			resolve(paths);
		});
	});
};

var deleteFolderRecursive = function(path) {
	if (fs.existsSync(path)) {
		fs.readdirSync(path).forEach(function(file, index) {
			var curPath = path + '/' + file;
			if (fs.lstatSync(curPath).isDirectory()) {
				deleteFolderRecursive(curPath);
			} else {
				fs.unlinkSync(curPath);
			}
		});
		fs.rmdirSync(path);
	}
};

if (fs.existsSync(paths.destination)) {
	deleteFolderRecursive(paths.destination);
}
fs.mkdirSync(paths.destination);
fs.mkdirSync(path.join(paths.destination, 'core'));

var getMethodFolders = function(dirPath, methodPaths) {
	if (!fs.lstatSync(dirPath).isDirectory()) {
		return;
	}

	fs.readdirSync(dirPath).forEach(function(file) {
		var currentPath = path.join(dirPath, file);

		if (file.toLowerCase() === 'method') {
			methodPaths.push(currentPath);
			return;
		}
		getMethodFolders(currentPath, methodPaths);
	});
};
var parseFolder = function(paramPath, output) {
	return readFolder(paramPath).then(function(folders) {
		return Promise.all(folders.reduce(function(arr, folder) {
			// 'paramPath === paths.solutions' scans redundant 'com' folder,
			// skip it to avoid redundant "Method" folder in destination
			var skipFolder = folder === 'com' && paramPath === paths.solutions;
			var methodPaths = [];
			if (!skipFolder) {
				getMethodFolders(path.join(paramPath, folder), methodPaths);
			}
			var folderPromises = methodPaths.map(function(innerPath) {
				return readFolder(innerPath).then(function(files) {
					return {
						folder: folder,
						innerPath: innerPath,
						files: files
					};
				}).then(function(obj) {
					var folder = obj.folder;
					var innerPath = obj.innerPath;
					obj.files.forEach(function(fileName) {
						var filePath = path.join(innerPath, fileName);
						var outFilePath = path.join(output, folder);
						fs.readFile(filePath, function(err, data) {
							if (err) {
								console.log('err during reading ' + filePath);
								return;
							}
							parser(data, function(err, result) {
								if (err) {
									console.log('err during parsing : ' + filePath);
									return;
								}

								var item = result.AML.Item;
								if (item['method_code'] && item['method_type'] && item['method_type'].toLowerCase() === 'javascript') {
									var name = item.name.replace(/\s/g, '_');
									var file = path.join(outFilePath, (name + '.js'));
									var data = item['method_code'].toString();
									if (!fs.existsSync(outFilePath)) {
										fs.mkdirSync(outFilePath);
									}
									fs.writeFile(file, '\ufeff' + wrapFunc(name, data.replace(/\r\n/gm, '\r\n\t').replace(/\t\r/g, '\r').trim()), function() {});
								}
							});
						});
					});
				});
			});
			return arr.concat(folderPromises);
		}, []));
	}).catch(function(er) {
		console.log(er);
	});
};

return Promise.all([parseFolder(paths.core, path.join(paths.destination, 'core')), parseFolder(paths.solutions, paths.destination)]);
