import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { showAlert } from '../../app/slices/alertSlice';
import { addDummyProjects, addDummyUsers, fetchAllFirestoreData, clearFirestoreData } from '../../app/slices/adminPaneSlice';
import { selectDomain } from '../../app/slices/authSlice';
import { seedDevData } from '../../services/dataSeeder';
import './AdminPanel.scss';

// --- Icons (Enhanced) ---
const FolderIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="fs-icon">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
    </svg>
);

const DocIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="fs-icon">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
);

const SearchIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
);

const CopyIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
);

const ExpandIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 3 21 3 21 9"></polyline>
        <polyline points="9 21 3 21 3 15"></polyline>
        <line x1="21" y1="3" x2="14" y2="10"></line>
        <line x1="3" y1="21" x2="10" y2="14"></line>
    </svg>
);

const CollapseIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="4 14 10 14 10 20"></polyline>
        <polyline points="20 10 14 10 14 4"></polyline>
        <line x1="14" y1="10" x2="21" y2="3"></line>
        <line x1="10" y1="14" x2="3" y2="21"></line>
    </svg>
);

// --- JsonViewer Component ---
const JsonViewer = ({ data, level = 0, initialExpanded = false, forceExpand = null }) => {
    const [isExpanded, setIsExpanded] = useState(level < 1 || initialExpanded);

    useEffect(() => {
        if (forceExpand !== null) {
            setIsExpanded(forceExpand);
        }
    }, [forceExpand]);

    if (data === null) return <span className="jv-null">null</span>;
    if (data === undefined) return <span className="jv-undefined">undefined</span>;
    
    if (typeof data !== 'object') {
        const type = typeof data;
        const value = type === 'string' ? `"${data}"` : String(data);
        return <span className={`jv-value jv-${type}`}>{value}</span>;
    }

    const isArray = Array.isArray(data);
    const keys = Object.keys(data);
    const isEmpty = keys.length === 0;
    const preview = isArray ? `Array(${data.length})` : 'Object';

    if (isEmpty) return <span className="jv-empty">{isArray ? '[]' : '{}'}</span>;

    return (
        <div className="jv-node" style={{ marginLeft: level > 0 ? 20 : 0 }}>
            <div 
                className="jv-toggle"
                onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }} 
            >
                <span className="jv-arrow">{isExpanded ? '▼' : '▶'}</span>
                <span className={`jv-label ${isArray ? 'jv-array' : 'jv-object'}`}>
                    {preview}
                </span>
            </div>
            
            {isExpanded && (
                <div className="jv-content">
                    {keys.map((key) => (
                        <div key={key} className="jv-line">
                            <span className="jv-key">{key}:</span>
                            <JsonViewer data={data[key]} level={level + 1} forceExpand={forceExpand} />
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

    // Explorer State
    const [path, setPath] = useState([]);
    const [selectedCollection, setSelectedCollection] = useState(null);
    const [selectedDocId, setSelectedDocId] = useState(null);
    
    // UI State
    const [colSearch, setColSearch] = useState('');
    const [docSearch, setDocSearch] = useState('');
    const [jsonForceExpand, setJsonForceExpand] = useState(null);
    const [isSeeding, setIsSeeding] = useState(false);

    // --- Helpers ---

    const getCollectionsAtCurrentLevel = useMemo(() => {
        if (!firestoreData) return [];

        let collections = [];
        if (path.length === 0) {
            collections = Object.keys(firestoreData).filter(k => !k.includes('::'));
        } else {
            const parent = path[path.length - 1];
            const prefix = `${parent.col}::`;
            const potentialKeys = Object.keys(firestoreData).filter(k => k.startsWith(prefix));
            
            collections = potentialKeys
                .map(k => ({ fullKey: k, name: k.split('::')[1] }))
                .filter(({ fullKey }) => {
                    const subColData = firestoreData[fullKey];
                    return subColData && subColData[parent.doc] && subColData[parent.doc].length > 0;
                })
                .map(item => item.name);
        }

        if (!colSearch) return collections;
        return collections.filter(c => c.toLowerCase().includes(colSearch.toLowerCase()));
    }, [firestoreData, path, colSearch]);

    const getDocumentsInSelectedCollection = useMemo(() => {
        if (!firestoreData || !selectedCollection) return [];

        let docs = [];
        if (path.length === 0) {
            docs = firestoreData[selectedCollection] || [];
        } else {
            const parent = path[path.length - 1];
            const fullKey = `${parent.col}::${selectedCollection}`;
            const map = firestoreData[fullKey];
            docs = map ? (map[parent.doc] || []) : [];
        }

        if (!docSearch) return docs;
        return docs.filter(d => d.id.toLowerCase().includes(docSearch.toLowerCase()));
    }, [firestoreData, selectedCollection, path, docSearch]);

    const getSelectedDocumentData = useMemo(() => {
        const docs = getDocumentsInSelectedCollection;
        return docs.find(d => d.id === selectedDocId) || null;
    }, [getDocumentsInSelectedCollection, selectedDocId]);

    const getSubcollectionsForDoc = useCallback((docId) => {
        if (!firestoreData || !selectedCollection) return [];
        if (path.length > 0) return []; // Limit nesting for now

        const prefix = `${selectedCollection}::`;
        return Object.keys(firestoreData)
            .filter(k => k.startsWith(prefix))
            .map(k => ({ fullKey: k, name: k.split('::')[1] }))
            .filter(({ fullKey }) => {
                const map = firestoreData[fullKey];
                return map && map[docId] && map[docId].length > 0;
            })
            .map(item => item.name);
    }, [firestoreData, selectedCollection, path]);

    // --- Handlers ---

    const handleCollectionClick = (colName) => {
        setSelectedCollection(colName);
        setSelectedDocId(null);
        setDocSearch('');
    };

    const handleDocClick = (docId) => {
        setSelectedDocId(docId);
        setJsonForceExpand(null);
    };

    const handleDrillDown = (subColName) => {
        setPath([...path, { col: selectedCollection, doc: selectedDocId }]);
        setSelectedCollection(subColName);
        setSelectedDocId(null);
        setColSearch('');
        setDocSearch('');
    };

    const handleBreadcrumbClick = (index) => {
        if (index === -1) {
            setPath([]);
            setSelectedCollection(null);
            setSelectedDocId(null);
        } else {
            const newPath = path.slice(0, index + 1);
            setPath(newPath);
            setSelectedCollection(null); 
            setSelectedDocId(null);
        }
        setColSearch('');
        setDocSearch('');
    };

    const copyToClipboard = () => {
        if (!getSelectedDocumentData) return;
        const text = JSON.stringify(getSelectedDocumentData, null, 2);
        navigator.clipboard.writeText(text).then(() => {
            dispatch(showAlert({ type: 'success', message: 'JSON copied to clipboard!' }));
        });
    };

    const toggleExpandAll = () => {
        setJsonForceExpand(prev => prev === true ? false : true);
    };

    // --- Actions ---

    const handleAction = async (actionFn, successMsg) => {
        setIsSeeding(true);
        try {
            await actionFn();
            dispatch(showAlert({ type: 'success', message: successMsg }));
        } catch (error) {
            dispatch(showAlert({ type: 'error', message: error.message }));
        } finally {
            setIsSeeding(false);
        }
    };

    const handleAddDummyProjects = () => {
        if (!domain) {
            dispatch(showAlert({ type: 'error', message: 'Domain not found.' }));
            return;
        }
        handleAction(() => dispatch(addDummyProjects({ domain, count: 20 })).unwrap(), 'Dummy projects added!');
    };

    const handleAddDummyUsers = () => {
        handleAction(() => dispatch(addDummyUsers()).unwrap(), 'Dummy users added!');
    };

    const handleSeedDevData = () => {
        handleAction(seedDevData, 'Dev data seeded!');
    };

    const handleFetchData = () => {
        if (loading) return;
        handleAction(() => dispatch(fetchAllFirestoreData(domain)).unwrap(), 'Firestore data refreshed!');
        setPath([]);
        setSelectedCollection(null);
        setSelectedDocId(null);
    };

    return (
        <main className="developer-tools">
            <header className="dev-header">
                <h1 className="admin-title">Developer Tools</h1>
                <div className="dev-status">
                    {loading && <span className="status-badge loading">Syncing...</span>}
                    {isSeeding && <span className="status-badge seeding">Seeding Data...</span>}
                </div>
            </header>

            <div className="admin-dashboard">
                <div className="admin-actions dev-toolbar">
                    <button className="button secondary outline small" onClick={handleAddDummyProjects} disabled={isSeeding}>
                        + Dummy Projects
                    </button>
                    <button className="button secondary outline small" onClick={handleAddDummyUsers} disabled={isSeeding}>
                        + Dummy Users
                    </button>
                    <button className="button secondary outline small" onClick={handleSeedDevData} disabled={isSeeding}>
                        Seed Dev Data
                    </button>
                    <button className="button primary small" onClick={handleFetchData} disabled={loading || isSeeding}>
                        {loading ? 'Refreshing...' : 'Refresh Explorer'}
                    </button>
                     <button className="button danger outline small" onClick={() => dispatch(clearFirestoreData())} disabled={isSeeding}>
                        Clear View
                    </button>
                </div>

                {firestoreData && (
                    <div className="firestore-explorer-container">
                        {/* Breadcrumbs */}
                        <div className="fs-breadcrumbs">
                            <div 
                                className={`crumb ${path.length === 0 ? 'active' : ''}`}
                                onClick={() => handleBreadcrumbClick(-1)}
                            >
                                <FolderIcon /> root
                            </div>
                            {path.map((item, index) => (
                                <React.Fragment key={index}>
                                    <span className="sep">›</span>
                                    <div 
                                        className={`crumb ${index === path.length - 1 && !selectedCollection ? 'active' : ''}`}
                                        onClick={() => handleBreadcrumbClick(index)}
                                    >
                                        {item.col} <span className="doc-id">[{item.doc.substring(0, 6)}..]</span>
                                    </div>
                                </React.Fragment>
                            ))}
                            {selectedCollection && (
                                <>
                                    <span className="sep">›</span>
                                    <div className="crumb active">{selectedCollection}</div>
                                </>
                            )}
                        </div>

                        {/* 3-Column Layout */}
                        <div className="fs-columns">
                            {/* Column 1: Collections */}
                            <div className="fs-col collections-col">
                                <div className="col-header">
                                    <span>Collections</span>
                                    <div className="col-search">
                                        <SearchIcon />
                                        <input 
                                            type="text" 
                                            placeholder="Filter..." 
                                            value={colSearch}
                                            onChange={(e) => setColSearch(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="col-list">
                                    {getCollectionsAtCurrentLevel.map(col => (
                                        <div 
                                            key={col}
                                            className={`list-item ${selectedCollection === col ? 'active' : ''}`}
                                            onClick={() => handleCollectionClick(col)}
                                        >
                                            <FolderIcon />
                                            <span className="text">{col}</span>
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
                                    <span>Documents {selectedCollection && `(${getDocumentsInSelectedCollection.length})`}</span>
                                    <div className="col-search">
                                        <SearchIcon />
                                        <input 
                                            type="text" 
                                            placeholder="Search ID..." 
                                            value={docSearch}
                                            onChange={(e) => setDocSearch(e.target.value)}
                                            disabled={!selectedCollection}
                                        />
                                    </div>
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

                            {/* Column 3: Data */}
                            <div className="fs-col data-col">
                                <div className="col-header">
                                    <span className="doc-title">{selectedDocId || 'Document Data'}</span>
                                    {selectedDocId && (
                                        <div className="data-actions">
                                            <button className="icon-btn" title="Copy JSON" onClick={copyToClipboard}>
                                                <CopyIcon />
                                            </button>
                                            <button className="icon-btn" title="Toggle Expand" onClick={toggleExpandAll}>
                                                {jsonForceExpand === true ? <CollapseIcon /> : <ExpandIcon />}
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="data-content">
                                    {selectedDocId && getSelectedDocumentData ? (
                                        <>
                                            {/* Subcollections Panel */}
                                            {getSubcollectionsForDoc(selectedDocId).length > 0 && (
                                                <div className="subcollections-panel">
                                                    <div className="sub-label">Subcollections</div>
                                                    <div className="sub-chips">
                                                        {getSubcollectionsForDoc(selectedDocId).map(sub => (
                                                            <div 
                                                                key={sub} 
                                                                className="chip"
                                                                onClick={() => handleDrillDown(sub)}
                                                            >
                                                                <FolderIcon /> {sub}
                                                                <span className="arrow">→</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="json-panel">
                                                <JsonViewer 
                                                    data={getSelectedDocumentData} 
                                                    forceExpand={jsonForceExpand} 
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="empty-state">
                                            <div className="icon">📄</div>
                                            <p>{selectedCollection ? 'Select a document to view its data' : 'Explore Firestore collections'}</p>
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

