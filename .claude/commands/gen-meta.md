Scan `public/docs/zh/` and generate missing `_meta.json` files for any subdirectory that doesn't have one.

## Steps

1. List all subdirectories under `public/docs/zh/` (recursively)
2. For each subdirectory, check if `_meta.json` exists
3. For directories missing `_meta.json`, infer appropriate display names:
   - `en` value: title-case the folder name, replace hyphens/underscores with spaces
   - `zh` value: translate the `en` value into Traditional Chinese — use your knowledge to pick a natural, commonly used Chinese tech term (e.g. `backend` → `後端`, `devops` → `DevOps`, `frontend` → `前端`, `security` → `資安`, `database` → `資料庫`)
4. Write the `_meta.json` to each directory that was missing one
5. Report which files were created and their contents. Skip directories that already have `_meta.json`.
