// Firebase SDK instances (assuming already initialized in app.js)
const authPackage = firebase.auth();
const dbPackage = firebase.firestore();

// Package DOM Elements
const packagesSection = document.getElementById('packages-section');
const addPackageBtn = document.getElementById('add-package-btn');
const createPackageFormContainer = document.getElementById('create-package-form-container');
const packageFormTitle = document.getElementById('package-form-title');
const packageIdInput = document.getElementById('package-id');
const packageNameInput = document.getElementById('packageName');
const packageDescriptionInput = document.getElementById('packageDescription');
const packageServicesInput = document.getElementById('packageServices');
const packageBasePriceInput = document.getElementById('packageBasePrice');
const savePackageBtn = document.getElementById('save-package-btn');
const cancelPackageBtn = document.getElementById('cancel-package-btn');
const packagesListDiv = document.getElementById('packages-list');

// Navigation buttons
const navProjectsBtnPkg = document.getElementById('nav-projects-btn');
const navPackagesBtnPkg = document.getElementById('nav-packages-btn');
const navExpensesBtnPkg = document.getElementById('nav-expenses-btn'); // Added for active tab management


let currentEditingPackageId = null;

if (addPackageBtn) {
    addPackageBtn.addEventListener('click', () => {
        currentEditingPackageId = null;
        if (packageFormTitle) packageFormTitle.textContent = 'Add New Package';
        if (packageIdInput) packageIdInput.value = '';
        if (createPackageFormContainer) createPackageFormContainer.style.display = 'block';
        if (packageNameInput) packageNameInput.value = '';
        if (packageDescriptionInput) packageDescriptionInput.value = '';
        if (packageServicesInput) packageServicesInput.value = '';
        if (packageBasePriceInput) packageBasePriceInput.value = '';
    });
}

if (cancelPackageBtn) {
    cancelPackageBtn.addEventListener('click', () => {
        if (createPackageFormContainer) createPackageFormContainer.style.display = 'none';
        currentEditingPackageId = null;
        if (packageIdInput) packageIdInput.value = '';
    });
}

if (savePackageBtn) {
    savePackageBtn.addEventListener('click', async () => {
        const packageName = packageNameInput.value.trim();
        const description = packageDescriptionInput.value.trim();
        const servicesText = packageServicesInput.value.trim();
        const basePrice = parseFloat(packageBasePriceInput.value);

        if (!packageName || isNaN(basePrice)) {
            alert('Package Name and Base Price are required.');
            return;
        }

        const user = authPackage.currentUser;
        if (!user) {
            alert('You must be logged in to save packages.');
            return;
        }
        const photographerUid = user.uid;
        const services = servicesText.split('\n').map(s => s.trim()).filter(s => s);

        const packageData = {
            photographerUid,
            packageName,
            description,
            services,
            basePrice,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            if (currentEditingPackageId) {
                await dbPackage.collection('packages').doc(currentEditingPackageId).update(packageData);
                console.log('Package updated successfully');
            } else {
                packageData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                packageData.isActive = true;
                await dbPackage.collection('packages').add(packageData);
                console.log('Package added successfully');
            }
            if (createPackageFormContainer) createPackageFormContainer.style.display = 'none';
            currentEditingPackageId = null;
            if (packageIdInput) packageIdInput.value = '';
            if (packageNameInput) packageNameInput.value = '';
            if (packageDescriptionInput) packageDescriptionInput.value = '';
            if (packageServicesInput) packageServicesInput.value = '';
            if (packageBasePriceInput) packageBasePriceInput.value = '';
        } catch (error) {
            console.error('Error saving package:', error);
            alert('Error saving package: ' + error.message);
        }
    });
}

function displayPackages() {
    const user = authPackage.currentUser;
    if (!user || !packagesListDiv) return;

    dbPackage.collection('packages')
        .where('photographerUid', '==', user.uid)
        .orderBy('packageName')
        .onSnapshot(querySnapshot => {
            if (!packagesListDiv) return;
            packagesListDiv.innerHTML = '<h3>Your Packages:</h3>';
            if (querySnapshot.empty) {
                packagesListDiv.innerHTML += '<p>No packages found. Add one!</p>';
                return;
            }
            querySnapshot.forEach(doc => {
                const pkg = doc.data();
                const packageId = doc.id;
                const packageElement = document.createElement('div');
                packageElement.classList.add('list-item');
                let servicesHtml = '<ul>';
                if (pkg.services && pkg.services.length > 0) {
                    pkg.services.forEach(s => { servicesHtml += `<li>${s}</li>`; });
                } else {
                    servicesHtml += '<li>No services listed.</li>';
                }
                servicesHtml += '</ul>';

                packageElement.innerHTML = `
                    <h4>${pkg.packageName}</h4>
                    <p>Description: ${pkg.description || 'N/A'}</p>
                    <p>Services:</p>
                    ${servicesHtml}
                    <p>Base Price: $${pkg.basePrice ? pkg.basePrice.toFixed(2) : '0.00'}</p>
                    <div class="actions">
                        <button class="edit-package-btn" data-id="${packageId}">Edit</button>
                        <button class="delete-package-btn" data-id="${packageId}">Delete</button>
                    </div>
                `;
                packagesListDiv.appendChild(packageElement);

                const editBtn = packageElement.querySelector('.edit-package-btn');
                if (editBtn) {
                    editBtn.addEventListener('click', () => {
                        loadPackageForEditing(packageId, pkg);
                    });
                }
                const deleteBtn = packageElement.querySelector('.delete-package-btn');
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', () => {
                        deletePackage(packageId);
                    });
                }
            });
        }, error => {
            console.error('Error fetching packages:', error);
            if (packagesListDiv) packagesListDiv.innerHTML = '<p>Error loading packages.</p>';
        });
}

function loadPackageForEditing(id, pkgData) {
    currentEditingPackageId = id;
    if (packageFormTitle) packageFormTitle.textContent = 'Edit Package';
    if (packageIdInput) packageIdInput.value = id;
    if (packageNameInput) packageNameInput.value = pkgData.packageName || '';
    if (packageDescriptionInput) packageDescriptionInput.value = pkgData.description || '';
    if (packageServicesInput) packageServicesInput.value = pkgData.services ? pkgData.services.join('\n') : '';
    if (packageBasePriceInput) packageBasePriceInput.value = pkgData.basePrice || '';
    if (createPackageFormContainer) createPackageFormContainer.style.display = 'block';
    window.scrollTo(0, createPackageFormContainer.offsetTop);
}

async function deletePackage(packageId) {
    if (confirm('Are you sure you want to delete this package?')) {
        try {
            await dbPackage.collection('packages').doc(packageId).delete();
            console.log('Package deleted successfully');
        } catch (error) {
            console.error('Error deleting package:', error);
            alert('Error deleting package: ' + error.message);
        }
    }
}

// Expose functions to be called from auth.js
window.appFirebase = window.appFirebase || {};
window.appFirebase.displayPackages = displayPackages;
window.appFirebase.clearPackagesList = () => {
    if(packagesListDiv) packagesListDiv.innerHTML = '';
    if(createPackageFormContainer) createPackageFormContainer.style.display = 'none';
};
window.appFirebase.showPackagesSection = () => {
    if(packagesSection) packagesSection.style.display = 'block';
    if (window.appFirebase && window.appFirebase.hideProjectsSection) window.appFirebase.hideProjectsSection();
    if (window.appFirebase && window.appFirebase.quotes && window.appFirebase.quotes.hideQuotesSection) window.appFirebase.quotes.hideQuotesSection();
    if (window.appFirebase && window.appFirebase.invoices && window.appFirebase.invoices.hideInvoicesSection) window.appFirebase.invoices.hideInvoicesSection();
    if (window.appFirebase && window.appFirebase.expenses && window.appFirebase.expenses.hideExpensesSection) window.appFirebase.expenses.hideExpensesSection(); // Hide expenses

    if (navPackagesBtnPkg) navPackagesBtnPkg.classList.add('active-tab');
    if (navProjectsBtnPkg) navProjectsBtnPkg.classList.remove('active-tab');
    if (navExpensesBtnPkg) navExpensesBtnPkg.classList.remove('active-tab'); // Deactivate expenses tab
};
window.appFirebase.hidePackagesSection = () => {
    if(packagesSection) packagesSection.style.display = 'none';
};

console.log('package_management.js loaded');
