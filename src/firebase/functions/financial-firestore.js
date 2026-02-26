import { db } from "../app";
import { doc, collection, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { generateRandomString } from "../../utils/stringUtils";

// Budget
  export const addBudgetToFirestore = async (domain, projectId, budgetData) => {
    if (!domain || !projectId || !budgetData) {
        throw new Error('Domain, Project ID, and Budget data are required.');
    }

    let color = domain === '' ? 'gray' : '#0099ff';
    console.log(`%cAdding budget to Project ${projectId} under ${domain}`, `color: ${color};`);

    const studioDocRef = doc(db, 'studios', domain);
    const projectsCollectionRef = collection(studioDocRef, 'projects');
    const projectDocRef = doc(projectsCollectionRef, projectId);

    try {
        const projectSnapshot = await getDoc(projectDocRef);

        if (!projectSnapshot.exists()) {
            throw new Error('Project does not exist.');
        }

        const projectData = projectSnapshot.data();
        const id = `budget-${projectData.name.toLowerCase().replace(/\s/g, '-')}-${generateRandomString(5)}`;
        
        const updatedProject = {
            ...projectData,
            budgets: budgetData, // Assuming budgets is an array in your projectData
        };

        await updateDoc(projectDocRef, updatedProject);

        color = '#54a134';
        console.log(`%cBudget added to Project ${projectId} under ${domain} successfully.`, `color: ${color};`);

        return budgetData;
    } catch (error) {
        color = 'red';
        console.error(`%cError adding budget to Project ${projectId} under ${domain}: ${error.message}`, `color: ${color};`);
        throw error;
    }
};
// Payment
export const addPaymentToFirestore = async (domain, projectId, paymentData) => {
    if (!domain || !projectId || !paymentData) {
        throw new Error('Domain, Project ID, and Payment data are required.');
    }

    let color = domain === '' ? 'gray' : '#0099ff';
    console.log(`%cAdding payment to Project ${projectId} under ${domain}`, `color: ${color};`);

    const studioDocRef = doc(db, 'studios', domain);
    const projectsCollectionRef = collection(studioDocRef, 'projects');
    const projectDocRef = doc(projectsCollectionRef, projectId);

    try {
        const projectSnapshot = await getDoc(projectDocRef);

        if (!projectSnapshot.exists()) {
            throw new Error('Project does not exist.');
        }

        const projectData = projectSnapshot.data();
        const id = `payment-${projectData.name.toLowerCase().replace(/\s/g, '-')}-${generateRandomString(5)}`;
        
        paymentData = {
            id,
            ...paymentData
        };

        const updatedProject = {
            ...projectData,
            payments: arrayUnion(paymentData),
        };

        await updateDoc(projectDocRef, updatedProject);

        color = '#54a134';
        console.log(`%cPayment added to Project ${id} under ${domain} successfully.`, `color: ${color};`);

        return id;
    } catch (error) {
        color = 'red';
        console.error(`%cError adding payment to Project ${projectId} under ${domain}: ${error.message}`, `color: ${color};`);
        throw error;
    }
};
// Expenses
export const addExpenseToFirestore = async (domain, projectId, expenseData) => {
    if (!domain || !projectId || !expenseData) {
        throw new Error('Domain, Project ID, and Expense data are required.');
    }

    let color = domain === '' ? 'gray' : '#0099ff';
    console.log(`%cAdding expense to Project ${projectId} under ${domain}`, `color: ${color};`);


    const studioDocRef = doc(db, 'studios', domain);
    const projectsCollectionRef = collection(studioDocRef, 'projects');
    const projectDocRef = doc(projectsCollectionRef, projectId);

    try {
        const projectSnapshot = await getDoc(projectDocRef);

        if (!projectSnapshot.exists()) {
            throw new Error('Project does not exist.');
        }

        const projectData = projectSnapshot.data();
        const id = `expense-${projectData.name.toLowerCase().replace(/\s/g, '-')}-${generateRandomString(5)}`;
        
        expenseData = {
            id,
            ...expenseData
        };

        const updatedProject = {
            ...projectData,
            expenses: arrayUnion(expenseData),
        };

        await updateDoc(projectDocRef, updatedProject);

        color = '#54a134';
        console.log(`%cExpense added to Project ${id} under ${domain} successfully.`, `color: ${color};`);

        return expenseData;
    } catch (error) {
        color = 'red';
        console.error(`%cError adding expense to Project ${projectId} under ${domain}: ${error.message}`, `color: ${color};`);
        throw error;
    }
};
