import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DocsManifestService } from '../../shared/docs-manifest.service';
import { LangService } from '../../shared/lang.service';

const CATEGORY_ICONS: Record<string, string> = {
  'Getting Started': '🚀', '入門': '🚀',
  'Backend': '⚡',         '後端': '⚡',
  'DevOps': '🐳',
  'Database': '🗄️',       '資料庫': '🗄️',
  'Frontend': '🅰️',       '前端': '🅰️',
  'Security': '🔒',        '資安': '🔒',
};

@Component({
  selector: 'app-browse',
  imports: [RouterLink],
  template: `
    <main class="md:ml-64 xl:mr-64">
      <div class="max-w-3xl mx-auto px-6 py-10">
        <h1 class="text-2xl font-bold text-slate-900 dark:text-dark-text mb-1">
          {{ lang.current() === 'zh' ? '所有筆記' : 'All Notes' }}
        </h1>
        <p class="text-sm text-slate-400 dark:text-dark-muted mb-10">
          {{ totalArticles() }}
          {{ lang.current() === 'zh' ? ' 篇' : ' articles' }}
        </p>

        <div class="space-y-10">
          @for (group of manifest.groups(); track group.label) {
            <div>
              <div class="flex items-center gap-2 mb-4">
                <span class="text-xl">{{ icon(group.label) }}</span>
                <span class="font-semibold text-slate-700 dark:text-dark-text">{{ group.label }}</span>
                <span class="text-xs text-slate-400 dark:text-dark-muted">{{ group.items.length }}</span>
              </div>

              <div class="grid sm:grid-cols-2 gap-3">
                @for (item of group.items; track item.link) {
                  <a
                    [routerLink]="item.link"
                    class="group flex items-start gap-3 p-4 rounded-lg border border-slate-200 dark:border-dark-border hover:border-sky-300 dark:hover:border-sky-700 hover:bg-sky-50 dark:hover:bg-sky-950/30 transition-all"
                  >
                    <span class="mt-0.5 text-slate-300 dark:text-dark-border group-hover:text-sky-400 transition-colors text-lg leading-none">#</span>
                    <span class="text-sm text-slate-600 dark:text-dark-muted group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors leading-snug">
                      {{ item.label }}
                    </span>
                  </a>
                }
              </div>
            </div>
          }
        </div>
      </div>
    </main>
  `,
})
export class BrowseComponent {
  protected readonly manifest = inject(DocsManifestService);
  protected readonly lang = inject(LangService);
  protected readonly totalArticles = computed(() =>
    this.manifest.groups().reduce((total, group) => total + group.items.length, 0)
  );

  protected icon(label: string): string {
    return CATEGORY_ICONS[label] ?? '📝';
  }
}
