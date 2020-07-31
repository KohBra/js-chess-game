import Piece from '../Piece.js'
import { KING } from '../const.js'
import MoveSet from '../MoveSet.js'
import Move from '../Move.js'
import Position from '../Position.js'
import QueensideCastle from '../Move/QueensideCastle.js'
import KingsideCastle from '../Move/KingsideCastle.js'
import { oppositeColor } from '../helpers.js'

export default class King extends Piece
{
    type = KING

    getValue () {
        return 4
    }

    getMovePositions () {
        return [
            new Position(this.position.rank - 1, this.position.file),
            new Position(this.position.rank - 1, this.position.file - 1),
            new Position(this.position.rank - 1, this.position.file + 1),
            new Position(this.position.rank + 1, this.position.file),
            new Position(this.position.rank + 1, this.position.file - 1),
            new Position(this.position.rank + 1, this.position.file + 1),
            new Position(this.position.rank, this.position.file + 1),
            new Position(this.position.rank, this.position.file - 1),
        ]
    }

    getPinningMoves (board) {
        let moves = new MoveSet

        this.getMovePositions().forEach(position => {
            if (!board.isValidPosition(position)) {
                return
            }

            if (board.hasPieceAt(position, oppositeColor(this.color))) {
                return
            }

            moves.add(new Move(this, position))
        })

        return moves
    }

    getPotentialMoves (board) {
        let moves = new MoveSet

        this.getMovePositions().forEach(position => {
            if (!board.isValidPosition(position)) {
                return
            }

            if (board.hasPieceAt(position, this.color)) {
                return
            }

            moves.add(new Move(this, position))
        })

        if (this.canKingsideCastle(board)) {
            moves.add(new KingsideCastle(this, new Position(this.position.rank, this.position.file + 2)))
        }

        if (this.canQueensideCastle(board)) {
            moves.add(new QueensideCastle(this, new Position(this.position.rank, this.position.file - 2)))
        }

        return moves
    }

    canKingsideCastle (board) {
        let positions = [
            new Position(this.position.rank, this.position.file + 1),
            new Position(this.position.rank, this.position.file + 2),
        ]

        return this.canCastle(board, 8, positions)
    }

    canQueensideCastle (board) {
        let positions = [
            new Position(this.position.rank, this.position.file - 1),
            new Position(this.position.rank, this.position.file - 2),
        ]

        return this.canCastle(board, 1, positions)
    }

    canCastle (board, rookFile, positions) {
        let rook = board.at(this.position.rank, rookFile)
        // Can't castle if either piece has moved before.
        if (rook === null || rook.hasMoved() || this.hasMoved()) {
            return false
        }

        // Can't castle if there are pieces between the king and rook
        if (positions.reduce(
            (hasPieceBetween, position) => hasPieceBetween || (hasPieceBetween = board.hasPieceAt(position)), false)
        ) {
            return false
        }

        positions.push(this.position)

        return !positions.reduce((hasAttacksAgainst, position) =>
            hasAttacksAgainst || (hasAttacksAgainst = board.currentMoves[oppositeColor(this.color)].hasMoveToPosition(position)),
        false);
    }
}