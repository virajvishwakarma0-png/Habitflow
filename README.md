# HabitFlow — Premium Personal Habit Tracker

HabitFlow is an offline-first, local-only habit tracker built with HTML, CSS and vanilla JavaScript.

## Included

- Responsive dark/light dashboard
- Daily habits with daily or selected-weekday schedules
- Add, edit, delete habits
- Search and category filtering
- One-tap completion
- Daily score, progress ring and streaks
- 7/14/30-day canvas chart
- Monthly calendar heatmap
- History review/editing and daily notes
- JSON backup/restore
- CSV export
- LocalStorage persistence
- PWA manifest + service worker
- No account, server or API key

## Run on Windows 10

For the best PWA test, use a local HTTPS/localhost server rather than opening `index.html` with `file://`.

If Python is installed:

1. Open Command Prompt in this folder.
2. Run `python -m http.server 8000`
3. Open `http://localhost:8000` in Chrome/Edge.
4. Test the app, refresh it, then disable network in DevTools and refresh again.

A simple static web server is also fine.

## Deploy for Android installation

A PWA generally needs HTTPS (or localhost for development). GitHub Pages is a practical free option:

1. Create a GitHub repository.
2. Upload all project files.
3. Enable GitHub Pages for the repository's main branch.
4. Open the resulting HTTPS site on Android Chrome.
5. Use the browser's Install app / Add to Home screen option when offered.

The exact install wording varies by browser and Android version.

## Verify offline behavior

Load the app once while online. Then enable airplane mode or disable the site's network access and reopen it. Previously cached app files should still load. Your habit data is stored locally in the browser.

## Privacy

Habit data is stored in localStorage on the device/browser by default. Exported JSON/CSV files are ordinary files and should be protected like any personal backup.

## Backup and restore

Use Settings → Export JSON for a complete backup. Restore it with Settings → Restore JSON. CSV is intended as a history/report export and is not a full restore format.

## Limitations

- Browser storage can be cleared by the user or operating system.
- Storage is tied to the browser/site profile; changing browsers/devices does not automatically move data.
- Notifications/reminders are not guaranteed across browsers, Android battery policies and installed-PWA configurations, so the app does not pretend they are universally supported.
- The service worker only works in a secure context such as HTTPS or on localhost; `file://` is not a complete PWA environment.
- The included charts use Canvas and do not require a runtime CDN.

## Core statistics

Dates use the device's local calendar rather than UTC date strings. A streak day requires all habits scheduled for that date to be completed. Days with zero scheduled habits are not treated as perfect days and do not divide by zero.
