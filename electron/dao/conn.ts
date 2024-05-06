import { PrismaClient } from '@prisma/client'
// const prisma = new PrismaClient()
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: import.meta.env.VITE_DATABASE_URL,
    },
  },
})
export default prisma
