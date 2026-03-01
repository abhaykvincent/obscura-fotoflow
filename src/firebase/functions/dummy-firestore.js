import { db } from "../app";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { generateRandomString } from "../../utils/stringUtils";
import { addProjectToStudio } from "./project-firestore";

// Project Operations

/**
 * Create multiple dummy projects for development/testing.
 * @param {string} domain - Studio domain.
 * @param {number} n - Number of dummy projects to create.
 */
export const createDummyProjectsInFirestore = async (domain, n = 5) => {
    console.log(domain);

    // Arrays for realistic random data
    const firstNames = ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank', 'Grace', 'Heidi', 'Ivan', 'Judy', 'Kevin', 'Liam', 'Mia', 'Noah', 'Olivia', 'Peter', 'Quinn', 'Rachel', 'Sam', 'Tina', 'Uma', 'Victor', 'Wendy', 'Xavier', 'Yara', 'Zoe'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Lee', 'Perez', 'Thompson', 'Moore', 'Wright', 'King'];
    const businessNames = ['Elite Events', 'Pixel Perfect Studio', 'Moment Makers', 'Timeless Captures', 'Dream Lens Photography', 'The Artful Shutter', 'Infinite Frames'];
    const locations = ['New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ', 'Philadelphia, PA', 'San Antonio, TX', 'San Diego, CA', 'Dallas, TX', 'San Jose, CA'];

    const projectTypes = ['Wedding', 'Baptism', 'Birthday', 'Maternity', 'Newborn', 'Headshot', 'Anniversary', 'Family'];
    const projectStatuses = ['draft', 'active', 'selected', 'completed', 'archived'];
    const collectionNames = ['Originals', 'High Res', 'Web Quality', 'Selections', 'Highlights', 'Ceremony', 'Reception'];

    const now = Date.now();
    const thirteenMonthsAgo = new Date();
    thirteenMonthsAgo.setMonth(thirteenMonthsAgo.getMonth() - (13*2));
    const thirteenMonthsMs = now - thirteenMonthsAgo.getTime();

    for (let i = 1; i <= n; i++) {
        let projectName;
        let clientName;
        const nameType = Math.random();

        if (nameType < 0.4) {
            const name1 = `${firstNames[Math.floor(Math.random() * firstNames.length)]}`;
            const name2 = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
            projectName = `${name1} & ${name2}`;
            clientName = `${lastNames[Math.floor(Math.random() * lastNames.length)]} Family`;
        } else if (nameType < 0.8) {
            const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
            const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
            projectName = `${firstName} ${lastName}`;
            clientName = `${firstName} ${lastName}`;
        } else {
            projectName = businessNames[Math.floor(Math.random() * businessNames.length)];
            clientName = `Client ${Math.floor(100 + Math.random() * 900)}`;
        }

        const optionalName2 = Math.random() < 0.5 ?
            `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}` :
            '';

        const randomOffset = Math.floor(Math.random() * thirteenMonthsMs);
        const createdAt = now - randomOffset;

        // Dummy Collections Metadata (to be updated later with counts)
        const dummyCollectionsMeta = Array.from({ length: Math.floor(Math.random() * 2) + 2 }, () => ({
            id: `${collectionNames[Math.floor(Math.random() * collectionNames.length)].toLowerCase()}-${generateRandomString(5)}`,
            name: collectionNames[Math.floor(Math.random() * collectionNames.length)],
            status: 'visible',
            filesCount: 0,
            galleryCover: '',
            favoriteImages: []
        }));

        let totalProjectFilesCount = 0;
        let totalProjectSize = 0;
        let firstImageUrl = '';

        const dummyProject = {
            name: projectName,
            name2: optionalName2,
            type: projectTypes[Math.floor(Math.random() * projectTypes.length)],
            projectValidityMonths: [3, 6, 12][i % 3],
            createdAt: createdAt,
            status: projectStatuses[Math.floor(Math.random() * projectStatuses.length)],
            collections: dummyCollectionsMeta,
            events: [],
            payments: [],
            expenses: [],
            budgets: {},
            projectCover: '',
            pin: Math.floor(1000 + Math.random() * 9000).toString(),
            description: `This is a dummy project for development and testing. #${i} - Client: ${clientName || projectName}`,
            totalFileSize: 0,
            uploadedFilesCount: 0
        };

        const addedProject = await addProjectToStudio(domain, dummyProject);
        const projectDocRef = doc(db, 'studios', domain, 'projects', addedProject.id);

        const projectEvents = [];

        // Process each collection
        for (const coll of dummyCollectionsMeta) {
            const numImages = Math.floor(Math.random() * 15) + 10; // 10-25 images
            const images = Array.from({ length: numImages }, (_, imgIdx) => {
                const isSelected = Math.random() > 0.7; // 30% chance of being selected
                const imgUrl = `https://picsum.photos/seed/${coll.id}-${imgIdx}/1200/800`;
                if (!firstImageUrl) firstImageUrl = imgUrl;
                
                return {
                    name: `image-${imgIdx}.jpg`,
                    url: imgUrl,
                    lastModified: createdAt,
                    dateTimeOriginal: new Date(createdAt).toISOString(),
                    dimensions: { width: 1200, height: 800 },
                    thumbAvailable: true,
                    status: isSelected ? 'selected' : 'unselected'
                };
            });

            coll.filesCount = numImages;
            coll.galleryCover = images[0].url;
            coll.favoriteImages = images.slice(1, 4).map(img => img.url);
            
            const collectionSize = numImages * 0.5;
            totalProjectFilesCount += numImages;
            totalProjectSize += collectionSize;

            // Add Image Grid Event (simulating actual upload logic)
            projectEvents.push({
                type: 'image-grid',
                id: `image-grid-${coll.id}-${createdAt}`,
                images: images,
                collectionId: coll.id,
                date: createdAt,
            });

            // Add Upload Completion Event (simulating actual upload logic)
            projectEvents.push({
                id: `upload-completion-${coll.id}-${createdAt}`,
                type: coll.name,
                date: createdAt,
                location: '',
                crews: [],
                collectionId: coll.id,
                filesCount: numImages,
                totalSize: collectionSize,
            });

            const collectionDoc = {
                id: coll.id,
                name: coll.name,
                status: coll.status,
                uploadedFiles: images,
                smartGallery: {
                    id: coll.id,
                    name: coll.name,
                    sections: [
                        {
                            id: `image-grid-${coll.id}`,
                            type: 'image-grid',
                            order: 1,
                            images: images
                        }
                    ],
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                }
            };
            const collectionRef = doc(db, 'studios', domain, 'projects', addedProject.id, 'collections', coll.id);
            await setDoc(collectionRef, collectionDoc);
        }

        // Dummy Main Event
        projectEvents.push({
            id: `event-${generateRandomString(5)}`,
            type: dummyProject.type,
            date: createdAt,
            location: locations[Math.floor(Math.random() * locations.length)],
            crews: []
        });

        // Final Project Update with aggregated data
        await updateDoc(projectDocRef, {
            collections: dummyCollectionsMeta,
            events: projectEvents,
            totalFileSize: totalProjectSize,
            uploadedFilesCount: totalProjectFilesCount,
            projectCover: firstImageUrl,
            payments: Array.from({ length: 1 }, () => ({
                id: `payment-${generateRandomString(5)}`,
                amount: 1500,
                date: createdAt,
                description: 'Initial Deposit',
                status: 'paid'
            })),
            budgets: {
                totalBudget: 3000,
                allocatedFunds: 2400,
                remainingFunds: 600
            }
        });
    }
    console.log(`Created ${n} fully populated dummy projects in studio: ${domain}`);
};
