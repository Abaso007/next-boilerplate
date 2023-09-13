import { z } from "zod"
import { getJsonApiSkip, getJsonApiSort, getJsonApiTake, parseJsonApiQuery } from "@/lib/json-api"
import { prisma } from "@/lib/prisma"
import { getActiveSessionsResponseSchema, getActiveSessionsSchema } from "@/lib/schemas/user"
import { ensureLoggedIn, handleApiError } from "@/lib/server-utils"
import { apiInputFromSchema } from "@/types"

export const getActiveSessions = async ({
  input,
  ctx: { session },
}: apiInputFromSchema<typeof getActiveSessionsSchema>) => {
  try {
    ensureLoggedIn(session)

    const query = parseJsonApiQuery(input)
    const activeSessions = await prisma.session.findMany({
      where: {
        userId: session.user.id,
      },
      skip: getJsonApiSkip(query),
      take: getJsonApiTake(query),
      orderBy: getJsonApiSort(query),
    })

    const total = await prisma.session.count({
      where: {
        userId: session.user.id,
      },
    })

    const response: z.infer<ReturnType<typeof getActiveSessionsResponseSchema>> = {
      data: activeSessions,
      meta: {
        total: activeSessions.length,
        page: query.page,
        perPage: query.perPage,
        totalPages: Math.ceil(total / query.perPage),
      },
    }
    return response
  } catch (error: unknown) {
    return handleApiError(error)
  }
}
