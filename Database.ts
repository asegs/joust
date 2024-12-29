import {PrismaClient, Tournament} from '@prisma/client'

const prisma = new PrismaClient()

const INCLUDE_PLAYERS = {
    entries: {
            include: {
                player: true
            }
        }
}

const INCLUDE_TOURNAMENTS = {
    entries: {
        include: {
            tournament: true
        }
    }
}

const INCLUDE_PLAYERS_GAMES = {
    entries: {
        include: {
            player: true
        }
    },
    games: {}
}


export async function getTournaments() {
    return prisma.tournament.findMany({
        include: INCLUDE_PLAYERS
    }).then(formatDatesForTournaments);
}

export async function getTournamentsByName(name: string) {
    return prisma.tournament.findMany(
        {
            where: {
                name: {
                    contains: name,
                },
            },
            include: INCLUDE_PLAYERS
        }).then(formatDatesForTournaments)
}

export async function getTournamentById(id: number) {
    return prisma.tournament.findUnique({
        where: {
            id: id,
        },
        include: INCLUDE_PLAYERS_GAMES
    }).then(formatDateForTournament)
}

export async function getPlayerById(id: number) {
    return prisma.player.findUnique({
        where: {
            id: id
        },
        include: INCLUDE_TOURNAMENTS
    });
}

export async function createTournament(payload: any) {
    payload.startDate = new Date(payload.startDate);
    payload.endDate = new Date(payload.endDate);
    payload.maxPlayers = parseInt(payload.maxPlayers);
    return prisma.tournament.create(
        {
            data: payload
        }
    )
}

async function formatDateForTournament(tournament: Tournament): Promise<Tournament> {
    return formatDate(tournament);
}


async function formatDatesForTournaments(tournaments: Tournament[]): Promise<Tournament[]> {
    return tournaments.map(formatDate);
}

function formatDate(tournament: Tournament) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',hour: "2-digit", minute: "2-digit" };
    // Correctly flagged as the wrong type.  Do we need a second model to be returned?
    tournament.startDate = tournament.startDate.toLocaleTimeString("en-US", options);
    tournament.endDate = tournament.endDate.toLocaleTimeString("en-US", options);
    return tournament;
}