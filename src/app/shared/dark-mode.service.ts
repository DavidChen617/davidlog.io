import { Injectable, signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DarkModeService {
  readonly isDark = signal(this.getInitial());

  constructor() {
    effect(() => {
      document.documentElement.classList.toggle('dark', this.isDark());
      localStorage.setItem('theme', this.isDark() ? 'dark' : 'light');
    });
  }

  toggle() {
    this.isDark.update((v) => !v);
  }

  private getInitial(): boolean {
    const stored = localStorage.getItem('theme');
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
}
