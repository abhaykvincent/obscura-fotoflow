import { doc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../../firebase/app";
import { selectUserStudio } from "../../app/slices/authSlice";
import { useDispatch, useSelector } from "react-redux";
import { showAlert } from "../../app/slices/alertSlice";

export const ProjectCover = ({ project }) => {
    const dispatch = useDispatch();
    const currentStudio = useSelector(selectUserStudio);
    const [isSetFocusButton, setIsSetFocusButton] = useState(false);
    const [focusPointLocal, setFocusPointLocal] = useState({ x: 0.5, y: 0.5 });
    const [focusPoint, setFocusPoint] = useState( { x: 0.5, y: 0.5 });

    const setFocusButtonClick = (e) => {
        // fix: this click affecting the click on image 
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
    useEffect(() => {
        setFocusPointLocal(focusPoint);
        console.log(focusPointLocal)
    }, [focusPoint]);
    useEffect(() => {
        console.log(focusPointLocal)
    }, [focusPointLocal]);
    useEffect(() => {
        setFocusPoint(project.focusPoint);
    }, [project.focusPoint]);
    
    return (
        <div
            className={`project-page-cover ${isSetFocusButton ? "focus-button-active" : ""} ${project?.projectCover ? "cover-show" : "cover-hide"}`}
            style={{ // Ensure the container height
                backgroundImage: `url(${project?.projectCover || 'https://img.icons8.com/?size=256&id=UVEiJZnIRQiE&format=png&color=1f1f1f'})`,
                backgroundPosition: `${focusPointLocal?.x * 100}% ${focusPointLocal?.y * 100}%`,
                backgroundSize: `${project?.projectCover ? "cover":"auto 50% "}`, // Ensure image scaling
            }}
            onClick={handleFocusClick}
        >
            {
                !isSetFocusButton ? <div className="cover-tools">
                    <div
                        className="button transparent-button secondary icon set-focus"
                        onClick={setFocusButtonClick}
                    >Set focus</div>
                    <div className="button transparent-button secondary icon image">Change Cover</div>
                    </div>
                    :
                    <div className="cover-tools">
                        <div
                            className="button transparent-button primary icon set-focus"
                            onClick={ () => saveFocusPoint(focusPointLocal)}
                        >
                            Save
                        </div>
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