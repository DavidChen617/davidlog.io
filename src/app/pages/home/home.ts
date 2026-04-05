import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { socialLinks } from '../../shared/social-links';


@Component({
  selector: 'app-home',
  imports: [RouterLink, TranslatePipe],
  template: `
    <main class="min-h-[calc(100vh-3.5rem)] flex flex-col">

      <!-- Hero -->
      <section class="flex flex-col items-center justify-center text-center px-6 pt-24 pb-16">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 mb-8">
          <span class="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></span>
          {{ 'home.badge' | translate }}
        </div>

        <h1 class="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 dark:text-dark-text mb-6">
          <span class="text-sky-600 dark:text-sky-400">david</span>log.io
        </h1>

        <p class="max-w-xl text-lg text-slate-500 dark:text-dark-muted mb-10 leading-relaxed">
          {{ 'home.description' | translate }}
        </p>

        <div class="flex flex-wrap items-center justify-center gap-3">
          <a
            routerLink="/browse"
            class="px-6 py-3 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-medium text-sm transition-colors shadow-sm"
          >
            {{ 'home.browse' | translate }}
          </a>
          <a
            [href]="socialLinks.github.href"
            target="_blank"
            rel="noopener"
            class="px-6 py-3 rounded-lg border border-slate-200 dark:border-dark-border text-slate-700 dark:text-dark-text hover:bg-slate-50 dark:hover:bg-dark-border font-medium text-sm transition-colors"
          >
            GitHub
          </a>
          <a
            [href]="socialLinks.linkedin.href"
            target="_blank"
            rel="noopener"
            class="px-6 py-3 rounded-lg border border-slate-200 dark:border-dark-border text-slate-700 dark:text-dark-text hover:bg-slate-50 dark:hover:bg-dark-border font-medium text-sm transition-colors"
          >
            LinkedIn
          </a>
          <a
            [href]="socialLinks.x.href"
            target="_blank"
            rel="noopener"
            class="px-6 py-3 rounded-lg border border-slate-200 dark:border-dark-border text-slate-700 dark:text-dark-text hover:bg-slate-50 dark:hover:bg-dark-border font-medium text-sm transition-colors"
          >
            X
          </a>
        </div>
      </section>


    </main>
  `,
})
export class HomeComponent {
  protected readonly socialLinks = socialLinks;
}
