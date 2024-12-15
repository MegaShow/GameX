import svgComputer from './assets/computer.svg';
import svgO from './assets/o.svg';
import svgPlayer from './assets/player.svg';
import svgX from './assets/x.svg';
import { Bot, Chess, EasyBot, HardBot, PlayType, Player } from './game';

import './main.css';

const EnableLog = new URLSearchParams(window.location.search).get('log') !== null;

type GameDifficulty = 'easy' | 'hard';
type GameMode = 'pve' | 'pvp';

class SceneGame {
  private isPlaying = false;
  private chess = new Chess('basic');
  private mode: GameMode = 'pve';
  private player: Player = 'x';
  private bot: Bot = new EasyBot();

  /** 电脑回合 */
  private botPlay(first?: boolean) {
    // 预测电脑回合的下棋位置
    const start = Date.now();
    const predictIndex = this.bot.predict(this.chess);
    const end = Date.now();
    if (EnableLog) {
      // eslint-disable-next-line no-console
      console.log('bot finish predict, use %dms', end - start);
    }

    // 电脑回合至少保持 800ms
    const botPlay = () => {
      this.chess.set(this.chess.getNextPlayer(), predictIndex);
      this.render();
    };
    if (first || end - start > 800) {
      botPlay();
    } else {
      setTimeout(botPlay, 800 - (end - start));
    }
  }

  /** 切换角色 */
  onChangePlayer() {
    if (this.isPlaying) {
      return;
    } else if (this.mode === 'pvp') {
      return;
    }
    const players = document.querySelectorAll<HTMLElement>('.game-player');
    players[0].lastElementChild?.setAttribute('src', svgComputer);
    players[1].lastElementChild?.setAttribute('src', svgPlayer);
    this.isPlaying = true;
    this.player = 'o';
    this.botPlay(true);
  }

  /** 下棋 */
  onClickCell(event: Event) {
    if (this.chess.getWinner()) {
      return;
    }
    this.isPlaying = true;
    const cell = event.target as HTMLElement;
    if (cell.dataset.index === undefined) {
      return;
    }
    switch (this.mode) {
      case 'pve': {
        // 判断是否为玩家回合, 如果不是则跳过
        if (this.chess.getNextPlayer() !== this.player) {
          return;
        }
        try {
          const success = this.chess.set(this.player, Number(cell.dataset.index));
          if (!success) {
            return;
          }
        } catch {
          return;
        }
        this.render();

        // 电脑回合
        if (!this.chess.getWinner()) {
          this.botPlay();
        }
        break;
      }
      case 'pvp': {
        const success = this.chess.set(this.chess.getNextPlayer(), Number(cell.dataset.index));
        if (!success) {
          return;
        }
        this.render();
        break;
      }
      default:
    }
  }

  /** 重新开始 */
  onClickRestart() {
    this.isPlaying = false;
    this.chess.reset();
    this.player = 'x';
    this.render();

    // 重置双方角色
    const players = document.querySelectorAll<HTMLElement>('.game-player');
    switch (this.mode) {
      case 'pve':
        players[0].lastElementChild?.setAttribute('src', svgPlayer);
        players[1].lastElementChild?.setAttribute('src', svgComputer);
        players[1].classList.add('game-player-select');
        break;
      case 'pvp':
        players[0].lastElementChild?.setAttribute('src', svgPlayer);
        players[1].lastElementChild?.setAttribute('src', svgPlayer);
        players[1].classList.remove('game-player-select');
        break;
      default:
    }

    // 重置胜利信息
    document.querySelector('.game-board-line')?.classList.remove('game-board-line-show');
    document.querySelector('.game-winner')?.classList.remove('game-winner-show');
    document.querySelector('.game-winner-draw')?.classList.remove('game-winner-show');
  }

  /** 选择游戏难度 */
  onSelectDifficulty(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.bot = (select.value as GameDifficulty) === 'easy' ? new EasyBot() : new HardBot();
    this.onClickRestart();
  }

  /** 选择游戏模式 */
  onSelectMode(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.mode = select.value as GameMode;
    this.onClickRestart();
  }

  /** 选择游戏类型 */
  onSelectType(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.chess.setPlayType(select.value as PlayType);
    this.onClickRestart();
  }

  // 渲染棋盘
  private render() {
    // 棋盘
    const cells = document.querySelectorAll<HTMLElement>('.game-board-cell');
    const board = this.chess.getBoard();
    for (const cell of cells) {
      const index = Number(cell.dataset.index);
      let svg = undefined;
      if (board.x.includes(index)) {
        svg = svgX;
      } else if (board.o.includes(index)) {
        svg = svgO;
      }
      if (cell.firstElementChild && svg) {
        cell.firstElementChild?.setAttribute('src', svg);
      } else if (svg) {
        const img = document.createElement('img');
        img.src = svg;
        cell.appendChild(img);
      } else if (cell.firstElementChild) {
        cell.removeChild(cell.firstElementChild);
      }

      if (
        this.chess.getPlayType() === 'three_piece' &&
        ((board.x.length === 3 && board.x[0] === index) || (board.o.length === 3 && board.o[0] === index))
      ) {
        cell.firstElementChild?.classList.add('game-board-cell-disappear');
      } else {
        cell.firstElementChild?.classList.remove('game-board-cell-disappear');
      }
    }

    // 更新回合展示, 如果存在胜利不再更新
    const winner = this.chess.getWinner();
    if (!winner) {
      const nextPlayer = this.chess.getNextPlayer();
      const players = document.querySelectorAll<HTMLElement>('.game-player');
      for (const player of players) {
        if (player.dataset.player === nextPlayer) {
          player.classList.add('game-player-next');
        } else {
          player.classList.remove('game-player-next');
        }
        if (this.isPlaying) {
          player.classList.remove('game-player-select');
        }
      }
    } else {
      // 延迟 500ms 后执行
      setTimeout(() => {
        for (const cell of cells) {
          cell.firstElementChild?.classList.remove('game-board-cell-disappear');
        }

        if (winner === 'x' || winner === 'o') {
          const winPieces = this.chess.getWinPieces();
          const line = document.querySelector<HTMLElement>('.game-board-line');
          if (line) {
            line.dataset.case = winPieces.join(',');
            line.dataset.line = 'diagonal';
            if (winPieces[0] + 1 === winPieces[1] && winPieces[0] + 2 === winPieces[2]) {
              line.dataset.line = 'row';
            } else if (winPieces[0] + 3 === winPieces[1] && winPieces[0] + 6 === winPieces[2]) {
              line.dataset.line = 'col';
            }
            line.classList.add('game-board-line-show');
          }
          const winnerDiv = document.querySelector('.game-winner');
          winnerDiv?.classList.add('game-winner-show');
          winnerDiv?.firstElementChild?.setAttribute('src', winner === 'x' ? svgX : svgO);
        } else {
          // 平局
          document.querySelector('.game-winner-draw')?.classList.add('game-winner-show');
        }
      }, 500);
    }
  }
}

// 初始化游戏实例
window.onload = () => {
  window.G = new SceneGame();
};
