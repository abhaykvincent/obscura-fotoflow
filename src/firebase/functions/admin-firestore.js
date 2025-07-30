import { db } from "../app";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";

/**
 * Migrates all collections for all projects within a studio.
 * This function can be used to update the data structure of collections.
 * For example, adding a new field like 'version'.
 * @param {string} domain - The studio domain.
 */
export const migrateCollectionsByStudio = async (domain) => {
    console.log(`Starting migration for studio: ${domain}`);

    const studioDocRef = doc(db, 'studios', domain);
    const projectsCollectionRef = collection(studioDocRef, 'projects');
    const projectsSnapshot = await getDocs(projectsCollectionRef);

    if (projectsSnapshot.empty) {
        console.log(`No projects found for studio: ${domain}`);
        return;
    }

    for (const projectDoc of projectsSnapshot.docs) {
        const projectId = projectDoc.id;
        const projectData = projectDoc.data();
        const projectRef = doc(db, 'studios', domain, 'projects', projectId);

        console.log(`Migrating collections for project: ${projectId}`);

        if (projectData.collections && projectData.collections.length > 0) {
            const updatedCollections = projectData.collections.map(collection => {
                // Example migration: add version if it doesn't exist
                if (collection.version === undefined) {
                    return {
                        ...collection,
                        status: 'visible', // Default status if not set
                        version: 2, // or some other migration logic
                    };
                }
                return collection;
            });

            try {
                await updateDoc(projectRef, { collections: updatedCollections });
                console.log(`Successfully migrated collections for project: ${projectId}`);
            } catch (error) {
                console.error(`Error migrating collections for project ${projectId}:`, error);
            }
        } else {
            console.log(`No collections to migrate for project: ${projectId}`);
        }
    }

    console.log(`Migration completed for studio: ${domain}`);
};
