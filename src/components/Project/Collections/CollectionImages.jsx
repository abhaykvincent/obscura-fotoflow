import React, {useState, useEffect} from 'react';
import { fetchImageUrls, handleUpload } from '../../../utils/storageOperations';
import ImageGallery from '../../ImageGallery/ImageGallery';
import { fetchImages } from '../../../firebase/functions/firestore';
import { addAllFileSizesToMB } from '../../../utils/fileUtils';
import UploadButton from '../../UploadButton/UploadButton';
import { useDispatch } from 'react-redux';
import { setUploadList, setUploadStatuss } from '../../../app/slices/uploadSlice';
import Lottie from 'react-lottie';
import animationData from '../../../assets/animations/UploadFiles.json';

const CollectionImages = ({ id, collectionId,collection }) => {
    const dispatch =useDispatch()
// Files
const [collectionImages, setCollectionImages] = useState([]);
const [imageUrls, setImageUrls] = useState([]);
const [selectedImages, setSelectedImages] = useState([]);
const [isPhotosImported, setIsPhotosImported] = useState(false);
//import size
const [showAllPhotos,setShowAllPhotos]=useState(true);
const [page,setPage]=useState(1);
const [size,setSize]=useState(15);

// Upload progress
const [uploadList, setUploadLists] = useState([]);
const [uploadStatus, setUploadStatus] = useState('close');
const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: 'xMidYMid slice'
    }
  };
// ON Upload status
useEffect(() => {
  if(uploadStatus === 'completed')
    setTimeout(() => setUploadStatus('close'), 1000)
    dispatch(setUploadStatuss(uploadStatus))
}, [uploadStatus])
useEffect(() => {
    console.log(uploadList)
   dispatch(setUploadList(uploadList))
}, [uploadList])

// Initial collection images fetch
useEffect(()=>{
    setShowAllPhotos(true)
    //get images from 
    fetchImages(id,collectionId)
    .then((images)=>{
        setCollectionImages(images)
    })
    .catch((error)=>{
    console.log(error)
    })
},[collectionId])
// Fetch Images
useEffect(() => {
    if(!collectionImages){

        setImageUrls([])
        return
    } 
    let start=(page-1)*size;
    let end=page*size;
    let images=collectionImages.slice(start,end)
    setImageUrls(images)
    setSelectedImages(collectionImages.filter((image)=>image.status==='selected'))
}, [collectionImages,page]);
// Show All Photos
useEffect(() => {
    if(!collectionImages) return
    else{
        setPage(1 )
        if(showAllPhotos){
            let start=(page-1)*size;
            let end=page*size;
            let images=collectionImages.slice(start,end)
        setImageUrls(images)
        }
        else{
        setImageUrls(selectedImages)
        }
    }
}, [showAllPhotos,collectionImages]);
// Upload Files Input Changes

return (
    <div className="project-collection">
        <div className="header">
            <div className="options">
                <UploadButton {...{isPhotosImported,setIsPhotosImported,imageUrls,setImageUrls,setUploadStatus,id,collectionId,setUploadLists}}/>
            </div>
            {
                collectionImages?.length>0?
                <div className="view-control">
                    <div className="control-label label-all-photos">{collectionImages.length} Photos</div>
                    <div className="control-wrap">
                        <div className="controls">
                            <div className={`control ${showAllPhotos ? 'active' : ''}`} onClick={() => setShowAllPhotos(true)}>All photos</div>
                            <div className={`control ${!showAllPhotos ? 'active' : ''}`} onClick={() => setShowAllPhotos(false)}>Selected</div>
                        </div>
                        <div className={`active`}></div>
                    </div>
                    <div className="control-label label-selected-photos">{selectedImages.length} Photos</div>
                </div>:
                <div className="empty-message">
                </div>
            }
        </div>
        {
            imageUrls.length > 0 ?
                <ImageGallery {...{isPhotosImported, imageUrls, projectId:id}}/>:
                <label  htmlFor="fileInput"  className="drop-upload">
                    <div for="" className="drop-area">
                        <p>Click here to upload</p>
                    <Lottie
            options={defaultOptions}
            height={150}
            width={150}
          />
                    </div>
                </label>
        }
    </div>
    );
};

export default CollectionImages;
// Line Complexity  1.2 -> 