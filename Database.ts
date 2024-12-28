import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()


export async function getTournaments() {
    return prisma.tournament.findMany();
}

export async function getTournamentsByName(name: string) {
    return prisma.tournament.findMany({where: {
            name: {
                contains: name,
            },
        },})
}
