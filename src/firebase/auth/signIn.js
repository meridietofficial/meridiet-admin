import firebase_app from "../firebase";
import { signInWithEmailAndPassword, getAuth } from "firebase/auth";

// const auth = getAuth(firebase_app);

export default async function signIn(email, password) {
  let result = null,
    error = null;
  try {
    result = await signInWithEmailAndPassword(firebase_app, email, password);
  } catch (e) {
    error = e;
  }

  return { result, error };
}
