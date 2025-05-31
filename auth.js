// Assuming 'auth' is initialized in app.js and is a global or passed variable

const authContainer = document.getElementById('auth-container');
const appContent = document.getElementById('app-content'); // Main app content container
const userInfo = document.getElementById('user-info');
const logoutButton = document.getElementById('logout-button');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');

// Navigation buttons (for tab behavior)
const navProjectsBtn = document.getElementById('nav-projects-btn');
const navPackagesBtn = document.getElementById('nav-packages-btn');
const navExpensesBtn = document.getElementById('nav-expenses-btn'); // Added

// Sign Up
function signUpWithEmailPassword(email, password) {
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            console.log('User signed up:', user);
        })
        .catch((error) => {
            console.error('Sign up error:', error.message);
            alert('Sign up error: ' + error.message);
        });
}

// Sign In
function signInWithEmailPassword(email, password) {
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            console.log('User signed in:', userCredential.user);
        })
        .catch((error) => {
            console.error('Sign in error:', error.message);
            alert('Sign in error: ' + error.message);
        });
}

// Sign Out
function signOutUser() {
    auth.signOut()
        .then(() => {
            console.log('User signed out');
        })
        .catch((error) => {
            console.error('Sign out error:', error.message);
            alert('Sign out error: ' + error.message);
        });
}

// Event Listeners for forms
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        signInWithEmailPassword(email, password);
    });
}

if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        signUpWithEmailPassword(email, password);
    });
}

if (logoutButton) {
    logoutButton.addEventListener('click', () => {
        signOutUser();
    });
}

// Navigation Tab Event Listeners
if (navProjectsBtn) {
    navProjectsBtn.addEventListener('click', () => {
        if (window.appFirebase && window.appFirebase.showProjectsSection) window.appFirebase.showProjectsSection();
    });
}
if (navPackagesBtn) {
    navPackagesBtn.addEventListener('click', () => {
         if (window.appFirebase && window.appFirebase.showPackagesSection) window.appFirebase.showPackagesSection();
    });
}
if (navExpensesBtn) { // Added
    navExpensesBtn.addEventListener('click', () => {
        if (window.appFirebase && window.appFirebase.expenses && window.appFirebase.expenses.showExpensesSection) {
            window.appFirebase.expenses.showExpensesSection();
        }
    });
}


// Auth State Listener
auth.onAuthStateChanged(user => {
    if (user) {
        // User is signed in
        console.log('Auth state changed: User is signed in', user.uid);
        if (userInfo) userInfo.textContent = `Logged in as: ${user.email}`;
        if (authContainer) authContainer.style.display = 'none';
        if (appContent) appContent.style.display = 'block';
        if (logoutButton) logoutButton.style.display = 'block';

        // Show default section (projects) and load data
        if (window.appFirebase && window.appFirebase.showProjectsSection) {
            window.appFirebase.showProjectsSection();
        }
        if (window.appFirebase && window.appFirebase.displayProjects) {
            window.appFirebase.displayProjects();
        }
        if (window.appFirebase && window.appFirebase.displayPackages) { // Load packages in background
             window.appFirebase.displayPackages();
        }
        if (window.appFirebase && window.appFirebase.expenses && window.appFirebase.expenses.populateProjectDropdown) { // Populate expenses project dropdown
            window.appFirebase.expenses.populateProjectDropdown();
        }
        // Ensure context-specific sections are hidden initially
        if (window.appFirebase && window.appFirebase.quotes && window.appFirebase.quotes.hideQuotesSection) {
            window.appFirebase.quotes.hideQuotesSection();
        }
        if (window.appFirebase && window.appFirebase.invoices && window.appFirebase.invoices.hideInvoicesSection) {
            window.appFirebase.invoices.hideInvoicesSection();
        }
        if (window.appFirebase && window.appFirebase.expenses && window.appFirebase.expenses.hideExpensesSection) { // Hide expenses section itself initially
            window.appFirebase.expenses.hideExpensesSection();
        }


    } else {
        // User is signed out
        console.log('Auth state changed: User is signed out');
        if (userInfo) userInfo.textContent = 'Not logged in.';
        if (authContainer) authContainer.style.display = 'block';
        if (appContent) appContent.style.display = 'none';
        if (logoutButton) logoutButton.style.display = 'none';

        // Clear lists and hide all management sections
        const sectionsToClear = ['Projects', 'Packages', 'Quotes', 'Invoices', 'Expenses'];
        sectionsToClear.forEach(sectionName => {
            const lowerSectionName = sectionName.toLowerCase();
            const clearListFunc = window.appFirebase && (window.appFirebase[lowerSectionName === 'quotes' || lowerSectionName === 'invoices' || lowerSectionName === 'expenses' ? lowerSectionName : '']?.[`clear${sectionName}List`] || window.appFirebase?.[`clear${sectionName}List`]);
            const hideSectionFunc = window.appFirebase && (window.appFirebase[lowerSectionName === 'quotes' || lowerSectionName === 'invoices' || lowerSectionName === 'expenses' ? lowerSectionName : '']?.[`hide${sectionName}Section`] || window.appFirebase?.[`hide${sectionName}Section`]);

            if (clearListFunc) clearListFunc();
            if (hideSectionFunc) hideSectionFunc();
        });
    }
});
