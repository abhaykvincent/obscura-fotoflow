import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { db, storage } from "../../firebase/app";
import { doc, updateDoc } from "firebase/firestore";
import { selectUserStudio } from "../../app/slices/authSlice";
import { showAlert } from "../../app/slices/alertSlice";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { setCoverPhotoInFirestore } from "../../firebase/functions/firestore";
import { updateProjectCover } from "../../app/slices/projectsSlice";
import { convertMegabytes } from "../../utils/stringUtils";

export const ProjectCover = ({ project }) => {
    const dispatch = useDispatch();
    const currentStudio = useSelector(selectUserStudio);

    const [focusPoint, setFocusPoint] = useState( project?.focusPoint);
    const [focusPointLocal, setFocusPointLocal] = useState(project?.focusPoint);
    const [isSetFocusButton, setIsSetFocusButton] = useState(false);

    const setFocusButtonClick = (e) => {
        e.stopPropagation();
        // show indicator when click
        setIsSetFocusButton(true);

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

    useEffect(() => {
        setFocusPointLocal(focusPoint);
    }, [focusPoint]);
    useEffect(() => {
        setFocusPoint(project.focusPoint);
    }, [project.focusPoint]);

    useEffect(() => {
        console.log(project)
    }, [project]);
    
    return (
        <div
            className={`project-page-cover ${isSetFocusButton ? "focus-button-active" : ""} ${project?.projectCover ? "cover-show" : "cover-hide"}`}
            style={{ // Ensure the container height
                
                backgroundImage: project?.projectCover ?`url(${project.projectCover.replace(/\(/g, '%28').replace(/\)/g, '%29').split('&token=')[0]})` : `url('https://img.icons8.com/?size=256&id=UVEiJZnIRQiE&format=png&color=1f1f1f')`,
                backgroundPosition: `${focusPointLocal?.x * 100}% ${focusPointLocal?.y * 100}%`,
                backgroundSize: `${project?.projectCover ? "cover":"auto 50% "}`, // Ensure image scaling
            }}
            onClick={handleFocusClick}
        >
            <div className="cover-footer">
                <div className="static-tools bottom">
                    {/* <div className="cover-info project-views-count">
                        <div className="icon-show view"></div>
                        <p>1.6K <span>Views</span></p>
                    </div> */}
                    <div className="cover-info project-size">
                        <div className="icon-show storage"></div>
                        <p>{ convertMegabytes(project?.totalFileSize)} <span></span> </p>
                    </div>
                    <div className="cover-info project-size">
                        <div className="icon-show image"></div>
                        <p>
                            {project?.uploadedFilesCount} <span>Photos  </span>
                        </p>
                    </div>
                    <div className="cover-info project-size">
                        <div className="icon-show folder"></div>
                        <p>
                            {project?.collections.length} <span>Galleries</span>
                        </p>
                    </div>
                </div>
                
            </div>
            <div className="static-tools top">
                    <div className="cover-info project-expiry">
                        <p>Expires 
                            <span> in </span> 
                            {
                                project?.createdAt ? 
                                Math.ceil(((new Date(project?.createdAt).getTime() + 360 * 24 * 60 * 60 * 1000) - Date.now()) / (1000 * 60 * 60 * 24))
                                : 0
                            } Days</p>
                        <div className="icon-show expire"></div>

                    </div>
                </div>
            {
            !isSetFocusButton ? 
                <div className="cover-tools">
                    <div
                        className="button transparent-button secondary icon set-focus"
                        onClick={setFocusButtonClick}
                    >Set focus</div>
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
                    <div
                        className="button transparent-button primary icon set-focus"
                        onClick={ () => saveFocusPoint(focusPointLocal)}
                    >Save</div>
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