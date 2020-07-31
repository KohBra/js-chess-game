import Piece from '../Piece.js'
import { PAWN } from '../const.js'
import MoveSet from '../MoveSet.js'
import Position from '../Position.js'
import Move from '../Move.js'
import { oppositeColor } from '../helpers.js'
import Promotion from '../Move/Promotion.js'
import Advance from '../Move/Advance.js'
import EnPassant from '../Move/EnPassant.js'

export default class Pawn extends Piece
{
    type = PAWN
    originalRank = null

    getValue () {
        return 1
    }

    constructor (position, color = null) {
        super(position, color)
        this.originalRank = position.rank
    }

    getDirection () {
        return this.originalRank === 2 ? 1 : -1
    }

    getPinningMoves (board) {
        let direction = this.getDirection()
        let moves = new MoveSet

        let attackLeft = new Position(this.position.rank + direction, this.position.file - 1)
        let attackRight = new Position(this.position.rank + direction, this.position.file + 1)

        if (board.hasPieceAt(attackLeft, this.color)) {
            moves.add(new Move(this, attackLeft))
        }

        if (board.hasPieceAt(attackRight, this.color)) {
            moves.add(new Move(this, attackRight))
        }

        return moves
    }

    getPotentialMoves (board) {
        let direction = this.getDirection()
        let moves = new MoveSet

        let attackLeft = new Position(this.position.rank + direction, this.position.file - 1)
        let attackRight = new Position(this.position.rank + direction, this.position.file + 1)

        if (board.hasPieceAt(attackLeft, oppositeColor(this.color))) {
            moves.add(new Move(this, attackLeft))
        }

        if (board.hasPieceAt(attackRight, oppositeColor(this.color))) {
            moves.add(new Move(this, attackRight))
        }

        if (board.hasEnPassantAt(attackRight)) {
            moves.add(new EnPassant(this, attackRight, new Position(this.position.rank, attackRight.file)))
        } else if (board.hasEnPassantAt(attackLeft)) {
            moves.add(new EnPassant(this, attackLeft, new Position(this.position.rank, attackLeft.file)))
        }

        let nextPosition = new Position(this.position.rank + direction, this.position.file)
        if (!board.hasPieceAt(nextPosition)) {
            moves.add(new Move(this, nextPosition))

            let pawnAdvancePosition = new Position(this.position.rank + (direction * 2), this.position.file)
            if (this.position.rank === this.originalRank && !board.hasPieceAt(pawnAdvancePosition)) {
                moves.add(new Advance(this, pawnAdvancePosition, nextPosition))
            }
        }

        // make sure promotions are accounted for.
        moves.map(move => {
            if (move.to.rank === this.originalRank + (direction * 6)) {
                return new Promotion(this, move.to)
            } else {
                return move
            }
        })

        return moves
    }
}