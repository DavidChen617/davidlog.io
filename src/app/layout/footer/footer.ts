import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { socialLinks } from '../../shared/social-links';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, TranslatePipe],
  template: `
    <footer class="md:ml-64 xl:mr-64 border-t border-slate-200 dark:border-dark-border mt-auto">
      <div class="max-w-3xl mx-auto px-6 py-16 space-y-10">
        <!-- Tagline -->
        <div>
          <div class="text-lg font-semibold text-slate-700 dark:text-dark-text mb-1">
            <span class="text-sky-600 dark:text-sky-400">david</span>log.io
          </div>
          <p class="text-sm text-slate-400 dark:text-dark-muted leading-relaxed max-w-sm">
            {{ 'footer.tagline' | translate }}
          </p>
        </div>

        <!-- Links -->
        <div class="flex flex-wrap gap-x-8 gap-y-2 text-sm text-slate-400 dark:text-dark-muted">
          <a routerLink="/" class="hover:text-slate-700 dark:hover:text-dark-text transition-colors">{{ 'nav.home' | translate }}</a>
          <a routerLink="/browse" class="hover:text-slate-700 dark:hover:text-dark-text transition-colors">{{ 'nav.docs' | translate }}</a>
          <a [href]="socialLinks.github.href" target="_blank" rel="noopener" class="hover:text-slate-700 dark:hover:text-dark-text transition-colors">GitHub</a>
          <a [href]="socialLinks.linkedin.href" target="_blank" rel="noopener" class="hover:text-slate-700 dark:hover:text-dark-text transition-colors">LinkedIn</a>
          <a [href]="socialLinks.x.href" target="_blank" rel="noopener" class="hover:text-slate-700 dark:hover:text-dark-text transition-colors">X</a>
        </div>

        <!-- Bottom -->
        <div class="pt-6 border-t border-slate-100 dark:border-dark-border text-xs text-slate-400 dark:text-dark-muted">
          © {{ year }} David Chen · {{ 'footer.built_with' | translate }}
        </div>
      </div>
    </footer>
  `,
})
export class FooterComponent {
  protected readonly year = new Date().getFullYear();
  protected readonly socialLinks = socialLinks;
}
