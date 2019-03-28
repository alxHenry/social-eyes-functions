import { RequestHandler } from "express";
import { firestore } from "firebase-admin";
import { db } from "../firebase-init";
import { Poster, PosterResponse } from "../types";

const postersRef = db.collection("poster");

export const getAllPosters: RequestHandler = async (_, res) => {
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
};

export const createPoster: RequestHandler = async (req, res) => {
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
};
