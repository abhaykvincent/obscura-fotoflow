import * as ExifReader from 'exifreader';
import { db } from '../firebase/app';
import { doc, updateDoc } from 'firebase/firestore';

// write function to add all the sizes of importef files array
export const addAllFileSizesToMB = (files) => {
    let size = 0;
    for (const file of files) {
        size += file.size;
    }
    return size / 1000000;
}
export const getUsedSpace = (projects) => {
    const usedSpace = projects.reduce((acc, project) => {
        return acc + project.totalFileSize
    }, 0)
    return usedSpace
}

// File type validation
export const validateFileTypes = (files) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    for (let file of files) {
        if (!allowedTypes.includes(file.type)) {
            return false;
        }
    }
    return true;
};

export const extractExifData = async (file) => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const tags = ExifReader.load(arrayBuffer);
        delete tags['Thumbnail'];
        return tags;
    } catch (error) {
        console.error("Error reading EXIF data:", error);
        return null;
    }
};

