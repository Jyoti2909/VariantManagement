const xxhashSource = atob(
	'AGFzbQEAAAABIAVgA39/fwF/YAJ/fwF/YAN/f34BfmACfn4BfmACf38AAwUEAAIDBAUDAQABBnEKfwBBsfPd8XkLfwBB95Svr3gLfwBBvdzKlXwLfwBBr9bTvgILfwBBsc/ZsgELfgBCh5Wvr5i23puefwt+AELP1tO+0ser2UILfgBC+fPd8Zn2masWC34AQuPcypX8zvL1hX8LfgBCxc/ZsvHluuonCwcXAwNtZW0CAAV4eGgzMgAABXh4aDY0AAMKkgYEtwIBBX8gACABaiEDIAFBEE8EfyADQRBrIQcgAiMAaiMBaiEEIAIjAWohBSACIQYgAiMAayECA0AgBCAAKAIAIwFsakENdyMAbCEEIAUgAEEEaiIAKAIAIwFsakENdyMAbCEFIAYgAEEEaiIAKAIAIwFsakENdyMAbCEGIAIgAEEEaiIAKAIAIwFsakENdyMAbCECIABBBGoiACAHTQ0ACyAEQQF3IAVBB3cgBkEMdyACQRJ3ampqBSACIwRqCyABaiECAkADQCAAQQRqIANLDQEgAiAAKAIAIwJsakERdyMDbCECIABBBGohAAwACwALAkADQCAAIANPDQEgAiAALQAAIwRsakELdyMAbCECIABBAWohAAwACwALIAIgAkEPdnMjAWwiAiACQQ12cyMCbCICIAJBEHZzC4MDAgJ/A34gACABaiEDIAFBIE8EfiADQSBrIQQgAiMFfCMGfCEFIAIjBnwhBiACQgB8IQcgAiMFfSECA0AgBSAAKQMAIwZ+fEIfiSMFfiEFIAYgAEEIaiIAKQMAIwZ+fEIfiSMFfiEGIAcgAEEIaiIAKQMAIwZ+fEIfiSMFfiEHIAIgAEEIaiIAKQMAIwZ+fEIfiSMFfiECIABBCGoiACAETQ0ACyAFQgGJIAZCB4kgB0IMiSACQhKJfHx8IAUQAiAGEAIgBxACIAIQAgUgAiMJfAsgAa18IQICQANAIABBCGogA0sNASACQgAgACkDACICIwZ+fEIfiSMFfoVCG4kjBX4jCHwhAiAAQQhqIQAMAAsACyAAQQRqIANNBEAgAiAANQIAIwV+hUIXiSMGfiMHfCECIABBBGohAAsCQANAIAAgA08NASACIAAxAAAjCX6FQguJIwV+IQIgAEEBaiEADAALAAsgAiACQiGIhSMGfiICIAJCHYiFIwd+IgIgAkIgiIULGQAgAEIAIAEjBn58Qh+JIwV+hSMFfiMIfAs4AgF/AX4gACICIABBCGogASAANQIAQiCGIABBBGo1AgCEIgMQASIDQiCIPgIAIAJBBGogAz4CAAs='
);

const wasmBytes = Uint8Array.from(
	[].map.call(xxhashSource, (byte) => byte.charCodeAt(0))
);

function writeBufferToMemory(buffer, memory, offset) {
	if (memory.buffer.byteLength < buffer.byteLength + offset) {
		const extraPages = Math.ceil(
			(buffer.byteLength + offset - memory.buffer.byteLength) / (64 * 1024)
		);
		memory.grow(extraPages);
	}
	const u8memory = new Uint8Array(memory.buffer, offset);
	u8memory.set(buffer);
}

async function load() {
	const {
		instance: {
			exports: { mem, xxh32 }
		}
	} = await WebAssembly.instantiate(wasmBytes);
	return function (buffer, seed = 0) {
		const dataArray = new Uint8Array(buffer);
		writeBufferToMemory(dataArray, mem, 0);
		// Logical shift right makes it an u32, otherwise it's interpreted as
		// an i32.
		const h32 = xxh32(0, dataArray.byteLength, seed) >>> 0;
		return h32;
	};
}

const xxHashFunction = load();

onmessage = async function (e) {
	const xxHash = await xxHashFunction;
	const receivedData = e.data.data;
	const fileId = e.data.fileId;
	const offset = e.data.from;
	const result = {
		fileId: fileId,
		offset: offset
	};
	let reader = new FileReaderSync();
	let byteData = null;
	try {
		byteData = reader.readAsArrayBuffer(receivedData);
		result.xxhash = xxHash(byteData);
	} catch (err) {
		result.error = err.message || err.name || 'xxhWorker are failed';
	}

	// we remove links to objects in memory to prevent keeping references and to stable garbage collector working
	reader = null;
	byteData = null;
	postMessage(result);
};
