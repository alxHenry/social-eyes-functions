import { RequestHandler } from "express";
import { auth, db } from "../firebase-init";

const usersRef = db.collection("users");

export const create: RequestHandler = async (req, res) => {
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
};

export const login: RequestHandler = async (req, res) => {
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
};
