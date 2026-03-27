declare module 'passport-google-oauth20' {
  import { Strategy as PassportStrategy } from 'passport';

  export interface VerifyCallback {
    (err: Error | null, user?: any, info?: any): void;
  }

  export interface StrategyOptions {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
    scope?: string[];
  }

  export class Strategy extends PassportStrategy {
    constructor(options: StrategyOptions, verify: Function);
  }
}
