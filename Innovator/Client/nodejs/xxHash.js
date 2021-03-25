const fs = require('fs');
const wasmBytes = new Uint8Array(fs.readFileSync(__dirname + '/xxhash.wasm'));

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

async function xxhash() {
	const {
		instance: { exports: { mem, xxh32 } }
	} = await WebAssembly.instantiate(wasmBytes);
	return function(buffer, seed = 0) {
			const dataArray = new Uint8Array(buffer);
			writeBufferToMemory(dataArray, mem, 0);
			// Logical shift right makes it an u32, otherwise it's interpreted as
			// an i32.
			const h32 = xxh32(0, dataArray.byteLength, seed) >>> 0;
			return h32;
		};
}

module.exports = xxhash;
