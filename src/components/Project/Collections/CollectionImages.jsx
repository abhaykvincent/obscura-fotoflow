import React, { useState, useEffect, useRef } from 'react';

import ImageGallery from '../../ImageGallery/ImageGallery';
import { fetchImages } from '../../../firebase/functions/firestore';
import { addAllFileSizesToMB, validateFileTypes } from '../../../utils/fileUtils';
import UploadButton from '../../UploadButton/UploadButton';
import { useDispatch, useSelector } from 'react-redux';
import { 
    selectUploadStatus,
    clearUploadSession
} from '../../../app/slices/uploadSlice';
import animationData from '../../../assets/animations/UploadFiles.json';
import { selectDomain, selectUserStudio } from '../../../app/slices/authSlice';
import DownloadFiles from '../../DownloadFiles/DownloadFiles';
import { findCollectionById } from '../../../utils/CollectionQuery';
import { openModal } from '../../../app/slices/modalSlice';
import ImageGalleryGrid from '../../ImageGallery/ImageGalleryGrid';
import { showAlert } from '../../../app/slices/alertSlice';
import { selectStudio, selectStudioStorageUsage } from '../../../app/slices/studioSlice';
import { handleUpload } from '../../../utils/uploadOperations';
import { createNotification } from '../../../app/slices/notificationSlice';
import { updateCollectionStatus } from '../../../app/slices/projectsSlice';
import ImageGalleryDesigner from '../../ImageGalleryDesigner/ImageGalleryDesigner';
import { selectGalleryMode, setGalleryMode } from '../../../app/slices/gallerySlice';
import { getOperatingSystem } from '../../../utils/generalUtils';

const CollectionImages = ({ id, collectionId, project, setSelectedCount }) => {
    const projectCollectionRef = useRef(null);
    const dispatch = useDispatch();
    const galleryMode = useSelector(selectGalleryMode);
    const domain = useSelector(selectDomain);
    const storageLimit = useSelector(selectStudioStorageUsage);
    const currentStudio = useSelector(selectUserStudio);
    const studio = useSelector(selectStudio);
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

    const [copyStatus, setCopyStatus] = useState('Desktop');
    
    const defaultOptions = {
        loop: true,
        autoplay: true,
        animationData: animationData,
        rendererSettings: {
            preserveAspectRatio: 'xMidYMid slice',
        },
    };

    const galleryPageRef = useRef(null);
    const loaderRef = useRef(null);

    useEffect(() => {
        galleryPageRef.current = document.querySelector('.gallery-page');

        const handleScroll = () => {
            if (projectCollectionRef.current && galleryPageRef.current) {
                const projectCollectionTop = projectCollectionRef.current.getBoundingClientRect().top;
                const galleryPageTop = galleryPageRef.current.getBoundingClientRect().top;

                if (projectCollectionTop <= galleryPageTop + 8) {
                    projectCollectionRef.current.classList.add('scrolled-top');
                } else {
                    projectCollectionRef.current.classList.remove('scrolled-top');
                }
            }
        };

        if (galleryPageRef.current) {
            galleryPageRef.current.addEventListener('scroll', handleScroll);
        }

        return () => {
            if (galleryPageRef.current) {
                galleryPageRef.current.removeEventListener('scroll', handleScroll);
            }
        };
    }, []);

    // Infinite scroll observer
    useEffect(() => {
        if (!showAllPhotos || !galleryPageRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && collectionImages?.length > imageUrls.length) {
                    setPage((prevPage) => prevPage + 1);
                }
            },
            {
                root: galleryPageRef.current,
                rootMargin: '600px', // Trigger load more 600px before reaching the bottom for preloading
            }
        );

        const currentLoader = loaderRef.current;
        if (currentLoader) {
            observer.observe(currentLoader);
        }

        return () => {
            if (currentLoader) {
                observer.unobserve(currentLoader);
            }
        };
    }, [collectionImages?.length, imageUrls.length, showAllPhotos, galleryPageRef.current]);

    // Global upload status from Redux
    const globalUploadStatus = useSelector(selectUploadStatus);

    const handleDroppedFiles = async (files) => {
        const selectedFiles = Array.from(files);
        const importFileSize = addAllFileSizesToMB(selectedFiles);
    
        // Validate file types
        if (!validateFileTypes(selectedFiles)) {
            dispatch(showAlert({ type: 'error', message: 'Currently, only .jpg, .jpeg, and .png. More to come!' }));
            return; // Exit if files are not valid
        }
        setIsPhotosImported(true);
    
        
        // If Space Available
        // Upload files and update storage usage
        if (importFileSize < (storageLimit?.quota -  storageLimit?.used) ) {
          try {
            const startTime = Date.now();  // Record the start time
    
            // Handle upload Operation - Updated call
            const resp = await handleUpload({
              domain,
              files: selectedFiles,
              id,
              collectionId,
              importFileSize,
              dispatch,
              collectionName: findCollectionById(project, collectionId)?.name,
              bucketUrl: studio.bucketUrl
            });
    
            const endTime = Date.now();  // Record the end time
            const duration = (endTime - startTime) / 1000;  // Calculate duration in seconds
            console.log(`%c Upload Session Duration : ${duration} seconds`, 'color:#32adf0');
                
            const uploadedImages = resp.uploadedFiles
    
            setImageUrls(prevUrls => [...prevUrls, ...uploadedImages]);
            
            const dispatchNotification = () => {
              dispatch(
                createNotification({
                  studioId: currentStudio.domain, // Replace with the appropriate project or studio ID
                  notificationData: {
                    title: '', // Updated title
                    message: `${uploadedImages.length }new photos uploaded`, // Updated message
                    type: 'project', // Changed type to 'project'
                    actionLink: '/projects', // Updated action link to navigate to projects
                    priority: 'normal',
                    isRead: false,
                    metadata: {
                      createdAt: new Date().toISOString(),
                      eventType: 'project_created', // Updated event type
                      createdBy: 'system', // Added creator's email
                      projectName: 'Project Name', // Add the project name if available
                      authMethod: 'google', // Optional: Include if relevant
                    },
                  },
                })
              );
              };
              dispatch(updateCollectionStatus
                ({
                  domain,
                  projectId: id,
                  collectionId,
                  status: 'visible'
                }));
              console.log(domain)
            setTimeout(() => {
              dispatch(openModal('uploadCompleted'))
            }, 1000);
            
    
          } catch (error) {
            dispatch(showAlert({ type: 'error', message: 'Upload failed, please try again!' }));
          } finally {
            
              
            dispatch(showAlert({ type: 'success', message: 'Upload Complete' }));
            
            setIsPhotosImported(false);
          }
        } 
        else {
            dispatch(showAlert({ type: 'error', message: 'Uploaded <b>file size exceeds</b> your limit! Upgrade' }));
          setIsPhotosImported(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            handleDroppedFiles(files);
            e.dataTransfer.clearData();
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

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
                const selectedIds = project?.selectedImageIds || [];
                const updatedImages = images.map(img => ({
                    ...img,
                    status: selectedIds.includes(img.url) ? 'selected' : (img.status === 'selected' ? 'none' : img.status)
                }));
                setCollectionImages(updatedImages);
            })
            .catch((error) => {
                console.log(error);
            });
        document.title = `${project.name}'s ${collectionId } Gallery`
    }, [collectionId]);

    // Update collectionImages when project prop changes (e.g., after Redux update)
    useEffect(() => {
        if (project && project.collections) {
            const currentCollection = project.collections.find(c => c.id === collectionId);
            if (currentCollection && currentCollection.uploadedFiles) {
                const selectedIds = project?.selectedImageIds || [];
                const updatedImages = currentCollection.uploadedFiles.map(img => ({
                    ...img,
                    status: selectedIds.includes(img.url) ? 'selected' : (img.status === 'selected' ? 'none' : img.status)
                }));
                setCollectionImages(updatedImages);
            }
        }
    }, [project, collectionId, project?.selectedImageIds]);

    // Fetch Images
    useEffect(() => {
        if (!collectionImages) {
            setImageUrls([]);
            return;
        }

        if(collectionImages.length === 0) {
            setUploadTrigger(true);
        }

        const selectedIds = project?.selectedImageIds || [];

        let start = 0;
        let end = page * size;
        let images = collectionImages.slice(start, end);
        setImageUrls(images);
        // Use selectedImageIds from project document as the source of truth for selections
        setSelectedImages(collectionImages.filter((image) => selectedIds.includes(image.url)));
    }, [collectionImages, page, project?.selectedImageIds]);

    // Update parent selected count
    useEffect(() => {
        if (setSelectedCount) {
            setSelectedCount(selectedImages.length);
        }
    }, [selectedImages, setSelectedCount]);

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

    // Handle "Open in Desktop" click
    const handleOpenInDesktopApp = () => {
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
            setTimeout(() => setCopyStatus('Desktop'), 2000);
            dispatch(showAlert({
                type:'success',
                message:'Filenames copied to clipboard'
              }
              ))
            
            // Open the instructions modal
            dispatch(openModal('openInDesktop'));
        });
    };

   const handleDesignClick = () => {
    setDisplayMode('lightMode');
    dispatch(setGalleryMode('designMode'));

    // DEFERRED SCROLL ACTION
    setTimeout(() => {
        if (projectCollectionRef.current) {
            projectCollectionRef.current.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start', 
                // offset is a non-standard property, see notes below
            });
        }
    }, 200); // Runs the scroll after the state updates and re-render are committed to the DOM
};

    return (
        <div className={`project-collection ${displayMode}`} ref={projectCollectionRef}>
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
                        collectionName: findCollectionById(project, collectionId)?.name,
                        // setUploadLists, // Removed
                        dispatch // Added
                    }} />
                        <div className="view-control">
                            {/* <div className="control-label label-all-photos">{collectionImages?.length ? collectionImages?.length: imageUrls.length} Photos</div> */}
                            <div className="control-wrap">
                                <div className="controls">
                                    <div className={`control ${showAllPhotos ? 'active' : ''}`} onClick={() => setShowAllPhotos(true)}>All photos</div>
                                    <div className={`control ${!showAllPhotos ? 'active' : ''}`} onClick={() => setShowAllPhotos(false)}>Selected ({selectedImages.length}) {selectedImages.length>0&&<div className='favorite selected'></div>}</div>
                                </div>
                                <div className={`active`}></div>
                            </div>
                            <div className={`control-label label-selected-photos ${selectedImages.length>0&&' active'}`}> </div>
                        </div>
                </div>
                <div className="view-control gallery-mode">
                        <div className="control-wrap">
                            <div className="controls">
                                <div className={`control ${galleryMode === 'workflowMode' ? 'active' : ''}`} onClick={() => { setDisplayMode('darkMode') ;dispatch(setGalleryMode('workflowMode'))}}>Worklow</div>
                                <div className={`control ${galleryMode === 'designMode' ? 'active' : ''}`} onClick={handleDesignClick}>Design {selectedImages.length>0&&<div className='favorite selected'></div>}</div>
                            </div>
                            <div className={`active`}></div>
                        </div>
                    </div>
                
                {collectionImages?.length > 0 || imageUrls.length > 0  ? (

                    <div className="gallery-header-right">
                        
                    { !showAllPhotos ?
                    <>
                    <div className={`open-in ${showAllPhotos ? 'disabled' : ''}`} onClick={handleOpenInDesktopApp}>
                         <button className={`lr button secondary icon copy`}>
                            {copyStatus === 'Copied' ? 'Copied' : `Open in Desktop`}
                         </button>
                    </div>
                    
                        </>:
                    <>
                    {/* <div className="control-wrap">
                        <div className="controls">
                            <div className={`control ctrl-all ${galleryView === 'grid' ? 'active' : ''}`} 
                                onClick={() => setGalleryView('grid')} 
                            ><div className="icon card-view"></div></div>
                            <div className={`control ctrl-active  ${galleryView === 'list' ? 'active' : ''}`} 
                                onClick={() => setGalleryView('list')}
                            ><div className="icon list-view"></div></div>
                        </div>
                    <div className={`active`}></div>
                </div> */}
                </>}
                    </div>
                ) : (
                    <div className="empty-message"></div>
                )}
            </div>


            
            {
                galleryMode === 'workflowMode' && (
                    
                
                imageUrls.length > 0 ? (
                    galleryView === 'grid' ?
                    <ImageGalleryGrid {...{ isPhotosImported, imageUrls, projectId: id, collectionId, project }} />:
                    <ImageGallery {...{ isPhotosImported, imageUrls, projectId: id, collectionId, project }} />
                ) : (
                    <label 
                        htmlFor="fileInput" 
                        className={`drop-upload ${isPhotosImported ? 'active' : ''}`}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                    >
                        <div className="drop-area">
{/*                             <Lottie options={defaultOptions} height={150} width={150} />
 */}                            <h2>Drop files here</h2>
                            <p>or use the "Upload" Button</p>
                        </div>
                    </label>
                )
                )
            }
            {
                galleryMode === 'designMode' &&(
                <ImageGalleryDesigner {...{project, collectionId }} />
            )
            }

            {
                collectionImages?.length >0 && <div className={`${galleryMode === 'designMode' && 'bottom-panel-light-mode'} image-gallery-bottom-panel `} ref={loaderRef}>
                    {/* <div className="button secondary">Load All</div> */}
                    
                    {collectionImages?.length !== imageUrls.length && collectionImages?.length >0 && showAllPhotos && <div className={`button primary`}
                        onClick={() => setPage(page + 1)}
                    >Loading more...</div>}

                    {(imageUrls.length !==0 && collectionImages?.length === imageUrls.length && showAllPhotos)  && <p className='caughtup-label label'>You are all caught up!</p>}

                </div>
            }
        </div>
    );
};

export default CollectionImages;