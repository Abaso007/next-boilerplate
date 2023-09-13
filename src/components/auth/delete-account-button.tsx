"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { authRoutes } from "@/lib/auth/constants"
import { handleMutationError } from "@/lib/client-utils"
import { TDictionary } from "@/lib/langs"
import { trpc } from "@/lib/trpc/client"
import { Button } from "../ui/button"
import { toast } from "../ui/use-toast"

export default function DeleteAccountButton({
  children,
  dictionary,
}: {
  children: React.ReactNode
  dictionary: TDictionary
}) {
  const router = useRouter()
  const deleteAccountMutation = trpc.me.deleteAccount.useMutation({
    onError: (error) => {
      handleMutationError(error, dictionary, router)
      setIsDeletingAccount(false)
    },
    onSuccess: () => {
      toast({
        title: dictionary.deleteAccountSuccessTitle,
        description: dictionary.deleteAccountSuccessDescription,
      })
      router.push(authRoutes.signIn[0])
    },
  })

  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const handleDeleteAccount = () => {
    setIsDeletingAccount(true)
    deleteAccountMutation.mutate()
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" isLoading={isDeletingAccount}>
          {children}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{dictionary.deleteAccountConfirmationTitle}</AlertDialogTitle>
          <AlertDialogDescription>{dictionary.deleteAccountConfirmationDescription}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{dictionary.cancel}</AlertDialogCancel>
          <Button variant="destructive" onClick={handleDeleteAccount} isLoading={isDeletingAccount}>
            {dictionary.deleteAccountConfirm}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
