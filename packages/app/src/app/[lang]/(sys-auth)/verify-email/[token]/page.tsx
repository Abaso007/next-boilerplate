import Link from "next/link"
import { Locale } from "i18n-config"

import { authRoutes } from "@/lib/auth/constants"
import { getDictionary } from "@/lib/langs"

import VerifyEmailButton from "./form"

export default async function VerifyEmail({
  params: { lang, token },
}: {
  params: {
    lang: Locale
    token: string
  }
}) {
  const dictionary = await getDictionary(lang)

  return (
    <main className="container m-auto flex min-h-screen flex-1 flex-col items-center justify-center space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">{dictionary.emailVerificationTitle}</h1>
      <p className="text-muted-foreground text-sm">{dictionary.emailVerificationDescription}</p>
      <VerifyEmailButton dictionary={dictionary} token={token} />
      <Link href={authRoutes.signIn[0]} className="text-muted-foreground hover:text-primary text-sm">
        {dictionary.goToSignInPage}
      </Link>
    </main>
  )
}
