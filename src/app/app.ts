import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './layout/navbar/navbar';
import { SidebarComponent } from './layout/sidebar/sidebar';
import { FooterComponent } from './layout/footer/footer';
import { DarkModeService } from './shared/dark-mode.service';
import { DocsManifestService } from './shared/docs-manifest.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, SidebarComponent, FooterComponent],
  template: `
    <app-navbar />
    <app-sidebar />
    <div class="pt-14 min-h-screen flex flex-col">
      <router-outlet />
      <app-footer />
    </div>
  `,
})
export class App implements OnInit {
  private readonly darkMode = inject(DarkModeService);
  private readonly docsManifest = inject(DocsManifestService);

  ngOnInit() {
    this.darkMode.isDark();
    this.docsManifest.load();
  }
}
