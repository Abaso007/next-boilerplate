import { randomUUID } from "crypto"
import { logger } from "@/lib/logger"
import { sendMail } from "@/lib/mailer"
import { prisma } from "@/lib/prisma"
import { sendVerificationEmailSchema, verifyEmailSchema } from "@/lib/schemas/user"
import { html, plainText, subject } from "@/lib/templates/mail/verify-email"
import { ApiError, handleApiError, throwableErrorsMessages } from "@/lib/utils/server-utils"
import { apiInputFromSchema } from "@/types"
import { emailVerificationExpiration, resendEmailVerificationExpiration } from "@/types/constants"
import { env } from "env.mjs"

export const sendVerificationEmail = async ({ input }: apiInputFromSchema<typeof sendVerificationEmailSchema>) => {
  try {
    const { email, silent } = sendVerificationEmailSchema().parse(input)

    const token = randomUUID()
    const user = await prisma.user.findUnique({
      where: {
        email: email.toLowerCase(),
      },
    })
    if (!user) {
      logger.debug("User not found")
      return { email }
    }

    if (user.emailVerified) {
      logger.debug("User email already verified")
      if (silent) return { email }
      return ApiError(throwableErrorsMessages.emailAlreadyVerified, "BAD_REQUEST")
    }

    const userEmailVerificationToken = await prisma.userEmailVerificationToken.findFirst({
      where: {
        identifier: user.id,
      },
    })
    if (userEmailVerificationToken) {
      //? If silent, return early
      if (silent) return { email }

      const isToRecent = userEmailVerificationToken.expires.getTime() > Date.now() + resendEmailVerificationExpiration
      if (isToRecent) {
        logger.debug("Verification email already sent")
        return ApiError(throwableErrorsMessages.emailAlreadySentPleaseTryAgainInFewMinutes, "BAD_REQUEST")
      }
      await prisma.userEmailVerificationToken.delete({
        where: {
          identifier: userEmailVerificationToken.identifier,
        },
      })
    }

    if (env.ENABLE_MAILING_SERVICE === true) {
      await prisma.userEmailVerificationToken.create({
        data: {
          identifier: user.id,
          token: token,
          expires: new Date(Date.now() + emailVerificationExpiration),
        },
      })
      const url = `${env.VERCEL_URL ?? env.BASE_URL}/verify-email/${token}`
      await sendMail({
        from: `"${env.SMTP_FROM_NAME}" <${env.SMTP_FROM_EMAIL}>`,
        to: email.toLowerCase(),
        subject: subject,
        text: plainText(url),
        html: html(url),
      })
    } else {
      logger.debug("Email verification disabled")
      if (silent) return { email }
      return ApiError(throwableErrorsMessages.emailServiceDisabled, "PRECONDITION_FAILED")
    }

    return { email }
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

export const verifyEmail = async ({ input }: apiInputFromSchema<typeof verifyEmailSchema>) => {
  try {
    const { token } = verifyEmailSchema().parse(input)

    const userEmailVerificationToken = await prisma.userEmailVerificationToken.findUnique({
      where: {
        token: token,
      },
    })
    if (!userEmailVerificationToken) {
      logger.debug("Token not found")
      return ApiError(throwableErrorsMessages.tokenNotFound, "BAD_REQUEST")
    }

    await prisma.userEmailVerificationToken.delete({
      where: {
        identifier: userEmailVerificationToken.identifier,
      },
    })

    if (userEmailVerificationToken.expires.getTime() < Date.now()) {
      logger.debug("Token expired")
      return ApiError(throwableErrorsMessages.tokenExpired, "BAD_REQUEST")
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userEmailVerificationToken.identifier,
      },
    })
    if (!user) {
      logger.debug("User not found")
      return ApiError(throwableErrorsMessages.userNotFound, "BAD_REQUEST")
    }

    if (user.emailVerified) {
      logger.debug("User email already verified")
      return ApiError(throwableErrorsMessages.emailAlreadyVerified, "BAD_REQUEST")
    }

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        emailVerified: new Date(),
      },
    })

    return {
      user,
    }
  } catch (error: unknown) {
    return handleApiError(error)
  }
}
