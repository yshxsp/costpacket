import {NextResponse,type NextRequest} from 'next/server'
import {getSessionCookie} from 'better-auth/cookies'
// Optimistic routing only. Every data operation validates the real session.
export function middleware(request:NextRequest){
 const path=request.nextUrl.pathname
 if(!['/','/login','/signup','/privacy','/forgot-password','/reset-password','/accept-invite'].includes(path)&&!path.startsWith('/api/')&&!getSessionCookie(request)){
  const url=request.nextUrl.clone();url.pathname='/login';url.search='';url.searchParams.set('redirectTo',path);return NextResponse.redirect(url)
 }
 return NextResponse.next()
}
export const config={matcher:['/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest)$).*)']}
