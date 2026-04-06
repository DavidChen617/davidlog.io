import {
  Component,
  computed,
  inject,
  signal,
  OnInit,
  AfterViewInit,
  ElementRef,
  ViewChild,
  OnDestroy,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MarkdownComponent } from 'ngx-markdown';
import { TranslatePipe } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { catchError, combineLatest, of, Subscription } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { LangService } from '../../shared/lang.service';
import { DarkModeService } from '../../shared/dark-mode.service';
import { DocsManifestService } from '../../shared/docs-manifest.service';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

@Component({
  selector: 'app-doc',
  imports: [MarkdownComponent, TranslatePipe],
  template: `
    <div class="flex min-h-[calc(100vh-3.5rem)]">
      <!-- Main content -->
      <main class="flex-1 min-w-0 md:ml-64 xl:mr-64">
        <div class="max-w-3xl mx-auto px-6 py-10">
          @if (loading()) {
            <div class="flex items-center justify-center py-32 text-slate-400">
              <svg class="animate-spin w-8 h-8 mr-3" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              {{ 'doc.loading' | translate }}
            </div>
          } @else if (error()) {
            <div class="py-32 text-center">
              <div class="text-6xl mb-4">📄</div>
              <h2 class="text-2xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
                {{ 'doc.not_found_title' | translate }}
              </h2>
              <p class="text-slate-500 dark:text-slate-400">{{ error() }}</p>
            </div>
          } @else {
            <div #contentEl>
              <markdown class="markdown-body" [data]="content()" mermaid [mermaidOptions]="mermaidOpts()" (ready)="onReady()" />
            </div>

            @if (lastUpdated()) {
              <div class="mt-12 pt-6 border-t border-slate-200 dark:border-dark-border text-sm">
                <span class="text-slate-400 dark:text-slate-500 italic">
                  {{ 'doc.last_updated' | translate }}{{ lastUpdated() }}
                </span>
              </div>
            }
          }
        </div>
      </main>

      <!-- Right TOC -->
      @if (toc().length > 0) {
        <aside class="hidden xl:block w-64 shrink-0 fixed top-14 right-0 bottom-0 overflow-y-auto py-8 px-6 border-l border-slate-200 dark:border-dark-border">
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
            {{ 'doc.on_this_page' | translate }}
          </p>
          <ul class="space-y-1">
            @for (item of toc(); track item.id) {
              <li [style.padding-left.rem]="(item.level - 2) * 0.75">
                <a
                  [href]="'#' + item.id"
                  class="block text-sm py-0.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                  [class.toc-link-active]="activeId() === item.id"
                  (click)="scrollTo($event, item.id)"
                >
                  {{ item.text }}
                </a>
              </li>
            }
          </ul>
        </aside>
      }
    </div>
  `,
})
export class DocComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('contentEl', { read: ElementRef }) contentEl?: ElementRef<HTMLElement>;

  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);
  private readonly lang = inject(LangService);
  private readonly darkMode = inject(DarkModeService);
  private readonly docsManifest = inject(DocsManifestService);

  protected readonly mermaidOpts = computed(() =>
    ({ theme: (this.darkMode.isDark() ? 'dark' : 'default') as 'dark' | 'default' })
  );

  protected readonly content = signal('');
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly toc = signal<TocItem[]>([]);
  protected readonly activeId = signal('');
  protected readonly lastUpdated = computed(() => {
    const currentLang = this.lang.current();
    const item = this.docsManifest.findItem(this.docPath());
    const updatedAt = item?.updatedAt[currentLang] ?? item?.updatedAt.zh;

    if (!updatedAt) return '';

    const locale = currentLang === 'en' ? 'en-US' : 'zh-TW';
    return new Date(updatedAt).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  });

  private readonly docPath = signal('intro');
  private readonly lang$ = toObservable(this.lang.current);
  private sub?: Subscription;
  private scrollCleanup?: () => void;

  ngOnInit() {
    this.sub = combineLatest([
      this.route.params,
      this.lang$,
    ]).subscribe(([params]) => {
      const parts = [params['p1'], params['p2'], params['p3']].filter(Boolean);
      this.docPath.set(parts.length ? parts.join('/') : 'intro');
      this.loadDoc();
    });
  }

  ngAfterViewInit() {}

  ngOnDestroy() {
    this.sub?.unsubscribe();
    this.scrollCleanup?.();
  }

  protected onReady() {
    this.setupToc();
    this.setupScrollObserver();
  }

  private loadDoc() {
    const lang = this.lang.current();
    const path = this.docPath();
    this.loading.set(true);
    this.error.set('');
    this.toc.set([]);
    this.scrollCleanup?.();

    // 優先載入當前語言版本，找不到 fallback 到 zh/
    this.http
      .get(`docs/${lang}/${path}.md`, { responseType: 'text' })
      .pipe(
        catchError(() =>
          this.http
            .get(`docs/zh/${path}.md`, { responseType: 'text' })
            .pipe(catchError(() => of(null)))
        )
      )
      .subscribe((md) => {
        if (md === null) {
          this.error.set(`Could not load: ${path}`);
        } else {
          this.content.set(md);
        }
        this.loading.set(false);
      });
  }

  private setupToc() {
    const el = this.contentEl?.nativeElement;
    if (!el) return;

    const headings = el.querySelectorAll('h2, h3, h4');
    const items: TocItem[] = [];

    headings.forEach((h) => {
      const heading = h as HTMLElement;
      if (!heading.id) {
        heading.id = heading.textContent!
          .toLowerCase()
          .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
          .replace(/^-|-$/g, '');
      }
      items.push({
        id: heading.id,
        text: heading.textContent ?? '',
        level: parseInt(heading.tagName[1]),
      });
    });

    this.toc.set(items);
  }

  private setupScrollObserver() {
    this.scrollCleanup?.();
    const el = this.contentEl?.nativeElement;
    if (!el) return;

    const headings = Array.from(el.querySelectorAll('h2, h3, h4')) as HTMLElement[];
    if (!headings.length) return;

    const OFFSET = 80;

    const onScroll = () => {
      // scrollY + OFFSET = the "active threshold" line in absolute page coords
      const threshold = window.scrollY + OFFSET;

      // Find the last heading whose absolute top has been crossed
      let active = headings[0].id;
      for (const h of headings) {
        const absoluteTop = h.getBoundingClientRect().top + window.scrollY;
        if (absoluteTop <= threshold) {
          active = h.id;
        }
      }
      this.activeId.set(active);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // set initial state

    this.scrollCleanup = () => window.removeEventListener('scroll', onScroll);
  }

  protected scrollTo(e: MouseEvent, id: string) {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    this.activeId.set(id);
  }
}
