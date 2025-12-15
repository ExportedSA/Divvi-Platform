import { DefaultSession } from 'next-auth'
import { USER_ROLES } from '@/lib/constants'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: typeof USER_ROLES[number]
      firstName: string
      lastName: string
      country: string
      region: string
      farmName?: string
    } & DefaultSession['user']
  }

  interface User {
    id: string
    role: typeof USER_ROLES[number]
    firstName: string
    lastName: string
    country: string
    region: string
    farmName?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: typeof USER_ROLES[number]
    firstName: string
    lastName: string
    country: string
    region: string
    farmName?: string
  }
}
