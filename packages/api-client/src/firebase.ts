import { type FirebaseApp, getApps, initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  confirmPasswordReset as fbConfirmPasswordReset,
  createUserWithEmailAndPassword,
  type ConfirmationResult,
  EmailAuthProvider,
  getAuth,
  linkWithPhoneNumber,
  onAuthStateChanged as fbOnAuthStateChanged,
  reauthenticateWithCredential,
  RecaptchaVerifier,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signOut,
  setPersistence,
  updatePassword,
  type User as FirebaseUser,
  verifyPasswordResetCode as fbVerifyPasswordResetCode,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getFirebaseApp(): FirebaseApp {
  return getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
}

export const auth = getAuth(getFirebaseApp());

if (typeof window !== "undefined") {
  setPersistence(auth, browserLocalPersistence).catch(() => {
    // Falls back to the SDK's in-memory default persistence if the browser blocks storage.
  });
}

export function onAuthStateChanged(callback: (user: FirebaseUser | null) => void) {
  return fbOnAuthStateChanged(auth, callback);
}

export function signUpWithEmail(email: string, password: string) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export function signInWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function signOutFirebase() {
  return signOut(auth);
}

/** Container must be an empty, always-mounted DOM node — invisible reCAPTCHA renders into it. */
export function createRecaptchaVerifier(containerId: string) {
  return new RecaptchaVerifier(auth, containerId, { size: "invisible" });
}

/** Login-screen phone branch: signs in (or silently creates a new Firebase user
 * if this number was never linked to anyone — callers should pre-flight with
 * authApi.lookup and post-check with GET /auth/me, see LoginPage). */
export function startPhoneSignIn(phoneNumber: string, verifier: RecaptchaVerifier) {
  return signInWithPhoneNumber(auth, phoneNumber, verifier);
}

/** Register-screen flow: attaches a phone number as an additional sign-in
 * credential on the already-signed-in (email/password) user. */
export function linkPhoneToCurrentUser(phoneNumber: string, verifier: RecaptchaVerifier) {
  if (!auth.currentUser) throw new Error("No signed-in user to link a phone number to");
  return linkWithPhoneNumber(auth.currentUser, phoneNumber, verifier);
}

export function confirmPhoneCode(confirmationResult: ConfirmationResult, code: string) {
  return confirmationResult.confirm(code);
}

export function sendResetEmail(email: string, continueUrl: string) {
  return sendPasswordResetEmail(auth, email, { url: continueUrl });
}

export function verifyPasswordResetCode(oobCode: string) {
  return fbVerifyPasswordResetCode(auth, oobCode);
}

export function confirmPasswordReset(oobCode: string, newPassword: string) {
  return fbConfirmPasswordReset(auth, oobCode, newPassword);
}

/** Signed-in user's own "change password" flow (account settings) — Firebase
 * requires a recent sign-in for this, so it reauthenticates with the current
 * password first rather than trusting the existing session alone. */
export async function changePassword(currentPassword: string, newPassword: string) {
  const user = auth.currentUser;
  if (!user?.email) throw new Error("No signed-in user");
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
}

export type { FirebaseUser, ConfirmationResult };
export { RecaptchaVerifier };
