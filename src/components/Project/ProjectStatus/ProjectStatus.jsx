
import { useDispatch, useSelector } from "react-redux";
import { selectUserStudio } from "../../../app/slices/authSlice";
import { showAlert } from "../../../app/slices/alertSlice";
import { updateProjectStatus } from "../../../app/slices/projectsSlice";

export const ProjectStatus = ({ project }) => {
    const dispatch = useDispatch();
    const currentStudio = useSelector(selectUserStudio);

    const handleStatusChange = (newStatus) => {
        if (newStatus === 'draft' && project.uploadedFilesCount > 0) {
            dispatch(showAlert({ type: "error", message: "Cannot change status to Draft when images are present." }));
            return;
        }
        dispatch(updateProjectStatus({ domain: currentStudio.domain, projectId: project.id, newStatus }));
    };

    return (
        <div className={`project-status ${project?.status}`}>
            <select
                className="button secondary"
                value={project?.status}
                onChange={(e) => handleStatusChange(e.target.value)}
            >
                {['draft', 'active', 'selected', 'completed', 'archived'].map(status => (
                    <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                ))}
            </select>
            <div className="status-signal" />
        </div>
    );
};
