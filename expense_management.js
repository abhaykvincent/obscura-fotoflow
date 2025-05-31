// Firebase SDK instances
const authExpense = firebase.auth();
const dbExpense = firebase.firestore();
const storageExpense = firebase.storage();

// DOM Elements for Expenses
const expensesSection = document.getElementById('expenses-section');
const addExpenseBtn = document.getElementById('add-expense-btn');
const createExpenseFormContainer = document.getElementById('create-expense-form-container');
const expenseFormTitle = document.getElementById('expense-form-title');
const currentExpenseIdInput = document.getElementById('current-expense-id');
const expenseDateInput = document.getElementById('expenseDate');
const expenseDescriptionInput = document.getElementById('expenseDescription');
const expenseAmountInput = document.getElementById('expenseAmount');
const expenseCategoryInput = document.getElementById('expenseCategory');
const expenseProjectIdSelect = document.getElementById('expenseProjectId');
const expenseReceiptFileInput = document.getElementById('expenseReceiptFile');
const receiptPreviewImg = document.getElementById('receipt-preview');
const uploadProgress = document.getElementById('upload-progress');
const saveExpenseBtn = document.getElementById('save-expense-btn');
const cancelExpenseBtn = document.getElementById('cancel-expense-btn');
const expensesListDiv = document.getElementById('expenses-list');
const navExpensesBtn = document.getElementById('nav-expenses-btn'); // Nav tab

let currentEditingExpenseId = null;
let currentReceiptFile = null; // To store the selected file

// --- Navigation & Section Visibility ---
if (navExpensesBtn) {
    navExpensesBtn.addEventListener('click', () => {
        showExpensesSection();
    });
}

function showExpensesSection() {
    if (expensesSection) expensesSection.style.display = 'block';
    if (window.appFirebase && window.appFirebase.hideProjectsSection) window.appFirebase.hideProjectsSection();
    if (window.appFirebase && window.appFirebase.hidePackagesSection) window.appFirebase.hidePackagesSection();
    if (window.appFirebase && window.appFirebase.quotes && window.appFirebase.quotes.hideQuotesSection) window.appFirebase.quotes.hideQuotesSection();
    if (window.appFirebase && window.appFirebase.invoices && window.appFirebase.invoices.hideInvoicesSection) window.appFirebase.invoices.hideInvoicesSection();

    // Update active tab
    document.querySelectorAll('.nav-tab-btn').forEach(btn => btn.classList.remove('active-tab'));
    if (navExpensesBtn) navExpensesBtn.classList.add('active-tab');

    populateProjectDropdown(); // Ensure dropdown is populated when section is shown
    displayExpenses();
    if (createExpenseFormContainer) createExpenseFormContainer.style.display = 'none';
}

function hideExpensesSection() {
    if (expensesSection) expensesSection.style.display = 'none';
    if (expensesListDiv) expensesListDiv.innerHTML = '';
}


// --- Populate Project Dropdown ---
async function populateProjectDropdown() {
    if (!expenseProjectIdSelect) return;
    const user = authExpense.currentUser;
    if (!user) return;

    expenseProjectIdSelect.innerHTML = '<option value="">None (General Expense)</option>'; // Default option

    try {
        const querySnapshot = await dbExpense.collection('projects')
            .where('photographerUid', '==', user.uid)
            .orderBy('projectName')
            .get();
        querySnapshot.forEach(doc => {
            const project = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = project.projectName;
            expenseProjectIdSelect.appendChild(option);
        });
    } catch (error) {
        console.error("Error populating project dropdown:", error);
    }
}


// --- Expense Form Logic ---
if (addExpenseBtn) {
    addExpenseBtn.addEventListener('click', () => {
        currentEditingExpenseId = null;
        if (expenseFormTitle) expenseFormTitle.textContent = 'Record New Expense';
        if (currentExpenseIdInput) currentExpenseIdInput.value = '';
        if (expenseDateInput) expenseDateInput.value = new Date().toISOString().split('T')[0];
        if (expenseDescriptionInput) expenseDescriptionInput.value = '';
        if (expenseAmountInput) expenseAmountInput.value = '';
        if (expenseCategoryInput) expenseCategoryInput.value = '';
        if (expenseProjectIdSelect) expenseProjectIdSelect.value = ''; // Default to "None"
        if (expenseReceiptFileInput) expenseReceiptFileInput.value = null; // Clear file input
        if (receiptPreviewImg) {
            receiptPreviewImg.style.display = 'none';
            receiptPreviewImg.src = '#';
        }
        if (uploadProgress) {
            uploadProgress.style.display = 'none';
            uploadProgress.value = 0;
        }
        currentReceiptFile = null;
        if (createExpenseFormContainer) createExpenseFormContainer.style.display = 'block';
    });
}

if (cancelExpenseBtn) {
    cancelExpenseBtn.addEventListener('click', () => {
        if (createExpenseFormContainer) createExpenseFormContainer.style.display = 'none';
        currentEditingExpenseId = null;
        currentReceiptFile = null;
        if (expenseReceiptFileInput) expenseReceiptFileInput.value = null;
    });
}

if (expenseReceiptFileInput) {
    expenseReceiptFileInput.addEventListener('change', (e) => {
        currentReceiptFile = e.target.files[0];
        if (currentReceiptFile && receiptPreviewImg) {
            if (currentReceiptFile.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    receiptPreviewImg.src = event.target.result;
                    receiptPreviewImg.style.display = 'block';
                };
                reader.readAsDataURL(currentReceiptFile);
            } else {
                receiptPreviewImg.style.display = 'none';
                receiptPreviewImg.src = '#'; // Clear if not image
            }
        } else if (receiptPreviewImg) {
            receiptPreviewImg.style.display = 'none';
        }
    });
}

if (saveExpenseBtn) {
    saveExpenseBtn.addEventListener('click', async () => {
        const date = expenseDateInput.value;
        const description = expenseDescriptionInput.value.trim();
        const amount = parseFloat(expenseAmountInput.value);
        const category = expenseCategoryInput.value.trim();
        const projectId = expenseProjectIdSelect.value || null; // Null if "None" selected

        if (!date || !description || isNaN(amount) || amount <= 0) {
            alert('Date, Description, and a valid Amount are required for expenses.');
            return;
        }
        const user = authExpense.currentUser;
        if (!user) {
            alert('You must be logged in to save expenses.');
            return;
        }

        const expenseData = {
            photographerUid: user.uid,
            expenseDate: firebase.firestore.Timestamp.fromDate(new Date(date)),
            description,
            amount,
            category,
            projectId, // Will be null if not linked
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            receiptUrl: null, // Initialize with null
            storagePath: null // Initialize with null
        };

        // Handle file upload if a new file is selected
        if (currentReceiptFile) {
            if (uploadProgress) uploadProgress.style.display = 'block';
            const newExpenseIdForPath = currentEditingExpenseId || dbExpense.collection('expenses').doc().id; // Use existing ID or generate one for path
            const filePath = `receipts/${user.uid}/${newExpenseIdForPath}/${currentReceiptFile.name}`;
            const fileRef = storageExpense.ref(filePath);
            const uploadTask = fileRef.put(currentReceiptFile);

            uploadTask.on('state_changed',
                (snapshot) => { // Progress
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    if (uploadProgress) uploadProgress.value = progress;
                },
                (error) => { // Error
                    console.error("Upload failed:", error);
                    alert("Receipt upload failed: " + error.message);
                    if (uploadProgress) uploadProgress.style.display = 'none';
                    saveExpenseBtn.disabled = false; // Re-enable save button
                },
                async () => { // Complete
                    try {
                        const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                        expenseData.receiptUrl = downloadURL;
                        expenseData.storagePath = filePath; // Store the path for future management
                        await saveExpenseDataToFirestore(expenseData);
                    } catch (urlError) {
                        console.error("Error getting download URL or saving after upload:", urlError);
                        alert("Error processing receipt after upload: " + urlError.message);
                        if (uploadProgress) uploadProgress.style.display = 'none';
                        saveExpenseBtn.disabled = false;
                    }
                }
            );
            saveExpenseBtn.disabled = true; // Disable save button during upload
        } else {
            // No new file, just save data (might be an edit without changing receipt)
            if (currentEditingExpenseId) { // If editing, preserve existing receipt if no new file
                const existingDoc = await dbExpense.collection('expenses').doc(currentEditingExpenseId).get();
                if (existingDoc.exists) {
                    expenseData.receiptUrl = existingDoc.data().receiptUrl || null;
                    expenseData.storagePath = existingDoc.data().storagePath || null;
                }
            }
            await saveExpenseDataToFirestore(expenseData);
        }
    });
}

async function saveExpenseDataToFirestore(expenseData) {
    try {
        if (currentEditingExpenseId) {
            await dbExpense.collection('expenses').doc(currentEditingExpenseId).update(expenseData);
        } else {
            expenseData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await dbExpense.collection('expenses').add(expenseData);
        }
        console.log('Expense saved successfully');
        if (createExpenseFormContainer) createExpenseFormContainer.style.display = 'none';
        currentEditingExpenseId = null;
        currentReceiptFile = null;
        if (expenseReceiptFileInput) expenseReceiptFileInput.value = null;
        if (uploadProgress) uploadProgress.style.display = 'none';
        saveExpenseBtn.disabled = false; // Re-enable if it was disabled
    } catch (error) {
        console.error('Error saving expense to Firestore:', error);
        alert('Error saving expense: ' + error.message);
        saveExpenseBtn.disabled = false; // Re-enable on error too
    }
}


// --- Display Expenses ---
function displayExpenses() {
    const user = authExpense.currentUser;
    if (!user || !expensesListDiv) return;

    dbExpense.collection('expenses')
        .where('photographerUid', '==', user.uid)
        .orderBy('expenseDate', 'desc')
        .onSnapshot(async (querySnapshot) => {
            if (!expensesListDiv) return;
            expensesListDiv.innerHTML = '<h3>Your Expenses:</h3>';
            if (querySnapshot.empty) {
                expensesListDiv.innerHTML += '<p>No expenses recorded yet.</p>';
                return;
            }
            // Fetch all project names for efficient lookup if expenses are linked
            const projectNames = {};
            try {
                const projectsSnap = await dbExpense.collection('projects').where('photographerUid', '==', user.uid).get();
                projectsSnap.forEach(doc => projectNames[doc.id] = doc.data().projectName);
            } catch (e) { console.error("Couldn't pre-fetch project names for expenses list", e); }


            querySnapshot.forEach(doc => {
                const expense = doc.data();
                const expenseId = doc.id;
                const expenseElement = document.createElement('div');
                expenseElement.classList.add('list-item', 'expense-list-item');

                let receiptHtml = 'No receipt';
                if (expense.receiptUrl) {
                    if (expense.receiptUrl.toLowerCase().match(/\.(jpeg|jpg|gif|png)$/)) {
                         receiptHtml = `<a href="${expense.receiptUrl}" target="_blank"><img src="${expense.receiptUrl}" alt="Receipt" style="max-width:100px; max-height:100px; cursor:pointer;"></a>`;
                    } else {
                        receiptHtml = `<a href="${expense.receiptUrl}" target="_blank">View Receipt</a>`;
                    }
                }
                const linkedProjectName = expense.projectId && projectNames[expense.projectId] ? projectNames[expense.projectId] : 'N/A (General)';

                expenseElement.innerHTML = `
                    <p><strong>Date:</strong> ${expense.expenseDate.toDate().toLocaleDateString()}</p>
                    <p><strong>Description:</strong> ${expense.description}</p>
                    <p><strong>Amount:</strong> $${expense.amount.toFixed(2)}</p>
                    <p><strong>Category:</strong> ${expense.category || 'N/A'}</p>
                    <p><strong>Project:</strong> ${linkedProjectName}</p>
                    <p><strong>Receipt:</strong> ${receiptHtml}</p>
                    <div class="actions">
                        <button class="edit-expense-btn" data-id="${expenseId}">Edit</button>
                        <button class="delete-expense-btn" data-id="${expenseId}">Delete</button>
                    </div>
                `;
                expensesListDiv.appendChild(expenseElement);

                expenseElement.querySelector('.edit-expense-btn').addEventListener('click', () => {
                    loadExpenseForEditing(expenseId, expense);
                });
                expenseElement.querySelector('.delete-expense-btn').addEventListener('click', () => {
                    deleteExpense(expenseId, expense.storagePath);
                });
            });
        }, error => {
            console.error("Error fetching expenses:", error);
            if (expensesListDiv) expensesListDiv.innerHTML = '<p>Error loading expenses.</p>';
        });
}

async function loadExpenseForEditing(expenseId, expenseData) {
    currentEditingExpenseId = expenseId;
    if (expenseFormTitle) expenseFormTitle.textContent = 'Edit Expense';
    if (currentExpenseIdInput) currentExpenseIdInput.value = expenseId;

    if (expenseDateInput) expenseDateInput.value = expenseData.expenseDate.toDate().toISOString().split('T')[0];
    if (expenseDescriptionInput) expenseDescriptionInput.value = expenseData.description || '';
    if (expenseAmountInput) expenseAmountInput.value = expenseData.amount || '';
    if (expenseCategoryInput) expenseCategoryInput.value = expenseData.category || '';
    if (expenseProjectIdSelect) { // Repopulate and set
        await populateProjectDropdown(); // Ensure it has fresh data
        expenseProjectIdSelect.value = expenseData.projectId || '';
    }
    if (expenseReceiptFileInput) expenseReceiptFileInput.value = null; // Clear file input, user must re-select if changing
    currentReceiptFile = null;

    if (receiptPreviewImg) {
        if (expenseData.receiptUrl && expenseData.receiptUrl.toLowerCase().match(/\.(jpeg|jpg|gif|png)$/)) {
            receiptPreviewImg.src = expenseData.receiptUrl;
            receiptPreviewImg.style.display = 'block';
        } else {
            receiptPreviewImg.style.display = 'none';
            receiptPreviewImg.src = '#';
        }
    }
    if (uploadProgress) uploadProgress.style.display = 'none';
    if (createExpenseFormContainer) createExpenseFormContainer.style.display = 'block';
}

async function deleteExpense(expenseId, storagePath) {
    if (confirm('Are you sure you want to delete this expense?')) {
        try {
            await dbExpense.collection('expenses').doc(expenseId).delete();
            console.log('Expense document deleted successfully');
            // Optionally delete file from storage
            if (storagePath) {
                if (confirm("Also delete the associated receipt from storage? This cannot be undone.")) {
                    const fileRef = storageExpense.ref(storagePath);
                    await fileRef.delete();
                    console.log('Receipt file deleted successfully from storage.');
                }
            }
        } catch (error) {
            console.error(`Error deleting expense ${expenseId}:`, error);
            alert('Error deleting expense: ' + error.message);
        }
    }
}


// Expose functions
window.appFirebase = window.appFirebase || {};
window.appFirebase.expenses = {
    showExpensesSection,
    hideExpensesSection,
    populateProjectDropdown, // May be called on login or when section is shown
    clearExpensesList: () => {
        if(expensesListDiv) expensesListDiv.innerHTML = '';
        if(createExpenseFormContainer) createExpenseFormContainer.style.display = 'none';
    }
};

console.log('expense_management.js loaded');
