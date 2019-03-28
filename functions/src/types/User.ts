export interface FirebaseUserCred {
  uid: string;
}

export const isUserCred = (user: any): user is FirebaseUserCred => {
  return (user && user.uid);
};
