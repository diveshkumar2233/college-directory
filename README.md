# College Directory

A simple static site that reads `data/colleges.json` and shows a searchable,
filterable directory of colleges.

## Folder structure

```
college-directory/
├── index.html        # main page
├── css/
│   └── style.css      # styles
├── js/
│   └── app.js          # loads data.json, handles search + filter
├── data/
│   └── colleges.json  # your college data (edit this to update listings)
└── README.md
```

## How to run

Because `app.js` loads `data/colleges.json` with `fetch()`, opening
`index.html` directly by double-clicking it (`file://...`) will **not**
work in most browsers — they block `fetch` on local files for security
reasons. Run a tiny local server instead, from inside the
`college-directory` folder:

**Option 1 — Python (already installed on most machines):**
```bash
cd college-directory
python3 -m http.server 8000
```
Then open http://localhost:8000 in your browser.

**Option 2 — Node.js:**
```bash
cd college-directory
npx serve
```
It will print a local URL to open.

**Option 3 — VS Code:**
Install the "Live Server" extension, right-click `index.html`, and choose
"Open with Live Server."

## Updating the data

Just edit `data/colleges.json` — it's a plain array of college objects.
Refresh the page (no rebuild step needed) to see changes.
