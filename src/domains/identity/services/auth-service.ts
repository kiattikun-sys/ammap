export class AuthService {
  async signIn(_email: string, _password: string): Promise<never> {
    throw new Error("Not implemented");
  }

  async signOut(): Promise<never> {
    throw new Error("Not implemented");
  }
}
