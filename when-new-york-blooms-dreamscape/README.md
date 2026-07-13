# When New York Blooms

Files:
- `index.html` — complete standalone D3 visualization
- `flowers.csv` — 30 rows × 365 daily bloom-intensity values
- `flowers_metadata.csv` — flower names, dates, locations, and colors

## Run locally

Do not double-click `index.html`, because it loads CSV files.

In VS Code, right-click `index.html` and choose **Open with Live Server**.

Or run:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

All paths are relative, so the same files can be uploaded directly to GitHub Pages.
