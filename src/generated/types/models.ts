export interface User {
  id: string;
  name: string;
  age: number;
  post: Post[];
}

export interface Post {
  id: string;
  name: string;
  userId: string;
  user: User;
}

export interface Reviews {
  id: string;
  name: string;
}