import {PrismaClient, Tournament} from '@prisma/client'

const prisma = new PrismaClient()

const INCLUDE_PLAYERS = {
    entries: {
            where: {
                type: "entry"
            },
            include: {
                player: true
            }
        }
}

const INCLUDE_TOURNAMENTS = {
    entries: {
        where: {
          type: "entry"
        },
        include: {
            tournament: true
        }
    }
}

const INCLUDE_PLAYERS_GAMES = {
    entries: {
        where: {
            type: "entry"
        },
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

export async function getPlayerByEmail(email: string) {
    return prisma.player.findUnique({
        where: {
            email: email
        },
        include: INCLUDE_TOURNAMENTS
    });
}

export async function createPlayerByEmail(email: string) {
    return prisma.player.create({
        data: {
            email: email,
            firstName: "",
            lastName: ""
        }
    })
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

export async function setAdminById(playerId: number, tournamentId: number, adminType: string) {
    return prisma.admin.upsert({
            where: {
                adminId: {
                    playerId: playerId,
                    tournamentId: tournamentId
                }
            },
            create: {
                playerId: playerId,
                tournamentId: tournamentId,
                type: adminType
            },
            update: {
                type: adminType
            }
        }
    )
}

export async function updatePlayer(payload: any) {
    // Can't send this, not a real field
    delete payload.entries;
    let validNeutralRatingSetting = false;
    if (payload.neutralRating) {
        // TODO: this code SUCKS!
        if (typeof payload.neutralRating === "number") {
            validNeutralRatingSetting = true;
        }
        if (typeof payload.neutralRating === "string") {
            const neutralRating = parseInt(payload.neutralRating);
            if (!Number.isNaN(neutralRating)) {
                payload.neutralRating = parseInt(payload.neutralRating);
                validNeutralRatingSetting = true;
            }
        }
    }
    if (!validNeutralRatingSetting) {
        delete payload.neutralRating;
    }
    return prisma.player.update({
        where: {
            id: payload.id
        },
        data: payload
    });
}



export async function registerPlayerForTournament(playerId: number, tournamentId: number) {
    return prisma.entry.upsert({
        where: {
            entryId: {
                playerId: playerId,
                tournamentId: tournamentId
            }
        },
        create: {
            tournamentId: tournamentId,
            playerId: playerId,
            type: "entry"
        },
        update: {
            type: "entry"
        }
    })
}

export async function withdrawPlayerFromTournament(playerId: number, tournamentId: number) {
    return prisma.entry.update(
        {
            where: {
                entryId: {
                    playerId: playerId,
                    tournamentId: tournamentId
                }
            },
            data: {
                type: "withdrawn"
            }
        }
    );
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