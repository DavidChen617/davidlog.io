import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideMarkdown, MERMAID_OPTIONS } from 'ngx-markdown';
import { HttpClient } from '@angular/common/http';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { routes } from './app.routes';

const isDark = () => document.documentElement.classList.contains('dark');

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(),
    provideMarkdown({
      loader: HttpClient,
      mermaidOptions: {
        provide: MERMAID_OPTIONS,
        useFactory: () => ({ darkMode: isDark(), theme: 'default' }),
      },
    }),
    provideTranslateService(),
    provideTranslateHttpLoader({ prefix: 'i18n/', suffix: '.json' }),
  ],
};
