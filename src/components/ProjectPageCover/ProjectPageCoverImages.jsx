import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { db, storage } from "../../firebase/app";
import { doc, updateDoc } from "firebase/firestore";
import { selectDomain, selectUserStudio } from "../../app/slices/authSlice";
import { showAlert } from "../../app/slices/alertSlice";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { setCoverPhotoInFirestore } from "../../firebase/functions/firestore";
import { updateProjectCover, updateProjectName } from "../../app/slices/projectsSlice";
import { convertMegabytes } from "../../utils/stringUtils";

export const ProjectPageCoverImages = ({ project }) => {
    const dispatch = useDispatch();
    const currentStudio = useSelector(selectUserStudio);
    const domain = useSelector(selectDomain);

    const [focusPoint, setFocusPoint] = useState( project?.focusPoint);
    const [focusPointLocal, setFocusPointLocal] = useState(project?.focusPoint);
    const [isSetFocusButton, setIsSetFocusButton] = useState(false);

    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState("");
    const handleSave = () => {
    if (newName && newName !== project.name) {
        dispatch(updateProjectName({ domain, projectId: project.id, newName })).then(() => {
        setIsEditing(false);
        // Update local project state in Redux
        /* setProject({ ...project, name: newName }); */
        });
    }
    };
    const handleCancel = () => setIsEditing(false);
    const handleNameDoubleClick = () => {

    setIsEditing(true);
    setNewName(project.name);
    };
    
    // Cover Focus point
    const handleFocusClick = (e) => {

        if (isSetFocusButton) {
            const rect = e.target.getBoundingClientRect();
            let  x = (e.clientX - rect.left) / rect.width
            // round x
            x = Math.round(x * 100) / 100;
            let  y = (e.clientY - rect.top) / 600; // Normalize relative to the 400px container height
                y = Math.round(y * 100) / 100;
            const newFocusPoint = { x, y };
            setFocusPointLocal(newFocusPoint);
        }
    };
    const handleCoverChange = async (e) => {
        e.stopPropagation();
        const file = e.target.files[0]; // Get the selected file
        if (!file) return;
    
        try {
            // Define the storage path
            const storageRef = ref(storage, `studios/${currentStudio.domain}/projects/${project.id}/cover.jpg`);
    
            // Upload the file to Firebase Storage
            await uploadBytes(storageRef, file);
    
            // Get the download URL
            const downloadURL = await getDownloadURL(storageRef);
    
            // Dispatch the thunk to update the cover photo and focus point
            const focusPoint = { x: 0.5, y: 0.5 }; // Default focus point for a new cover
            dispatch(updateProjectCover({ domain: currentStudio.domain, projectId: project.id, newCoverUrl: downloadURL, focusPoint }));
            
            dispatch(showAlert({ type: "success", message: "Cover photo updated successfully!" }));
        } catch (error) {
            console.error("Error changing cover photo:", error);
            dispatch(showAlert({ type: "error", message: "Failed to update cover photo. Please try again." }));
        }
    };
    const saveFocusPoint = async (newFocusPoint) => {
        console.log(newFocusPoint)
        const projectDocRef = doc(db, "studios", currentStudio.domain, "projects", project.id);
        await updateDoc(projectDocRef, { focusPoint: newFocusPoint })
        .then(() => {

        setFocusPoint(newFocusPoint);
        setIsSetFocusButton(false);
            console.log("Focus point updated successfully!");
            dispatch(showAlert({
                type: "success",
                message: "Focus point updated successfully!"
                }))
        })
        .catch((error) => {
            console.error("Error updating focus point:", error);
        });
        
    };
    const setFocusButtonClick = (e) => {
        e.stopPropagation();
        // show indicator when click
        setIsSetFocusButton(true);

    };
    useEffect(() => {
        setFocusPointLocal(focusPoint);
    }, [focusPoint]);
    useEffect(() => {
        setFocusPoint(project.focusPoint);
    }, [project.focusPoint]);


    const getAllImages = () => {
        let images = [];
        if (project?.projectCover) {
            images.push(project.projectCover);
        }
        if (project?.collections) {
            project.collections.forEach(collection => {
                if (collection.favoriteImages) {
                    images = [...images, ...collection.favoriteImages];
                }
            });
        }
        return images;
    }
    const allImages = getAllImages();
    
    return (
        <div
            className={`project-page-cover ${isSetFocusButton ? "focus-button-active" : ""} ${project?.projectCover || allImages.length > 0 ? "cover-show" : "cover-hide"}`}
        >
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', overflowX: 'auto', scrollbarWidth: 'none' }}>
                {allImages.map((image, i) => (
                    <img key={i} src={image.replace('-thumb', '')} style={{ height: '100%', width: 'auto', objectFit: 'cover' }} />
                ))}
            </div>

            {
            !isSetFocusButton && project.pin? 
                <div className="cover-tools">
                    {/* <div
                        className="button transparent-button secondary icon set-focus"
                        onClick={setFocusButtonClick}
                    >Set focus</div> */}
                    <div className="button transparent-button secondary icon image">
                        <label htmlFor={`change-cover-${project.id}`} style={{ cursor: "pointer" }}>
                            Change Cover
                        </label>
                        <input
                            id={`change-cover-${project.id}`}
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={handleCoverChange}
                        />
                    </div>
                </div>
                :
                <div className="cover-tools">
                    {/* <div
                        className="button transparent-button primary icon set-focus"
                        onClick={ () => saveFocusPoint(focusPointLocal)}
                    >Save</div> */}
                </div>
            }
            {isSetFocusButton && project?.projectCover && (
                <div
                    className="focus-indicator"
                    style={{
                        left: `${focusPointLocal?.x * 100}%`,
                        top: `${focusPointLocal?.y * 600}px`, // Position relative to the container's height
                        transform: "translate(-50%, -50%)", // Center the indicator at the focus point
                    }}
                ></div>
            )}
        </div>
    );
}