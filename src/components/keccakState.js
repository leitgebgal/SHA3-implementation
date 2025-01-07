import { KECCAK_ROTATION_OFFSETS, KECCAK_ROUND_CONSTANTS } from "../utils/constants";
import { rotateLeft } from "../utils/cryptoUtils";

export class KeccakState {
    constructor() {
        this.state = new Array(25).fill(0n);
    }
    
    // Diffusion step
    theta() {
        const C = new Array(5).fill(0n);
        const D = new Array(5).fill(0n);

        // Step 1: Compute column parities
        for (let x = 0; x < 5; x++) {
            C[x] = this.state[x] ^ this.state[x + 5] ^ this.state[x + 10] ^ this.state[x + 15] ^ this.state[x + 20];
        }

        // Step 2: Compute D values
        // C[(x + 4) % 5] parity of the previous column (cyclically)
        // C[(x + 1) % 5]parity of the next column (cyclically)
        // Next column is rotated left by 1 bit to add diffusion (increase randomness and resistance to attacks)
        for (let x = 0; x < 5; x++) {
            D[x] = C[(x + 4) % 5] ^ rotateLeft(C[(x + 1) % 5], 1n);
        }

        // Step 3: Apply D to all state words
        for (let x = 0; x < 5; x++) {
            for (let y = 0; y < 5; y++) {
                this.state[x + 5 * y] ^= D[x];
            }
        }
    }
    
    // Rotation step
    rho() {
        const newState = [...this.state];
        for (let x = 0; x < 5; x++) {
            for (let y = 0; y < 5; y++) {
                const index = x + 5 * y;
                if (index !== 0) { // Skip (0,0)
                    newState[index] = rotateLeft(
                        this.state[index], 
                        BigInt(KECCAK_ROTATION_OFFSETS[index])
                    );
                }
            }
        }
        this.state = newState;
    }
    
    // Permutation step
    pi() {
        const temp = [...this.state];
        for (let x = 0; x < 5; x++) {
            for (let y = 0; y < 5; y++) {
                // Apply π: (x,y) ← (y, 2x + 3y mod 5)
                const newX = y;
                const newY = (2 * x + 3 * y) % 5;
                
                // Convert 2D coordinates to 1D array indexes
                const oldIndex = x + 5 * y;
                const newIndex = newX + 5 * newY;
                
                this.state[newIndex] = temp[oldIndex];
            }
        }
    }
    
    // Nonlinear step
    chi() {
        const temp = [...this.state];
        for (let x = 0; x < 5; x++) {
            for (let y = 0; y < 5; y++) {
                const index = x + 5 * y;
                // Apply a[i][j][k] ← a[i][j][k] ⊕ (¬a[i][j+1][k] & a[i][j+2][k])
                // ~temp[(x + 1) % 5 + 5 * y] - negated bit in next column in the same row
                // temp[(x + 2) % 5 + 5 * y] - bit two columns ahead in the same row
                this.state[index] = temp[index] ^ ((~temp[(x + 1) % 5 + 5 * y]) & temp[(x + 2) % 5 + 5 * y]);
            }
        }
    }
    
    // Round constant addition
    iota(round) {
        // break symmetry with different constant values between rounds
        this.state[0] ^= KECCAK_ROUND_CONSTANTS[round];
    }
}