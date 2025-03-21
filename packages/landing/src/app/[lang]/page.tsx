import { env } from "env.mjs"
import { Locale } from "i18n-config"

import { getDictionary } from "@/lib/langs"

import Blob from "./blob"

export default async function Home({
  params: { lang },
}: {
  params: {
    lang: Locale
  }
}) {
  const dictionary = await getDictionary(lang)

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 md:p-24">
      <div className="pointer-events-none absolute left-0 top-0 h-full w-full overflow-hidden">
        <Blob />
      </div>
      <h1 className="animate-fade-in-scale relative rounded-lg p-5 text-center text-4xl font-bold text-white/80 md:text-6xl lg:text-8xl">
        {dictionary.home.title}
      </h1>
      <a href={env.NEXT_PUBLIC_APP_URL} className="animate-fade-in-scale mt-10 hover:text-blue-500">
        {dictionary.home.link}
      </a>
    </main>
  )
}
