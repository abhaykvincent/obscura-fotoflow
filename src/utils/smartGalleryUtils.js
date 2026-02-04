import { toTitleCase } from './stringUtils';

export const organizePhotos = (photos, collectionId, existingSections = []) => {
    if (!photos || photos.length === 0) return existingSections;

    // Helper to get time from photo
    const getPhotoTime = (p) => new Date(p.dateTimeOriginal || p.lastModified).getTime();

    // 1. Sort new photos
    const sortedNewPhotos = [...photos].sort((a, b) => getPhotoTime(a) - getPhotoTime(b));

    // Deep copy existing sections to avoid mutation side effects
    let sections = JSON.parse(JSON.stringify(existingSections));
    const TIME_GAP_THRESHOLD = 1 * 60 * 1000;

    // Helper to get time from section
    const getSectionTime = (section) => {
        // Try to get from ID first if it follows pattern
        // ID format: type-collectionId-startTime
        const parts = section.id.split('-');
        const possibleTime = parseInt(parts[parts.length - 1]);
        if (!isNaN(possibleTime) && possibleTime > 1000000000000) {
            return possibleTime;
        }
        // Fallback: check images if it's a grid
        if (section.type === 'image-grid' && section.images && section.images.length > 0) {
            return getPhotoTime(section.images[0]);
        }
        return 0; // Unknown time
    };

    const unmergedPhotos = [];

    sortedNewPhotos.forEach(photo => {
        const photoTime = getPhotoTime(photo);
        let merged = false;

        for (let section of sections) {
            if (section.type === 'image-grid') {
                // Check if grid has images to compare against
                if (section.images && section.images.length > 0) {
                     const firstImgTime = getPhotoTime(section.images[0]);
                     const lastImgTime = getPhotoTime(section.images[section.images.length - 1]);

                     // Check overlap or proximity (within 30 mins of range)
                     if ( (photoTime >= firstImgTime - TIME_GAP_THRESHOLD) &&
                          (photoTime <= lastImgTime + TIME_GAP_THRESHOLD) ) {
                         
                         section.images.push(photo);
                         // Re-sort this section immediately
                         section.images.sort((a, b) => getPhotoTime(a) - getPhotoTime(b));
                         merged = true;
                         break;
                     }
                } else {
                    // Empty grid, check ID time
                    const sTime = getSectionTime(section);
                    if (Math.abs(photoTime - sTime) <= TIME_GAP_THRESHOLD) {
                         if (!section.images) section.images = [];
                         section.images.push(photo);
                         merged = true;
                         break;
                    }
                }
            }
        }

        if (!merged) {
            unmergedPhotos.push(photo);
        }
    });

    // Create sections for unmerged photos
    const newSections = [];
    if (unmergedPhotos.length > 0) {
        let currentGroup = [];
        let groupStartTime = getPhotoTime(unmergedPhotos[0]);

        unmergedPhotos.forEach((photo, i) => {
             const pTime = getPhotoTime(photo);
             if (i === 0) {
                 currentGroup.push(photo);
                 return;
             }
             // Check against previous photo in this new batch
             const prevTime = getPhotoTime(unmergedPhotos[i-1]);
             
             if (pTime - prevTime > TIME_GAP_THRESHOLD) {
                 newSections.push(...createSectionsForGroup(currentGroup, groupStartTime, collectionId));
                 currentGroup = [photo];
                 groupStartTime = pTime;
             } else {
                 currentGroup.push(photo);
             }
        });
        if (currentGroup.length > 0) {
            newSections.push(...createSectionsForGroup(currentGroup, groupStartTime, collectionId));
        }
    }

    // Combine and Sort
    const allSections = [...sections, ...newSections];

    // Annotate with sort time
    const sectionsWithTime = allSections.map(s => ({
        section: s,
        time: getSectionTime(s),
        typePriority: s.type === 'text-block' ? 0 : 1
    }));

    sectionsWithTime.sort((a, b) => {
        if (a.time !== b.time) return a.time - b.time;
        return a.typePriority - b.typePriority;
    });

    // Re-index
    return sectionsWithTime.map((item, index) => ({
        ...item.section,
        order: index + 1
    }));
};

const createSectionsForGroup = (images, startTime, collectionId) => {
    const date = new Date(startTime);
    const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateString = date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    
    return [
        {
            id: `text-block-${collectionId}-${startTime}`,
            type: 'text-block',
            content: `<h3 style="text-align: center;">${dateString} • ${timeString}</h3>`,
            order: 0
        },
        {
            id: `image-grid-${collectionId}-${startTime}`,
            type: 'image-grid',
            images: images,
            order: 0,
            gridSettings: {
                columns: 3,
                spacing: '16px',
            }
        }
    ];
};
