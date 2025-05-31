// Firebase SDK instances
const authInvoice = firebase.auth();
const dbInvoice = firebase.firestore();

// DOM Elements for Invoices
const invoicesSection = document.getElementById('invoices-section');
const invoicesProjectTitle = document.getElementById('invoices-project-title');
const addInvoiceBtn = document.getElementById('add-invoice-btn');
const createInvoiceFormContainer = document.getElementById('create-invoice-form-container');
const invoiceFormTitle = document.getElementById('invoice-form-title');
const currentInvoiceProjectIdInput = document.getElementById('current-invoice-project-id');
const currentInvoiceIdInput = document.getElementById('current-invoice-id');
const generatedFromQuoteIdInput = document.getElementById('generated-from-quote-id');
const invoiceNumberInput = document.getElementById('invoiceNumber');
const invoiceDateInput = document.getElementById('invoiceDate');
const invoiceDueDateInput = document.getElementById('invoiceDueDate');
const invoiceStatusInput = document.getElementById('invoiceStatus');
const invoiceItemsContainer = document.getElementById('invoice-items-container');
const addInvoiceItemBtn = document.getElementById('add-invoice-item-btn');
const invoiceTotalAmountSpan = document.getElementById('invoiceTotalAmount');
const invoicePaidAmountDisplaySpan = document.getElementById('invoicePaidAmountDisplay');
const saveInvoiceBtn = document.getElementById('save-invoice-btn');
const cancelInvoiceBtn = document.getElementById('cancel-invoice-btn');
const invoicesListDiv = document.getElementById('invoices-list');
const backToProjectsBtnInvoice = document.getElementById('back-to-projects-btn-from-invoice');

// DOM Elements for Payment Form
const recordPaymentFormContainer = document.getElementById('record-payment-form-container');
const paymentFormTitle = document.getElementById('payment-form-title');
const paymentFormInvoiceNumberSpan = document.getElementById('payment-form-invoice-number');
const currentPaymentInvoiceIdInput = document.getElementById('current-payment-invoice-id');
const currentPaymentProjectIdInput = document.getElementById('current-payment-project-id');
const paymentDateInput = document.getElementById('paymentDate');
const paymentAmountInput = document.getElementById('paymentAmount');
const paymentMethodInput = document.getElementById('paymentMethod');
const paymentReferenceInput = document.getElementById('paymentReference');
const savePaymentBtn = document.getElementById('save-payment-btn');
const cancelPaymentBtn = document.getElementById('cancel-payment-btn');

let activeProjectIdForInvoices = null;
let currentEditingInvoiceId = null;
let currentRecordingPaymentInvoiceId = null;

// --- Navigation & Section Visibility ---
function showInvoicesForProject(projectId, projectName) {
    activeProjectIdForInvoices = projectId;
    if (invoicesProjectTitle) invoicesProjectTitle.textContent = `Invoices for: ${projectName}`;
    if (currentInvoiceProjectIdInput) currentInvoiceProjectIdInput.value = projectId;

    if (window.appFirebase && window.appFirebase.hideProjectsSection) window.appFirebase.hideProjectsSection();
    if (window.appFirebase && window.appFirebase.hidePackagesSection) window.appFirebase.hidePackagesSection();
    if (window.appFirebase && window.appFirebase.quotes && window.appFirebase.quotes.hideQuotesSection) {
        window.appFirebase.quotes.hideQuotesSection();
    }
    if (window.appFirebase && window.appFirebase.expenses && window.appFirebase.expenses.hideExpensesSection) { // Hide expenses
        window.appFirebase.expenses.hideExpensesSection();
    }
    if (invoicesSection) invoicesSection.style.display = 'block';

    displayInvoices(projectId);
    if (createInvoiceFormContainer) createInvoiceFormContainer.style.display = 'none';
    if (recordPaymentFormContainer) recordPaymentFormContainer.style.display = 'none';
}

function hideInvoicesSection() {
    if (invoicesSection) invoicesSection.style.display = 'none';
    if (invoicesListDiv) invoicesListDiv.innerHTML = '';
    if (createInvoiceFormContainer) createInvoiceFormContainer.style.display = 'none';
    if (recordPaymentFormContainer) recordPaymentFormContainer.style.display = 'none';
}

if (backToProjectsBtnInvoice) {
    backToProjectsBtnInvoice.addEventListener('click', () => {
        hideInvoicesSection();
        if (window.appFirebase && window.appFirebase.showProjectsSection) {
            window.appFirebase.showProjectsSection();
        }
    });
}

// --- Invoice Item Management ---
createInvoiceItemElement = function(item = {}) {
    const itemDiv = document.createElement('div');
    itemDiv.classList.add('invoice-item-row');
    itemDiv.innerHTML = `
        <input type="text" class="itemDescription" placeholder="Description" value="${item.description || ''}" required>
        <input type="number" class="itemQuantity" placeholder="Qty" value="${item.quantity || 1}" min="0" step="any">
        <input type="number" class="itemUnitPrice" placeholder="Unit Price" value="${item.unitPrice || 0.00}" min="0" step="0.01">
        <span class="itemTotal">0.00</span>
        <button type="button" class="remove-invoice-item-btn">Remove</button>
    `;
    itemDiv.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', updateTotalInvoiceAmount);
        input.addEventListener('change', updateTotalInvoiceAmount);
    });
    itemDiv.querySelector('.remove-invoice-item-btn').addEventListener('click', () => {
        itemDiv.remove();
        updateTotalInvoiceAmount();
    });
    return itemDiv;
};
if (addInvoiceItemBtn) {
    addInvoiceItemBtn.addEventListener('click', () => {
        if (invoiceItemsContainer) {
            invoiceItemsContainer.appendChild(createInvoiceItemElement());
            updateTotalInvoiceAmount();
        }
    });
}
updateTotalInvoiceAmount = function() {
    let total = 0;
    if (invoiceItemsContainer) {
        invoiceItemsContainer.querySelectorAll('.invoice-item-row').forEach(row => {
            const qty = parseFloat(row.querySelector('.itemQuantity').value) || 0;
            const price = parseFloat(row.querySelector('.itemUnitPrice').value) || 0;
            const itemTotal = qty * price;
            row.querySelector('.itemTotal').textContent = itemTotal.toFixed(2);
            total += itemTotal;
        });
    }
    if (invoiceTotalAmountSpan) invoiceTotalAmountSpan.textContent = total.toFixed(2);
};

// --- Invoice Form Logic ---
if (addInvoiceBtn) {
    addInvoiceBtn.addEventListener('click', () => {
        currentEditingInvoiceId = null;
        if (invoiceFormTitle) invoiceFormTitle.textContent = 'Add New Invoice';
        if (currentInvoiceIdInput) currentInvoiceIdInput.value = '';
        if (generatedFromQuoteIdInput) generatedFromQuoteIdInput.value = '';
        if (invoiceNumberInput) invoiceNumberInput.value = '';
        if (invoiceDateInput) invoiceDateInput.value = new Date().toISOString().split('T')[0];
        if (invoiceDueDateInput) {
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 30);
            invoiceDueDateInput.value = dueDate.toISOString().split('T')[0];
        }
        if (invoiceStatusInput) invoiceStatusInput.value = 'Draft';
        if (invoiceItemsContainer) invoiceItemsContainer.innerHTML = '';
        if (addInvoiceItemBtn) addInvoiceItemBtn.click();
        if (invoicePaidAmountDisplaySpan) invoicePaidAmountDisplaySpan.textContent = "0.00";
        if (createInvoiceFormContainer) createInvoiceFormContainer.style.display = 'block';
        updateTotalInvoiceAmount();
        suggestNextInvoiceNumber(activeProjectIdForInvoices);
    });
 }
if (cancelInvoiceBtn) {
    cancelInvoiceBtn.addEventListener('click', () => {
        if (createInvoiceFormContainer) createInvoiceFormContainer.style.display = 'none';
        currentEditingInvoiceId = null;
    });
 }
if (saveInvoiceBtn) {
    saveInvoiceBtn.addEventListener('click', async () => {
        const projectId = activeProjectIdForInvoices || currentInvoiceProjectIdInput.value;
        if (!projectId) {
            alert('Project context is missing for this invoice.');
            return;
        }
        const invoiceNumber = invoiceNumberInput.value.trim();
        const invoiceDate = invoiceDateInput.value;
        const dueDate = invoiceDueDateInput.value;
        const status = invoiceStatusInput.value;
        const generatedQuoteId = generatedFromQuoteIdInput.value || null;

        if (!invoiceNumber || !invoiceDate || !dueDate || !status) {
            alert('Invoice Number, Invoice Date, Due Date, and Status are required.');
            return;
        }
        const items = [];
        let formIsValid = true;
        invoiceItemsContainer.querySelectorAll('.invoice-item-row').forEach(row => {
            const description = row.querySelector('.itemDescription').value.trim();
            const quantity = parseFloat(row.querySelector('.itemQuantity').value);
            const unitPrice = parseFloat(row.querySelector('.itemUnitPrice').value);
            if (!description || isNaN(quantity) || quantity < 0 || isNaN(unitPrice) || unitPrice < 0) {
                formIsValid = false;
            }
            items.push({ description, quantity, unitPrice });
        });
        if (!formIsValid) {
            alert('Please ensure all invoice items have a valid description, quantity, and unit price.');
            return;
        }
        if (items.length === 0) {
            alert('An invoice must have at least one item.');
            return;
        }
        const totalAmount = parseFloat(invoiceTotalAmountSpan.textContent);
        const existingPaidAmount = parseFloat(invoicePaidAmountDisplaySpan.textContent) || 0;

        const invoiceData = {
            invoiceNumber,
            invoiceDate: firebase.firestore.Timestamp.fromDate(new Date(invoiceDate)),
            dueDate: firebase.firestore.Timestamp.fromDate(new Date(dueDate)),
            status, items, totalAmount,
            paidAmount: existingPaidAmount,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        if (generatedQuoteId) {
            invoiceData.generatedFromQuoteId = generatedQuoteId;
        }

        try {
            const invoiceCollectionRef = dbInvoice.collection('projects').doc(projectId).collection('invoices');
            if (currentEditingInvoiceId) {
                await invoiceCollectionRef.doc(currentEditingInvoiceId).update(invoiceData);
            } else {
                invoiceData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                invoiceData.paidAmount = 0;
                await invoiceCollectionRef.add(invoiceData);
            }
            if (createInvoiceFormContainer) createInvoiceFormContainer.style.display = 'none';
            currentEditingInvoiceId = null;
        } catch (error) {
            console.error('Error saving invoice:', error);
            alert('Error saving invoice: ' + error.message);
        }
    });
 }

// --- Display Invoices ---
function displayInvoices(projectId) {
    if (!projectId || !invoicesListDiv) return;
    activeProjectIdForInvoices = projectId;

    dbInvoice.collection('projects').doc(projectId).collection('invoices')
        .orderBy('invoiceDate', 'desc')
        .onSnapshot(querySnapshot => {
            if (!invoicesListDiv) return;
            invoicesListDiv.innerHTML = '<h4>Invoices for this Project:</h4>';
            if (querySnapshot.empty) {
                invoicesListDiv.innerHTML += '<p>No invoices found. Add one or generate from an accepted quote!</p>';
                return;
            }
            querySnapshot.forEach(doc => {
                const invoice = doc.data();
                const invoiceId = doc.id;
                const totalAmount = invoice.totalAmount || 0;
                const paidAmount = invoice.paidAmount || 0;
                const remainingAmount = totalAmount - paidAmount;

                let itemsSummaryHtml = '<ul>';
                invoice.items.forEach(item => {
                    itemsSummaryHtml += `<li>${item.description} (Qty: ${item.quantity}, Price: ${item.unitPrice.toFixed(2)})</li>`;
                });
                itemsSummaryHtml += '</ul>';

                const invoiceElement = document.createElement('div');
                invoiceElement.classList.add('list-item', 'invoice-list-item');
                invoiceElement.innerHTML = `
                    <p><strong>Invoice #:</strong> ${invoice.invoiceNumber}</p>
                    <p><strong>Date:</strong> ${invoice.invoiceDate.toDate().toLocaleDateString()}</p>
                    <p><strong>Due Date:</strong> ${invoice.dueDate.toDate().toLocaleDateString()}</p>
                    <p><strong>Status:</strong> <span class="invoice-status-${invoiceId}">${invoice.status}</span></p>
                    <p><strong>Total:</strong> ${totalAmount.toFixed(2)}</p>
                    <p><strong>Paid:</strong> <span class="invoice-paid-${invoiceId}">${paidAmount.toFixed(2)}</span></p>
                    <p><strong>Remaining:</strong> <span class="invoice-remaining-${invoiceId}">${remainingAmount.toFixed(2)}</span></p>
                    <div><strong>Items:</strong> ${itemsSummaryHtml}</div>
                    ${invoice.generatedFromQuoteId ? `<p><small><em>Generated from Quote ID: ${invoice.generatedFromQuoteId}</em></small></p>` : ''}
                    <div class="actions">
                        <button class="edit-invoice-btn" data-id="${invoiceId}">Edit</button>
                        <button class="delete-invoice-btn" data-id="${invoiceId}">Delete</button>
                        <button class="record-payment-btn" data-invoice-id="${invoiceId}" data-project-id="${projectId}" data-invoice-number="${invoice.invoiceNumber}" data-total-amount="${totalAmount}">Record Payment</button>
                    </div>
                    <div class="invoice-payments-list" id="payments-for-invoice-${invoiceId}"></div>
                `;
                invoicesListDiv.appendChild(invoiceElement);

                invoiceElement.querySelector('.edit-invoice-btn').addEventListener('click', () => {
                    loadInvoiceForEditing(invoiceId, invoice);
                });
                invoiceElement.querySelector('.delete-invoice-btn').addEventListener('click', () => {
                    deleteInvoice(projectId, invoiceId);
                });
                invoiceElement.querySelector('.record-payment-btn').addEventListener('click', (e) => {
                    const invId = e.target.dataset.invoiceId;
                    const projId = e.target.dataset.projectId;
                    const invNum = e.target.dataset.invoiceNumber;
                    showRecordPaymentForm(projId, invId, invNum);
                });
                displayPaymentsForInvoice(projectId, invoiceId, `payments-for-invoice-${invoiceId}`);
            });
        }, error => {
            console.error(`Error fetching invoices for project ${projectId}:`, error);
            if (invoicesListDiv) invoicesListDiv.innerHTML = '<p>Error loading invoices.</p>';
        });
}

loadInvoiceForEditing = function(invoiceId, invoiceData) {
    currentEditingInvoiceId = invoiceId;
    if (invoiceFormTitle) invoiceFormTitle.textContent = 'Edit Invoice';
    if (currentInvoiceIdInput) currentInvoiceIdInput.value = invoiceId;
    if (currentInvoiceProjectIdInput && activeProjectIdForInvoices) currentInvoiceProjectIdInput.value = activeProjectIdForInvoices;
    if (generatedFromQuoteIdInput) generatedFromQuoteIdInput.value = invoiceData.generatedFromQuoteId || '';
    if (invoiceNumberInput) invoiceNumberInput.value = invoiceData.invoiceNumber;
    if (invoiceDateInput) invoiceDateInput.value = invoiceData.invoiceDate.toDate().toISOString().split('T')[0];
    if (invoiceDueDateInput) invoiceDueDateInput.value = invoiceData.dueDate.toDate().toISOString().split('T')[0];
    if (invoiceStatusInput) invoiceStatusInput.value = invoiceData.status;
    if (invoicePaidAmountDisplaySpan) invoicePaidAmountDisplaySpan.textContent = (invoiceData.paidAmount || 0).toFixed(2);
    if (invoiceItemsContainer) invoiceItemsContainer.innerHTML = '';
    invoiceData.items.forEach(item => {
        if (invoiceItemsContainer) invoiceItemsContainer.appendChild(createInvoiceItemElement(item));
    });
    updateTotalInvoiceAmount();
    if (createInvoiceFormContainer) createInvoiceFormContainer.style.display = 'block';
};
deleteInvoice = async function(projectId, invoiceId) {
    if (confirm('Are you sure you want to delete this invoice? This will also delete associated payments.')) {
        try {
            await dbInvoice.collection('projects').doc(projectId).collection('invoices').doc(invoiceId).delete();
        } catch (error) {
            console.error(`Error deleting invoice ${invoiceId}:`, error);
            alert('Error deleting invoice: ' + error.message);
        }
    }
};

// --- Generate Invoice from Quote Data ---
generateInvoiceFromQuoteData = async function(quoteData, projectId, projectName, quoteId) {
    console.log("Hint: If this is a deposit invoice, adjust line items and total as necessary before saving."); // Added hint
    showInvoicesForProject(projectId, projectName);
    currentEditingInvoiceId = null;
    if (invoiceFormTitle) invoiceFormTitle.textContent = 'New Invoice (from Quote)';
    if (currentInvoiceIdInput) currentInvoiceIdInput.value = '';
    if (generatedFromQuoteIdInput) generatedFromQuoteIdInput.value = quoteId;
    if (currentInvoiceProjectIdInput) currentInvoiceProjectIdInput.value = projectId;
    await suggestNextInvoiceNumber(projectId);
    if (invoiceDateInput) invoiceDateInput.value = new Date().toISOString().split('T')[0];
    if (invoiceDueDateInput) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);
        invoiceDueDateInput.value = dueDate.toISOString().split('T')[0];
    }
    if (invoiceStatusInput) invoiceStatusInput.value = 'Draft';
    if (invoicePaidAmountDisplaySpan) invoicePaidAmountDisplaySpan.textContent = "0.00";
    if (invoiceItemsContainer) invoiceItemsContainer.innerHTML = '';
    if (quoteData.items && quoteData.items.length > 0) {
        quoteData.items.forEach(item => {
            invoiceItemsContainer.appendChild(createInvoiceItemElement(item));
        });
    } else {
        if (addInvoiceItemBtn) addInvoiceItemBtn.click();
    }
    updateTotalInvoiceAmount();
    if (createInvoiceFormContainer) createInvoiceFormContainer.style.display = 'block';
};

suggestNextInvoiceNumber = async function(projectId) {
    if (!projectId || !invoiceNumberInput) return;
    try {
        const querySnapshot = await dbInvoice.collection('projects').doc(projectId).collection('invoices')
                                      .orderBy('createdAt', 'desc').limit(1).get();
        if (!querySnapshot.empty) {
            const lastInvoice = querySnapshot.docs[0].data();
            const lastNumberStr = lastInvoice.invoiceNumber;
            const match = lastNumberStr.match(/\d+$/);
            if (match) {
                const nextNum = parseInt(match[0]) + 1;
                const prefix = lastNumberStr.substring(0, match.index);
                invoiceNumberInput.value = prefix + nextNum.toString().padStart(match[0].length, '0');
            } else {
                 invoiceNumberInput.value = lastNumberStr + "-1";
            }
        } else {
            invoiceNumberInput.value = 'INV-001';
        }
    } catch (error) {
        console.error("Error suggesting next invoice number:", error);
        invoiceNumberInput.value = 'INV-';
    }
};


// --- Payment Logic ---
function showRecordPaymentForm(projectId, invoiceId, invoiceNumber) {
    currentRecordingPaymentInvoiceId = invoiceId;
    if (paymentFormInvoiceNumberSpan) paymentFormInvoiceNumberSpan.textContent = invoiceNumber;
    if (currentPaymentInvoiceIdInput) currentPaymentInvoiceIdInput.value = invoiceId;
    if (currentPaymentProjectIdInput) currentPaymentProjectIdInput.value = projectId;
    if (paymentDateInput) paymentDateInput.value = new Date().toISOString().split('T')[0];
    if (paymentAmountInput) paymentAmountInput.value = '';
    if (paymentMethodInput) paymentMethodInput.value = 'Bank Transfer';
    if (paymentReferenceInput) paymentReferenceInput.value = '';
    if (recordPaymentFormContainer) recordPaymentFormContainer.style.display = 'block';
    if (createInvoiceFormContainer) createInvoiceFormContainer.style.display = 'none';
}

if (cancelPaymentBtn) {
    cancelPaymentBtn.addEventListener('click', () => {
        if (recordPaymentFormContainer) recordPaymentFormContainer.style.display = 'none';
        currentRecordingPaymentInvoiceId = null;
    });
}

if (savePaymentBtn) {
    savePaymentBtn.addEventListener('click', async () => {
        const invoiceId = currentPaymentInvoiceIdInput.value;
        const projectId = currentPaymentProjectIdInput.value;
        const paymentDate = paymentDateInput.value;
        const paymentAmount = parseFloat(paymentAmountInput.value);
        const paymentMethod = paymentMethodInput.value;
        const paymentReference = paymentReferenceInput.value.trim();

        if (!invoiceId || !projectId || !paymentDate || isNaN(paymentAmount) || paymentAmount <= 0 || !paymentMethod) {
            alert('Please fill in all required payment fields with valid data.');
            return;
        }
        const paymentData = {
            paymentDate: firebase.firestore.Timestamp.fromDate(new Date(paymentDate)),
            amount: paymentAmount,
            method: paymentMethod,
            reference: paymentReference || null,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        const invoiceRef = dbInvoice.collection('projects').doc(projectId).collection('invoices').doc(invoiceId);
        try {
            await invoiceRef.collection('payments').add(paymentData);
            console.log('Payment recorded successfully.');
            await invoiceRef.update({
                paidAmount: firebase.firestore.FieldValue.increment(paymentAmount)
            });
            console.log('Invoice paidAmount incremented.');
            const updatedInvoiceSnap = await invoiceRef.get();
            if (updatedInvoiceSnap.exists) {
                const invoiceData = updatedInvoiceSnap.data();
                let newStatus = invoiceData.status;
                if (invoiceData.paidAmount >= invoiceData.totalAmount) {
                    newStatus = 'Paid';
                } else if (invoiceData.paidAmount > 0 && invoiceData.paidAmount < invoiceData.totalAmount) {
                    newStatus = 'Partially Paid';
                }
                if (newStatus !== invoiceData.status) {
                    await invoiceRef.update({ status: newStatus });
                    console.log(`Invoice status updated to ${newStatus}`);
                }
            }
            if (recordPaymentFormContainer) recordPaymentFormContainer.style.display = 'none';
            currentRecordingPaymentInvoiceId = null;
        } catch (error) {
            console.error('Error saving payment or updating invoice:', error);
            alert('Error saving payment: ' + error.message);
        }
    });
}

function displayPaymentsForInvoice(projectId, invoiceId, containerElementId) {
    const paymentsListContainer = document.getElementById(containerElementId);
    if (!paymentsListContainer) return;

    dbInvoice.collection('projects').doc(projectId).collection('invoices').doc(invoiceId).collection('payments')
        .orderBy('paymentDate', 'desc')
        .onSnapshot(querySnapshot => {
            paymentsListContainer.innerHTML = '<h5>Payments Received:</h5>';
            if (querySnapshot.empty) {
                paymentsListContainer.innerHTML += '<p><small>No payments recorded for this invoice.</small></p>';
                return;
            }
            const ul = document.createElement('ul');
            ul.classList.add('payment-details-list');
            querySnapshot.forEach(doc => {
                const payment = doc.data();
                const li = document.createElement('li');
                li.innerHTML = `
                    <small>
                        Date: ${payment.paymentDate.toDate().toLocaleDateString()},
                        Amount: ${payment.amount.toFixed(2)},
                        Method: ${payment.method}
                        ${payment.reference ? ', Ref: ' + payment.reference : ''}
                    </small>
                `;
                ul.appendChild(li);
            });
            paymentsListContainer.appendChild(ul);
        }, error => {
            console.error(`Error fetching payments for invoice ${invoiceId}:`, error);
            paymentsListContainer.innerHTML = '<p><small>Error loading payments.</small></p>';
        });
}

// Expose functions under appFirebase.invoices namespace
window.appFirebase = window.appFirebase || {};
window.appFirebase.invoices = {
    showInvoicesForProject,
    hideInvoicesSection,
    generateInvoiceFromQuoteData,
    clearInvoicesList: () => {
        if(invoicesListDiv) invoicesListDiv.innerHTML = '';
        if(createInvoiceFormContainer) createInvoiceFormContainer.style.display = 'none';
        if(recordPaymentFormContainer) recordPaymentFormContainer.style.display = 'none';
    }
};

console.log('invoice_management.js loaded');
