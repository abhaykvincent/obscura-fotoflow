import { db } from "../app";
import { collection, doc, setDoc, getDocs } from "firebase/firestore";
import { generateRandomString } from "../../utils/stringUtils";

export const addPackageToFirestore = async (domain, packageData) => {
  const { name } = packageData;
  const id = `${name.toLowerCase().replace(/\s/g, '-')}-${generateRandomString(5)}`;
  const newPackageData = {
    id,
    name,
    createdAt: new Date().getTime(),
  };

  try {
    const studioDocRef = doc(db, 'studios', domain);
    const packagesCollectionRef = collection(studioDocRef, 'packages');
    await setDoc(doc(packagesCollectionRef, id), newPackageData);
    console.log("Package added successfully 🎉");
    return newPackageData;
  } catch (error) {
    console.error('Error adding package:', error.message);
    throw error;
  }
};

export const fetchPackagesFromFirestore = async (domain) => {
  try {
    const studioDocRef = doc(db, 'studios', domain);
    const packagesCollectionRef = collection(studioDocRef, 'packages');
    const querySnapshot = await getDocs(packagesCollectionRef);
    const packages = querySnapshot.docs.map(doc => doc.data());
    return packages;
  } catch (error) {
    console.error('Error fetching packages:', error.message);
    throw error;
  }
};
