import * as express from "express";
import { https } from "firebase-functions";
import { createPoster, getAllPosters } from "./handlers/posters";
import { create, login } from "./handlers/users";
import { withAuth } from "./middleware/withAuth";

const app = express();

app.get("/posters", getAllPosters);
app.post("/posters", withAuth, createPoster);

app.post("/signup", create);

app.post("/login", login);

export const api = https.onRequest(app);
