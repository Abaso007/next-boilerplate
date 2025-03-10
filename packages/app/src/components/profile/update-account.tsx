"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { useAccount } from "@/contexts/account"
import { TDictionary } from "@/lib/langs"
import { logger } from "@/lib/logger"
import { updateUserSchema } from "@/lib/schemas/user"
import { trpc } from "@/lib/trpc/client"
import { handleMutationError } from "@/lib/utils/client-utils"
import { zodResolver } from "@hookform/resolvers/zod"

import FormField from "../ui/form"
import NeedSavePopup from "../ui/need-save-popup"

import GenerateTotp from "./totp/generate"
import UpdateAvatar from "./avatar"

//? Put only the fields you can update withou password confirmation
const nonSensibleSchema = updateUserSchema

type INonSensibleForm = z.infer<ReturnType<typeof nonSensibleSchema>>

export default function UpdateAccount({
  dictionary,
  sessionHasVerifiedEmail,
}: {
  dictionary: TDictionary
  sessionHasVerifiedEmail: boolean
}) {
  const router = useRouter()
  const utils = trpc.useUtils()

  const { update } = useSession()
  const account = useAccount(dictionary)

  const hasVerifiedEmail =
    account.data?.user.emailVerified === undefined ? sessionHasVerifiedEmail : account.data.user.emailVerified

  const updateUserMutation = trpc.me.updateUser.useMutation({
    onError: (error) => handleMutationError(error, dictionary, router),
    onSuccess: async (data) => {
      logger.debug("User updated")
      await update()
      utils.me.getAccount.invalidate()
      form.reset({
        username: data.user.username ?? "",
      })
    },
  })

  const [isNotSensibleInformationsUpdated, setIsNotSensibleInformationsUpdated] = useState<boolean>(false)

  const form = useForm<INonSensibleForm>({
    resolver: zodResolver(nonSensibleSchema(dictionary)),
    values: {
      username: account.data?.user.username || "",
    },
  })

  const resetForm = useCallback(() => {
    form.reset({
      username: account.data?.user.username ?? "",
    })
  }, [account.data?.user, form])

  if (form.formState.isDirty && !isNotSensibleInformationsUpdated) {
    setIsNotSensibleInformationsUpdated(true)
  } else if (!form.formState.isDirty && isNotSensibleInformationsUpdated) {
    setIsNotSensibleInformationsUpdated(false)
  }

  async function onUpdateNonSensibleInforation(data: INonSensibleForm) {
    if (!hasVerifiedEmail) return
    updateUserMutation.mutate(data)
  }

  return (
    <div className="relative flex flex-col gap-4">
      <div className="mt-3 flex flex-row items-center gap-3">
        <UpdateAvatar account={account} dictionary={dictionary} />
        <div className="flex flex-1 flex-col gap-2">
          <form onSubmit={form.handleSubmit(onUpdateNonSensibleInforation)} className="grid gap-2">
            <FormField
              form={form}
              name="username"
              label={dictionary.profilePage.profileDetails.username.label}
              type="text"
              disabled={updateUserMutation.isLoading || account.isInitialLoading || !hasVerifiedEmail}
              skeleton={account.isInitialLoading}
            />
            <NeedSavePopup
              show={isNotSensibleInformationsUpdated}
              onReset={resetForm}
              isSubmitting={updateUserMutation.isLoading}
              text={dictionary.needSavePopup}
              dictionary={dictionary}
            />
          </form>
        </div>
      </div>
      <GenerateTotp dictionary={dictionary} account={account} />
      {!hasVerifiedEmail && (
        <div className="absolute -inset-2 z-10 !m-0 flex items-center justify-center backdrop-blur-sm">
          <p className="text-muted-foreground text-center text-sm font-semibold">
            {dictionary.errors.emailNotVerified}
          </p>
        </div>
      )}
    </div>
  )
}
