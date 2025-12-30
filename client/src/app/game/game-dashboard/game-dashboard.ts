import { CommonModule } from '@angular/common';
import {
  afterNextRender,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  NgZone,
  OnDestroy,
  OnInit,
  runInInjectionContext,
  signal,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';

import { Subscription } from 'rxjs';
import { AuthService } from '../../identity/services/auth.service';
import { RoomService } from '../../services/room.service';
import { SocketService } from '../../services/socket.service';
import { LiveProgress } from '../liveprogress/live-progress';

import {
  ILeaderboardData,
  IParagraphReady,
  IPlayerData,
  IWordState,
} from '../../interfaces/socket.interfaces';

@Component({
  selector: 'app-game-dashboard',
  standalone: true,
  imports: [CommonModule, LiveProgress],
  templateUrl: './game-dashboard.html',
  styleUrl: './game-dashboard.scss',
})
export class GameDashboard implements OnInit, OnDestroy {
  time = signal(10);

  gameStarted = signal(false);
  paragraphLoaded = signal(false);
  isFinished = signal(false);

  wordStates = signal<IWordState[]>([]);
  currentWordIndex = signal(0);
  charIndexInWord = signal(0);

  correctCount = signal(0);
  totalErrors = signal(0);
  startTime = signal<number | null>(null);

  accuracy = computed(() => {
    const total = this.correctCount() + this.totalErrors();
    return total > 0 ? Math.round((this.correctCount() / total) * 100) : 0;
  });

  wpm = signal(0);
  timeTakenSeconds = signal(0);

  isWaitingForOthers = false;
  redirectCountdown = signal(0);
  currentRoomId = '';
  currentUserId = '';

  private progressEmitTimer: NodeJS.Timeout | null = null;
  private subscription: Subscription[] = [];

  // ViewChild
  @ViewChild('typingInput')
  typingInput!: ElementRef<HTMLTextAreaElement>;

  private readonly socket = inject(SocketService);
  private readonly roomService = inject(RoomService);
  private readonly authService = inject(AuthService);
  private readonly ngZone = inject(NgZone);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);

  constructor() {
    // get current room and user info
    const currentRoom = this.roomService.getCurrentRoom();
    this.currentRoomId = currentRoom?.key || '';

    const currentUser = this.authService.currentUser();
    this.currentUserId = currentUser?.id?.toString() || '';
  }

  ngOnInit(): void {
    this.startCountdown();
    this.listenForParagraph();
    this.startProgressEmitter();

    // when all players are done
    this.socket.on('all-players-finished', () => {
      this.isWaitingForOthers = true;
      this.startRedirectCountdown();
    });

    // redirect to leaderboard event
    this.socket.on('redirect-to-leaderboard', (data: ILeaderboardData) => {
      this.redirectToLeaderboard(data.roomId, data.finalResults);
    });

    // when a player finishes
    this.socket.on('player-finished', () => {
      this.isWaitingForOthers = true;
    });
  }

  ngOnDestroy(): void {
    this.socket.off('paragraph-ready');
    this.socket.off('all-players-finished');
    this.socket.off('redirect-to-leaderboard');
    this.socket.off('player-finished');

    if (this.progressEmitTimer) {
      clearInterval(this.progressEmitTimer);
    }

    this.subscription.forEach((sub) => sub.unsubscribe());
  }

  private startRedirectCountdown(): void {
    this.redirectCountdown.set(5);
    const countdownInterval = setInterval(() => {
      this.ngZone.run(() => {
        this.redirectCountdown.update((count) => count - 1);

        if (this.redirectCountdown() <= 0) {
          //redirect to leaderboard when server recieves result from all players
          clearInterval(countdownInterval);
        }
      });
    }, 1000);
  }

  private redirectToLeaderboard(roomId: string, results: IPlayerData[]): void {
    // go to leaderboard with results
    this.router.navigate(['/leaderboard'], {
      queryParams: {
        roomId: roomId,
        results: JSON.stringify(results),
      },
    });
  }

  startCountdown(): void {
    const timer = setInterval(() => {
      this.time.update((t) => {
        if (t <= 1) {
          clearInterval(timer);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  private listenForParagraph(): void {
    this.socket.on('paragraph-ready', (data: IParagraphReady) => {
      const cleanParagraph = data.paragraph.trim().replace(/\s+/g, ' ');

      const words: IWordState[] = cleanParagraph.split(' ').map((word: string, i: number) => ({
        word,
        state: i === 0 ? 'active' : 'pending',
        chars: word.split('').map((c: string) => ({
          char: c,
          state: 'pending',
        })),
      }));

      this.wordStates.set(words);
      this.paragraphLoaded.set(true);
      this.gameStarted.set(true);

      runInInjectionContext(this.injector, () => {
        afterNextRender(() => {
          this.typingInput?.nativeElement.focus();
          this.typingInput.nativeElement.value = '';
        });
      });
    });
  }

  onInput(event: Event): void {
    if (this.isFinished()) return;

    if (!this.startTime()) {
      this.startTime.set(Date.now());
      this.emitLiveProgress();
    }

    const input = event.target as HTMLTextAreaElement;
    const typedChar = input.value.slice(-1);
    input.value = '';

    const words = this.wordStates();
    const wIndex = this.currentWordIndex();
    const cIndex = this.charIndexInWord();

    const currentWord = words[wIndex];
    const expectedChar = currentWord.chars[cIndex]?.char;

    if (!typedChar || !expectedChar) return;

    if (typedChar === expectedChar) {
      currentWord.chars[cIndex].state = 'correct';
      this.correctCount.update((v) => v + 1);
      this.charIndexInWord.set(cIndex + 1);

      if (cIndex + 1 === currentWord.chars.length) {
        currentWord.state = 'completed';
        this.currentWordIndex.set(wIndex + 1);
        this.charIndexInWord.set(0);

        if (words[wIndex + 1]) {
          words[wIndex + 1].state = 'active';
        } else {
          this.wordStates.set([...words]);
          this.handleCompletion();
          return;
        }
      }
    } else {
      currentWord.chars[cIndex].state = 'incorrect';
      this.totalErrors.update((v) => v + 1);
    }

    this.wordStates.set([...words]);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Backspace') {
      event.preventDefault();
    }
  }

  private startProgressEmitter(): void {
    this.progressEmitTimer = setInterval(() => {
      if (this.gameStarted() && !this.isFinished() && this.startTime()) {
        this.emitLiveProgress();
      }
    }, 2000);
  }

  emitLiveProgress(): void {
    const roomId = this.roomService.getCurrentRoom()?.key;
    if (!roomId) return;

    const totalChars = this.wordStates().reduce((acc, w) => acc + w.chars.length, 0);

    const typedChars = this.correctCount() + this.totalErrors();
    const progress = Math.min(Math.round((this.correctCount() / totalChars) * 100), 100);

    const now = Date.now();
    const start = this.startTime() ?? now;
    const minutes = (now - start) / 60000;

    const wpm = minutes > 0 ? Math.round(this.correctCount() / 5 / minutes) : 0;

    const accuracy = typedChars > 0 ? Math.round((this.correctCount() / typedChars) * 100) : 0;

    this.socket.handleLiveProgress(roomId, progress, wpm, accuracy);
  }

  private handleCompletion(): void {
    this.isFinished.set(true);

    if (this.progressEmitTimer) {
      clearInterval(this.progressEmitTimer);
    }

    const endTime = Date.now();
    const start = this.startTime() ?? endTime;

    const minutes = (endTime - start) / 60000;
    const seconds = Math.floor((endTime - start) / 1000);

    const wpm = minutes > 0 ? Math.round(this.correctCount() / 5 / minutes) : 0;

    const accuracy =
      this.correctCount() + this.totalErrors() > 0
        ? Math.round((this.correctCount() / (this.correctCount() + this.totalErrors())) * 100)
        : 0;

    this.wpm.set(wpm);
    this.timeTakenSeconds.set(seconds);

    const roomId = this.roomService.getCurrentRoom()?.key;

    if (roomId) {
      this.socket.emit('player-finished', {
        roomId,
        stats: {
          wpm,
          accuracy,
          totalMistakes: this.totalErrors(),
          timeTakenSeconds: seconds,
        },
      });
    }
  }
}
