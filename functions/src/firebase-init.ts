import * as firebase from "firebase";
import * as admin from "firebase-admin";
import { firebaseApiKey } from "./secret";

const config = {
  apiKey: firebaseApiKey,
  authDomain: "socialeyes-d0b5f.firebaseapp.com",
  databaseURL: "https://socialeyes-d0b5f.firebaseio.com",
  projectId: "socialeyes-d0b5f",
  storageBucket: "socialeyes-d0b5f.appspot.com",
  messagingSenderId: "528326298125"
};

firebase.initializeApp(config);
admin.initializeApp();

export const auth = firebase.auth();
export const adminAuth = admin.auth();
export const db = admin.firestore();
