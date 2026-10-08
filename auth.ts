import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import {isAllowedGoogleAccount, hasSessionEmail} from '@/lib/authPolicy';
import {hasAppAccess} from '@/lib/allowedUsers';

export const {handlers, auth, signIn, signOut} = NextAuth({
  providers: [Google({
    clientId: process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET,
    authorization: {params: {prompt: 'select_account'}},
  })],
  pages: {signIn: '/signin', error: '/signin'},
  session: {strategy: 'jwt', maxAge: 7 * 24 * 60 * 60},
  callbacks: {
    async signIn({account, profile}) {
      return isAllowedGoogleAccount(account?.provider, profile) && await hasAppAccess(profile?.email);
    },
    jwt({token, account, profile}) {
      // Only Google's verified profile establishes identity. Client-side
      // session updates must never change authorization.
      if (account) {
        token.googleVerified = isAllowedGoogleAccount(account.provider, profile);
        token.email = token.googleVerified ? profile?.email : null;
      }
      return token;
    },
    async session({session, token}) {
      session.user.email = token.googleVerified === true && hasSessionEmail(token.email) && await hasAppAccess(token.email)
        ? token.email : '';
      return session;
    },
  },
});
