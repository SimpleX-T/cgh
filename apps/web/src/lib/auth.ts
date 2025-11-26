import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Wallet",
      credentials: {
        walletAddress: { label: "Wallet Address", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.walletAddress) return null;

        await dbConnect();
        const user = await User.findOne({
          walletAddress: credentials.walletAddress.toLowerCase(),
        });

        if (user) {
          return {
            id: user._id.toString(),
            name: user.username,
            image: user.avatar,
            email: user.walletAddress, // Storing wallet address in email field for convenience or custom field
          };
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        // We can fetch fresh data here if needed, but token.sub is usually enough for ID
        // Let's also ensure wallet address is available
        const email = session.user.email; // We stored wallet address here
        // @ts-ignore
        session.user.walletAddress = email;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/", // Redirect to home if sign in needed
  },
};
