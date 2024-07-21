import { findIndexofCollection } from "../CollectionQuery";

export const positionCollectionsActiveBox = (collectionId,collections) =>{
    const activeBox = document.querySelector('.active-box');
    if (activeBox) {
        activeBox.style.left = `${findIndexofCollection(collectionId,collections) * 8 * 27.2 + 8 * 4}px`;
    }
}