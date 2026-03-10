export interface CreateUserInput {
  email: string;
  name: string;
  password: string;
}

export interface UpdateUserInput {
  id: string;
  name?: string;
  email?: string;
}
