export const PROJECT_TYPES = [
    { id: "template-wedding", value: "Wedding", label: "Wedding" },
    { id: "template-baptism", value: "Baptism", label: "Baptism" },
    { id: "template-birthday", value: "Birthday", label: "Birthday" },
    { id: "template-maternity", value: "Maternity", label: "Maternity" },
    { id: "template-newborn", value: "Newborn", label: "Newborn" },
    { id: "template-family", value: "Family", label: "Family" },
    { id: "template-group", value: "Group", label: "Group" },
    { id: "template-travel", value: "Travel", label: "Travel" },
    { id: "template-event", value: "Event", label: "Event" },
    { id: "template-other", value: "Other", label: "Other" },
  ];
  
  export const VALIDITY_OPTIONS = [
    { id: "validity-3", value: "3", label: "3 Months" },
    { id: "validity-6", value: "6", label: "6 Months", className: "free-validity" },
    { id: "validity-12", value: "12", label: "1 Year", disabled: true, className: "upgrade-needed" },
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
  };
