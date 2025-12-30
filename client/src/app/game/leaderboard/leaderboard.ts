import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import confetti from 'canvas-confetti';
import { Subscription } from 'rxjs';

import { Router } from '@angular/router';
import { CONFETTI_DURATION } from '../../constants';
import { ILeaderboardDisplay, IPlayerData } from '../../interfaces/socket.interfaces';
import { RoomService } from '../../services/room.service';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './leaderboard.html',
  styleUrl: './leaderboard.scss',
})
export class LeaderBoard implements OnInit, OnDestroy {
  players: ILeaderboardDisplay[] = [];
  private subscriptions: Subscription[] = [];

  private readonly platformId = inject(PLATFORM_ID);
  private readonly roomService = inject(RoomService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  ngOnInit(): void {
    this.loadFinalResults();
    this.animationPopper();
  }

  loadFinalResults(): void {
    // try to get results from URL params first
    const paramsSub = this.route.queryParams.subscribe((params) => {
      if (params['results']) {
        try {
          const results = JSON.parse(params['results']);
          this.players = results
            .map((p: IPlayerData) => ({
              username: p.userName,
              wpm: p.stats?.wpm || 0,
              accuracy: p.stats?.accuracy || 0,
              time: p.stats?.timeTakenSeconds || 0,
              totalWrong: p.stats?.totalMistakes || 0,
            }))
            .sort((a: ILeaderboardDisplay, b: ILeaderboardDisplay) => {
              if (b.wpm !== a.wpm) return b.wpm - a.wpm;
              return b.accuracy - a.accuracy;
            });
          return;
        } catch {
          // fallback to room service if parsing fails
        }
      }

      // fallback to room service
      const room = this.roomService.getCurrentRoom();
      if (room && room.data.players) {
        // sort players by highest wpm, then by accuracy
        this.players = room.data.players
          .map((p: IPlayerData) => ({
            username: p.userName,
            wpm: p.stats?.wpm || 0,
            accuracy: p.stats?.accuracy || 0,
            time: p.stats?.timeTakenSeconds || 0,
            totalWrong: p.stats?.totalMistakes || 0,
          }))
          .sort((a: ILeaderboardDisplay, b: ILeaderboardDisplay) => {
            if (b.wpm !== a.wpm) return b.wpm - a.wpm;
            return b.accuracy - a.accuracy;
          }); 
      }
    });
    this.subscriptions.push(paramsSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  goHome(): void {
    this.router.navigate(['/homepage']);
  }

  animationPopper(): void {
    // Only run confetti animation in browser environment
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const duration: number = CONFETTI_DURATION;
    const animationEnd: number = Date.now() + duration;
    const defaults = {
      startVelocity: 30,
      spread: 360,
      ticks: 60,
      zIndex: 0,
    };

    const randomInRange = (min: number, max: number): number => {
      return Math.random() * (max - min) + min;
    };

    const interval: NodeJS.Timeout = setInterval((): void => {
      const timeLeft: number = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount: number = 50 * (timeLeft / duration);

      confetti(
        Object.assign({}, defaults, {
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        }),
      );
      confetti(
        Object.assign({}, defaults, {
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        }),
      );
    }, 250);
  }
}
