
const W = 'white'
const B = 'red'

const clamp = (num, min, max) => Math.min(Math.max(min, num), max)

const clone = obj => JSON.parse(JSON.stringify(obj))
const oppositeColor = color => color === W ? B : W
var chess = null

class Game
{
    static start () {
        let game = new Game
        chess = game
        game.setStartingPieces()
        game.nextTurn()
        return game
    }

    constructor () {
        this[B] = this.newPlayer(B)
        this[W] = this.newPlayer(W)
        this.board = new Board
        this.turn = null
        this.turnCount = 0
    }

    nextTurn () {
        // Clear En Passant moves from the previous turn
        this.board.clearEnPassant(this.turnCount)
        // Change turn
        this.changeTurn()
        // Calculate last players available moves to find checks
        this.board.calculateMoves(this[oppositeColor(this.turn)], this)
        this.board.calculateChecks(this[this.turn]);
        // Calculate next players moves now
        this.board.calculateMoves(this[this.turn], this)
        // Show the board
        this.board.show()

        let player = this[this.turn]
        console.log(`${this.turn}'s move${this.board.check ? ', checked' : ''}`)
    }
    changeTurn () {
        switch (this.turn) {
            case W:
                this.turn = B
                break
            case B:
            case null:
                this.turn = W
                break
        }
        this.turnCount++
    }

    // Make a move by notation: "Qd4"
    moveN (notation) {
        this.move(Move.convertMoveNotation(this, notation))
    }
    // Move piece at x to y
    moveD (from, to) {
        this.move(Move.getValidMove(this, from, to))
    }
    // Force move piece at x to y, even if invalid
    moveF (from, to) {
        this.doMove(Move.convertDefaultNotation(this, from, to))
        this.nextTurn()
    }
    // Execute a given move on the game board
    move (move) {
        if (this.isValidMove(move)) {
            this.doMove(move)
            this.nextTurn()
        } else {
            throw new Error('Invalid move')
        }
    }
    doMove (move) {
        if (move instanceof SpecialMove) {
            return move.execute(this)
        }

        if (this.board.hasPieceAt(move.position)) {
            this.capturePiece(this.board.at(move.position))
        }

        this.board.movePiece(move)
    }
    capturePiece (piece) {
        this[this.turn].capturedPieces.push(piece)
        this[this.turn === W ? B : W].removePiece(piece)
        this.board.removePiece(piece.position)
    }
    isValidMove (move) {
        if (move.piece === null) {
            throw new Error('No piece to move.')
        }

        if (move.piece.color !== this.turn) {
            throw new Error('Can\'t move other color\'s pieces.')
        }

        return move.isValid(this.board, this.turn)
    }

    newPlayer (color) {
        return new Player(color)
    }

    setStartingPieces () {
        this[B].setPieces(this.startingPieces(8, 7, B))
        this[W].setPieces(this.startingPieces(1, 2, W))
        this.board.addPieces(this[B].pieces)
        this.board.addPieces(this[W].pieces)
    }

    startingPieces (homeRow, pawnRow, color) {
        let pieces = [
            new Rook(new Position(homeRow, 1)),
            new Knight(new Position(homeRow, 2)),
            new Bishop(new Position(homeRow, 3)),
            new Queen(new Position(homeRow, 4)),
            new King(new Position(homeRow, 5)),
            new Bishop(new Position(homeRow, 6)),
            new Knight(new Position(homeRow, 7)),
            new Rook(new Position(homeRow, 8)),
        ]

        for (let i = 1; i <= this.board.width; i++) {
            pieces.push(new Pawn(new Position(pawnRow, i)))
        }

        pieces.forEach(piece => piece.setColor(color))

        return pieces
    }
}

class Board
{
    constructor (width = 8, height = 8) {
        this.width = width
        this.height = height
        this.pieces = {[W]: [], [B]: []}
        this.moves = {[W]: new MoveSet(), [B]: new MoveSet()}
        this.enPassantPosition = null
        this.enPassantTurn = null
        this.check = null
        this.board = []
        for (let i = 1; i <= height; i++) {
            for (let j = 1; j <= width; j++) {
                if (!Array.isArray(this.board[i])) {
                    this.board[i] = []
                }

                this.board[i][j] = null
            }
        }
    }

    addPieces (pieces) {
        pieces.forEach(piece => {
            this.pieces[piece.color].push(piece)
            this.board[piece.position.v][piece.position.h] = piece
        })
    }
    removePiece (v, h) {
        let piece = this.at(v, h)

        if (piece) {
            if (v instanceof Position) {
                this.board[v.v][v.h] = null
            } else {
                this.board[v][h] = null
            }
            this.pieces[piece.color].splice(this.pieces[piece.color].indexOf(piece), 1)
        }
    }

    at (v, h) {
        if (v instanceof Position) {
            return this.board[v.v][v.h]
        } else {
            return this.board[v][h]
        }
    }
    hasPieceAt (v, h) {
        return this.at(v, h) !== null
    }
    hasEnemyPieceAt (v, h, color) {
        let piece = this.at(v, h)
        return piece && piece.color !== color
    }
    movePiece (move) {
        this.board[move.piece.position.v][move.piece.position.h] = null
        move.piece.position = move.position
        this.board[move.position.v][move.position.h] = move.piece
        move.piece.moved()
    }
    setEnPassantPosition (position, turnCount) {
        this.enPassantPosition = position
        this.enPassantTurn = turnCount
    }
    clearEnPassant (turnCount) {
        if (this.enPassantPosition !== null && this.enPassantTurn < turnCount) {
            this.enPassantPosition = null
            this.enPassantTurn = null
        }
    }

    calculateChecks (player) {
        if (this.hasAttack(player.color, player.getKing().position)) {
            this.check = player.color
        } else {
            this.check = null
        }
    }
    calculateMoves (player, game, limitByChecks = true) {
        let moves = new MoveSet()
        this.pieces[player.color].forEach(piece => {
            moves.combine(piece.getPotentialMoves(this))
        })

        if (limitByChecks && this.check === player.color) {
            let movesOutOfCheck = moves.moves.filter(move => {
                return this.simulateMove(game, move, player).check === null
            })
            moves = new MoveSet()
            moves.addMoves(movesOutOfCheck)
        }

        this.moves[player.color] = moves
    }
    // Check if the enemy can move to specific position
    hasMove (color, position) {
        return this.moves[oppositeColor(color)].moves.filter(move => {
            return move.position.equals(position)
        }).length > 0
    }
    // Check if the enemy has an attack against the specified position
    hasAttack (color, position) {
        return this.moves[oppositeColor(color)].getAttackingMoves().filter(move => {
            return move.position.equals(position)
        }).length > 0
    }
    // Check if the enemy could potentially attack against the specified position
    canAttack (color, position) {
        return this.hasMove(color, position) || this.hasAttack(color, position)
    }

    simulateMove (game, move, player) {
        move = move.clone()
        let board = this.clone()
        if (move.isAttack) {
            board.removePiece(move.position)
        }
        board.movePiece(move)
        board.calculateMoves(game[oppositeColor(player.color)], game, false)
        board.calculateChecks(player)
    }

    clone () {
        let board = new Board()
        board.addPieces(this.pieces[W].map(piece => piece.clone()))
        board.addPieces(this.pieces[B].map(piece => piece.clone()))
        board.moves = {[W]: this.moves[W].clone(), [B]: this.moves[B].clone()}
        board.enPassantPosition = this.enPassantPosition
        board.enPassantTurn = this.enPassantTurn
        board.check = this.check
        return board
    }

    show () {
        console.log("%c   A    B    C    D    E    F    G    H", 'font-size:12px')
        for (let i = 1; i <= this.height; i++) {
            let row = `${i}  `
            let colors = []
            for (let j = 1; j <= this.width; j++) {
                let piece = this.at(i, j)
                row += `%c${piece ? piece.getCharacter() : '-'}  `
                colors.push(piece ? piece.color : 'grey')
            }

            console.log(row, ...colors.map(color => `color:${color};font-size:20px`))
        }
    }
}

class Position
{
    constructor (v, h) {
        this.v = v
        this.h = h
    }

    equals (otherPosition) {
        return this.v === otherPosition.v && this.h === otherPosition.h
    }

    inBoard (board) {
        return this.v > 0 && this.v <= board.height && this.h > 0 && this.h <= board.width
    }

    static convertHorizontalNotation (char) {
        switch (char) {
            case 'a':
                return 1
            case 'b':
                return 2
            case 'c':
                return 3
            case 'd':
                return 4
            case 'e':
                return 5
            case 'f':
                return 6
            case 'g':
                return 7
            case 'h':
                return 8
            default:
                return char
        }
    }
}

class Player
{
    constructor (color) {
        this.color = color
        this.pieces = []
        this.capturedPieces = []
    }

    setPieces (pieces) {
        this.pieces = pieces
    }
    removePiece (piece) {
        this.pieces.splice(this.pieces.indexOf(piece), 1)
    }
    getPiecesOfType (type) {
        return this.pieces.filter(piece => piece.type === type)
    }
    getKing () {
        return this.getPiecesOfType(KING)[0]
    }
}

class MoveSet
{
    constructor () {
        this.moves = []
    }
    clone () {
        let moveSet = new MoveSet()
        this.moves.forEach(move => {
            moveSet.add(move.clone())
        })
        return moveSet
    }
    add (move) {
        if (!move instanceof Move) {
            return
        }

        this.moves.push(move)
    }
    addMoves (moves) {
        moves.forEach(move => this.add(move))
    }
    hasMove (move) {
        let moves = this.getMovesToPosition(move.position)

        moves = moves.filter(m => m.piece === move.piece)

        return moves.length > 0
    }

    getMovesToPosition (position) {
        return this.moves.filter(move => move.position.equals(position))
    }
    getAttackingMoves () {
        return this.moves.filter(move => move.isAttack)
    }

    combine (moveSet) {
        this.moves = this.moves.concat(moveSet.moves)
    }

    show () {
        for (let i = 1; i <= 8; i++) {
            let row = `${i}  `
            let colors = []
            for (let j = 1; j <= 8; j++) {
                let moves = this.getMovesToPosition(new Position(i, j))
                if (moves.length === 0) {
                    row += `%c-  `
                    colors.push('grey')
                    continue
                }

                let hasAttack = moves.reduce((hasAttack, move) => hasAttack || (hasAttack = move.isAttack), false)
                row += `%c${hasAttack ? 'X' : 'M'}  `
                colors.push(hasAttack ? 'red' : 'white')
            }

            console.log(row, ...colors.map(color => `color:${color};font-size:20px`))
        }
    }
}

class Move
{
    constructor (piece, position, isAttack = false) {
        this.piece = piece
        this.position = position
        this.isAttack = isAttack
    }

    clone () {
        return new this.constructor(this.piece.clone(), new Position(this.position.v, this.position.h), this.isAttack)
    }

    isValid (board, turn) {
        return this.piece.getPotentialMoves(board, turn).hasMove(this)
    }

    static convertMoveNotation (game, str) {
        str = str.toLowerCase()
        let pieceType = Piece.getTypeByNotation(str.substring(0, 1))
        let h = clamp(Position.convertHorizontalNotation(str.substr(-2, 1)), 1, 8)
        let v = clamp(parseInt(str.substr(-1)), 1, 8)

        if (str.length === 2) {
            // Pawn move
            return Move.findPieceToMove(game, {
                piece: PAWN,
                type: null,
                v: v,
                h: h,
                initialV: null,
                initialH: null,
            })
        } else if (str.length === 3) {
            if (str === 'o-o') {
                return Move.findPieceToMove(game, {
                    piece: KING,
                    type: 'kingside-castle',
                    v: null,
                    h: null,
                    initialV: null,
                    initialH: null,
                })
            } else {
                return Move.findPieceToMove(game, {
                    piece: pieceType,
                    type: null,
                    v: v,
                    h: h,
                    initialV: null,
                    initialH: null,
                })
            }
        } else if (str.length === 4) {
            // Ndf8 -> d -> 4
            return Move.findPieceToMove(game, {
                piece: pieceType,
                type: null,
                v: v,
                h: h,
                initialV: null,
                initialH: clamp(Position.convertHorizontalNotation(str.substr(1, 1)), 1, 8),
            })
        } else if (str.length === 5) {
            if (str === 'o-o-o') {
                return Move.findPieceToMove(game, {
                    piece: KING,
                    type: 'queenside-castle',
                    v: null,
                    h: null,
                    initialV: null,
                    initialH: null,
                })
            } else {
                return Move.findPieceToMove(game, {
                    piece: pieceType,
                    type: null,
                    v: v,
                    h: h,
                    initialV: clamp(parseInt(str.substr(2, 1)), 1, 8),
                    initialH: clamp(Position.convertHorizontalNotation(str.substr(1, 1)), 1, 8),
                })
            }
        }

        throw new Error(`Invalid move ${str}`)
    }
    static findPieceToMove (game, move) {
        let pieces = game[game.turn].getPiecesOfType(move.piece)

        if (pieces.length === 0) {
            throw new Error(`Invalid Piece for move`, move)
        }

        if (move.piece === KING) {
            return new Move(game[game.turn].getKing(), new Position(move.v, move.h))
        }

        if (move.initialV !== null || move.initialH !== null) {
            let specificPieces = pieces.filter(piece => {
                if (move.initialH !== null && move.initialV !== null) {
                    return piece.position.h === move.initialH
                        && piece.position.v === move.initialV
                } else if (move.initialH !== null) {
                    return piece.position.h === move.initialH
                } else if (move.initialV !== null) {
                    return piece.position.v === move.initialV
                }
            })

            if (specificPieces.length === 1) {
                return new Move(pieces[0], new Position(move.v, move.h))
            } else if (specificPieces.length === 0) {
                throw new Error('Invalid move', move)
            }
        }

        pieces = pieces.filter(piece => {
            return piece.canPotentialMoveTo(move.v, move.h)
        })

        if (pieces.length === 1) {
            return new Move(pieces[0], new Position(move.v, move.h))
        } else if (pieces.length === 0) {
            throw new Error('Invalid move', move)
        } else {
            throw new Error('Invalid move, too vague', move)
        }
    }

    static getValidMove (game, from, to) {
        let move = Move.convertDefaultNotation(game, from, to)
        let moves = move.piece.getPotentialMoves(game.board)

        if (moves.hasMove(move)) {
            // use the provided move, it may be a special type
            return moves.getMovesToPosition(move.position)[0]
        }

        throw new Error(`Invalid move from ${from} to ${to}`)
    }

    static convertDefaultNotation (game, from, to) {
        let fromV = clamp(parseInt(from.substr(-1)), 1, 8)
        let fromH = clamp(Position.convertHorizontalNotation(from.substr(0, 1)), 1, 8)
        let toV = clamp(parseInt(to.substr(-1)), 1, 8)
        let toH = clamp(Position.convertHorizontalNotation(to.substr(0, 1)), 1, 8)

        let piece = game.board.at(fromV, fromH)
        let finalPosition = new Position(toV, toH)

        return new Move(piece, finalPosition)
    }
}

class SpecialMove extends Move
{
    execute (game) {
        throw new Error('Implement execute')
    }
}

class KingsideCastle extends SpecialMove
{
    execute (game) {
        game.board.movePiece(this)
        game.board.movePiece(
            new Move(
                game.board.at(this.piece.position.v, 8),
                new Position(this.piece.position.v, this.piece.position.h - 1)
            )
        )
    }
}

class QueensideCastle extends SpecialMove
{
    execute (game) {
        game.board.movePiece(this)
        game.board.movePiece(
            new Move(
                game.board.at(this.piece.position.v, 1),
                new Position(this.piece.position.v, this.piece.position.h + 1)
            )
        )
    }
}

class PawnAdvance extends SpecialMove
{
    execute (game) {
        game.board.setEnPassantPosition(
            new Position(this.piece.position.v + this.piece.getDirection(), this.piece.position.h),
            game.turnCount
        )
        game.board.movePiece(this)
    }
}

class EnPassant extends SpecialMove
{
    execute (game) {
        game.board.movePiece(this)
        let enemyPawnPos = new Position(this.position.v + (this.piece.getDirection() * -1), this.position.h)
        game.capturePiece(game.board.at(enemyPawnPos))
        game.board.removePiece(enemyPawnPos)
    }
}

class Promotion extends SpecialMove
{
    execute (game) {
        game.board.movePiece(this)
        game.board.addPieces([new Queen(this.position, this.piece.color)])
    }
}

class Piece
{
    constructor (position, color = null) {
        this.position = position
        this.type = this.getType()
        this.color = color
        this.hasMoved = false
    }

    clone () {
        let piece = new this.constructor(new Position(this.position.v, this.position.h), this.color)
        piece.hasMoved = this.hasMoved
        return piece
    }

    static getTypeByNotation (char) {
        switch (char.toLowerCase()) {
            case 'p':
                return PAWN
            case 'r':
                return ROOK
            case 'n':
                return KNIGHT
            case 'b':
                return BISHOP
            case 'k':
                return KING
            case 'q':
                return QUEEN
            default:
                return null
        }
    }

    getType () {
        throw new Error("Implement getType")
    }

    canPotentialMoveTo (v, h) {
        return true
    }

    moved () {
        this.hasMoved = true
    }

    setColor (color) {
        this.color = color
    }

    addMoveIfEnemyAt(board, moveSet, position) {
        if (!position.inBoard(board)) {
            return
        }

        let piece = board.at(position)
        if (piece && piece.color !== this.color) {
            moveSet.add(new Move(this, position, true))
        }
    }
    addMoveIfEnemyOrEmptyAt(board, moveSet, position) {
        if (!position.inBoard(board)) {
            return
        }

        let piece = board.at(position)
        if (piece === null || piece.color !== this.color) {
            moveSet.add(new Move(this, position, piece && piece.color !== this.color))
        }
    }
    addMovesUntilPiece (board, moveSet, maxCount, getPosition) {
        for (let i = 1; i <= maxCount; i++) {
            let position = getPosition(i)
            let piece = board.at(position)
            if (piece) {
                if (piece.color !== this.color) {
                    moveSet.add(new Move(this, position, true))
                }

                break
            } else {
                moveSet.add(new Move(this, position))
            }
        }
    }

    filterPins (moveSet, board) {
        moveSet.moves = moveSet.moves.filter(move => {
            board.simulateMove(chess, move, chess[move.piece.color])
        })
    }
}

const PAWN = 'Pawn'
const ROOK = 'Rook'
const KNIGHT = 'Knight'
const BISHOP = 'Bishop'
const KING = 'King'
const QUEEN = 'Queen'

class Pawn extends Piece
{
    constructor (position, color = null) {
        super(position, color)
        this.originalV = position.v
    }

    getType () {
        return PAWN
    }

    getCharacter () {
        return '\u2659'
    }

    canPotentialMoveTo (v, h) {
        return h === this.position.h
    }

    getDirection () {
        return this.originalV === 2 ? 1 : -1
    }

    getPotentialMoves (board) {
        let moveSet = new MoveSet

        let direction = this.getDirection()

        let attackLeft = new Position(this.position.v + direction, this.position.h - 1)
        let attackRight = new Position(this.position.v + direction, this.position.h + 1)
        this.addMoveIfEnemyAt(board, moveSet, attackLeft)
        this.addMoveIfEnemyAt(board, moveSet, attackRight)

        if (board.enPassantPosition !== null &&
            (board.enPassantPosition.equals(attackLeft) ||
            board.enPassantPosition.equals(attackRight))
        ) {
            moveSet.add(new EnPassant(this, board.enPassantPosition, true))
        }

        if (board.hasPieceAt(this.position.v + direction, this.position.h)) {
            return moveSet
        }

        if (this.position.v === this.originalV + (direction * 5)) {
            moveSet.add(new Promotion(this, new Position(this.position.v + direction, this.position.h)))
        } else {
            moveSet.add(new Move(this, new Position(this.position.v + direction, this.position.h)))
        }

        if (this.position.v === this.originalV && !board.hasPieceAt(this.position.v + (direction * 2), this.position.h)) {
            moveSet.add(new PawnAdvance(this, new Position(this.position.v + (direction * 2), this.position.h)))
        }

        return this.filterPins(moveSet, board)
    }
}

class Rook extends Piece
{
    getType () {
        return ROOK
    }

    getCharacter () {
        return '\u2656'
    }

    getPotentialMoves (board) {
        let moveSet = new MoveSet

        Rook.addRookMoves(this, board, moveSet)

        return moveSet
    }

    static addRookMoves (piece, board, moveSet) {
        piece.addMovesUntilPiece(board, moveSet, board.width - piece.position.h, i => new Position(piece.position.v, piece.position.h + i))
        piece.addMovesUntilPiece(board, moveSet, piece.position.h - 1, i => new Position(piece.position.v, piece.position.h - i))
        piece.addMovesUntilPiece(board, moveSet, board.height - piece.position.v, i => new Position(piece.position.v + i, piece.position.h))
        piece.addMovesUntilPiece(board, moveSet, piece.position.v - 1, i => new Position(piece.position.v - i, piece.position.h))
    }
}

class Knight extends Piece
{
    getType () {
        return KNIGHT
    }

    getCharacter () {
        return '\u2658'
    }

    getPotentialMoves (board) {
        let moveSet = new MoveSet

        let positions = [
            new Position(this.position.v - 1, this.position.h - 2),
            new Position(this.position.v - 2, this.position.h - 1),
            new Position(this.position.v - 2, this.position.h + 1),
            new Position(this.position.v - 1, this.position.h + 2),
            new Position(this.position.v + 1, this.position.h + 2),
            new Position(this.position.v + 2, this.position.h + 1),
            new Position(this.position.v + 1, this.position.h - 2),
            new Position(this.position.v + 2, this.position.h - 1),
        ]

        positions.forEach(pos => this.addMoveIfEnemyOrEmptyAt(board, moveSet, pos))

        return moveSet
    }
}

class Bishop extends Piece
{
    getType () {
        return BISHOP
    }

    getCharacter () {
        return '\u2657'
    }

    getPotentialMoves (board) {
        let moveSet = new MoveSet

        Bishop.addBishopMoves(this, board, moveSet)

        return moveSet
    }
    
    static addBishopMoves (piece, board, moveSet) {
        piece.addMovesUntilPiece(board, moveSet, Math.min(board.height - piece.position.v, board.width - piece.position.h), i => new Position(piece.position.v + i, piece.position.h + i))
        piece.addMovesUntilPiece(board, moveSet, Math.min(piece.position.v - 1, board.width - piece.position.h), i => new Position(piece.position.v - i, piece.position.h + i))
        piece.addMovesUntilPiece(board, moveSet, Math.min(board.height - piece.position.v, piece.position.h - 1), i => new Position(piece.position.v + i, piece.position.h - i))
        piece.addMovesUntilPiece(board, moveSet, Math.min(piece.position.v - 1, piece.position.h - 1), i => new Position(piece.position.v - i, piece.position.h - i))
    }
}

class King extends Piece
{
    getType () {
        return KING
    }

    getCharacter () {
        return '\u2654'
    }

    getPotentialMoves (board) {
        let moveSet = new MoveSet

        let positions = [
            new Position(this.position.v - 1, this.position.h - 1),
            new Position(this.position.v - 1, this.position.h),
            new Position(this.position.v - 1, this.position.h + 1),
            new Position(this.position.v, this.position.h + 1),
            new Position(this.position.v + 1, this.position.h + 1),
            new Position(this.position.v + 1, this.position.h - 1),
            new Position(this.position.v, this.position.h - 1),
        ]

        positions.forEach(pos => this.addMoveIfEnemyOrEmptyAt(board, moveSet, pos))

        if (this.canKingsideCastle(board)) {
            moveSet.add(new KingsideCastle(this, new Position(this.position.v, this.position.h + 2)))
        }

        if (this.canQueensideCastle(board)) {
            moveSet.add(new QueensideCastle(this, new Position(this.position.v, this.position.h - 3)))
        }

        return moveSet
    }

    canKingsideCastle (board) {
        let positions = [
            new Position(this.position.v, this.position.h + 1),
            new Position(this.position.v, this.position.h + 2),
        ]

        return this.canCastle(board, 8, positions)
    }

    canQueensideCastle (board) {
        let positions = [
            new Position(this.position.v, this.position.h - 1),
            new Position(this.position.v, this.position.h - 2),
            new Position(this.position.v, this.position.h - 3),
        ]

        return this.canCastle(board, 1, positions)
    }

    canCastle (board, hRookPosition, positions) {
        let rook = board.at(this.position.v, hRookPosition)
        if (rook === null || rook.hasMoved || this.hasMoved) {
            return false
        }

        if (positions.reduce((hasPiecesBetween, pos) => hasPiecesBetween || (hasPiecesBetween = board.hasPieceAt(pos)), false)) {
            return false
        }

        // Add current king position for attack checks
        positions.push(this.position)

        if (positions.reduce((hasAttacksAgainst, pos) => hasAttacksAgainst || (hasAttacksAgainst = board.canAttack(this.color, pos)), false)) {
            return false
        }

        return true
    }
}

class Queen extends Piece
{
    getType () {
        return QUEEN
    }

    getCharacter () {
        return '\u2655'
    }

    getPotentialMoves (board) {
        let moveSet = new MoveSet

        Rook.addRookMoves(this, board, moveSet)
        Bishop.addBishopMoves(this, board, moveSet)

        return moveSet
    }
}
