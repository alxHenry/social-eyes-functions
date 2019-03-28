import * as express from "express";
import * as firebase from "firebase";
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { Poster, PosterResponse } from "./types";

const config = {
  apiKey: "AIzaSyCRylCm5yiUf6gThinGR412VfvbFUHbljk",
  authDomain: "socialeyes-d0b5f.firebaseapp.com",
  databaseURL: "https://socialeyes-d0b5f.firebaseio.com",
  projectId: "socialeyes-d0b5f",
  storageBucket: "socialeyes-d0b5f.appspot.com",
  messagingSenderId: "528326298125"
};

firebase.initializeApp(config);
admin.initializeApp();
const app = express();
const db = admin.firestore();
const usersRef = db.collection("users");

app.get("/posters", async (_, res) => {
  const posters: PosterResponse[] = [];

  try {
    const posterDocs = await db
      .collection("poster")
      .orderBy("createdAt", "desc")
      .get();

    posterDocs.forEach(posterDoc => {
      const poster = posterDoc.data() as Poster;
      posters.push({
        id: posterDoc.id,
        userId: poster.userId,
        createdAt: poster.createdAt,
        content: poster.content
      });
    });

    res.json(posters);
  } catch (err) {
    res.status(500).send("Something went wrong");
  }
});

app.post("/posters", async (req, res) => {
  const uncreatedPoster: Poster = {
    content: req.body.content,
    userId: req.body.userId,
    createdAt: admin.firestore.Timestamp.fromDate(new Date())
  };

  try {
    const posterDoc = await db.collection("poster").add(uncreatedPoster);
    res.send(posterDoc.id);
  } catch (err) {
    res.status(500).send("Failed to create poster");
  }
});

app.post("/signup", async (req, res) => {
  if (req.body.password !== req.body.confirmPassword) {
    res
      .status(400)
      .json({ errorCode: 1, errorMessage: "Password fields do not match" });
    return;
  }

  try {
    const newUser = {
      email: req.body.email,
      password: req.body.password,
      handle: req.body.handle
    };

    // Validate if user exists already
    const userSnap = await usersRef.doc(newUser.handle).get();
    if (userSnap.exists) {
      res
        .status(400)
        .json({ errorMessage: "The user handle is already taken" });
      return;
    }

    // Create user credntial
    const userCred = await firebase
      .auth()
      .createUserWithEmailAndPassword(newUser.email, newUser.password);
    if (!userCred.user) {
      res.status(400).json({ errorMessage: "Failed to create user cred" });
      return;
    }
    const userAccessToken = await userCred.user.getIdToken();

    // Store in our DB
    const userId = userCred.user ? userCred.user.uid : null;
    await usersRef.doc(newUser.handle).set({
      userId,
      handle: newUser.email,
      email: newUser.email,
      createdAt: new Date()
    });

    // Respond
    res.status(201).json({
      userId,
      userAccessToken
    });
    return;
  } catch (err) {
    const errorMessage = err.message || "Password is not sufficiently strong";

    res.status(500).json({
      errorMessage
    });
  }
});

export const api = functions.https.onRequest(app);
