/* eslint-disable no-console*/
const xxhashLoader = require('./xxHash');
let xxHash;
const {promisify} = require('util');
const fs = require('fs');
const path = require('path');
const statFileAsync = promisify(fs.stat);
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const existsAsync = promisify(fs.exists);
const mkdirAsync = promisify(fs.mkdir);

async function loadXXHash() {
	if (!xxHash) {
		xxHash = await xxhashLoader();
	}
	return xxHash;
}

let rootClientAbsolutePath = process.cwd();
const callFromPortableNodeJs = rootClientAbsolutePath.split(path.sep).pop() === 'nodejs';
if (callFromPortableNodeJs) {
	rootClientAbsolutePath = path.join(rootClientAbsolutePath, '..');
}

const bundleFolder = path.join(rootClientAbsolutePath, 'Modules');
let bundleConfig = path.join(bundleFolder, 'jsBundleList.json');

const cacheFolder = path.join(rootClientAbsolutePath, 'jsBundles');
let cacheConfig = path.join(cacheFolder, 'data.json');

module.exports = {
	cacheModuleList: [],
	getCacheModuleXXHash: function(cacheModule) {
		return this.getHashOfPathsList(cacheModule.listOfDependencies, this.setXXHashFile);
	},
	getCacheModuleTimeHash: function(cacheModule) {
		return this.getHashOfPathsList(cacheModule.listOfDependencies, this.setTimeHashFile);
	},
	getHashOfPathsList: function(pathsList, hashFunction) {
		const hashObject = {};
		const listHashPromises = [];
		pathsList.forEach((path) => {
			listHashPromises.push(hashFunction(path, hashObject));
		});

		return Promise.all(listHashPromises).then(resolve => {
			let moduleHash = '';
			pathsList.forEach((path) => {
				moduleHash += hashObject[path];
			});
			return moduleHash;
		});
	},
	getCacheModuleList: function() {
		if (!fs.existsSync(cacheConfig)) {
			this.cacheModuleList = [];
			return;
		}

		const data = fs.readFileSync(cacheConfig, 'utf8');
		if (!data) {
			return;
		}
		this.cacheModuleList = JSON.parse(data);
		const bundleList = this.getBundleList();
		let clientPathFromCacheConfig = '';

		this.cacheModuleList.forEach((cacheModule) => {
			if (clientPathFromCacheConfig === '') {
				const currenBundletModule = bundleList.find((bundleModule) => {
					return bundleModule.name == cacheModule.name;
				});
				if (!currenBundletModule) {
					return;
				}
				const inputLength = currenBundletModule.input.length - rootClientAbsolutePath.length;
				clientPathFromCacheConfig = cacheModule.srcPath.slice(0, -inputLength);
			}
			const cacheFilePath = cacheModule.srcPath.substring(clientPathFromCacheConfig.length);
			cacheModule.srcPath = path.join(rootClientAbsolutePath, cacheFilePath);
			cacheModule.listOfDependencies = cacheModule.listOfDependencies.map((depPath) => {
				const cacheDepPath = depPath.substring(clientPathFromCacheConfig.length);
				return path.join(rootClientAbsolutePath, cacheDepPath);
			});
		});
	},
	getDependenciesFiles: function(options, bundle) {
		const bundleName = `${options.name}.js`;
		const modules = bundle[bundleName].modules;
		const dependencies = Object.keys(modules).reduce(
			(dependenciesFiles, rollupResultModule) => {
				if (!rollupResultModule.startsWith('\0')) {
					const normalizedPath = path.normalize(rollupResultModule);
					dependenciesFiles.push(normalizedPath);
				}
				return dependenciesFiles;
			}, 
			[]
		);

		// First element in dependencies must be srcPath
		// Rollup can time to time change sorting and API
		const sortedDependencies = dependencies.reverse();

		return sortedDependencies;
	},
	getGenerateHookHandler: function(isUsingXxHash = false) {
		return async (options, bundle) => {
			const rollupDependencyPathList = this.getDependenciesFiles(options, bundle);
			const srcAbsolutePath = rollupDependencyPathList[0];

			const hashFunction = (isUsingXxHash) ? this.setXXHashFile : this.setTimeHashFile;
			const hashString = await this.getHashOfPathsList(rollupDependencyPathList, hashFunction);

			const moduleIndex = this.cacheModuleList.findIndex(module => {
				return module.srcPath === srcAbsolutePath && module.name === options.name;
			});

			if (moduleIndex > -1) {
				this.cacheModuleList.splice(moduleIndex, 1);
			}

			const moduleCacheInfo = {
				name: options.name,
				srcPath: srcAbsolutePath,
				listOfDependencies: rollupDependencyPathList,
				moduleHash: hashString
			};
			this.cacheModuleList.push(moduleCacheInfo);
			await this.writeCacheConfigFile();
		};
	},
	writeCacheConfigFile: async function() {
		if (!await existsAsync(cacheFolder)) {
			await mkdirAsync(cacheFolder);
		}
		return await writeFileAsync(cacheConfig, JSON.stringify(this.cacheModuleList));
	},
	setXXHashFile: async function(filePath, hashStorage) {
		await loadXXHash();
		const file = await readFileAsync(filePath);
		hashStorage[filePath] = xxHash(file, 0xCAFEBABE);
	},
	setTimeHashFile: async function(filePath, hashStorage) {
		const fileInfo = await statFileAsync(filePath);
		hashStorage[filePath] = fileInfo.mtime.getTime() / 1000 | 0;
	},
	getBundleList: function() {
		let listOfBundles = {};
		if (fs.existsSync(bundleConfig)) {
			listOfBundles = JSON.parse(fs.readFileSync(bundleConfig, 'utf8'));
		}

		return Object.keys(listOfBundles).map((moduleName) => {
			return {
				name: moduleName,
				input: path.join(bundleFolder, listOfBundles[moduleName]),
				file: path.join(cacheFolder, moduleName + '.js')
			};
		});
	}
};
