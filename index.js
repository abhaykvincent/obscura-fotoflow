const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();

/**
 * Creates a new user document in Firestore when a new Firebase Authentication user is created.
 */
exports.createNewUserDocument = functions.auth.user().onCreate(async (user) => {
  const { uid, email, displayName, metadata } = user;
  const creationTime = metadata.creationTime; // ISO string

  const userRef = db.collection("users").doc(uid);

  try {
    await userRef.set({
      uid: uid,
      email: email, // Storing email, ensure it's handled according to privacy best practices
      displayName: displayName || null,
      createdAt: admin.firestore.Timestamp.fromDate(new Date(creationTime)),
      roles: ["photographer"], // Default role for new users
      // Initialize any other default fields needed for a new user profile
      // e.g., defaultCurrency: "USD", preferences: {}, etc.
    });
    console.log(`User document created successfully for UID: ${uid}`);
    return null;
  } catch (error) {
    console.error(`Error creating user document for UID: ${uid}. Error: ${error.message}`, error);
    // It's important to handle errors, but for onCreate, returning null is often sufficient
    // as Firebase Auth user creation itself has succeeded.
    return null;
  }
});

/**
 * Updates the 'updatedAt' timestamp of a project when its status changes.
 */
exports.updateProjectTimestampOnStatusChange = functions.firestore
  .document("projects/{projectId}")
  .onUpdate(async (change, context) => {
    const newValue = change.after.data();
    const previousValue = change.before.data();
    const projectId = context.params.projectId;

    // Check if 'status' field actually changed and is different.
    // Also good to check if newValue and previousValue are defined.
    if (!newValue || !previousValue || newValue.status === previousValue.status) {
      // console.log(`No status change for project ${projectId}. No action needed.`);
      return null; // No action needed if status didn't change or data is missing
    }

    try {
      await change.after.ref.update({
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        // Example: Optionally add a field to record when a specific status was set
        // statusLastChangedAt: admin.firestore.FieldValue.serverTimestamp(),
        // if (newValue.status === "Completed") {
        //   return change.after.ref.update({ completedAt: admin.firestore.FieldValue.serverTimestamp() });
        // }
      });
      console.log(`Project ${projectId} 'updatedAt' timestamp updated due to status change from '${previousValue.status}' to '${newValue.status}'.`);
      return null;
    } catch (error) {
      console.error(`Error updating project ${projectId} timestamp: ${error.message}`, error);
      return null;
    }
  });
