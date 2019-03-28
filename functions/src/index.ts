import * as express from "express";
import { firestore } from "firebase-admin";
import { https } from "firebase-functions";
import { auth, db } from "./firebase-init";
import { withAuth } from "./middleware/withAuth";
import { Poster, PosterResponse } from "./types";

const app = express();
const usersRef = db.collection("users");
const postersRef = db.collection("poster");

app.get("/posters", async (_, res) => {
  const posters: PosterResponse[] = [];

  try {
    const posterDocs = await postersRef.orderBy("createdAt", "desc").get();

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
    return;
  }
});

app.post("/posters", withAuth, async (req, res) => {
  const uncreatedPoster: Poster = {
    content: req.body.content,
    userId: req.body.userId,
    createdAt: firestore.Timestamp.fromDate(new Date())
  };

  try {
    const posterDoc = await postersRef.add(uncreatedPoster);
    res.json({ id: posterDoc.id });
  } catch (err) {
    res.status(500).send("Failed to create poster");
    return;
  }
});

app.post("/signup", async (req, res) => {
  if (req.body.password !== req.body.confirmPassword) {
    res.status(400).json({ errorMessage: "Password fields do not match" });
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

    // Create user credential
    const userCred = await auth.createUserWithEmailAndPassword(
      newUser.email,
      newUser.password
    );
    if (!userCred.user) {
      res.status(400).json({ errorMessage: "Failed to create user cred" });
      return;
    }
    const userAccessToken = await userCred.user.getIdToken();

    // Store in our DB
    const userId = userCred.user ? userCred.user.uid : null;
    await usersRef.doc(newUser.handle).set({
      userId,
      handle: newUser.handle,
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
      errorMessage,
      errorCode: err.code
    });
    return;
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const userCred = await auth.signInWithEmailAndPassword(email, password);

    if (!userCred.user) {
      throw new Error("Unable to get the user creds");
    }

    const userAccessToken = await userCred.user.getIdToken();
    res.json({ userAccessToken });
  } catch (err) {
    res.status(500).json({
      errorMessage: err.message || "Unable to log the user in",
      errorCode: err.code
    });
    return;
  }
});

export const api = https.onRequest(app);
