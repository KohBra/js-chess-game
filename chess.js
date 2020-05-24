
const W = 'white';
const B = 'red';

const clamp = function (num, min, max) {
    return Math.min(Math.max(min, num), max)
}

class Game
{
    constructor () {
        this[B] = this.newPlayer(B)
        this[W] = this.newPlayer(W)
        this.players = [
            this[B],
            this[W],
        ]
        this.board = new Board
        this.turn = null
    }
    static start () {
        let game = new Game
        game.setStartingPieces()
        game.nextTurn()
        return game
    }

    nextTurn () {
        switch (this.turn) {
            case W:
                this.turn = B
                break;
            case B:
            case null:
                this.turn = W
                break;
        }
        // Swap turn, and calculate all their moves
        this.board.calculateMoves(this.turn)
        this.board.show()
        let player = this[this.turn]
        console.log(`${this.turn}'s move${player.inCheck ? ', checked' : ''}`)
    }

    // Make a move by notation: "Qd4"
    moveN (notation) {
        this.move(Move.convertMoveNotation(this, notation))
    }
    // Move piece at x to y
    moveD (from, to) {
        this.move(Move.convertDefaultNotation(this, from, to))
    }
    // Force move piece at x to y, even if invalid
    moveF (from, to) {
        this.doMove(Move.convertDefaultNotation(this, from, to));
        this.nextTurn()
    }
    // Execute a given move on the game board
    move (move) {
        if (this.isValidMove(move)) {
            this.doMove(move)
            this.nextTurn()
        } else {
            throw new Error('Invalid move');
        }
    }
    doMove (move) {
        if (this.board.hasPieceAt(move.position)) {
            this.capturePiece(this.board.at(move.position))
        }
        this.board.movePiece(move)
        // this.calculateAttacks()
    }
    capturePiece (piece) {
        this[this.turn].capturedPieces.push(piece)
        this[this.turn === W ? B : W].removePiece(piece)
        // piece.position = new Position(piece.position.v, piece.position.h)
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

    calculateAttacks () {
        this[W].calculateAttacks(this.board)
        this[B].calculateAttacks(this.board)
        this.calculateChecks()
    }
    calculateChecks () {
        this[W].calculateChecks(this[B].attacks)
        this[B].calculateChecks(this[W].attacks)
    }

    newPlayer (color) {
        return new Player(color)
    }

    setStartingPieces () {
        this[B].setPieces(this.startingPieces(8, 7, B))
        this[W].setPieces(this.startingPieces(1, 2, W))
        this.board.addPieces(this[B].pieces);
        this.board.addPieces(this[W].pieces);
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
            this.pieces[piece.color].push(piece);
            this.board[piece.position.v][piece.position.h] = piece;
        })
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

    calculateMoves (color) {
        this.moves[color] = new MoveSet()
        this.pieces[color].forEach(piece => {
            this.moves[color].combine(piece.getPotentialMoves(this))
        })
    }
    hasAttack (color, position) {
        return this.moves[color].attacks.filter(move => {
            move.position.equals(position)
        }).length > 0
    }

    show () {
        for (let i = 1; i <= this.height; i++) {
            let row = `${i}  `;
            let colors = []
            for (let j = 1; j <= this.width; j++) {
                let piece = this.at(i, j)
                row += `%c${piece ? piece.getCharacter() : '-'}  `
                colors.push(piece ? piece.color : 'grey')
            }

            console.log(row, ...colors.map(color => `color:${color}`));
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
        this.attacks = null
        this.inCheck = false
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

    calculateAttacks (board) {
        let attacks = new MoveSet
        this.pieces.forEach(piece => {
            let moves = piece.getPotentialMoves(board)
            attacks.combine(moves.getAttackingMoves(board))
        })

        this.attacks = attacks
    }

    calculateChecks (enemyAttacks) {
        this.inCheck = enemyAttacks.hasMove(this.getKing().position)
    }
}

class MoveSet
{
    constructor () {
        this.moves = []
        this.attacks = []
    }
    add (move) {
        if (!move instanceof Move) {
            return
        }

        if (move.isAttack) {
            this.attacks.push(move)
        }

        this.moves.push(move)
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
        return this.attacks
    }

    combine (moveSet) {
        this.moves = this.moves.concat(moveSet.moves)
        this.attacks = this.attacks.concat(moveSet.attacks)
    }
}

class Move
{
    constructor (piece, position, isAttack = false) {
        this.piece = piece
        this.position = position
        this.isAttack = isAttack
    }

    isValid (board, turn) {
        return this.piece.getPotentialMoves(board, turn).hasMove(this)
    }

    static convertMoveNotation (game, str) {
        str = str.toLowerCase();
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
                throw new Error('Invalid move', move);
            }
        }

        pieces = pieces.filter(piece => {
            return piece.canPotentialMoveTo(move.v, move.h)
        })

        if (pieces.length === 1) {
            return new Move(pieces[0], new Position(move.v, move.h))
        } else if (pieces.length === 0) {
            throw new Error('Invalid move', move);
        } else {
            throw new Error('Invalid move, too vague', move)
        }
    }

    static convertDefaultNotation (game, from, to) {
        let fromV = clamp(parseInt(from.substr(-1)), 1, 8)
        let fromH = clamp(Position.convertHorizontalNotation(from.substr(0, 1)), 1, 8)
        let toV = clamp(parseInt(to.substr(-1)), 1, 8)
        let toH = clamp(Position.convertHorizontalNotation(to.substr(0, 1)), 1, 8)

        let piece = game.board.at(fromV, fromH);

        if (piece !== undefined) {
            return new Move(piece, new Position(toV, toH))
        }

        throw new Error(`Invalid move from ${from} to ${to}`)
    }
}

class Piece
{
    constructor (position) {
        this.position = position
        this.type = this.getType()
        this.color = null
        this.hasMoved = false
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

                break;
            } else {
                moveSet.add(new Move(this, position))
            }
        }
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
    constructor (position) {
        super(position)
        this.originalV = position.v
    }

    getType () {
        return PAWN
    }

    getCharacter () {
        return 'P'
    }

    canPotentialMoveTo (v, h) {
        return h === this.position.h
    }

    getPotentialMoves (board) {
        let moveSet = new MoveSet

        let direction = this.originalV === 2 ? 1 : -1;

        this.addMoveIfEnemyAt(board, moveSet, new Position(this.position.v + direction, this.position.h - 1))
        this.addMoveIfEnemyAt(board, moveSet, new Position(this.position.v + direction, this.position.h + 1))

        if (board.hasPieceAt(this.position.v + direction, this.position.h)) {
            return moveSet
        }

        moveSet.add(new Move(this, new Position(this.position.v + direction, this.position.h)))

        if (this.position.v === this.originalV && !board.hasPieceAt(this.position.v + (direction * 2), this.position.h)) {
            moveSet.add(new Move(this, new Position(this.position.v + (direction * 2), this.position.h)))
        }

        return moveSet
    }
}

class Rook extends Piece
{
    getType () {
        return ROOK
    }

    getCharacter () {
        return 'R'
    }

    getPotentialMoves (board) {
        let moveSet = new MoveSet

        this.addMovesUntilPiece(board, moveSet, board.width - this.position.h, i => new Position(this.position.v, this.position.h + i))
        this.addMovesUntilPiece(board, moveSet, this.position.h - 1, i => new Position(this.position.v, this.position.h - i))
        this.addMovesUntilPiece(board, moveSet, board.height - this.position.v, i => new Position(this.position.v + i, this.position.h))
        this.addMovesUntilPiece(board, moveSet, this.position.v - 1, i => new Position(this.position.v - i, this.position.h))

        return moveSet
    }
}

class Knight extends Piece
{
    getType () {
        return KNIGHT
    }

    getCharacter () {
        return 'N'
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
        return 'B'
    }

    getPotentialMoves (board) {
        let moveSet = new MoveSet

        this.addMovesUntilPiece(board, moveSet, Math.min(board.height - this.position.v, board.width - this.position.h), i => new Position(this.position.v + i, this.position.h + i))
        this.addMovesUntilPiece(board, moveSet, Math.min(this.position.v - 1, board.width - this.position.h), i => new Position(this.position.v - i, this.position.h + i))
        this.addMovesUntilPiece(board, moveSet, Math.min(board.height - this.position.v, this.position.h - 1), i => new Position(this.position.v + i, this.position.h - i))
        this.addMovesUntilPiece(board, moveSet, Math.min(this.position.v - 1, this.position.h - 1), i => new Position(this.position.v - i, this.position.h - i))
        // for (let i = 1; i <= Math.min(board.height - this.position.v, board.width - this.position.h); i++) {
        //     let piece = board.at(this.position.v + i, this.position.h + i).piece
        //     if (piece) {
        //         if (piece.color !== this.color) {
        //             moveSet.add(this.position.v + i, this.position.h + i)
        //         }
        //
        //         break;
        //     } else {
        //         moveSet.add(this.position.v + i, this.position.h + i)
        //     }
        // }

        // for (let i = 1; i < Math.min(this.position.v, board.width - this.position.h); i++) {
        //     let piece = board.at(this.position.v - i, this.position.h + i).piece
        //     if (piece) {
        //         if (piece.color !== this.color) {
        //             moveSet.add(this.position.v - i, this.position.h + i)
        //         }
        //
        //         break;
        //     } else {
        //         moveSet.add(this.position.v - i, this.position.h + i)
        //     }
        // }

        // for (let i = 1; i <= Math.min(board.height - this.position.v, this.position.h); i++) {
        //     let piece = board.at(this.position.v + i, this.position.h - i).piece
        //     if (piece) {
        //         if (piece.color !== this.color) {
        //             moveSet.add(this.position.v + i, this.position.h - i)
        //         }
        //
        //         break;
        //     } else {
        //         moveSet.add(this.position.v + i, this.position.h - i)
        //     }
        // }

        // for (let i = 1; i < Math.min(this.position.v, this.position.h); i++) {
        //     let piece = board.at(this.position.v - i, this.position.h - i).piece
        //     if (piece) {
        //         if (piece.color !== this.color) {
        //             moveSet.add(this.position.v - i, this.position.h - i)
        //         }
        //
        //         break;
        //     } else {
        //         moveSet.add(this.position.v - i, this.position.h - i)
        //     }
        // }

        return moveSet
    }
}

class King extends Piece
{
    getType () {
        return KING
    }

    getCharacter () {
        return 'K'
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

        if (this.canKingCastle(board)) {
            moveSet.add(new Move(this, new Position(this.position.v, this.position.h + 2)))
        }

        // if (this.canQueenCastle(board)) {
        //     moveSet.add(new Move(this, new Position(this.position.v, this.position.h - 3)))
        // }

        return moveSet
    }

    canKingCastle (board) {
        // check king hasn't moved.
        // check rook hasn't moved.
        // check no pieces
        // check not in check and won't move through check
        let rook = board.at(this.position.v, 8)
        if (this.hasMoved || rook.hasMoved) {
            return false
        }

        let positions = [
            new Position(this.position.v, this.position.h + 1),
            new Position(this.position.v, this.position.h + 2),
        ]

        if (positions.reduce((hasPiecesBetween, pos) => hasPiecesBetween = board.hasPieceAt(pos), false)) {
            return false
        }

        // Add current position for attack checks
        positions.push(this.position)

        if (positions.reduce((hasAttacksAgainst, pos) => hasAttacksAgainst = board.hasAttack(this.color, pos), false)) {
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
        return 'Q'
    }

    getPotentialMoves (board) {
        let moveSet = new MoveSet

        // Rook
        this.addMovesUntilPiece(board, moveSet, board.width - this.position.h, i => new Position(this.position.v, this.position.h + i))
        this.addMovesUntilPiece(board, moveSet, this.position.h - 1, i => new Position(this.position.v, this.position.h - i))
        this.addMovesUntilPiece(board, moveSet, board.height - this.position.v, i => new Position(this.position.v + i, this.position.h))
        this.addMovesUntilPiece(board, moveSet, this.position.v - 1, i => new Position(this.position.v - i, this.position.h))
        // Bishop
        this.addMovesUntilPiece(board, moveSet, Math.min(board.height - this.position.v, board.width - this.position.h), i => new Position(this.position.v + i, this.position.h + i))
        this.addMovesUntilPiece(board, moveSet, Math.min(this.position.v - 1, board.width - this.position.h), i => new Position(this.position.v - i, this.position.h + i))
        this.addMovesUntilPiece(board, moveSet, Math.min(board.height - this.position.v, this.position.h - 1), i => new Position(this.position.v + i, this.position.h - i))
        this.addMovesUntilPiece(board, moveSet, Math.min(this.position.v - 1, this.position.h - 1), i => new Position(this.position.v - i, this.position.h - i))

        return moveSet
    }
}
