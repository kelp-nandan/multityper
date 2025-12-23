import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocketService } from '../services/socket.service';
import { IParagraphReady, ICharacterState, IWordState, WordState, CharState } from '../interfaces';


@Component({
  selector: 'app-game-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game-dashboard.html',
  styleUrl: './game-dashboard.scss',
})
export class GameDashboard implements OnInit, OnDestroy {

  @ViewChild('typingInput') typingInput!: ElementRef<HTMLTextAreaElement>;

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

  wpm = signal(0);
  timeTakenSeconds = signal(0);

  constructor(private socket: SocketService) { }

  ngOnInit(): void {
    this.startCountdown();
    this.listenForParagraph();
  }

  private listenForParagraph(): void {
    this.socket.on('paragraph-ready', (data: IParagraphReady) => {
      const words: IWordState[] = data.paragraph.split(' ').map((word, i) => ({
        word,
        state: (i === 0 ? 'active' : 'pending') as WordState,
        chars: word.split('').map(c => ({
          char: c,
          state: 'pending' as CharState
        }) as ICharacterState),
      }));

      this.wordStates.set(words);
      this.paragraphLoaded.set(true);
      this.gameStarted.set(true);

      setTimeout(() => this.typingInput.nativeElement.focus(), 100);
    });
  }

  onInput(event: Event): void {
    if (this.isFinished()) return;

    if (!this.startTime()) {
      this.startTime.set(Date.now());
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
      currentWord.chars[cIndex].state = 'correct' as CharState;
      this.correctCount.update(v => v + 1);
      this.charIndexInWord.set(cIndex + 1);

      if (cIndex + 1 === currentWord.chars.length) {
        currentWord.state = 'completed' as WordState;
        this.currentWordIndex.set(wIndex + 1);
        this.charIndexInWord.set(0);

        if (words[wIndex + 1]) {
          words[wIndex + 1].state = 'active' as WordState;
        } else {
          this.handleCompletion();
        }
      }
    } else {
      currentWord.chars[cIndex].state = 'incorrect' as CharState;
      this.totalErrors.update(v => v + 1);
    }

    this.wordStates.set([...words]);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Backspace') {
      event.preventDefault();
    }
  }

  private handleCompletion(): void {
    this.isFinished.set(true);

    const endTime = Date.now();
    const start = this.startTime() ?? endTime;

    const durationMinutes = (endTime - start) / 60000;
    const timeSeconds = Math.floor((endTime - start) / 1000);

    const wpm =
      durationMinutes > 0
        ? Math.round((this.correctCount() / 5) / durationMinutes)
        : 0;

    this.wpm.set(wpm);
    this.timeTakenSeconds.set(timeSeconds);

    const accuracy =
      this.correctCount() + this.totalErrors() > 0
        ? Math.round(
          (this.correctCount() /
            (this.correctCount() + this.totalErrors())) *
          100
        )
        : 0;

    this.socket.emit('player-finished', {
      stats: {
        wpm,
        accuracy,
        correctChars: this.correctCount(),
        totalMistakes: this.totalErrors(),
        timeTakenSeconds: timeSeconds,
      },
    });
  }

  startCountdown(): void {
    const timer = setInterval(() => {
      this.time.update(t => {
        if (t <= 1) {
          clearInterval(timer);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  ngOnDestroy(): void {
    this.socket.off('paragraph-ready');
  }
}
