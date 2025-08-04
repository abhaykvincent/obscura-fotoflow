import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux'

// --- Selectors and Actions ---
import { selectUserStudio } from '../../app/slices/authSlice';
import { openModal } from '../../app/slices/modalSlice';

// --- Components ---
import SearchInput from '../../components/Search/SearchInput';
import Refresh from '../../components/Refresh/Refresh';
import AddPackageModal from '../../components/Modal/AddPackage/AddPackage';

// --- Styles ---
import './Packages.scss';

// --- Main Component ---
function Packages() {
    const dispatch = useDispatch();
    const defaultStudio = useSelector(selectUserStudio);

    useEffect(() => {
        if (defaultStudio?.domain) {
            document.title = `${defaultStudio.domain} | Packages`;
        }
    }, [defaultStudio?.domain]);

    const handleNewPackageClick = useCallback(() => {
        dispatch(openModal('createPackage'));
    }, [dispatch]);


    if (!defaultStudio) {
        return <div>Loading studio information...</div>;
    }

    return (
        <>
            <AddPackageModal />

            <div className="projects-page-header">
                <div className="search-bar">
                    <SearchInput />
                </div>
            </div>

            <main className="projects">
                <div className="projects-header">
                    <h1>Packages</h1>
                    <div className="actions">
                        <button className="button primary icon add" onClick={handleNewPackageClick}>
                            New
                        </button>
                    </div>
                </div>
                <div>
                  Packages will be listed here.
                </div>

                <Refresh />
            </main>
        </>
    );
}

export default Packages;
