import { firestore } from "firebase-admin";

export interface FirebaseUserCred {
  uid: string;
}
export const isUserCred = (user: any): user is FirebaseUserCred => {
  return user && user.uid;
};

export interface User {
  userId: string;
  handle: string;
  email: string;
  createdAt: firestore.Timestamp;
}
