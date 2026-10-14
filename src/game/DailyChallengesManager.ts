// ============================================================================
// DAILY CHALLENGES RACING OBJECTIVES SYSTEM
// Generates three random, time-limited racing objectives each day with bonus XP & cash
// ============================================================================

export type ChallengeType =
  | 'top_speed'
  | 'near_miss'
  | 'wheelie_dist'
  | 'high_speed_cruise'
  | 'stunt_score'
  | 'police_evade'
  | 'toll_clear'
  | 'explore_districts';

export interface DailyChallenge {
  id: string;
  type: ChallengeType;
  title: string;
  description: string;
  target: number;
  current: number;
  unit: string;
  rewardCash: number;
  rewardXP: number;
  completed: boolean;
  claimed: boolean;
  iconName: string;
}

export interface DailyChallengeEvent {
  type: ChallengeType;
  value: number;
  district?: string;
}

class DailyChallengesManager {
  private challenges: DailyChallenge[] = [];
  private todayDateString = '';
  private listeners: (() => void)[] = [];
  private onCompletedCallback?: (challenge: DailyChallenge) => void;

  constructor() {
    this.refreshForToday();
  }

  public setOnCompletedCallback(cb: (challenge: DailyChallenge) => void) {
    this.onCompletedCallback = cb;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public getTodayDateKey(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  public getTimeRemainingSeconds(): number {
    const now = new Date();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return Math.max(0, Math.floor((endOfDay.getTime() - now.getTime()) / 1000));
  }

  public refreshForToday() {
    const today = this.getTodayDateKey();
    if (this.todayDateString === today && this.challenges.length > 0) return;

    this.todayDateString = today;
    const storageKey = `sr_daily_challenges_${today}`;

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        this.challenges = JSON.parse(saved);
        return;
      }
    } catch {}

    // Generate deterministic 3 challenges based on day seed
    this.challenges = this.generateChallengesForDate(today);
    this.save();
  }

  private generateChallengesForDate(dateStr: string): DailyChallenge[] {
    let seed = 0;
    for (let i = 0; i < dateStr.length; i++) {
      seed = (seed * 31 + dateStr.charCodeAt(i)) >>> 0;
    }

    const pseudoRand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return (seed & 0xffff) / 0xffff;
    };

    const POOL: Omit<DailyChallenge, 'current' | 'completed' | 'claimed'>[] = [
      {
        id: 'top_speed_challenge',
        type: 'top_speed',
        title: 'GST Road Velocity',
        description: 'Hit a top speed of 215 km/h on the highway',
        target: 215,
        unit: 'km/h',
        rewardCash: 1200,
        rewardXP: 600,
        iconName: 'Zap',
      },
      {
        id: 'near_miss_challenge',
        type: 'near_miss',
        title: 'Lane Splitter',
        description: 'Execute 8 close near-miss passes in traffic',
        target: 8,
        unit: 'misses',
        rewardCash: 950,
        rewardXP: 500,
        iconName: 'Flame',
      },
      {
        id: 'wheelie_challenge',
        type: 'wheelie_dist',
        title: 'Mono Wheel Master',
        description: 'Hold a continuous wheelie for 75 meters',
        target: 75,
        unit: 'meters',
        rewardCash: 1100,
        rewardXP: 550,
        iconName: 'Compass',
      },
      {
        id: 'stunt_score_challenge',
        type: 'stunt_score',
        title: 'Freestyle Stunter',
        description: 'Accumulate 3,500 total stunt points',
        target: 3500,
        unit: 'pts',
        rewardCash: 1350,
        rewardXP: 700,
        iconName: 'Trophy',
      },
      {
        id: 'high_speed_cruise_challenge',
        type: 'high_speed_cruise',
        title: 'Speed Demon',
        description: 'Maintain over 170 km/h for 15 seconds',
        target: 15,
        unit: 'sec',
        rewardCash: 1050,
        rewardXP: 520,
        iconName: 'Zap',
      },
      {
        id: 'police_evade_challenge',
        type: 'police_evade',
        title: 'Untouchable Outlaw',
        description: 'Escape a 2-star police pursuit without getting busted',
        target: 1,
        unit: 'evasion',
        rewardCash: 1500,
        rewardXP: 800,
        iconName: 'ShieldAlert',
      },
      {
        id: 'toll_challenge',
        type: 'toll_clear',
        title: 'FASTag Express',
        description: 'Pass through the Highway FASTag toll gate smoothly',
        target: 2,
        unit: 'tolls',
        rewardCash: 800,
        rewardXP: 400,
        iconName: 'Map',
      },
    ];

    // Pick 3 unique challenges
    const chosen: DailyChallenge[] = [];
    const poolCopy = [...POOL];

    for (let i = 0; i < 3 && poolCopy.length > 0; i++) {
      const idx = Math.floor(pseudoRand() * poolCopy.length);
      const item = poolCopy.splice(idx, 1)[0];
      chosen.push({
        ...item,
        current: 0,
        completed: false,
        claimed: false,
      });
    }

    return chosen;
  }

  public recordEvent(event: DailyChallengeEvent): {
    updated: boolean;
    completedChallenge?: DailyChallenge;
  } {
    this.refreshForToday();
    let updated = false;
    let completedChallenge: DailyChallenge | undefined;

    this.challenges.forEach((ch) => {
      if (ch.completed) return;
      if (ch.type === event.type) {
        if (ch.type === 'top_speed') {
          if (event.value > ch.current) {
            ch.current = Math.min(ch.target, Math.round(event.value));
            updated = true;
          }
        } else if (ch.type === 'near_miss' || ch.type === 'toll_clear' || ch.type === 'police_evade') {
          ch.current = Math.min(ch.target, ch.current + event.value);
          updated = true;
        } else if (ch.type === 'stunt_score') {
          ch.current = Math.min(ch.target, ch.current + event.value);
          updated = true;
        } else if (ch.type === 'wheelie_dist' || ch.type === 'high_speed_cruise') {
          if (event.value > ch.current) {
            ch.current = Math.min(ch.target, Math.round(event.value));
            updated = true;
          }
        }

        if (ch.current >= ch.target && !ch.completed) {
          ch.completed = true;
          completedChallenge = ch;
          this.onCompletedCallback?.(ch);
        }
      }
    });

    if (updated) {
      this.save();
      this.notify();
    }

    return { updated, completedChallenge };
  }

  public claimReward(challengeId: string): { cash: number; xp: number } | null {
    const ch = this.challenges.find((c) => c.id === challengeId);
    if (!ch || !ch.completed || ch.claimed) return null;

    ch.claimed = true;
    this.save();
    this.notify();
    return { cash: ch.rewardCash, xp: ch.rewardXP };
  }

  public getChallenges(): DailyChallenge[] {
    this.refreshForToday();
    return this.challenges;
  }

  private save() {
    try {
      const key = `sr_daily_challenges_${this.todayDateString}`;
      localStorage.setItem(key, JSON.stringify(this.challenges));
    } catch {}
  }
}

export const dailyChallenges = new DailyChallengesManager();
