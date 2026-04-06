import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LangService, Lang } from './lang.service';

export interface ManifestItem {
  path: string;
  titles: Record<Lang, string>;
  updatedAt: Record<Lang, string>;
}

export interface ManifestGroup {
  titles: Record<Lang, string>;
  items: ManifestItem[];
}

interface Manifest {
  generatedAt: string;
  groups: ManifestGroup[];
}

@Injectable({ providedIn: 'root' })
export class DocsManifestService {
  private readonly http = inject(HttpClient);
  private readonly lang = inject(LangService);

  private readonly manifest = signal<Manifest | null>(null);

  readonly groups = computed(() => {
    const m = this.manifest();
    const l = this.lang.current();
    if (!m) return [];
    return m.groups.map((g) => ({
      label: g.titles[l] ?? g.titles['zh'],
      items: g.items.map((item) => ({
        label: item.titles[l] ?? item.titles['zh'],
        link: `/docs/${item.path}`,
      })),
    }));
  });

  findItem(path: string) {
    const manifest = this.manifest();
    if (!manifest) return null;

    for (const group of manifest.groups) {
      const item = group.items.find((entry) => entry.path === path);
      if (item) return item;
    }

    return null;
  }

  load() {
    this.http.get<Manifest>('docs/manifest.json').subscribe((m) => this.manifest.set(m));
  }
}
