import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { DarkModeService } from '../../shared/dark-mode.service';
import { LangService } from '../../shared/lang.service';
import { navItems } from '../../shared/nav-config';
import { socialLinks } from '../../shared/social-links';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, TranslatePipe],
  template: `
    <header class="fixed top-0 left-0 right-0 z-50 h-14 border-b border-slate-200 dark:border-dark-border bg-white/90 dark:bg-dark-surface/90 backdrop-blur-sm">
      <div class="flex h-full items-center px-3 sm:px-6 gap-2 sm:gap-6">
        <!-- Logo -->
        <a routerLink="/" class="flex items-center gap-1.5 shrink-0">
          <span class="text-sky-600 dark:text-sky-400 font-bold text-lg">david</span>
          <span class="text-slate-400 dark:text-slate-500 text-sm">log.io</span>
        </a>

        <!-- Nav links -->
        <nav class="flex items-center gap-0.5 sm:gap-1 min-w-0">
          @for (item of navItems; track item.link) {
            <a
              [routerLink]="item.link"
              routerLinkActive="text-sky-600 dark:text-sky-400"
              [routerLinkActiveOptions]="{ exact: item.link === '/' }"
              class="px-2 sm:px-3 py-1.5 text-xs sm:text-sm rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-dark-border transition-colors whitespace-nowrap"
            >
              {{ item.labelKey | translate }}
            </a>
          }
        </nav>

        <div class="ml-auto flex items-center gap-0.5 sm:gap-1 shrink-0">
          <!-- GitHub -->
          <a
            [href]="socialLinks.github.href"
            target="_blank"
            rel="noopener"
            class="hidden min-[492px]:block p-2 rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-dark-border transition-colors"
            aria-label="GitHub"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
            </svg>
          </a>

          <a
            [href]="socialLinks.linkedin.href"
            target="_blank"
            rel="noopener"
            class="hidden min-[492px]:block p-2 rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-dark-border transition-colors"
            aria-label="LinkedIn"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M19 3A2 2 0 0 1 21 5V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19V5A2 2 0 0 1 5 3H19ZM8.34 10.06H5.67V18.3H8.34V10.06ZM7 5.8A1.6 1.6 0 1 0 7 9a1.6 1.6 0 0 0 0-3.2ZM18.33 13.25c0-2.47-1.57-3.36-3.18-3.36a2.88 2.88 0 0 0-2.59 1.43v-1.26H9.89c.03.84 0 8.24 0 8.24h2.67v-4.6c0-.25.02-.49.09-.66a1.46 1.46 0 0 1 1.37-.97c.97 0 1.36.73 1.36 1.81v4.42h2.67v-5.05Z"/>
            </svg>
          </a>

          <a
            [href]="socialLinks.x.href"
            target="_blank"
            rel="noopener"
            class="hidden min-[492px]:block p-2 rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-dark-border transition-colors"
            aria-label="X"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M18.9 2H21l-6.88 7.86L22 22h-6.2l-4.85-6.9L4.9 22H2.8l7.35-8.4L2 2h6.36l4.38 6.24L18.9 2Zm-1.09 18.12h1.72L7.43 3.78H5.58l12.23 16.34Z"/>
            </svg>
          </a>

          <!-- Language toggle -->
          <button
            (click)="lang.toggle()"
            class="px-2 sm:px-2.5 py-1 rounded-md text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-dark-border transition-colors min-w-[2.25rem] sm:min-w-[2.5rem] text-center"
            aria-label="Switch language"
          >
            {{ lang.current() === 'zh' ? 'EN' : '中' }}
          </button>

          <!-- Dark mode toggle -->
          <button
            (click)="darkMode.toggle()"
            class="p-2 rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-dark-border transition-colors"
            aria-label="Toggle dark mode"
          >
            @if (darkMode.isDark()) {
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
              </svg>
            } @else {
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
              </svg>
            }
          </button>
        </div>
      </div>
    </header>
  `,
})
export class NavbarComponent {
  protected readonly darkMode = inject(DarkModeService);
  protected readonly lang = inject(LangService);
  protected readonly navItems = navItems;
  protected readonly socialLinks = socialLinks;
}
