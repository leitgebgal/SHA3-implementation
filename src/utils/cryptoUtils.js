export const rotateLeft = (x, n) => {
    return ((x << n) | (x >> (64n - n))) & 0xFFFFFFFFFFFFFFFFn; // Ensure 64-bit rotation
};

export const fromString = (str) => {
    return new TextEncoder().encode(str); // Ensures UTF-8 encoding
};