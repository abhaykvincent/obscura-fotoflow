import React, { useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { showAlert } from '../../app/slices/alertSlice';
import { addDummyProjects, addDummyUsers, fetchAllFirestoreData, clearFirestoreData } from '../../app/slices/adminPaneSlice';
import { selectDomain } from '../../app/slices/authSlice';
import './AdminPanel.scss';

// --- Icons ---
const FolderIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
    </svg>
);

const DocIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
);

const BackIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
);

const JsonViewer = ({ data, level = 0 }) => {
    const [isExpanded, setIsExpanded] = useState(level < 1);

    if (data === null) return <span style={{ color: '#808080' }}>null</span>;
    if (data === undefined) return <span style={{ color: '#808080' }}>undefined</span>;
    
    if (typeof data !== 'object') {
        const color = typeof data === 'string' ? '#CE9178' : typeof data === 'number' ? '#B5CEA8' : '#569CD6';
        const value = typeof data === 'string' ? `"${data}"` : String(data);
        return <span style={{ color }}>{value}</span>;
    }

    const isArray = Array.isArray(data);
    const isEmpty = isArray ? data.length === 0 : Object.keys(data).length === 0;
    const preview = isArray ? `Array(${data.length})` : 'Object';

    if (isEmpty) return <span>{isArray ? '[]' : '{}'}</span>;

    return (
        <div style={{ marginLeft: level > 0 ? 20 : 0 }}>
            <div 
                onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }} 
                style={{ cursor: 'pointer', display: 'inline-block', userSelect: 'none' }}
            >
                <span style={{ color: '#C586C0', marginRight: 5 }}>{isExpanded ? '▼' : '▶'}</span>
                <span style={{ fontWeight: 'bold', color: isArray ? '#4EC9B0' : '#4EC9B0' }}>
                    {preview}
                </span>
            </div>
            
            {isExpanded && (
                <div style={{ marginLeft: 15, borderLeft: '1px solid #404040', paddingLeft: 5 }}>
                    {Object.entries(data).map(([key, value]) => (
                        <div key={key} style={{ margin: '2px 0' }}>
                            <span style={{ color: '#9CDCFE', marginRight: 5 }}>{key}:</span>
                            <JsonViewer data={value} level={level + 1} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

function DeveloperTools() {
    const dispatch = useDispatch();
    const domain = useSelector(selectDomain);
    const { firestoreData, loading } = useSelector((state) => state.adminPane);

    // Navigation State
    // path: Array of { col: string, doc: string }
    // Represents the drill-down history.
    // E.g., [{col: 'projects', doc: 'proj_1'}, {col: 'collections', doc: 'col_1'}]
    const [path, setPath] = useState([]);
    
    // Selection State at current level
    const [selectedCollection, setSelectedCollection] = useState(null); // Name of collection
    const [selectedDocId, setSelectedDocId] = useState(null); // ID of document

    // --- Helpers ---

    // Get available collections at the current path depth
    const getCollectionsAtCurrentLevel = useMemo(() => {
        if (!firestoreData) return [];

        if (path.length === 0) {
            // Root level: Return keys that don't contain '::'
            return Object.keys(firestoreData).filter(k => !k.includes('::'));
        } else {
            // Nested level: We are inside a doc. 
            // Previous collection was path[last].col
            // We need to find keys like `prevCol::subCol`
            // AND ensure they are relevant for the current doc context (path[last].doc)
            const parent = path[path.length - 1];
            // The data structure stores subcollections as 'parentCol::subCol'.
            // Note: Since 'projects::collections' is a top-level key in the slice, 
            // we need to match keys that start with `${parent.col}::`.
            // But wait, if we drilled down twice? e.g. projects -> collections -> photos.
            // The slice currently only supports 1 level of nesting ('parent::child'). 
            // Deeper nesting might not be supported by the current fetch logic.
            // Assuming 1 level of nesting for now based on slice.
            
            const prefix = `${parent.col}::`;
            const potentialKeys = Object.keys(firestoreData).filter(k => k.startsWith(prefix));
            
            // Map to simple subcollection names (e.g., 'collections', 'events')
            // And check if they have data for the current parent doc ID
            return potentialKeys
                .map(k => ({ fullKey: k, name: k.split('::')[1] }))
                .filter(({ fullKey }) => {
                    const subColData = firestoreData[fullKey]; // This is a Map: parentId -> [docs]
                    return subColData && subColData[parent.doc] && subColData[parent.doc].length > 0;
                })
                .map(item => item.name);
        }
    }, [firestoreData, path]);

    // Get documents for the currently selected collection
    const getDocumentsInSelectedCollection = useMemo(() => {
        if (!firestoreData || !selectedCollection) return [];

        if (path.length === 0) {
            // Root level collection
            return firestoreData[selectedCollection] || [];
        } else {
            // Nested collection
            const parent = path[path.length - 1];
            const fullKey = `${parent.col}::${selectedCollection}`;
            const map = firestoreData[fullKey]; // parentId -> [docs]
            return map ? (map[parent.doc] || []) : [];
        }
    }, [firestoreData, selectedCollection, path]);

    // Get the actual data of the selected document
    const getSelectedDocumentData = useMemo(() => {
        const docs = getDocumentsInSelectedCollection;
        return docs.find(d => d.id === selectedDocId) || null;
    }, [getDocumentsInSelectedCollection, selectedDocId]);

    // Check if the selected document has subcollections (to show drill-down options)
    const getSubcollectionsForDoc = (docId) => {
        if (!firestoreData || !selectedCollection) return [];
        
        // Construct potential key prefix for the next level
        // Currently slice uses 'parent::child'. 
        // If we are at root 'projects', we look for 'projects::...'.
        // If we are already deep, say 'projects::collections', the slice doesn't have 'projects::collections::items'.
        // So we only support 1 level of drill down with current data.
        
        if (path.length > 0) return []; // Limit to 1 level for now as per slice structure

        const prefix = `${selectedCollection}::`;
        return Object.keys(firestoreData)
            .filter(k => k.startsWith(prefix))
            .map(k => ({ fullKey: k, name: k.split('::')[1] }))
            .filter(({ fullKey }) => {
                const map = firestoreData[fullKey];
                return map && map[docId] && map[docId].length > 0;
            })
            .map(item => item.name);
    };

    // --- Handlers ---

    const handleCollectionClick = (colName) => {
        setSelectedCollection(colName);
        setSelectedDocId(null);
    };

    const handleDocClick = (docId) => {
        setSelectedDocId(docId);
    };

    const handleDrillDown = (subColName) => {
        // Push current state to path
        setPath([...path, { col: selectedCollection, doc: selectedDocId }]);
        // Reset selection for new level
        setSelectedCollection(subColName);
        setSelectedDocId(null);
    };

    const handleBreadcrumbClick = (index) => {
        // Navigate back to a specific level
        if (index === -1) {
            setPath([]);
            setSelectedCollection(null);
            setSelectedDocId(null);
        } else {
            const newPath = path.slice(0, index + 1);
            setPath(newPath);
            // We don't restore the exact selection state of that level automatically,
            // or we could store it in history. For now, reset selection or keep it if it was the target.
            // Better UX: Cut path, but we need to know what was selected at that level to render it?
            // Actually, if we go to level X, the state variables (selectedCollection) should reflect level X.
            // But `path` defines the PARENTS. The component state defines the CURRENT view.
            
            // If I click root (index -1): Path becomes empty.
            // I need to reset selectedCollection/DocId to what they were? Or just null?
            setSelectedCollection(null); 
            setSelectedDocId(null);
        }
    };

    // --- Actions ---

    const handleAddDummyProjects = async () => {
        if (!domain) {
            dispatch(showAlert({ type: 'error', message: 'Domain not found. Cannot add dummy projects.' }));
            return;
        }
        try {
            await dispatch(addDummyProjects({ domain, count: 20 })).unwrap();
            dispatch(showAlert({ type: 'success', message: 'Dummy projects added successfully!' }));
        } catch (error) {
            dispatch(showAlert({ type: 'error', message: `Error adding dummy projects: ${error.message}` }));
        }
    };

    const handleAddDummyUsers = async () => {
        try {
            await dispatch(addDummyUsers()).unwrap();
            dispatch(showAlert({ type: 'success', message: '20 Dummy users added successfully!' }));
        } catch (error) {
            dispatch(showAlert({ type: 'error', message: `Error adding dummy users: ${error.message}` }));
        }
    };

    const handleFetchData = async () => {
        try {
            // Reset nav
            setPath([]);
            setSelectedCollection(null);
            setSelectedDocId(null);
            await dispatch(fetchAllFirestoreData(domain)).unwrap();
            dispatch(showAlert({ type: 'success', message: 'Firestore data fetched successfully!' }));
        } catch (error) {
            dispatch(showAlert({ type: 'error', message: `Error fetching data: ${error.message}` }));
        }
    };

    return (
        <main className="developer-tools">
            <h1 className="admin-title">Developer Tools</h1>
            <div className="admin-dashboard">
                <div className="admin-actions">
                    <div className="button secondary outline" onClick={handleAddDummyProjects}>
                        Add Dummy Projects
                    </div>
                    <div className="button secondary outline" onClick={handleAddDummyUsers}>
                        Add Dummy Users
                    </div>
                    <div className="button secondary outline" onClick={handleFetchData}>
                        {loading ? 'Fetching...' : 'Refresh Firestore Data'}
                    </div>
                     <div className="button secondary outline" onClick={() => dispatch(clearFirestoreData())}>
                        Clear Data
                    </div>
                </div>

                {firestoreData && (
                    <div className="firestore-explorer-container">
                        {/* Breadcrumbs */}
                        <div className="fs-breadcrumbs">
                            <div 
                                className={`crumb ${path.length === 0 ? 'active' : ''}`}
                                onClick={() => handleBreadcrumbClick(-1)}
                            >
                                Root
                            </div>
                            {path.map((item, index) => (
                                <React.Fragment key={index}>
                                    <span className="sep">/</span>
                                    <div 
                                        className={`crumb ${index === path.length - 1 ? 'active' : ''}`}
                                        onClick={() => handleBreadcrumbClick(index)}
                                    >
                                        {item.col} <span className="doc-id">({item.doc})</span>
                                    </div>
                                </React.Fragment>
                            ))}
                        </div>

                        {/* 3-Column Layout */}
                        <div className="fs-columns">
                            {/* Column 1: Collections */}
                            <div className="fs-col collections-col">
                                <div className="col-header">Collections</div>
                                <div className="col-list">
                                    {getCollectionsAtCurrentLevel.map(col => (
                                        <div 
                                            key={col}
                                            className={`list-item ${selectedCollection === col ? 'active' : ''}`}
                                            onClick={() => handleCollectionClick(col)}
                                        >
                                            <FolderIcon />
                                            {col}
                                        </div>
                                    ))}
                                    {getCollectionsAtCurrentLevel.length === 0 && (
                                        <div className="empty-msg">No collections found</div>
                                    )}
                                </div>
                            </div>

                            {/* Column 2: Documents */}
                            <div className="fs-col documents-col">
                                <div className="col-header">
                                    Documents
                                    {selectedCollection && <span className="count">({getDocumentsInSelectedCollection.length})</span>}
                                </div>
                                <div className="col-list">
                                    {getDocumentsInSelectedCollection.map(doc => (
                                        <div 
                                            key={doc.id}
                                            className={`list-item ${selectedDocId === doc.id ? 'active' : ''}`}
                                            onClick={() => handleDocClick(doc.id)}
                                        >
                                            <DocIcon />
                                            <span className="text">{doc.id}</span>
                                        </div>
                                    ))}
                                    {!selectedCollection && <div className="empty-msg">Select a collection</div>}
                                    {selectedCollection && getDocumentsInSelectedCollection.length === 0 && (
                                        <div className="empty-msg">No documents</div>
                                    )}
                                </div>
                            </div>

                            {/* Column 3: Data & Subcollections */}
                            <div className="fs-col data-col">
                                <div className="col-header">
                                    {selectedDocId || 'Select a document'}
                                </div>
                                <div className="data-content">
                                    {selectedDocId && getSelectedDocumentData ? (
                                        <>
                                            {/* Subcollections Links (if any) */}
                                            {getSubcollectionsForDoc(selectedDocId).length > 0 && (
                                                <div className="subcollections-panel">
                                                    <div className="sub-label">Subcollections:</div>
                                                    <div className="sub-chips">
                                                        {getSubcollectionsForDoc(selectedDocId).map(sub => (
                                                            <div 
                                                                key={sub} 
                                                                className="chip"
                                                                onClick={() => handleDrillDown(sub)}
                                                            >
                                                                <FolderIcon />
                                                                {sub}
                                                                <span className="arrow">→</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="json-panel">
                                                <JsonViewer data={getSelectedDocumentData} />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="empty-state">
                                            <div className="icon">📄</div>
                                            <p>Select a document to view data</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}

export default DeveloperTools;
