import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret, secureCookie: true })

  if (!token) {
    const loginUrl = new URL("/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/accounts/:path*",
    "/scheduling-pages/:path*",
    "/bookings/:path*",
  ],
}
