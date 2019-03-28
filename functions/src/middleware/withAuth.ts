import { NextFunction, Request, Response } from "express";
import { adminAuth, db } from "../firebase-init";
import { User } from "../types/User";

const usersRef = db.collection("users");

export interface RequestWithAuth extends Request {
  user: User;
}

export const withAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (
    !req.headers.authorization ||
    !req.headers.authorization.startsWith("Bearer ")
  ) {
    res.status(403).send("Failed to authorize");
    return;
  }

  try {
    const token = req.headers.authorization.split(" ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userDoc = await usersRef
      .where("userId", "==", decodedToken.uid)
      .limit(1)
      .get();

    if (userDoc.empty) {
      throw new Error("Auth::User not found in DB");
    }

    const { userId, handle, email, createdAt } = userDoc.docs[0].data() as User;
    (req as RequestWithAuth).user = {
      userId,
      handle,
      email,
      createdAt
    };

    next();
  } catch (err) {
    res.status(500).json({
      errorMessage: err.message || "Auth::Failed to authorize",
      errorCode: err.code
    });
    return;
  }
};
