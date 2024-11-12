import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
// Selectors and actions
import { selectProjects } from '../../app/slices/projectsSlice';
import { selectUserStudio } from '../../app/slices/authSlice';
import { openModal } from '../../app/slices/modalSlice';
import Refresh from '../../components/Refresh/Refresh';
// Styles
import SearchInput from '../../components/Search/SearchInput';
import { getWebsiteURL } from '../../utils/urlUtils';
import AddProjectModal from '../../components/Modal/AddProject';
import AddCollectionModal from '../../components/Modal/AddCollection';

function PortfolioBuilder() {
    const defaultStudio = useSelector(selectUserStudio);
    const dispatch = useDispatch();
    document.title = `${defaultStudio.name} | Projects`;


    const handleNewCollectionClick = () => dispatch(openModal('createCollection'));
    return (
        <>

            <AddCollectionModal />
            <main className="portfolio-builder">
                <div className="portfolio-builder-header">
                    <h1>{defaultStudio.name} Portfolio</h1>
                    <a href={getWebsiteURL(defaultStudio.domain)}>{getWebsiteURL(defaultStudio.domain)}</a>
                    <div className="actions">
                    <div className="button primary icon add" onClick={handleNewCollectionClick}>
                            New
                        </div>
                    </div>
                </div>

            </main>
        </>
    );
}

export default PortfolioBuilder;
