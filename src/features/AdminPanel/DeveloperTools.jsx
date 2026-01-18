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
    const mainTabs = [...new Set(allKeys.map(k => k.split('::')[0]))];

    // Extract Sub Tabs for the active main tab
    const subTabs = activeMainTab === 'ALL' ? [] : allKeys
        .filter(k => k.startsWith(`${activeMainTab}::`))
        .map(k => k.split('::')[1]);

    const showSubTabs = subTabs.length > 0;

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
                    <div style={{ 
                        marginTop: 30, 
                        background: '#1E1E1E', 
                        color: '#D4D4D4', 
                        padding: 20, 
                        borderRadius: 8,
                        fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
                        fontSize: '14px',
                        textAlign: 'left',
                        maxHeight: '800px',
                        overflowY: 'auto'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15, borderBottom: '1px solid #333', paddingBottom: 10 }}>
                            <h3 style={{ margin: 0, color: '#fff' }}>Firestore Data Explorer</h3>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button 
                                    onClick={handleCopyJson}
                                    style={{ background: '#0E639C', color: 'white', border: 'none', padding: '5px 10px', borderRadius: 4, cursor: 'pointer' }}
                                >
                                    Copy JSON
                                </button>
                                <button 
                                    onClick={() => dispatch(clearFirestoreData())}
                                    style={{ background: '#C586C0', color: 'white', border: 'none', padding: '5px 10px', borderRadius: 4, cursor: 'pointer' }}
                                >
                                    Clear
                                </button>
                            </div>
                        </div>

                        {/* Main Tabs */}
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 15 }}>
                            <button
                                onClick={() => { setActiveMainTab('ALL'); setActiveSubTab('Main'); }}
                                style={{
                                    background: activeMainTab === 'ALL' ? '#0E639C' : '#333',
                                    color: 'white',
                                    border: 'none',
                                    padding: '5px 15px',
                                    borderRadius: 20,
                                    cursor: 'pointer',
                                    fontWeight: activeMainTab === 'ALL' ? 'bold' : 'normal',
                                    fontSize: '12px'
                                }}
                            >
                                ALL
                            </button>
                            {mainTabs.map(key => (
                                <button
                                    key={key}
                                    onClick={() => { setActiveMainTab(key); setActiveSubTab('Main'); }}
                                    style={{
                                        background: activeMainTab === key ? '#0E639C' : '#333',
                                        color: 'white',
                                        border: 'none',
                                        padding: '5px 15px',
                                        borderRadius: 20,
                                        cursor: 'pointer',
                                        fontWeight: activeMainTab === key ? 'bold' : 'normal',
                                        fontSize: '12px'
                                    }}
                                >
                                    {key}
                                </button>
                            ))}
                        </div>

                        {/* Sub Tabs */}
                        {showSubTabs && (
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 15, marginLeft: 20, paddingLeft: 10, borderLeft: '2px solid #555' }}>
                                <span style={{ color: '#888', alignSelf: 'center', fontSize: '12px' }}>Subcollections:</span>
                                <button
                                    onClick={() => setActiveSubTab('Main')}
                                    style={{
                                        background: activeSubTab === 'Main' ? '#4CAF50' : '#444',
                                        color: 'white',
                                        border: 'none',
                                        padding: '4px 12px',
                                        borderRadius: 15,
                                        cursor: 'pointer',
                                        fontSize: '11px',
                                        fontWeight: activeSubTab === 'Main' ? 'bold' : 'normal'
                                    }}
                                >
                                    Main Documents
                                </button>
                                {subTabs.map(subKey => (
                                    <button
                                        key={subKey}
                                        onClick={() => setActiveSubTab(subKey)}
                                        style={{
                                            background: activeSubTab === subKey ? '#4CAF50' : '#444',
                                            color: 'white',
                                            border: 'none',
                                            padding: '4px 12px',
                                            borderRadius: 15,
                                            cursor: 'pointer',
                                            fontSize: '11px',
                                            fontWeight: activeSubTab === subKey ? 'bold' : 'normal'
                                        }}
                                    >
                                        {subKey}
                                    </button>
                                ))}
                            </div>
                        )}

                        <JsonViewer data={getActiveData()} />
                    </div>
                )}
            </div>
        </main>
    );
}

export default DeveloperTools;
