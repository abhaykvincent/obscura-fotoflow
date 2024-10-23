import React, { useState, useEffect } from 'react';
import ImageGallery from '../../ImageGallery/ImageGallery';
import { fetchImages } from '../../../firebase/functions/firestore';
import { addAllFileSizesToMB } from '../../../utils/fileUtils';
import UploadButton from '../../UploadButton/UploadButton';
import { useDispatch, useSelector } from 'react-redux';
import { setUploadList, setUploadStatuss } from '../../../app/slices/uploadSlice';
import Lottie from 'react-lottie';
import animationData from '../../../assets/animations/UploadFiles.json';
import { selectDomain } from '../../../app/slices/authSlice';
import DownloadFiles from '../../DownloadFiles/DownloadFiles';
import { findCollectionById } from '../../../utils/CollectionQuery';
import { openModal } from '../../../app/slices/modalSlice';
import ImageGalleryGrid from '../../ImageGallery/ImageGalleryGrid';

const CollectionImages = ({ id, collectionId, project }) => {
    const dispatch = useDispatch();
    const domain = useSelector(selectDomain);

    // Files
    const [collectionImages, setCollectionImages] = useState([]);
    const [imageUrls, setImageUrls] = useState([]);
    const [selectedImages, setSelectedImages] = useState([]);
    const [isPhotosImported, setIsPhotosImported] = useState(false);
    const [galleryView, setGalleryView] = useState('grid');

    // Import size
    const [showAllPhotos, setShowAllPhotos] = useState(true);
    const [page, setPage] = useState(1);
    const [size, setSize] = useState(30);

    // Upload progress
    const [uploadList, setUploadLists] = useState([]);
    const [uploadStatus, setUploadStatus] = useState('close');
    const defaultOptions = {
        loop: true,
        autoplay: true,
        animationData: animationData,
        rendererSettings: {
            preserveAspectRatio: 'xMidYMid slice',
        },
    };

    // ON Upload status
    useEffect(() => {
        if (uploadStatus === 'completed') {
            setTimeout(() => setUploadStatus('close'), 1000);
        }
        dispatch(setUploadStatuss(uploadStatus));
    }, [uploadStatus]);

    useEffect(() => {
        dispatch(setUploadList(uploadList));
    }, [uploadList]);

    useEffect(() => {
        console.log(imageUrls);
    }, [imageUrls]);


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
    }, [collectionId]);

    // Fetch Images
    useEffect(() => {
        if (!collectionImages) {
            setImageUrls([]);
            return;
        }
        let start = 0;
        let end = page * size;
        let images = collectionImages.slice(start, end);
        setImageUrls(images);
        console.log(page);
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
        const selectedFilenames = selectedImages.map((image) => image.name); // Assuming 'filename' is a property of the image object
        console.log('Selected filenames for Lightroom:', selectedFilenames);
        // Perform any additional actions here, e.g., open Lightroom with the selected files
    };

    return (
        <div className="project-collection">
            <div className="header">
                <div className="options">
                    <UploadButton {...{ isPhotosImported, setIsPhotosImported, imageUrls, setImageUrls, setUploadStatus, id, collectionId, setUploadLists }} />
                </div>
                {collectionImages?.length > 0 ? (
                    <div className="view-control">
                        <div className="control-label label-all-photos">{collectionImages.length} Photos</div>
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
                        Open in <div className="lr button secondary">Lightroom</div>
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
                <label htmlFor="fileInput" className="drop-upload">
                    <div className="drop-area">
                        <Lottie options={defaultOptions} height={150} width={150} />
                        <h2>Drop files here</h2>
                        <p>or use the "Upload" Button</p>
                    </div>
                </label>
            )}
            <div className="image-gallery-bottom-panel">
                {/* <div className="button secondary">Load All</div> */}
                
                <div className={`button primary ${collectionImages.length === imageUrls.length ? 'disabled' : ''}`}
                    onClick={() => setPage(page + 1)}
                >Load More</div>
            </div>
        </div>
    );
};

export default CollectionImages;
