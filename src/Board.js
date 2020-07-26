import { boardSize, KING, KNIGHT, PAWN } from './const.js'
import Position from './Position.js'
import { oppositeColor } from './helpers.js'
import MoveSet from './MoveSet.js'

export class Board
{
    board = []
    pieces = []
    enPassant = null

    constructor () {
        for (let rank = 1; rank <= boardSize; rank++) {
            for (let file = 1; file <= boardSize; file++) {
                if (!Array.isArray(this.board[rank])) {
                    this.board[rank] = []
                }

                this.board[rank][file] = null
            }
        }
    }

    addPieces (pieces) {
        if (!Array.isArray(pieces)) {
            pieces = [pieces]
        }

        pieces.forEach(piece => {
            this.board[piece.getPosition().rank][piece.getPosition().file] = piece
            this.pieces.push(piece)
        })
    }

    removePiece (piece) {
        let index = this.pieces.indexOf(piece)

        if (index < 0) {
            return
        }

        this.board[piece.position.rank][piece.position.file] = null
        this.pieces.splice(index, 1)
    }

    at (rank, file) {
        if (rank instanceof Position) {
            file = rank.file
            rank = rank.rank
        }

        return this.board[rank][file]
    }

    hasPieceAt (position, color = null) {
        let piece = this.at(position)
        if (piece && color) {
            return piece.color === color
        } else {
            return !!piece
        }
    }

    playersPieces (color) {
        return this.pieces.filter(piece => piece.color === color)
    }

    isValidPosition (position) {
        return position.rank > 0 && position.rank <= boardSize && position.file > 0 && position.file <= boardSize
    }

    calculateMoves (player) {
        let enemies = this.playersPieces(oppositeColor(player.color))
        let enemyPins = new MoveSet
        let enemyMoves = new MoveSet
        enemies.forEach(piece => {
            let pinningMoves = piece.getPinningMoves(this)
            let potentialMoves = piece.getPotentialMoves(this)
            enemyPins.combine(pinningMoves)
            enemyMoves.combine(potentialMoves)
        })

        let validMoves = new MoveSet
        let checkMoves = enemyMoves.getMovesToPosition(player.king.position)
        if (checkMoves.length > 0) {
            console.log(`${player.color} in check`)
            validMoves = player.king.getPotentialMoves(this)
            // King can't move into checks (can't move to empty space that's attacked, or take an enemy piece that's protected
            validMoves.filter(move => !enemyMoves.hasMoveToPosition(move.to) && !enemyPins.hasMoveToPosition(move.to))
            if (checkMoves.length === 1) {
                let attackingPiece = checkMoves[0].piece
                // either the king can move, or another piece can take the attacker...
                let validMovePositions = [attackingPiece.position]
                if (attackingPiece.type !== KNIGHT && attackingPiece.type !== PAWN) {
                    // ...or a teammate can block the attack if attacked by rook/bishop/queen
                    let vector = enemyMoves.getVectorForMove(checkMoves[0])
                    validMovePositions.push(...vector.moves
                        .map(move => move.to)
                        .filter(position => !position.equals(player.king.position))
                    )
                }

                this.playersPieces(player.color).forEach(piece => {
                    if (piece.type === KING) {
                        return
                    }

                    let validPositions = [...validMovePositions]
                    if (enemyPins.hasMoveToPosition(piece.position)) {
                        // A pinned piece can't save a check
                        validPositions = []
                    }

                    let moveSet = piece.getPotentialMoves(this)
                    moveSet.moves.forEach(move => {
                        if (validPositions.findIndex(position => position.equals(move.to)) < 0) {
                            return
                        }

                        validMoves.add(move)
                    })
                })
            }

            if (validMoves.length === 0) {
                // check mate
                throw new Error(`${player.color} check mated. gg`)
            }

            return validMoves
        }

        this.playersPieces(player.color).forEach(piece => {
            let validPositions = []
            let pinMove = enemyPins.getMovesToPosition(piece.position)
            if (piece.type !== KING && pinMove.length > 0) {
                // We only want the vector positions that aren't attacks against our own pieces
                let pinVector = enemyPins.getVectorForMove(pinMove[0])
                validPositions = [pinMove[0].piece.position]
                validPositions.push(...pinVector.moves
                    .map(move => move.to)
                    .filter(position => this.at(position)?.color !== piece.color && !piece.position.equals(position))
                )
            }

            validMoves.combine(
                piece.getPotentialMoves(this).filter(
                    move => validPositions.length === 0 || validPositions.findIndex(position => position.equals(move.to)) >= 0
                )
            )
        })

        // validMoves.show()
        return validMoves
    }

    executeMove (move) {
        // Clear previous position
        this.board[move.piece.position.rank][move.piece.position.file] = null
        // Set new positions
        move.piece.position = move.to
        this.board[move.to.rank][move.to.file] = move.piece
        // Set moved flag
        move.piece.setMoved()
    }

    setEnPassantPosition (position) {
        this.enPassant = position
    }

    hasEnPassantAt (position) {
        return this.enPassant !== null && this.enPassant.equals(position)
    }

    clearEnPassant () {
        this.enPassant = null
    }

    show () {
        console.log('%c   A    B    C    D    E    F    G    H', 'font-size:12px')
        for (let rank = 1; rank < this.board.length; rank++) {
            let row = `${rank}  `
            let colors = []
            for (let file = 1; file < this.board[rank].length; file++) {
                let piece = this.at(rank, file)
                row += `%c${piece ? piece.getCharacter() : '- '} `
                colors.push(piece ? piece.getColor() : 'grey')
            }

            console.log(row, ...colors.map(color => `color:${color};font-size:20px`))
        }
    }
}