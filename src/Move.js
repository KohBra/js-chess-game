export default class Move
{
    constructor (piece, to) {
        this.piece = piece
        this.to = to
        this.from = piece.position.copy()
    }

    toHistory () {
        return [
            this.from.rank,
            this.from.file,
            this.to.rank,
            this.to.file,
            this.piece.type
        ]
    }
}