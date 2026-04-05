# davidlog.io

`davidlog.io` 是一個以 Angular 建置的個人技術筆記網站。  
專案採用純靜態 SPA 架構，沒有後端服務，內容以 Markdown 檔案維護，涵蓋後端工程、資料庫、DevOps 與 Angular 等主題。

## 專案特性

- 使用 Angular 21 與 standalone component 建構前端應用
- 以 `ngx-markdown` 渲染 Markdown 文章
- 支援 Mermaid 圖表與 Prism 程式碼高亮
- 支援中英文雙語切換
- 支援深色模式
- 以 build-time manifest 自動生成側邊欄與文章索引

## 技術架構

專案啟動流程如下：

```text
index.html -> main.ts -> bootstrapApplication(App, appConfig)
```

全域設定位於 [src/app/app.config.ts](/Users/chendavid/workspace/project/davidlog.io/src/app/app.config.ts)，主要包含：

- `provideZonelessChangeDetection()`：停用 Zone.js，改由 Signals 驅動變更偵測
- `provideRouter()`：提供前端路由
- `provideHttpClient()`：載入 Markdown 與 i18n JSON
- `provideMarkdown()`：處理 Markdown、Mermaid 與 Prism
- `provideTranslateService()` 與 `provideTranslateHttpLoader()`：載入 `/i18n/{lang}.json`

## 內容與導覽

文章內容放在 `public/docs/`：

- `public/docs/zh/`：中文文章
- `public/docs/en/`：英文文章
- `public/docs/manifest.json`：建置前自動產生的索引檔

`scripts/gen-manifest.mjs` 會掃描 `public/docs/zh/`，讀取各文章第一個 `# Heading` 與資料夾中的 `_meta.json`，產生 `manifest.json`。  
前端啟動時由 `DocsManifestService` 載入這份 manifest，提供：

- 左側 Sidebar 分類導覽
- `/browse` 的文章總覽頁
- 各分類與文章標題的中英文切換

## 國際化

此專案的國際化分成兩層：

1. UI 文案：使用 `ngx-translate`
   - `public/i18n/zh.json`
   - `public/i18n/en.json`
2. 文章內容：使用不同語言的 Markdown 檔
   - `/docs/zh/...`
   - `/docs/en/...`

切換語言時會同步影響：

- Navbar / Footer / 按鈕等介面文字
- Sidebar 與 Browse 頁面的分類與文章標題
- Doc 頁面載入對應語言的 Markdown

若英文文章不存在，Doc 頁面會自動 fallback 到中文版本。

## 主要頁面

- `/`：首頁，作為站點入口與導覽
- `/browse`：顯示全部文章與分類
- `/docs/:p1/:p2/:p3`：文章內容頁

文章頁會額外提供：

- Markdown 渲染
- Mermaid 圖表
- Prism 程式碼高亮
- 自動產生 TOC
- 依滾動位置高亮目前章節

## 專案結構

```text
public/
  i18n/
    zh.json
    en.json
  docs/
    manifest.json
    zh/
    en/

src/app/
  layout/
    navbar/
    sidebar/
    footer/
  pages/
    home/
    browse/
    doc/
  shared/
    dark-mode.service.ts
    lang.service.ts
    docs-manifest.service.ts
    nav-config.ts
    social-links.ts

scripts/
  gen-manifest.mjs
```

## 本機開發

安裝依賴：

```bash
pnpm install
```

啟動開發伺服器：

```bash
pnpm start
```

啟動後可在瀏覽器開啟 `http://localhost:4200/`。

## 建置

```bash
pnpm build
```

建置前會先自動執行 `scripts/gen-manifest.mjs` 重新產生 `public/docs/manifest.json`。

## 新增文章

1. 在 `public/docs/zh/` 下新增 Markdown 檔案
2. 第一個標題必須是 `# 文章標題`
3. 在 `public/docs/en/` 下新增對應英文檔案
4. 若是新資料夾，請建立 `_meta.json`

範例：

```json
{
  "zh": "分類名稱",
  "en": "Category Name"
}
```

完成後執行：

```bash
pnpm start
```

或：

```bash
pnpm build
```

系統會自動更新 manifest。
