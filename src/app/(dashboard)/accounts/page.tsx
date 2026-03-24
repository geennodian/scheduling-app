import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { AccountsClient } from "@/components/dashboard/accounts-client"

export default async function AccountsPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const accounts = await prisma.connectedGoogleAccount.findMany({
    where: { userId: session.user.id },
    include: {
      calendars: {
        orderBy: { calendarName: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  })

  return <AccountsClient accounts={accounts} />
}
