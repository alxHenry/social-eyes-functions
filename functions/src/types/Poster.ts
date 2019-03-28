export interface Poster {
  userId: string;
  content: string;
  createdAt: FirebaseFirestore.Timestamp;
}

export interface PosterResponse extends Poster {
  id: string;
}
