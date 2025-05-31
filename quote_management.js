// Firebase SDK instances
const authQuote = firebase.auth();
const dbQuote = firebase.firestore();

// DOM Elements for Quotes
const quotesSection = document.getElementById('quotes-section');
const quotesProjectTitle = document.getElementById('quotes-project-title');
const addQuoteBtn = document.getElementById('add-quote-btn');
const createQuoteFormContainer = document.getElementById('create-quote-form-container');
const quoteFormTitle = document.getElementById('quote-form-title');
const currentQuoteProjectIdInput = document.getElementById('current-quote-project-id');
const currentQuoteIdInput = document.getElementById('current-quote-id');
const quoteDateInput = document.getElementById('quoteDate');
const quoteExpiryDateInput = document.getElementById('quoteExpiryDate');
const quoteStatusInput = document.getElementById('quoteStatus');
const quoteItemsContainer = document.getElementById('quote-items-container');
const addQuoteItemBtn = document.getElementById('add-quote-item-btn');
const quoteTotalAmountSpan = document.getElementById('quoteTotalAmount');
const saveQuoteBtn = document.getElementById('save-quote-btn');
const cancelQuoteBtn = document.getElementById('cancel-quote-btn');
const quotesListDiv = document.getElementById('quotes-list');
const backToProjectsBtnQuote = document.getElementById('back-to-projects-btn-from-quote'); // Unique ID

let activeProjectIdForQuotes = null;
let currentEditingQuoteId = null;

// --- Navigation & Section Visibility ---
function showQuotesForProject(projectId, projectName) {
    activeProjectIdForQuotes = projectId;
    if (quotesProjectTitle) quotesProjectTitle.textContent = `Quotes for: ${projectName}`;
    if (currentQuoteProjectIdInput) currentQuoteProjectIdInput.value = projectId;

    if (window.appFirebase && window.appFirebase.hideProjectsSection) window.appFirebase.hideProjectsSection();
    if (window.appFirebase && window.appFirebase.hidePackagesSection) window.appFirebase.hidePackagesSection();
    if (window.appFirebase && window.appFirebase.invoices && window.appFirebase.invoices.hideInvoicesSection) { // Hide invoices if visible
        window.appFirebase.invoices.hideInvoicesSection();
    }
    if (quotesSection) quotesSection.style.display = 'block';

    displayQuotes(projectId);
    if (createQuoteFormContainer) createQuoteFormContainer.style.display = 'none';
}

function hideQuotesSection() {
    if (quotesSection) quotesSection.style.display = 'none';
    // activeProjectIdForQuotes = null; // Keep this to know context if user navigates back quickly
    if (quotesListDiv) quotesListDiv.innerHTML = '';
}

if (backToProjectsBtnQuote) {
    backToProjectsBtnQuote.addEventListener('click', () => {
        hideQuotesSection();
        if (window.appFirebase && window.appFirebase.showProjectsSection) {
            window.appFirebase.showProjectsSection();
        }
    });
}

// --- Quote Item Management ---
function createQuoteItemElement(item = {}) {
    const itemDiv = document.createElement('div');
    itemDiv.classList.add('quote-item-row');
    itemDiv.innerHTML = `
        <input type="text" class="itemDescription" placeholder="Description" value="${item.description || ''}" required>
        <input type="number" class="itemQuantity" placeholder="Qty" value="${item.quantity || 1}" min="0" step="any">
        <input type="number" class="itemUnitPrice" placeholder="Unit Price" value="${item.unitPrice || 0.00}" min="0" step="0.01">
        <span class="itemTotal">0.00</span>
        <button type="button" class="remove-quote-item-btn">Remove</button>
    `;
    itemDiv.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', updateTotalQuoteAmount);
        input.addEventListener('change', updateTotalQuoteAmount);
    });
    itemDiv.querySelector('.remove-quote-item-btn').addEventListener('click', () => {
        itemDiv.remove();
        updateTotalQuoteAmount();
    });
    return itemDiv;
}

if (addQuoteItemBtn) {
    addQuoteItemBtn.addEventListener('click', () => {
        if (quoteItemsContainer) {
            quoteItemsContainer.appendChild(createQuoteItemElement());
            updateTotalQuoteAmount();
        }
    });
}

function updateTotalQuoteAmount() {
    let total = 0;
    if (quoteItemsContainer) {
        quoteItemsContainer.querySelectorAll('.quote-item-row').forEach(row => {
            const qty = parseFloat(row.querySelector('.itemQuantity').value) || 0;
            const price = parseFloat(row.querySelector('.itemUnitPrice').value) || 0;
            const itemTotal = qty * price;
            row.querySelector('.itemTotal').textContent = itemTotal.toFixed(2);
            total += itemTotal;
        });
    }
    if (quoteTotalAmountSpan) quoteTotalAmountSpan.textContent = total.toFixed(2);
}

// --- Quote Form Logic ---
if (addQuoteBtn) {
    addQuoteBtn.addEventListener('click', () => {
        currentEditingQuoteId = null;
        if (quoteFormTitle) quoteFormTitle.textContent = 'Add New Quote';
        if (currentQuoteIdInput) currentQuoteIdInput.value = '';
        if (quoteDateInput) quoteDateInput.value = new Date().toISOString().split('T')[0];
        if (quoteExpiryDateInput) quoteExpiryDateInput.value = '';
        if (quoteStatusInput) quoteStatusInput.value = 'Draft';
        if (quoteItemsContainer) quoteItemsContainer.innerHTML = '';
        if (addQuoteItemBtn) addQuoteItemBtn.click();
        if (createQuoteFormContainer) createQuoteFormContainer.style.display = 'block';
        updateTotalQuoteAmount();
    });
}

if (cancelQuoteBtn) {
    cancelQuoteBtn.addEventListener('click', () => {
        if (createQuoteFormContainer) createQuoteFormContainer.style.display = 'none';
        currentEditingQuoteId = null;
    });
}

if (saveQuoteBtn) {
    saveQuoteBtn.addEventListener('click', async () => {
        const projectId = activeProjectIdForQuotes || currentQuoteProjectIdInput.value;
        if (!projectId) {
            alert('Project context is missing for this quote.');
            return;
        }
        const quoteDate = quoteDateInput.value;
        const expiryDate = quoteExpiryDateInput.value;
        const status = quoteStatusInput.value;
        if (!quoteDate || !status) {
            alert('Quote Date and Status are required.');
            return;
        }
        const items = [];
        let formIsValid = true;
        quoteItemsContainer.querySelectorAll('.quote-item-row').forEach(row => {
            const description = row.querySelector('.itemDescription').value.trim();
            const quantity = parseFloat(row.querySelector('.itemQuantity').value);
            const unitPrice = parseFloat(row.querySelector('.itemUnitPrice').value);
            if (!description || isNaN(quantity) || quantity < 0 || isNaN(unitPrice) || unitPrice < 0) {
                formIsValid = false;
            }
            items.push({ description, quantity, unitPrice });
        });
        if (!formIsValid) {
            alert('Please ensure all quote items have a valid description, quantity, and unit price.');
            return;
        }
        if (items.length === 0) {
            alert('A quote must have at least one item.');
            return;
        }
        const totalAmount = parseFloat(quoteTotalAmountSpan.textContent);
        const quoteData = {
            quoteDate: firebase.firestore.Timestamp.fromDate(new Date(quoteDate)),
            expiryDate: expiryDate ? firebase.firestore.Timestamp.fromDate(new Date(expiryDate)) : null,
            status, items, totalAmount,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        try {
            const quoteCollectionRef = dbQuote.collection('projects').doc(projectId).collection('quotes');
            if (currentEditingQuoteId) {
                await quoteCollectionRef.doc(currentEditingQuoteId).update(quoteData);
            } else {
                quoteData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                await quoteCollectionRef.add(quoteData);
            }
            if (createQuoteFormContainer) createQuoteFormContainer.style.display = 'none';
            currentEditingQuoteId = null;
        } catch (error) {
            console.error('Error saving quote:', error);
            alert('Error saving quote: ' + error.message);
        }
    });
}

// --- Display Quotes ---
function displayQuotes(projectId) {
    if (!projectId || !quotesListDiv) return;
    activeProjectIdForQuotes = projectId;

    dbQuote.collection('projects').doc(projectId).collection('quotes')
        .orderBy('quoteDate', 'desc')
        .onSnapshot(querySnapshot => {
            if (!quotesListDiv) return;
            quotesListDiv.innerHTML = '<h4>Quotes for this Project:</h4>';
            if (querySnapshot.empty) {
                quotesListDiv.innerHTML += '<p>No quotes found. Add one!</p>';
                return;
            }
            querySnapshot.forEach(doc => {
                const quote = doc.data();
                const quoteId = doc.id;
                let itemsSummaryHtml = '<ul>';
                quote.items.forEach(item => {
                    itemsSummaryHtml += `<li>${item.description} (Qty: ${item.quantity}, Price: ${item.unitPrice.toFixed(2)})</li>`;
                });
                itemsSummaryHtml += '</ul>';

                const quoteElement = document.createElement('div');
                quoteElement.classList.add('list-item', 'quote-list-item');
                let buttonsHtml = `
                    <button class="edit-quote-btn" data-id="${quoteId}">Edit</button>
                    <button class="delete-quote-btn" data-id="${quoteId}">Delete</button>
                `;
                if (quote.status === 'Accepted') {
                    buttonsHtml += `<button class="generate-invoice-from-quote-btn" data-quote-id="${quoteId}" data-project-id="${projectId}">Generate Invoice</button>`;
                }
                quoteElement.innerHTML = `
                    <p><strong>Quote Date:</strong> ${quote.quoteDate.toDate().toLocaleDateString()}</p>
                    <p><strong>Status:</strong> ${quote.status}</p>
                    <p><strong>Total:</strong> ${quote.totalAmount.toFixed(2)}</p>
                    <div><strong>Items:</strong> ${itemsSummaryHtml}</div>
                    <p>Expiry Date: ${quote.expiryDate ? quote.expiryDate.toDate().toLocaleDateString() : 'N/A'}</p>
                    <div class="actions">${buttonsHtml}</div>
                `;
                quotesListDiv.appendChild(quoteElement);

                quoteElement.querySelector('.edit-quote-btn').addEventListener('click', () => {
                    loadQuoteForEditing(quoteId, quote);
                });
                quoteElement.querySelector('.delete-quote-btn').addEventListener('click', () => {
                    deleteQuote(projectId, quoteId);
                });
                const genInvoiceBtn = quoteElement.querySelector('.generate-invoice-from-quote-btn');
                if (genInvoiceBtn) {
                    genInvoiceBtn.addEventListener('click', async (e) => {
                        const qId = e.target.dataset.quoteId;
                        const pId = e.target.dataset.projectId;
                        try {
                            const quoteDoc = await dbQuote.collection('projects').doc(pId).collection('quotes').doc(qId).get();
                            if (quoteDoc.exists) {
                                if (window.appFirebase && window.appFirebase.invoices && window.appFirebase.invoices.generateInvoiceFromQuoteData) {
                                    // Need project name for invoice section title
                                    const projectDoc = await dbQuote.collection('projects').doc(pId).get();
                                    const projectName = projectDoc.exists ? projectDoc.data().projectName : "Selected Project";
                                    window.appFirebase.invoices.generateInvoiceFromQuoteData(quoteDoc.data(), pId, projectName, qId);
                                }
                            } else {
                                alert('Quote data not found.');
                            }
                        } catch (error) {
                            console.error("Error fetching quote for invoice generation:", error);
                            alert("Error fetching quote data.");
                        }
                    });
                }
            });
        }, error => {
            console.error(`Error fetching quotes for project ${projectId}:`, error);
            if (quotesListDiv) quotesListDiv.innerHTML = '<p>Error loading quotes.</p>';
        });
}

function loadQuoteForEditing(quoteId, quoteData) {
    currentEditingQuoteId = quoteId;
    if (quoteFormTitle) quoteFormTitle.textContent = 'Edit Quote';
    if (currentQuoteIdInput) currentQuoteIdInput.value = quoteId;
    if (currentQuoteProjectIdInput && activeProjectIdForQuotes) currentQuoteProjectIdInput.value = activeProjectIdForQuotes;
    if (quoteDateInput) quoteDateInput.value = quoteData.quoteDate.toDate().toISOString().split('T')[0];
    if (quoteExpiryDateInput) quoteExpiryDateInput.value = quoteData.expiryDate ? quoteData.expiryDate.toDate().toISOString().split('T')[0] : '';
    if (quoteStatusInput) quoteStatusInput.value = quoteData.status;
    if (quoteItemsContainer) quoteItemsContainer.innerHTML = '';
    quoteData.items.forEach(item => {
        if (quoteItemsContainer) quoteItemsContainer.appendChild(createQuoteItemElement(item));
    });
    updateTotalQuoteAmount();
    if (createQuoteFormContainer) createQuoteFormContainer.style.display = 'block';
}

async function deleteQuote(projectId, quoteId) {
    if (confirm('Are you sure you want to delete this quote?')) {
        try {
            await dbQuote.collection('projects').doc(projectId).collection('quotes').doc(quoteId).delete();
        } catch (error) {
            console.error(`Error deleting quote ${quoteId}:`, error);
            alert('Error deleting quote: ' + error.message);
        }
    }
}

window.appFirebase = window.appFirebase || {};
window.appFirebase.quotes = {
    showQuotesForProject,
    hideQuotesSection,
    clearQuotesList: () => {
        if(quotesListDiv) quotesListDiv.innerHTML = '';
        if(createQuoteFormContainer) createQuoteFormContainer.style.display = 'none';
    }
};

console.log('quote_management.js loaded');
