const WIN_CASES = [
  [0, 1, 2],
  [0, 3, 6],
  [0, 4, 8],
  [1, 4, 7],
  [2, 4, 6],
  [2, 5, 8],
  [3, 4, 5],
  [6, 7, 8],
];

export interface Bot {
  predict(chess: Chess): number;
}
export type PlayType = 'basic' | 'three_piece';
export type Player = 'x' | 'o';

export class Chess {
  private playType: PlayType;
  private playerXPieces: number[] = [];
  private playerOPieces: number[] = [];
  private nextPlayer: Player = 'x';
  private winPlayer: Player | undefined;
  private winPieces: number[] = [];

  constructor(playType: PlayType) {
    this.playType = playType;
  }

  /** 获取棋盘 */
  getBoard(): { x: number[]; o: number[] } {
    return { x: this.playerXPieces, o: this.playerOPieces };
  }

  /** 获取下一步玩家 */
  getNextPlayer(): Player {
    return this.nextPlayer;
  }

  /** 获取胜利棋子 */
  getWinPieces(): number[] {
    return this.winPieces;
  }

  /** 获取胜者, '-' 表示平局 */
  getWinner(): Player | '-' | undefined {
    if (this.winPlayer) {
      return this.winPlayer;
    }
    for (const winCase of WIN_CASES) {
      if (winCase.every(v => this.playerXPieces.includes(v))) {
        this.winPlayer = 'x';
        this.winPieces = winCase;
      } else if (winCase.every(v => this.playerOPieces.includes(v))) {
        this.winPlayer = 'o';
        this.winPieces = winCase;
      }
    }
    if (this.winPlayer) {
      return this.winPlayer;
    }
    return this.playerXPieces.length + this.playerOPieces.length === 9 ? '-' : undefined;
  }

  /** 重置游戏 */
  reset() {
    this.playerXPieces = [];
    this.playerOPieces = [];
    this.nextPlayer = 'x';
    this.winPlayer = undefined;
    this.winPieces = [];
  }

  /** 设置棋子位置 */
  set(player: Player, index: number): boolean {
    if (index < 0 || index > 8) {
      throw new Error('invalid index: ' + index);
    } else if (player !== 'x' && player !== 'o') {
      throw new Error('invalid player: ' + String(player));
    }
    if (this.playerXPieces.includes(index) || this.playerOPieces.includes(index)) {
      throw new Error(`index ${index} already has piece`);
    }
    if (this.nextPlayer !== player) {
      return false;
    }

    this.trySet(player, index);
    return true;
  }

  /** 设置游戏类型 */
  setPlayType(playType: PlayType) {
    this.playType = playType;
  }

  /** 尝试设置棋子位置, 该方法不会校验合法性, 用于预测, 返回的函数可以取消该动作 */
  trySet(player: Player, index: number): () => void {
    const pieces = player === 'x' ? this.playerXPieces : this.playerOPieces;
    const oldPieces = pieces.slice();
    switch (this.playType) {
      case 'basic':
        pieces.push(index);
        break;
      case 'three_piece':
        if (pieces.length >= 3) {
          pieces.shift();
        }
        pieces.push(index);
        break;
      default:
    }
    const oldNextPlayer = this.nextPlayer;
    this.nextPlayer = player === 'x' ? 'o' : 'x';

    // 返回 unset 函数
    return () => {
      if (player === 'x') {
        this.playerXPieces = oldPieces;
      } else {
        this.playerOPieces = oldPieces;
      }
      this.nextPlayer = oldNextPlayer;
      // 需要清除获胜信息
      this.winPlayer = undefined;
      this.winPieces = [];
    };
  }
}

/** 简单电脑 */
export class EasyBot implements Bot {
  /** 预测下棋位置 */
  predict(chess: Chess): number {
    const self = chess.getNextPlayer();
    const enemy = self === 'x' ? 'o' : 'x';
    const board = chess.getBoard();
    const emptyIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter(v => !board.x.includes(v) && !board.o.includes(v));

    // 如果存在位置使得获胜, 则选择该位置
    for (const index of emptyIndices) {
      const unset = chess.trySet(self, index);
      if (chess.getWinner() === self) {
        unset();
        return index;
      }
      unset();
    }
    // 如果存在位置使得对方获胜, 则选择该位置
    for (const index of emptyIndices) {
      const unset = chess.trySet(enemy, index);
      if (chess.getWinner() === enemy) {
        unset();
        return index;
      }
      unset();
    }
    // 随机下棋
    return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
  }
}

export class HardBot implements Bot {
  /** 预测下棋位置 */
  predict(chess: Chess): number {
    const self = chess.getNextPlayer();
    const enemy = self === 'x' ? 'o' : 'x';
    const board = chess.getBoard();
    const emptyIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter(v => !board.x.includes(v) && !board.o.includes(v));

    // 使用 alpha-beta 剪枝算法计算分数最优的下棋位置
    let alpha = -100;
    let alphaIndex = -1;
    for (const index of emptyIndices) {
      const unset = chess.trySet(self, index);
      const score = this.alphaBetaPruning(self, chess, 10, alpha, 100);
      if (score <= -1) {
        // 必输的情况优先避免对方胜利
        const nextBoard = chess.getBoard();
        const nextEmptyIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter(
          v => !nextBoard.x.includes(v) && !nextBoard.o.includes(v),
        );
        const fail = nextEmptyIndices.some(nextIndex => {
          const nextUnset = chess.trySet(chess.getNextPlayer(), nextIndex);
          if (chess.getWinner() === enemy) {
            nextUnset();
            return true;
          }
          nextUnset();
          return false;
        });
        if (fail) {
          unset();
          continue;
        }
      }
      unset();
      if (alpha < score) {
        alpha = score;
        alphaIndex = index;
      }
    }
    return alphaIndex;
  }

  private alphaBetaPruning(self: Player, chess: Chess, depth: number, alpha: number, beta: number): number {
    const score = this.evaluate(self, chess, depth);
    if (score !== undefined) {
      return score;
    }

    // 模拟下一步, 计算最优位置
    const board = chess.getBoard();
    const emptyIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter(v => !board.x.includes(v) && !board.o.includes(v));
    for (const index of emptyIndices) {
      const unset = chess.trySet(chess.getNextPlayer(), index);
      const score = this.alphaBetaPruning(self, chess, depth - 1, alpha, beta);
      unset();
      if (chess.getNextPlayer() === self) {
        // 极大值层
        alpha = Math.max(alpha, score);
      } else {
        // 极小值层
        beta = Math.min(beta, score);
      }
      // alpha-beta 剪枝
      if (alpha >= beta) {
        break;
      }
    }
    return chess.getNextPlayer() === self ? alpha : beta;
  }

  /** 预估分数, 如果游戏未结束返回 undefined */
  private evaluate(self: Player, chess: Chess, depth: number): number | undefined {
    const winner = chess.getWinner();
    if (winner === self) {
      return 1;
    } else if (winner === '-') {
      // 平局
      return 0;
    } else if (winner) {
      return -1;
    }
    if (depth === 0) {
      return 0;
    }
    return undefined;
  }
}
