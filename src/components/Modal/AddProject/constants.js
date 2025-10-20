export const PROJECT_TYPES = [
    { id: "template-wedding", stared: true, value: "Wedding", label: "Wedding" },
    { id: "template-baptism", stared: true, value: "Baptism", label: "Baptism" },
    { id: "template-birthday", stared: true, value: "Birthday", label: "Birthday" },
    { id: "template-maternity", stared: false, value: "Maternity", label: "Maternity" },
    { id: "template-newborn", stared: false, value: "Newborn", label: "Newborn" },
    { id: "template-group", stared: false, value: "Group", label: "Group" },
    { id: "template-travel", stared: false, value: "Travel", label: "Travel" },
    { id: "template-other", stared: false, value: "Other", label: "Other" },
  ];
  
  export const VALIDITY_OPTIONS = [
    { id: "validity-3", value: "3", label: "3 Months" },
    { id: "validity-6", value: "6", label: "6 Months", className: "free-validity" },
    { id: "validity-12", value: "12", label: "1 Year", disabled: true, className: "upgrade-needed" },
  ];
  export const ARCHIVE_OPTIONS = [
    { id: "archive-1", value: "1", label: "1 Year" },
    { id: "archive-2", value: "2", label: "2 Year", className: "free-validity" },
    { id: "archive-5", value: "3", label: "3 Year", disabled: true, className: "upgrade-needed" },
  ];
  export const PROJECT_CATEGORIES = [
    {
      category: "Personal",
      types: [
        { id: "wedding", value: "Wedding", label: "Wedding" },
        { id: "birthday", value: "Birthday", label: "Birthday" },
        { id: "family", value: "Family", label: "Family" },
        // Add other personal event types as needed
      ]
    },
    {
      category: "Professional",
      types: [
        { id: "headshot", value: "Headshot", label: "Headshot" },
        { id: "corporate", value: "Corporate", label: "Corporate" },
        // Add other professional event types as needed
      ]
    },
    // Add additional categories as needed
  ];
  export const initialProjectData = {
    name: "",
    name2: "",
    type: "Wedding",
    email: "",
    phone: "",
    collections: [],
    events: [],
    payments: [],
    expenses: [],
    projectCover: "",
    selectedFilesCount: 0,
    uploadedFilesCount: 0,
    totalFileSize: 0,
    status: "draft",
    projectValidityMonths: '6',
    createdAt: new Date().getTime(),
  lastOpened: new Date().getTime(),
  team: [],
  };
