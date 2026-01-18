import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { showAlert } from '../../app/slices/alertSlice';
import { addDummyProjects, addDummyUsers, fetchAllFirestoreData, clearFirestoreData } from '../../app/slices/adminPaneSlice';
import { selectDomain } from '../../app/slices/authSlice';
import './AdminPanel.scss';

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
    const [activeMainTab, setActiveMainTab] = useState('ALL');
    const [activeSubTab, setActiveSubTab] = useState('Main');

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
            setActiveMainTab('ALL');
            setActiveSubTab('Main');
            await dispatch(fetchAllFirestoreData(domain)).unwrap();
            dispatch(showAlert({ type: 'success', message: 'Firestore data fetched successfully!' }));
        } catch (error) {
            dispatch(showAlert({ type: 'error', message: `Error fetching data: ${error.message}` }));
        }
    };

    const getActiveData = () => {
        if (!firestoreData) return null;
        if (activeMainTab === 'ALL') return firestoreData;
        if (activeSubTab === 'Main') return firestoreData[activeMainTab];
        return firestoreData[`${activeMainTab}::${activeSubTab}`];
    };

    const handleCopyJson = () => {
        const data = getActiveData();
        if (!data) return;
        navigator.clipboard.writeText(JSON.stringify(data, null, 2));
        dispatch(showAlert({ type: 'success', message: 'JSON copied to clipboard!' }));
    };

    // Extract Main Tabs (unique prefixes before '::')
    const allKeys = firestoreData ? Object.keys(firestoreData) : [];
    const mainTabs = [...new Set(allKeys.map(k => k.split('::')[0]))].filter(k => k !== 'ALL'); // Exclude ALL if present manually

    const getSubTabsFor = (mainKey) => {
        return allKeys
            .filter(k => k.startsWith(`${mainKey}::`))
            .map(k => k.split('::')[1]);
    };

    const renderNav = () => {
        return (
            <>
                <div 
                    className={`nav-item ${activeMainTab === 'ALL' ? 'active' : ''}`} 
                    onClick={() => { setActiveMainTab('ALL'); setActiveSubTab('Main'); }}
                >
                    ALL DATA
                </div>
                {mainTabs.map(key => {
                    const subTabs = getSubTabsFor(key);
                    const isActive = activeMainTab === key;
                    const hasSubTabs = subTabs.length > 0;

                    return (
                        <div key={key} className="nav-group">
                            <div 
                                className={`nav-item ${isActive && activeSubTab === 'Main' && !hasSubTabs ? 'active' : ''}`}
                                onClick={() => { setActiveMainTab(key); setActiveSubTab('Main'); }}
                            >
                                {key} {hasSubTabs && (isActive ? ' ▼' : ' ▶')}
                            </div>
                            
                            {isActive && hasSubTabs && (
                                <div className="sub-nav">
                                    <div 
                                        className={`nav-item ${activeSubTab === 'Main' ? 'active' : ''}`}
                                        onClick={() => setActiveSubTab('Main')}
                                    >
                                        Main Documents
                                    </div>
                                    {subTabs.map(subKey => (
                                        <div 
                                            key={subKey}
                                            className={`nav-item ${activeSubTab === subKey ? 'active' : ''}`}
                                            onClick={() => setActiveSubTab(subKey)}
                                        >
                                            {subKey}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </>
        );
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
                        {loading ? 'Fetching Data...' : 'Get All Firestore Data'}
                    </div>
                </div>

                {firestoreData && (
                    <div className="firestore-explorer">
                        <div className="sidebar">
                            <div className="sidebar-header">Collections</div>
                            {renderNav()}
                        </div>
                        <div className="content-area">
                            <div className="toolbar">
                                <h3>
                                    {activeMainTab === 'ALL' ? 'Full Database Dump' : `${activeMainTab} ${activeSubTab !== 'Main' ? `/ ${activeSubTab}` : ''}`}
                                </h3>
                                <div className="actions">
                                    <button onClick={handleCopyJson}>Copy JSON</button>
                                    <button className="clear-btn" onClick={() => dispatch(clearFirestoreData())}>Clear</button>
                                </div>
                            </div>
                            <div className="viewer-container">
                                <JsonViewer data={getActiveData()} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}

export default DeveloperTools;
