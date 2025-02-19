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
import AddCollectionModal from '../../components/Modal/AddCollection';
import AddPortfolioModal from '../../components/Modal/AddPortfolio';
import CollectionsPanel from '../../components/Project/Collections/CollectionsPanel';
import CollectionImages from '../../components/Project/Collections/CollectionImages';

function PortfolioBuilder() {
    const defaultStudio = useSelector(selectUserStudio);
    const projects = useSelector(selectProjects);
    const dispatch = useDispatch();
    document.title = `${defaultStudio.name} | Projects`;

    const [portfolio , setPortfolio] = useState(null);

    useEffect(() => {
        setPortfolio(projects.find(project => project.type === 'Portfolio'));
    }, [projects]);
    useEffect(() => {
        console.log(portfolio)
    }, [portfolio]);


    const handleNewPortfolioClick = () => dispatch(openModal('createPortfolio'));
    const handleNewCollectionClick = () => dispatch(openModal('createCollection'));
    return (
        <>

            <AddCollectionModal project={portfolio}/>
            <AddPortfolioModal />
            <main className="portfolio-builder">
                <div className="portfolio-builder-header">
                    <h1>{defaultStudio.name} Portfolio</h1>
                    <a className href={getWebsiteURL(defaultStudio.domain)}>{getWebsiteURL(defaultStudio.domain)}</a>
                    <div className="actions">
                    { !portfolio && <div className="button primary icon add" onClick={handleNewPortfolioClick}>Create Portfolio</div>}
                    { portfolio && !portfolio.collections[0] && <div className="button secondary icon add" onClick={handleNewCollectionClick}>Create Gallery</div>}
                    </div>

                </div>
                {(portfolio && portfolio?.collections[0]?.id) &&  <CollectionsPanel project={portfolio} collectionId={portfolio?.collections[0]?.id}/>}
                
            </main>
        </>
    );
}

export default PortfolioBuilder;
