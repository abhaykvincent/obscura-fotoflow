import React, { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

// --- Selectors and Actions ---
import { selectUserStudio } from '../../app/slices/authSlice';
import { openModal } from '../../app/slices/modalSlice';
import { fetchPackages, selectPackages, selectPackagesLoading, selectPackagesError } from '../../app/slices/packagesSlice';

// --- Components ---
import SearchInput from '../../components/Search/SearchInput';
import Refresh from '../../components/Refresh/Refresh';
import AddPackageModal from '../../components/Modal/AddPackage/AddPackage';
import PackageCard from '../../components/Cards/PackageCard/PackageCard';

// --- Styles ---
import './Packages.scss';

// --- Main Component ---
function Packages() {
    const dispatch = useDispatch();
    const defaultStudio = useSelector(selectUserStudio);
    const packages = useSelector(selectPackages);
    const loading = useSelector(selectPackagesLoading);
    const error = useSelector(selectPackagesError);

    useEffect(() => {
        if (defaultStudio?.domain) {
            document.title = `${defaultStudio.domain} | Packages`;
            dispatch(fetchPackages(defaultStudio.domain));
        }
    }, [defaultStudio?.domain, dispatch]);

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
                <div className="packages-list">
                    {loading && <p>Loading packages...</p>}
                    {error && <p>Error: {error}</p>}
                    {packages.map(pkg => (
                        <PackageCard key={pkg.id} packageData={pkg} />
                    ))}
                </div>

                <Refresh />
            </main>
        </>
    );
}

export default Packages;
