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