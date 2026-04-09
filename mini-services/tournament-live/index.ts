import { createServer } from 'http'
import { Server } from 'socket.io'

const httpServer = createServer()
const io = new Server(httpServer, {
  // DO NOT change the path, it is used by Caddy to forward the request to the correct port
  path: '/',
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000,
  pingInterval: 25000,
})

// Track which users are watching which tournaments
const tournamentViewers = new Map<string, Set<string>>() // tournamentId -> Set of socketIds
const socketTournaments = new Map<string, Set<string>>() // socketId -> Set of tournamentIds

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`)

  // Join a tournament's live leaderboard room
  socket.on('join-tournament', (data: { tournamentId: string }) => {
    const { tournamentId } = data

    // Track the viewer
    if (!tournamentViewers.has(tournamentId)) {
      tournamentViewers.set(tournamentId, new Set())
    }
    tournamentViewers.get(tournamentId)!.add(socket.id)

    // Track which tournaments this socket is watching
    if (!socketTournaments.has(socket.id)) {
      socketTournaments.set(socket.id, new Set())
    }
    socketTournaments.get(socket.id)!.add(tournamentId)

    // Join the socket.io room for this tournament
    socket.join(`tournament:${tournamentId}`)

    // Send current viewer count
    const viewerCount = tournamentViewers.get(tournamentId)?.size || 0
    io.to(`tournament:${tournamentId}`).emit('viewer-count', {
      tournamentId,
      count: viewerCount,
    })

    console.log(`Socket ${socket.id} joined tournament ${tournamentId} (${viewerCount} viewers)`)
  })

  // Leave a tournament's live leaderboard room
  socket.on('leave-tournament', (data: { tournamentId: string }) => {
    const { tournamentId } = data

    // Remove the viewer
    tournamentViewers.get(tournamentId)?.delete(socket.id)
    socketTournaments.get(socket.id)?.delete(tournamentId)

    // Leave the socket.io room
    socket.leave(`tournament:${tournamentId}`)

    // Send updated viewer count
    const viewerCount = tournamentViewers.get(tournamentId)?.size || 0
    io.to(`tournament:${tournamentId}`).emit('viewer-count', {
      tournamentId,
      count: viewerCount,
    })

    console.log(`Socket ${socket.id} left tournament ${tournamentId}`)
  })

  // Score update event from a scorer
  socket.on('score-update', (data: {
    tournamentId: string
    groupLetter: string
    scorerId: string
    holeNumber: number
    playerIndex: number
    strokes: number
    currentHole: number
    scores: any[] // Full scores array for the round
    playerScores?: any[] // Additional player scores
    playerNames?: string // JSON string of player names
    playerHandicap?: number
  }) => {
    // Broadcast to all viewers of this tournament
    io.to(`tournament:${data.tournamentId}`).emit('score-update', {
      ...data,
      timestamp: new Date().toISOString(),
    })

    console.log(`Score update: Tournament ${data.tournamentId}, Group ${data.groupLetter}, Hole ${data.holeNumber}, Player ${data.playerIndex} = ${data.strokes}`)
  })

  // Round completed event
  socket.on('round-completed', (data: {
    tournamentId: string
    groupLetter: string
    scorerId: string
    roundId: string
    totalStrokes: number
  }) => {
    io.to(`tournament:${data.tournamentId}`).emit('round-completed', {
      ...data,
      timestamp: new Date().toISOString(),
    })

    console.log(`Round completed: Tournament ${data.tournamentId}, Group ${data.groupLetter}, Scorer ${data.scorerId}`)
  })

  // Tournament status update
  socket.on('tournament-status', (data: {
    tournamentId: string
    status: string
  }) => {
    io.to(`tournament:${data.tournamentId}`).emit('tournament-status', {
      ...data,
      timestamp: new Date().toISOString(),
    })
  })

  socket.on('disconnect', () => {
    // Clean up all tournament subscriptions for this socket
    const tournaments = socketTournaments.get(socket.id)
    if (tournaments) {
      for (const tournamentId of tournaments) {
        tournamentViewers.get(tournamentId)?.delete(socket.id)

        // Send updated viewer count
        const viewerCount = tournamentViewers.get(tournamentId)?.size || 0
        io.to(`tournament:${tournamentId}`).emit('viewer-count', {
          tournamentId,
          count: viewerCount,
        })
      }
    }
    socketTournaments.delete(socket.id)
    console.log(`Client disconnected: ${socket.id}`)
  })

  socket.on('error', (error) => {
    console.error(`Socket error (${socket.id}):`, error)
  })
})

const PORT = 3005
httpServer.listen(PORT, () => {
  console.log(`Tournament live scoring WebSocket server running on port ${PORT}`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM signal, shutting down server...')
  httpServer.close(() => {
    console.log('WebSocket server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('Received SIGINT signal, shutting down server...')
  httpServer.close(() => {
    console.log('WebSocket server closed')
    process.exit(0)
  })
})
