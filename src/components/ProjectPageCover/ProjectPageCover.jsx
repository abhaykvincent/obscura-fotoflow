import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { db } from "../../firebase/app";
import { doc, updateDoc } from "firebase/firestore";
import { selectDomain, selectUserStudio } from "../../app/slices/authSlice";
import { showAlert } from "../../app/slices/alertSlice";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { setCoverPhotoInFirestore } from "../../firebase/functions/firestore";
import { updateProjectCover, updateProjectName } from "../../app/slices/projectsSlice";
import { convertMegabytes, truncateMiddle, truncateUrl } from "../../utils/stringUtils";
import { ProjectStatus } from "../Project/ProjectStatus/ProjectStatus";
import { getGalleryURL } from "../../utils/urlUtils";
import { getStorageForDomain } from "../../utils/uploadOperations";
import { selectStudio } from "../../app/slices/studioSlice";
import "./ProjectPageCover.scss";
import { formatDate, formatDateStyle02 } from "../../utils/dateUtils";

export const ProjectCover = ({ project, projectDashboardView, setProjectDashboardView }) => {
    const dispatch = useDispatch();
    const currentStudio = useSelector(selectUserStudio);
    const domain = useSelector(selectDomain);
    const studio = useSelector(selectStudio);

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
            const customStorage = await getStorageForDomain(domain, studio.bucketUrl);
            // Define the storage path
            const storageRef = ref(customStorage, `studios/${currentStudio.domain}/projects/${project.id}/cover.jpg`);
    
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


    
    return (
        <div
            className={`project-page-cover project-cover ${isSetFocusButton ? "focus-button-active" : ""} ${project?.projectCover || project?.projectCover.length > 0 ? "cover-show" : "cover-hide"}`}
        >
            {project?.projectCover ? (
                <div className="project-cover-image">
                    <img  
                        src={project?.projectCover.replace('/o/thumb%2F', '/o/web%2F').replace('-thumb', '')} 
                        loading="lazy"
                        style={{ height: '100%', width: 'auto', objectFit: 'cover' }} 
                    />
                </div>
            ) : (
                <div className="project-cover-image no-cover-image" />
            )}

            <div className="cover-footer">
                {/* 1. Project Title & Tag */}
                <div className="project-name-editor">
                    {isEditing ? (
                        <div className="editable-data">
                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                            />
                            <div className="input-edit-actions">
                                <button 
                                    className={`${newName === project.name ? 'disabled' : ''} button primary icon icon-only check`} 
                                    onClick={handleSave}
                                />
                                <button 
                                    className="button secondary icon icon-only close" 
                                    onClick={handleCancel}
                                />
                            </div>
                        </div>
                    ) : (
                        <h1 onClick={handleNameDoubleClick}>{project.name}</h1>
                    )}
                    <div className="edit-pen" onClick={handleNameDoubleClick} />
                    
                    {!isEditing && (
                        <div className="tags">
                            <div className="tag type">{project?.type}</div>
                        </div>
                    )}
                </div>

                <div className="static-tools bottom">
                    <div className="client">
                        {/* 2. Gallery URL Sharing & PIN */}
                        <div className="link-pin-container">
                            <div className="link-pin">
                                <a 
                                    className="linkToGallery" 
                                    href={getGalleryURL('smart-gallery', currentStudio?.domain, project?.id)} 
                                    target="_blank" 
                                    rel="noreferrer"
                                > 
                                    {truncateUrl(
                                        getGalleryURL('smart-gallery', currentStudio?.domain, project?.id), 8*3, 8*2
                                    )}
                                </a>
                                <div 
                                    className="button primary outline text-only icon copy" 
                                    onClick={() => {
                                        navigator.clipboard.writeText(getGalleryURL('smart-gallery', currentStudio?.domain, project?.id));
                                        dispatch(showAlert({ type: "success", message: "Link copied to clipboard!" }));
                                    }}
                                />
                            </div>
                        </div> 
                        <div className="link-pin-container">
                            {project.pin && <div className="project-pin">PIN: {project.pin}</div>}
                        </div> 

                        {/* 3. Project Statistics */}
                        {project.pin && (
                            <div className="bottom-right">
                                <div className="cover-info project-size">
                                    <div className="icon-show storage"></div>
                                    <p>{convertMegabytes(project?.totalFileSize)}</p>
                                </div>
                                <div className="cover-info project-size">
                                    <div className="icon-show image"></div>
                                    <p>
                                        {project?.uploadedFilesCount} <span>Photos</span>
                                    </p>
                                </div>
                                <div className="cover-info project-size">
                                    <div className="icon-show folder"></div>
                                    <p>
                                        {project?.collections.length} <span>Galleries</span>
                                    </p>
                                </div>
                                {project.status === 'selected' && (
                                    <div className="cover-info project-size">
                                        <div className="icon-show selected"></div>
                                        <p>
                                            {project?.selectedFilesCount} <span>Selected</span>
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* 4. Action Buttons & System Metadata */}
                    <div className="action-buttons">
                        <ProjectStatus project={project} />
                        
                        {project.pin && (
                            <>
                                <div className="cover-info project-expiry">
                                    <div className="icon-show archive"></div>
                                    <p>
                                        Expires <span>in</span>{' '}
                                        {project?.createdAt 
                                            ? Math.ceil(((new Date(project.createdAt).getTime() + 360 * 24 * 60 * 60 * 1000) - Date.now()) / (1000 * 60 * 60 * 24))
                                            : 0
                                        } Days
                                    </p>
                                </div>
                                <div className="project-metadata">
                                    <p>Project created on {formatDateStyle02(project?.createdAt)}</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {!isSetFocusButton && project.pin ? (
                <div className="cover-tools" />
            ) : (
                <div className="cover-tools" />
            )}

            {isSetFocusButton && project?.projectCover && (
                <div
                    className="focus-indicator"
                    style={{
                        left: `${focusPointLocal?.x * 100}%`,
                        top: `${focusPointLocal?.y * 600}px`,
                        transform: "translate(-50%, -50%)",
                    }}
                />
            )}
        </div>
    );
}