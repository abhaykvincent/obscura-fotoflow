import {
    BYTES_PER_MB,
    bytesToMB,
    mbToBytes,
    toByteSize,
    isValidByteSize,
} from './storageUnits';

describe('storageUnits - byte/MB contract', () => {
    it('uses decimal MB (1 MB = 1,000,000 bytes)', () => {
        expect(BYTES_PER_MB).toBe(1_000_000);
        expect(bytesToMB(10_000_000)).toBe(10);
        expect(bytesToMB(250_000)).toBe(0.25);
        expect(mbToBytes(10)).toBe(10_000_000);
    });

    it('treats missing sizes as zero', () => {
        expect(toByteSize(undefined)).toBe(0);
        expect(toByteSize(null)).toBe(0);
        expect(bytesToMB('')).toBe(0);
    });

    it('rejects negative, NaN, infinite and non-numeric values', () => {
        expect(() => toByteSize(-1)).toThrow(RangeError);
        expect(() => toByteSize(NaN)).toThrow(RangeError);
        expect(() => toByteSize(Infinity)).toThrow(RangeError);
        expect(() => toByteSize('not-a-number')).toThrow(RangeError);
        expect(() => bytesToMB(-1)).toThrow(RangeError);
    });

    it('validates byte sizes without throwing', () => {
        expect(isValidByteSize(0)).toBe(true);
        expect(isValidByteSize(1_000_000)).toBe(true);
        expect(isValidByteSize(-1)).toBe(false);
        expect(isValidByteSize(Infinity)).toBe(false);
    });
});
