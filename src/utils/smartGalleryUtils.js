import { toTitleCase } from './stringUtils';

export const organizePhotos = (photos, collectionId, startOrder = 1) => {
    if (!photos || photos.length === 0) return [];

    // 1. Sort photos by Date
    const sortedPhotos = [...photos].sort((a, b) => {
        const dateA = new Date(a.dateTimeOriginal || a.lastModified).getTime();
        const dateB = new Date(b.dateTimeOriginal || b.lastModified).getTime();
        return dateA - dateB;
    });

    const sections = [];
    // 30 minutes in milliseconds
    const TIME_GAP_THRESHOLD = 30 * 60 * 1000; 

    let currentGroupImages = [];
    let groupStartTime = null;
    let currentOrder = startOrder;

    sortedPhotos.forEach((photo, index) => {
        // Fallback to lastModified if dateTimeOriginal is invalid/missing
        const photoTime = new Date(photo.dateTimeOriginal || photo.lastModified).getTime();

        if (index === 0) {
            currentGroupImages.push(photo);
            groupStartTime = photoTime;
            return;
        }

        const prevPhotoTime = new Date(sortedPhotos[index - 1].dateTimeOriginal || sortedPhotos[index - 1].lastModified).getTime();
        const timeDiff = photoTime - prevPhotoTime;

        if (timeDiff > TIME_GAP_THRESHOLD) {
            // Close current group
            addSectionsForGroup(sections, currentGroupImages, groupStartTime, collectionId, currentOrder);
            currentOrder += 2; // Increment by 2 (Text + Grid)
            
            // Start new group
            currentGroupImages = [photo];
            groupStartTime = photoTime;
        } else {
            currentGroupImages.push(photo);
        }
    });

    // Close final group
    if (currentGroupImages.length > 0) {
        addSectionsForGroup(sections, currentGroupImages, groupStartTime, collectionId, currentOrder);
    }

    return sections;
};

const addSectionsForGroup = (sections, images, startTime, collectionId, order) => {
    const date = new Date(startTime);
    const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateString = date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    
    // Create Text Block Section (Header)
    sections.push({
        id: `text-block-${collectionId}-${startTime}`,
        type: 'text-block',
        content: `<h3 style="text-align: center;">${dateString} • ${timeString}</h3>`,
        order: order
    });

    // Create Image Grid Section
    sections.push({
        id: `image-grid-${collectionId}-${startTime}`,
        type: 'image-grid',
        images: images,
        order: order + 1,
        gridSettings: {
            columns: 3,
            spacing: '16px',
        }
    });
};
