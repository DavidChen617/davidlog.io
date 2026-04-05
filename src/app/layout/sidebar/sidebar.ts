import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { DocsManifestService } from '../../shared/docs-manifest.service';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar-scroll fixed top-14 left-0 bottom-0 w-64 overflow-y-auto border-r border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface hidden md:block py-6 px-3">
      @for (group of manifest.groups(); track group.label) {
        <div class="mb-4">
          <button
            class="w-full flex items-center justify-between px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            (click)="toggleGroup(group.label)"
          >
            {{ group.label }}
            <svg
              class="w-3.5 h-3.5 transition-transform"
              [class.rotate-90]="!collapsed().has(group.label)"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </button>

          @if (!collapsed().has(group.label)) {
            <ul class="mt-1 space-y-0.5">
              @for (item of group.items; track item.link) {
                <li>
                  <a
                    [routerLink]="item.link"
                    routerLinkActive="bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 font-medium"
                    class="block px-3 py-1.5 text-sm rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-dark-border transition-colors"
                  >
                    {{ item.label }}
                  </a>
                </li>
              }
            </ul>
          }
        </div>
      }
    </aside>
  `,
})
export class SidebarComponent {
  protected readonly manifest = inject(DocsManifestService);
  protected readonly collapsed = signal<Set<string>>(new Set());

  protected toggleGroup(label: string) {
    this.collapsed.update((s) => {
      const next = new Set(s);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }
}
