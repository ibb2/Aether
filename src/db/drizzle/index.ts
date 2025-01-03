/*
  This is client code for future reference, e.g. NEXT_PUBLIC needed.
*/

import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import * as dotenv from 'dotenv'

console.log('process.env.DATABASE_URL', process.env.DATABASE_URL!)
console.log('ENV', process.env.NEXT_PUBLIC_VERCEL_ENV)

const url =
    process.env.NEXT_PUBLIC_VERCEL_ENV === 'development'
        ? process.env.DATABASE_URL!
        : process.env.TURSO_DATABASE_URL!

const authToken =
    process.env.NEXT_PUBLIC_VERCEL_ENV === 'development'
        ? undefined!
        : process.env.TURSO_AUTH_TOKEN

console.log('url', url)

const client = createClient({
    url: url,
    authToken: authToken,
})

console.log('client', client)

export const db = drizzle(client)
