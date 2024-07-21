export const findCollectionById = (project,collectionId) => {
    const collection = project.collections.find((col) => col.id === collectionId);
    return collection ? collection : 'Collection not found';
  };
export const findIndexofCollection = (collectionId,collections) => {
    return collections.findIndex((collection) => collection.id === collectionId);
  };