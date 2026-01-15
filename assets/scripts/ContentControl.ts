import { _decorator, Component, Node, Prefab, instantiate } from 'cc'
const { ccclass, property } = _decorator

@ccclass('ContentControl')
export class ContentControl extends Component {
  @property({ type: [Prefab], tooltip: '棋子预设' })
  public chessPieces: Prefab[] = []

  @property({ type: Number, tooltip: '棋盘宽度' })
  public boardWidth: number = 6

  @property({ type: Number, tooltip: '棋盘高度' })
  public boardHeight: number = 6

  @property({ type: Number, tooltip: '棋子间距' })
  public spacing: number = 96

  @property({ type: Number, tooltip: '棋子初始X坐标' })
  public x: number = -240

  @property({ type: Number, tooltip: '棋子初始Y坐标' })
  public y: number = 240

  @property({ tooltip: '棋盘节点' })
  public chessBoard: Node[][] = []

  start() {
    this.generateBoard();
  }

  update(deltaTime: number) {}

  generateBoard() {
    this.chessBoard = Array.from({ length: this.boardHeight }, () =>
      Array.from({ length: this.boardWidth }, () => null)
    )

    for (let i = 0; i < this.boardHeight; i++) {
      for (let j = 0; j < this.boardWidth; j++) {
        // this.chessBoard[i][j] = this.generatePiece(i, j);
      }
    }
  }

  generatePiece(i: number, j: number) {
    const piece = this.getRandomChessPiece();
    const [x, y] = this.getPiecePosition(i, j);
    piece.setPosition(x, y);
    this.node.addChild(piece);
    return piece;
  }

  getPiecePosition(i: number, j: number): number[] {
    return [this.x + j * this.spacing, this.y - i * this.spacing];
  }

  getRandomChessPiece() {
    const randomIndex = Math.floor(Math.random() * this.chessPieces.length);
    const randomChessPiece = this.chessPieces[randomIndex];
    const piece = instantiate(randomChessPiece);
    return piece;
  }
}
