import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import express from 'express';
import { Poster } from "./types";

admin.initializeApp();
const db = admin.firestore();

export const helloWorld = functions.https.onRequest((_, response) => {
  response.send("Hello from Firebase!");
});

export const getPosters = functions.https.onRequest(async (_, response) => {
  const posters: Poster[] = [];

  try {
    const posterDocs = await db.collection("poster").get();
    posterDocs.forEach(posterDoc => posters.push(posterDoc.data() as Poster));
    response.json(posters);
  } catch (err) {
    response.status(500).send("Something went wrong");
  }
});

export const createPoster = functions.https.onRequest(async (req, res) => {
  const uncreatedPoster: Poster = {
    content: req.body.content,
    userId: req.body.userId,
    createdAt: admin.firestore.Timestamp.fromDate(new Date())
  };

  try {
    const posterDoc = await db.collection("poster").add(uncreatedPoster);
    res.json(posterDoc);
  } catch (err) {
    res.status(500).send("Failed to create poster");
  }
});
