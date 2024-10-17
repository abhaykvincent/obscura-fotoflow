import { findIndexofCollection } from "../CollectionQuery";

export const positionCollectionsActiveBox = (collectionId,collections) =>{
    const activeBox = document.querySelector('.active-box');
    if (activeBox) {
        activeBox.style.left = `${findIndexofCollection(collectionId,collections) * 8 * 26 + 8 * 4}px`;
    }
}