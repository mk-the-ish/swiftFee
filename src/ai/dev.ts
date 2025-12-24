import { config } from 'dotenv';
config();
import { genkit, ai } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK_CONFIG as string);

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();


export const onboardBursar = ai.defineFlow(
  {
    name: 'onboardBursar',
  },
  async () => {
    const userUID = 'Y9veIuEX62cOUMTmV8XUSURKrjn2';
    const roleDocRef = db.collection('roles_bursar').doc(userUID);

    const doc = await roleDocRef.get();
    if(doc.exists) {
        return "User already has bursar role.";
    }

    await roleDocRef.set({
        role: 'bursar',
        assignedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return `Successfully assigned bursar role to user ${userUID}`;
  }
);
