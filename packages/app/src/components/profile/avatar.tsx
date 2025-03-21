"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Camera } from "lucide-react"
import { toast } from "react-toastify"

import { useAccount } from "@/contexts/account"
import { TDictionary } from "@/lib/langs"
import { logger } from "@/lib/logger"
import { trpc } from "@/lib/trpc/client"
import { cn } from "@/lib/utils"
import { getImageUrl, handleMutationError } from "@/lib/utils/client-utils"
import { maxUploadSize } from "@/types/constants"
import { Avatar, Button, Modal, ModalBody, ModalContent, Skeleton, Spinner } from "@nextui-org/react"

import { Icons } from "../icons"
import FileUpload from "../ui/file-upload"
import { ModalHeader, ModalTitle } from "../ui/modal"

export default function UpdateAvatar({
  account,
  dictionary,
}: {
  account: ReturnType<typeof useAccount>
  dictionary: TDictionary
}) {
  const router = useRouter()
  const utils = trpc.useUtils()

  const getPresignedUrlMutation = trpc.upload.presignedUrl.useMutation({
    onError: (error) => handleMutationError(error, dictionary, router),
  })
  const updateUserMutation = trpc.me.updateUser.useMutation({
    onError: (error) => handleMutationError(error, dictionary, router),
  })

  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!file) {
      toast.error(dictionary.errors.noFileSelected)
      return
    }
    if (file.size > maxUploadSize) {
      toast.error(dictionary.errors.fileTooLarge)
      return
    }
    setUploading(true)
    try {
      const { url, fields } = await getPresignedUrlMutation.mutateAsync({
        filename: file.name,
        filetype: file.type,
        kind: "avatar",
      })

      try {
        const formData = new FormData()
        Object.entries(fields).forEach(([key, value]) => {
          formData.append(key, value as string)
        })
        formData.append("file", file)

        const uploadResponse = await fetch(url, {
          method: "POST",
          body: formData,
        })

        if (uploadResponse.ok) {
          await updateUserMutation.mutateAsync({
            image: fields.key,
          })

          utils.me.getAccount.invalidate()

          setShowModal(false)
        } else {
          const xml = await uploadResponse.text()
          const parser = new DOMParser()
          const xmlDoc = parser.parseFromString(xml, "text/xml")
          const error = xmlDoc.getElementsByTagName("Message")[0]
          if (error.textContent === "Your proposed upload exceeds the maximum allowed size") {
            toast.error(dictionary.errors.fileTooLarge)
          } else {
            toast.error(dictionary.errors.unknownError)
          }
        }
      } catch (e) {
        logger.error(e)
        toast.error(dictionary.errors.unknownError)
      }
    } catch {
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async () => {
    try {
      await updateUserMutation.mutateAsync({
        image: null,
      })

      utils.me.getAccount.invalidate()

      setShowModal(false)
    } catch {
      toast.error(dictionary.errors.unknownError)
    }
  }

  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <div className={cn("group relative h-20 w-20 rounded-full")}>
        <Skeleton isLoaded={!account.isInitialLoading} className="rounded-full">
          <Avatar
            className="text-large h-20 w-20"
            src={getImageUrl(account.data?.user.image) || undefined}
            name={account.data?.user.username || undefined}
            onClick={() => setShowModal(true)}
          />
        </Skeleton>
        <div
          className={cn(
            "upload-group bg-muted/40 group absolute inset-0 flex cursor-pointer items-center justify-center rounded-full opacity-0 backdrop-blur-sm transition-all duration-200 group-hover:opacity-100",
            {
              hidden: account.isInitialLoading,
            }
          )}
          onClick={() => setShowModal(true)}
        >
          <Camera className="duration-250 h-8 w-8 transition-all group-[.upload-group]:active:scale-95" />
        </div>
        <Button
          color="danger"
          className={cn(
            "text-foreground absolute right-0 top-0 h-[unset] min-w-0 rounded-full p-1.5 opacity-0 transition-all duration-200 group-hover:opacity-100",
            {
              hidden: account.isInitialLoading || !account.data?.user.image,
            }
          )}
          onPress={() => handleDelete()}
        >
          {updateUserMutation.isLoading ? (
            <Spinner
              classNames={{
                wrapper: "h-4 w-4",
              }}
              color="current"
            />
          ) : (
            <Icons.trash className="h-4 w-4" />
          )}
        </Button>
      </div>
      <Modal isOpen={showModal} onOpenChange={(open) => setShowModal(open)} backdrop="blur">
        <ModalContent>
          <ModalHeader>
            <ModalTitle>{dictionary.updateAvatar}</ModalTitle>
          </ModalHeader>
          <ModalBody>
            <form onSubmit={handleSubmit} className="flex flex-col gap-2">
              <FileUpload
                onFilesChange={(files) => {
                  setFile(files[0])
                }}
                accept={{
                  "image/png": [".png"],
                  "image/jpeg": [".jpg", ".jpeg"],
                }}
                dictionary={dictionary}
                disabled={uploading}
              />
              <Button color="primary" type="submit" isDisabled={uploading || !file} isLoading={uploading}>
                {dictionary.updateAvatar}
              </Button>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  )
}
