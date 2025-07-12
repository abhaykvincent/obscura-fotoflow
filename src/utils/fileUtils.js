import EXIF from 'exif-js';

// write function to add all the sizes of importef files array
export const addAllFileSizesToMB = (files) =>{
    let size = 0;
    for (const file of files) {
        size += file.size;
    }
    return size / 1000000;
}
export const getUsedSpace = (projects) =>{
    const usedSpace = projects.reduce((acc,project) => {
        return acc + project.totalFileSize
    },0)
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

export const extractExifData = (file) => {
    EXIF.getData(file, function() {
        const allMetaData = EXIF.getAllTags(this);
        console.log("EXIF Data:", allMetaData);
    });
};