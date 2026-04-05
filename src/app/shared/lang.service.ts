import { Injectable, signal, inject, effect } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type Lang = 'zh' | 'en';

@Injectable({ providedIn: 'root' })
export class LangService {
  private readonly translate = inject(TranslateService);
  readonly current = signal<Lang>(this.getInitial());

  constructor() {
    this.translate.setDefaultLang('zh');
    this.translate.use(this.current());

    effect(() => {
      const lang = this.current();
      this.translate.use(lang);
      localStorage.setItem('lang', lang);
    });
  }

  toggle() {
    this.current.update((l) => (l === 'zh' ? 'en' : 'zh'));
  }

  private getInitial(): Lang {
    const stored = localStorage.getItem('lang') as Lang | null;
    if (stored === 'zh' || stored === 'en') return stored;
    return navigator.language.startsWith('zh') ? 'zh' : 'en';
  }
}
