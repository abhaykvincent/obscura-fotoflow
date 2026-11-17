import {
    BYTES_PER_MB,
    bytesToMB,
    mbToBytes,
    toByteSize,
    isValidByteSize,
    projectTotalFileSizeToMB,
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

    it('reads legacy project totals stored in MB', () => {
        expect(projectTotalFileSizeToMB({ totalFileSize: 75.177, uploadedFilesCount: 40 })).toBe(75.177);
        expect(projectTotalFileSizeToMB({ totalFileSize: 0.777, uploadedFilesCount: 2 })).toBe(0.777);
        expect(projectTotalFileSizeToMB({ totalFileSize: 12 })).toBe(12);
    });

    it('reads new project totals stored in bytes', () => {
        expect(projectTotalFileSizeToMB({ totalFileSize: 2_349_898, uploadedFilesCount: 1 })).toBeCloseTo(2.349898);
        expect(projectTotalFileSizeToMB({ totalFileSize: 10_000_000, uploadedFilesCount: 5 })).toBe(10);
    });

    it('treats missing project totals as zero', () => {
        expect(projectTotalFileSizeToMB({})).toBe(0);
        expect(projectTotalFileSizeToMB({ totalFileSize: null })).toBe(0);
    });
});
