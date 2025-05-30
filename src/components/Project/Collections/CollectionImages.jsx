import React, { useState, useEffect } from 'react';
import ImageGallery from '../../ImageGallery/ImageGallery';
import { fetchImages } from '../../../firebase/functions/firestore';
// import { addAllFileSizesToMB } from '../../../utils/fileUtils'; // No longer used here
import UploadButton from '../../UploadButton/UploadButton';
import { useDispatch, useSelector } from 'react-redux';
import { 
    // setUploadList, // To be removed
    // setUploadStatuss, // To be removed
    selectUploadStatus, // Added
    clearUploadSession // Added
} from '../../../app/slices/uploadSlice';
import Lottie from 'react-lottie';
import animationData from '../../../assets/animations/UploadFiles.json';
import { selectDomain } from '../../../app/slices/authSlice';
import DownloadFiles from '../../DownloadFiles/DownloadFiles';
import { findCollectionById } from '../../../utils/CollectionQuery';
import { openModal } from '../../../app/slices/modalSlice';
import ImageGalleryGrid from '../../ImageGallery/ImageGalleryGrid';
import { showAlert } from '../../../app/slices/alertSlice';

const CollectionImages = ({ id, collectionId, project }) => {
    const dispatch = useDispatch();
    const domain = useSelector(selectDomain);
    // dark light mode
    const [displayMode, setDisplayMode] = useState('darkMode');
    const [uploadTrigger, setUploadTrigger] = useState(false);

    // Files
    const [collectionImages, setCollectionImages] = useState([]);
    const [imageUrls, setImageUrls] = useState([]);
    const [selectedImages, setSelectedImages] = useState([]);
    const [isPhotosImported, setIsPhotosImported] = useState(false);
    const [galleryView, setGalleryView] = useState('grid');

    // Import size
    const [showAllPhotos, setShowAllPhotos] = useState(true);
    const [page, setPage] = useState(1);
    const [size, setSize] = useState(16);

    // Upload progress state (uploadList and uploadStatus) is now managed by Redux.
    // Local useState for uploadList and uploadStatus are removed.

    const [copyStatus, setCopyStatus] = useState('Lightroom');
    
    const defaultOptions = {
        loop: true,
        autoplay: true,
        animationData: animationData,
        rendererSettings: {
            preserveAspectRatio: 'xMidYMid slice',
        },
    };

    // Global upload status from Redux
    const globalUploadStatus = useSelector(selectUploadStatus);

    // Handle post-upload actions based on globalUploadStatus
    useEffect(() => {
        if (globalUploadStatus === 'completed') {
            // showAlert('success', 'All files processed successfully!'); // Alert is shown by handleUpload
            setTimeout(() => {
                dispatch(clearUploadSession());
            }, 3000); // Delay before clearing
        } else if (globalUploadStatus === 'failed') {
            // showAlert('error', 'Some files failed to upload.'); // Alert is shown by handleUpload
            setTimeout(() => {
                dispatch(clearUploadSession());
            }, 3000); // Delay before clearing
        }
    }, [globalUploadStatus, dispatch]);

    // Obsolete useEffects for local uploadList and uploadStatus are removed.

    // Initial collection images fetch
    useEffect(() => {
        setShowAllPhotos(true);
        fetchImages(domain, id, collectionId)
            .then((images) => {
                setCollectionImages(images);
            })
            .catch((error) => {
                console.log(error);
            });
        document.title = `${project.name}'s ${collectionId } Gallery`
    }, [collectionId]);

    // Fetch Images
    useEffect(() => {
        if (!collectionImages) {
            setImageUrls([]);
            return;
        }

        if(collectionImages.length === 0) {
            
            
            setUploadTrigger(true);
            
        }
        let start = 0;
        let end = page * size;
        let images = collectionImages.slice(start, end);
        setImageUrls(images);
        setSelectedImages(collectionImages.filter((image) => image.status === 'selected'));
    }, [collectionImages, page]);

    // Show All Photos
    useEffect(() => {
        if (!collectionImages) return;
        if (showAllPhotos) {
            let start = 0;
            let end = page * size;
            let images = collectionImages.slice(start, end);
            setImageUrls(images);
        } else {
            setImageUrls(selectedImages);
        }
    }, [showAllPhotos, collectionImages,selectedImages]);

    // Handle "Open in Lightroom" click
    const handleOpenInLightroom = () => {
        if(selectedImages.length === 0) {
            dispatch(showAlert({
                type:'error',
                message:'No Images Selected'
              }
              ))
            return;
        }
        const selectedFilenames = selectedImages.map((image) => image.name).join(', ');
        navigator.clipboard.writeText(selectedFilenames).then(() => {
            setCopyStatus('Copied');
            setTimeout(() => setCopyStatus('Lightroom'), 2000);
            dispatch(showAlert({
                type:'success',
                message:'Link copied to clipboard'
              }
              ))
        });
    };

    return (
        <div className={`project-collection ${displayMode}`}>
            <div className="dark-light-mode">
                <div className="view-control">
                    <div className="control-wrap">
                        <div className="controls dark-controls">
                            <div className={`control  lightMode ${displayMode === 'lightMode'?'active':''} `}
                                onClick={() => setDisplayMode('lightMode')}
                            >
                                <div className="icon light-view"></div>
                            </div>
                            <div className={`control darkMode ${displayMode === 'darkMode'?'active':''} `}
                                onClick={() => setDisplayMode('darkMode')}
                            >
                                <div className="icon dark-view"></div>
                            </div>
                        </div>
                        <div className="active"></div>
                    </div>
                </div>
            </div>
            
            <div className="header">
                <div className="options">
                    {/* Updated UploadButton props: removed setUploadStatus, setUploadLists; added dispatch */}
                    <UploadButton {...{ 
                        isPhotosImported, 
                        setIsPhotosImported, 
                        imageUrls, 
                        setImageUrls, 
                        // setUploadStatus, // Removed
                        id, 
                        collectionId, 
                        // setUploadLists, // Removed
                        dispatch // Added
                    }} />
                </div>
                {collectionImages?.length > 0 || imageUrls.length > 0  ? (
                    <div className="view-control">
                        <div className="control-label label-all-photos">{collectionImages?.length ? collectionImages?.length: imageUrls.length} Photos</div>
                        <div className="control-wrap">
                            <div className="controls">
                                <div className={`control ${showAllPhotos ? 'active' : ''}`} onClick={() => setShowAllPhotos(true)}>All photos</div>
                                <div className={`control ${!showAllPhotos ? 'active' : ''}`} onClick={() => setShowAllPhotos(false)}>Selected  {selectedImages.length>0&&<div className='favorite selected'></div>}</div>
                            </div>
                            <div className={`active`}></div>
                        </div>
                        <div className={`control-label label-selected-photos ${selectedImages.length>0&&' active'}`}>{selectedImages.length} Photos</div>
                    </div>
                ) : (
                    <div className="empty-message"></div>
                )}
                
                <div className="open-buttons ">
                    { !showAllPhotos ?
                    <><div className={`open-in ${showAllPhotos ? 'disabled' : ''}`} onClick={handleOpenInLightroom}>
                        Copy to <div className="lr button secondary">{copyStatus}</div>
                    </div>
                        <DownloadFiles className={`open-in ${showAllPhotos ? 'disabled' : ''}`} folderPath={`${domain}/${id}/${collectionId}/`} project={project} collection={findCollectionById(project, collectionId)}/>
                        </>:
                    <>
                    <div className="control-wrap">
                        <div className="controls">
                            <div className={`control ctrl-all ${galleryView === 'grid' ? 'active' : ''}`} 
                                onClick={() => setGalleryView('grid')} 
                            ><div className="icon card-view"></div></div>
                            <div className={`control ctrl-active  ${galleryView === 'list' ? 'active' : ''}`} 
                                onClick={() => setGalleryView('list')}
                            ><div className="icon list-view"></div></div>
                        </div>
                    <div className={`active`}></div>
                </div>
                </>}
                </div>
            </div>
            {imageUrls.length > 0 ? (
                galleryView === 'grid' ?
                <ImageGalleryGrid {...{ isPhotosImported, imageUrls, projectId: id,collectionId }} />:
                <ImageGallery {...{ isPhotosImported, imageUrls, projectId: id, collectionId }} />
            ) : (
                <label htmlFor="fileInput" className={`drop-upload ${isPhotosImported ? 'active' : ''}`}>
                    <div className="drop-area">
                        <Lottie options={defaultOptions} height={150} width={150} />
                        <h2>Drop files here</h2>
                        <p>or use the "Upload" Button</p>
                    </div>
                </label>
            )}
            {<div className="image-gallery-bottom-panel">
                {/* <div className="button secondary">Load All</div> */}
                
                {collectionImages?.length !== imageUrls.length && collectionImages?.length >0 && <div className={`button primary`}
                    onClick={() => setPage(page + 1)}
                >Load More</div>}

                {(imageUrls.length !==0 && collectionImages?.length === imageUrls.length)  && <p className='caughtup-label label'>You are all caught up!</p>}

            </div>
}
            
        </div>
    );
};

export default CollectionImages;