import { KeccakState } from "./keccakState";
import { fromString } from "../utils/cryptoUtils";

export class SHA3 {
    constructor(outputBits = 256) {
        this.outputBits = outputBits;
        this.rate = 1600 - (2 * outputBits); // in bits
        this.blockSize = this.rate / 8;  // Convert to bytes
        this.state = new KeccakState();
        this.buffer = new Uint8Array(this.blockSize);
        this.bufferIndex = 0;
    }
    
    // Absorption phase: absorb input data into the state
    absorb(data) {
        let input;
        console.log(typeof data);
        if (typeof data === 'string') {
            // Handle string input
            input = new TextEncoder().encode(data);
        } else if (data instanceof ArrayBuffer) {
            // Handle ArrayBuffer
            input = new Uint8Array(data);
        } else if (data instanceof Uint8Array) {
            // Already a Uint8Array
            input = data;
        } else if (ArrayBuffer.isView(data)) {
            // Handle other TypedArrays
            input = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
        } else {
            throw new Error("Unsupported input type for absorb method.");
        }

        for (let i = 0; i < input.length; i++) {
            this.buffer[this.bufferIndex++] = input[i];
            if (this.bufferIndex === this.blockSize) {
                this.absorbBlock();
                this.bufferIndex = 0;
            }
        }

        return this;
    }
    
    // Absorb a single block into the state
    absorbBlock() {
        // XOR input with state
        for (let i = 0; i < this.blockSize / 8; i++) {
            const value =
                BigInt(this.buffer[i * 8]) |
                (BigInt(this.buffer[i * 8 + 1]) << 8n) |
                (BigInt(this.buffer[i * 8 + 2]) << 16n) |
                (BigInt(this.buffer[i * 8 + 3]) << 24n) |
                (BigInt(this.buffer[i * 8 + 4]) << 32n) |
                (BigInt(this.buffer[i * 8 + 5]) << 40n) |
                (BigInt(this.buffer[i * 8 + 6]) << 48n) |
                (BigInt(this.buffer[i * 8 + 7]) << 56n); // Little-endian format
            this.state.state[i] ^= value;
        }

        // Perform Keccak-f[1600] permutation
        this.keccakF1600();
    }

    // Keccak-f[1600] permutation - 24 rounds
    keccakF1600() {
        for (let round = 0; round < 24; round++) {
            this.state.theta();
            this.state.rho();
            this.state.pi();
            this.state.chi();
            this.state.iota(round);
        }
    }
  
    // Squeezing phase: finalize absorption and squeeze out the hash
    squeeze() {
        // Pad and absorb final block
        this.buffer[this.bufferIndex++] = 0x06; // SHA-3 domain separator
        // Fill with zeros, leaving space for final bit
        while (this.bufferIndex < this.blockSize - 1) {
            this.buffer[this.bufferIndex++] = 0x00;
        }
        this.buffer[this.blockSize - 1] = 0x80; // Final bit      

        this.absorbBlock();

        // Squeeze out the hash value
        const hash = new Uint8Array(this.outputBits / 8);
        for (let i = 0; i < hash.length / 8; i++) {
            const value = this.state.state[i];
            for (let j = 0; j < 8; j++) {
                hash[i * 8 + j] = Number((value >> BigInt(j * 8)) & 0xFFn); // Extract byte-by-byte
            }
        }

        return hash;
    }
}