export const validateForm = (projectData, setErrors, nameInputRef, typeInputRef) => {
    const newErrors = {};
    if (!projectData.name.trim()) newErrors.name = "Project name is required";
    // if project data is wedding check bride name
    if (projectData.type === 'Wedding' && !projectData.name2.trim()) newErrors.name2 = "Bride name is required";
    if (!projectData.type.trim()) newErrors.type = "Project type is required";
    setErrors(newErrors);
  
    if (newErrors.name && nameInputRef.current) nameInputRef.current.focus();
    else if (newErrors.type && typeInputRef.current) typeInputRef.current.focus();
  
    return Object.keys(newErrors).length === 0;
  };