// Firebase SDK instances (assuming already initialized in app.js)
const auth = firebase.auth();
const db = firebase.firestore();

// Project DOM Elements
const projectsSection = document.getElementById('projects-section');
const addProjectBtn = document.getElementById('add-project-btn');
const createProjectFormContainer = document.getElementById('create-project-form-container');
const projectFormTitle = document.getElementById('project-form-title');
const projectIdInput = document.getElementById('project-id'); // Hidden input for ID
const projectNameInput = document.getElementById('projectName');
const clientNameInput = document.getElementById('clientName');
const clientEmailInput = document.getElementById('clientEmail');
const eventDateInput = document.getElementById('eventDate');
const projectStatusInput = document.getElementById('projectStatus');
const saveProjectBtn = document.getElementById('save-project-btn');
const cancelProjectBtn = document.getElementById('cancel-project-btn');
const projectsListDiv = document.getElementById('projects-list');

// Navigation buttons
const navProjectsBtn = document.getElementById('nav-projects-btn');
const navPackagesBtn = document.getElementById('nav-packages-btn');
const navExpensesBtnProject = document.getElementById('nav-expenses-btn');


let currentEditingProjectId = null;

// Show Project Form
if (addProjectBtn) {
    addProjectBtn.addEventListener('click', () => {
        currentEditingProjectId = null;
        projectFormTitle.textContent = 'Add New Project';
        projectIdInput.value = '';
        createProjectFormContainer.style.display = 'block';
        projectNameInput.value = '';
        clientNameInput.value = '';
        clientEmailInput.value = '';
        eventDateInput.value = '';
        projectStatusInput.value = 'Lead';
    });
}

// Cancel Project Form
if (cancelProjectBtn) {
    cancelProjectBtn.addEventListener('click', () => {
        createProjectFormContainer.style.display = 'none';
        currentEditingProjectId = null;
        projectIdInput.value = '';
    });
}

// Save Project (Add or Edit)
if (saveProjectBtn) {
    saveProjectBtn.addEventListener('click', async () => {
        const projectName = projectNameInput.value.trim();
        const clientName = clientNameInput.value.trim();
        const clientEmail = clientEmailInput.value.trim();
        const eventDate = eventDateInput.value;
        const status = projectStatusInput.value; // User manually sets this.
        // TODO/Consideration: Automate project status to "Booked" via Cloud Function when a quote is "Accepted".
        // For now, this is a manual update by the user.

        if (!projectName || !clientName) {
            alert('Project Name and Client Name are required.');
            return;
        }

        const user = auth.currentUser;
        if (!user) {
            alert('You must be logged in to save projects.');
            return;
        }
        const photographerUid = user.uid;

        const projectData = {
            photographerUid,
            projectName,
            clientName,
            clientEmail,
            eventDate: eventDate ? firebase.firestore.Timestamp.fromDate(new Date(eventDate)) : null,
            status,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            if (currentEditingProjectId) {
                await db.collection('projects').doc(currentEditingProjectId).update(projectData);
                console.log('Project updated successfully');
            } else {
                projectData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                await db.collection('projects').add(projectData);
                console.log('Project added successfully');
            }
            createProjectFormContainer.style.display = 'none';
            currentEditingProjectId = null;
            projectIdInput.value = '';
            projectNameInput.value = '';
            clientNameInput.value = '';
            clientEmailInput.value = '';
            eventDateInput.value = '';
            projectStatusInput.value = 'Lead';
        } catch (error) {
            console.error('Error saving project:', error);
            alert('Error saving project: ' + error.message);
        }
    });
}

// Display Projects
function displayProjects() {
    const user = auth.currentUser;
    if (!user || !projectsListDiv) return;

    db.collection('projects')
        .where('photographerUid', '==', user.uid)
        .orderBy('createdAt', 'desc')
        .onSnapshot(querySnapshot => {
            if (!projectsListDiv) return;
            projectsListDiv.innerHTML = '<h3>Your Projects:</h3>';
            if (querySnapshot.empty) {
                projectsListDiv.innerHTML += '<p>No projects found. Add one!</p>';
                return;
            }
            querySnapshot.forEach(doc => {
                const project = doc.data();
                const projectId = doc.id;
                const projectElement = document.createElement('div');
                projectElement.classList.add('list-item');
                projectElement.innerHTML = `
                    <h4>${project.projectName}</h4>
                    <p>Client: ${project.clientName} ${project.clientEmail ? '(' + project.clientEmail + ')' : ''}</p>
                    <p>Event Date: ${project.eventDate ? project.eventDate.toDate().toLocaleDateString() : 'N/A'}</p>
                    <p>Status: ${project.status}</p>
                    <div class="actions">
                        <button class="edit-project-btn" data-id="${projectId}">Edit</button>
                        <button class="delete-project-btn" data-id="${projectId}">Delete</button>
                        <button class="manage-quotes-btn" data-project-id="${projectId}" data-project-name="${project.projectName}">Manage Quotes</button>
                        <button class="manage-invoices-btn" data-project-id="${projectId}" data-project-name="${project.projectName}">Manage Invoices</button>
                    </div>
                `;
                projectsListDiv.appendChild(projectElement);

                projectElement.querySelector('.edit-project-btn').addEventListener('click', () => {
                    loadProjectForEditing(projectId, project);
                });
                projectElement.querySelector('.delete-project-btn').addEventListener('click', () => {
                    deleteProject(projectId);
                });
                projectElement.querySelector('.manage-quotes-btn').addEventListener('click', (e) => {
                    const pId = e.target.dataset.projectId;
                    const pName = e.target.dataset.projectName;
                    if (window.appFirebase && window.appFirebase.quotes && window.appFirebase.quotes.showQuotesForProject) {
                        window.appFirebase.quotes.showQuotesForProject(pId, pName);
                    }
                });
                projectElement.querySelector('.manage-invoices-btn').addEventListener('click', (e) => {
                    const pId = e.target.dataset.projectId;
                    const pName = e.target.dataset.projectName;
                    if (window.appFirebase && window.appFirebase.invoices && window.appFirebase.invoices.showInvoicesForProject) {
                        window.appFirebase.invoices.showInvoicesForProject(pId, pName);
                    }
                });
            });
        }, error => {
            console.error('Error fetching projects:', error);
            if (projectsListDiv) projectsListDiv.innerHTML = '<p>Error loading projects.</p>';
        });
}

function loadProjectForEditing(id, projectData) {
    currentEditingProjectId = id;
    projectFormTitle.textContent = 'Edit Project';
    projectIdInput.value = id;
    projectNameInput.value = projectData.projectName || '';
    clientNameInput.value = projectData.clientName || '';
    clientEmailInput.value = projectData.clientEmail || '';
    eventDateInput.value = projectData.eventDate ? projectData.eventDate.toDate().toISOString().split('T')[0] : '';
    projectStatusInput.value = projectData.status || 'Lead';
    createProjectFormContainer.style.display = 'block';
    window.scrollTo(0, createProjectFormContainer.offsetTop);
}

async function deleteProject(projectId) {
    if (confirm('Are you sure you want to delete this project? This will also delete associated quotes and invoices.')) {
        try {
            await db.collection('projects').doc(projectId).delete();
            console.log('Project deleted successfully');
        } catch (error) {
            console.error('Error deleting project:', error);
            alert('Error deleting project: ' + error.message);
        }
    }
}

window.appFirebase = window.appFirebase || {};
window.appFirebase.displayProjects = displayProjects;
window.appFirebase.clearProjectsList = () => {
    if(projectsListDiv) projectsListDiv.innerHTML = '';
    if(createProjectFormContainer) createProjectFormContainer.style.display = 'none';
};
window.appFirebase.showProjectsSection = () => {
    if(projectsSection) projectsSection.style.display = 'block';
    if (window.appFirebase && window.appFirebase.hidePackagesSection) window.appFirebase.hidePackagesSection();
    if (window.appFirebase && window.appFirebase.quotes && window.appFirebase.quotes.hideQuotesSection) window.appFirebase.quotes.hideQuotesSection();
    if (window.appFirebase && window.appFirebase.invoices && window.appFirebase.invoices.hideInvoicesSection) window.appFirebase.invoices.hideInvoicesSection();
    if (window.appFirebase && window.appFirebase.expenses && window.appFirebase.expenses.hideExpensesSection) window.appFirebase.expenses.hideExpensesSection();

    if (navProjectsBtn) navProjectsBtn.classList.add('active-tab');
    if (navPackagesBtn) navPackagesBtn.classList.remove('active-tab');
    if (navExpensesBtnProject) navExpensesBtnProject.classList.remove('active-tab');
};
window.appFirebase.hideProjectsSection = () => {
    if(projectsSection) projectsSection.style.display = 'none';
};

console.log('project_management.js loaded');
