import { boardSize } from './const.js'
import Position from './Position.js'

export default class BitBoard
{
    board = []

    constructor () {
        for (let rank = 1; rank <= boardSize; rank++) {
            for (let file = 1; file <= boardSize; file++) {
                if (!Array.isArray(this.board[rank])) {
                    this.board[rank] = []
                }

                this.board[rank][file] = 0
            }
        }
    }

    set (rank, file) {
        if (rank instanceof Position) {
            file = rank.file
            rank = rank.rank
        }

        if (rank < 1 || rank > boardSize || file < 1 || file > boardSize) {
            return
        }

        return this.board[rank][file] = 1
    }

    unset (rank, file) {
        if (rank instanceof Position) {
            file = rank.file
            rank = rank.rank
        }

        if (rank < 1 || rank > boardSize || file < 1 || file > boardSize) {
            return
        }

        return this.board[rank][file] = 0
    }

    setRank (rank) {
        for (let file = 1; file <= boardSize; file++) {
            this.set(rank, file)
        }
    }

    setFile (file) {
        for (let rank = 1; rank <= boardSize; rank++) {
            this.set(rank, file)
        }
    }

    setCardinals (position) {
        this.setRank(position.rank)
        this.setFile(position.file)
        this.unset(position)
    }

    setDiagonals (position) {
        for (let i = 1; i < boardSize; i++) {
            this.set(position.rank + i, position.file + i)
            this.set(position.rank + i, position.file - i)
            this.set(position.rank - i, position.file + i)
            this.set(position.rank - i, position.file - i)
        }
    }

    get (rank, file) {
        if (rank instanceof Position) {
            file = rank.file
            rank = rank.rank
        }

        if (rank < 1 || rank > boardSize || file < 1 || file > boardSize) {
            throw new Error(`Invalid Position: (${rank},${file})`)
        }

        return this.board[rank][file]
    }
}