import { db } from "../app";
import { collection, getDocs, doc, setDoc, query, where, updateDoc } from "firebase/firestore";
import { generateMemorablePIN, generateRandomString, toKebabCase } from "../../utils/stringUtils";

// Referrals
export const fetchAllReferalsFromFirestore  = async () => {
    const referralsCollection = collection(db, 'referrals');
    const querySnapshot = await getDocs(referralsCollection);
    const referalData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));
    
    return referalData;
};
export const generateReferralInFirebase = async (referralData) => {
    const referralsCollection = collection(db, 'referrals');
    
    // Get all existing referrals
    const querySnapshot = await getDocs(referralsCollection);
    const existingReferrals = querySnapshot.docs.map(doc => doc.data());
    
    // Get the forced code or generate a new one
    const forceCode = referralData.code[0];
    let finalCode = forceCode;
    
    console.log(referralData)

    // If no force code, generate unique code
    if (!forceCode) {
        let isUnique = false;
        let attempts = 0;
        const maxAttempts = 5;
        
        while (!isUnique && attempts < maxAttempts) {
            const generatedCode = `${toKebabCase(referralData.name)}-${generateMemorablePIN(8)}`
            const codeExists = existingReferrals.some(referral => 
                referral.code.includes(generatedCode)
            );
            
            if (!codeExists) {
                finalCode = generatedCode;
                isUnique = true;
            }
            attempts++;
        }
        
        if (!isUnique) {
            throw new Error('Unable to generate unique referral code after multiple attempts');
        }
    } else {
        // Check if forced code already exists
        const codeExists = existingReferrals.some(referral => 
            referral.code.includes(forceCode)
        );
        
        if (codeExists) {
            throw new Error('Provided referral code already exists');
        }
    }
    const referralDoc = {
        ...referralData,
        code: [finalCode],
    };
    const documentId = `${toKebabCase(referralData.name)}-${generateRandomString(4)}`;

    await setDoc(doc(referralsCollection, documentId), referralDoc);

    return referralDoc;
};

export const validateInvitationCodeFromFirestore = async (invitationCode) =>{
    const referralsCollection = collection(db, 'referrals');
    const q = query(referralsCollection, where("code", "array-contains", invitationCode), where("status", "==", "active"));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return undefined;
    }

    const referralDoc = querySnapshot.docs[0];
    return {
        id: referralDoc.id,
        ...referralDoc.data()
    };
}
export const acceptInvitationCode = async (invitationCode) => {
    
    
    const referralsCollection = collection(db, 'referrals');
    const querySnapshot = await getDocs(referralsCollection);
    const referalData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));
    const referal = referalData.find((referal) => {
 
        return referal.code.includes(invitationCode) && referal.status === 'active'

    });
    // update referal used increment and  status to passive if used is equal to quota
    if(referal?.used < referal?.quota-1){
        referal.used = referal?.used + 1;
    }
    else{
        referal.used = referal?.used + 1;
        referal.status = 'passive';

    }
    await updateDoc(doc(referralsCollection, referal.id), referal);
    return referal;
}
