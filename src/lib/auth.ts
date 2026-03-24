import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile",
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  trustHost: true,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      console.log("[AUTH] signIn callback triggered for:", user.email)
      if (!account || !user.email) return false
      try {
        const existingAccount = await prisma.account.findUnique({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          },
        })
        if (existingAccount) {
          await prisma.account.update({
            where: { id: existingAccount.id },
            data: {
              access_token: account.access_token,
              refresh_token: account.refresh_token ?? existingAccount.refresh_token,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
              session_state: account.session_state as string | null,
            },
          })
          console.log("[AUTH] Updated existing account tokens")
        }
      } catch (e: any) {
        console.error("[AUTH] signIn callback error:", e?.message || e)
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      if (!token.id && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
        })
        if (dbUser) {
          token.id = dbUser.id
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  logger: {
    error(error: any) {
      const cause = error?.cause
      let causeStr = "unknown"
      if (cause instanceof Error) {
        causeStr = JSON.stringify({ message: cause.message, name: cause.name, stack: cause.stack?.split('\n').slice(0, 3).join('\n') })
      } else if (cause && typeof cause === 'object') {
        try {
          causeStr = JSON.stringify(cause, Object.getOwnPropertyNames(cause))
        } catch {
          causeStr = String(cause)
        }
      }
      console.error("[AUTH ERROR FULL]", JSON.stringify({
        message: error?.message,
        name: error?.name,
        cause: causeStr,
      }))
    },
    warn(code: any) {
      console.warn("[AUTH WARN]", code)
    },
    debug(message: any, metadata: any) {
      // skip verbose debug in production
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
})
