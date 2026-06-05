# Google Reviews Exporter

A Chrome extension that scrapes and exports Google Maps reviews to **CSV** or **JSON** with one click.

## Features

- Export up to 500 reviews (or all available)
- Choose CSV or JSON output format
- Captures: reviewer name, star rating, date, review text, Local Guide status, owner responses
- Works on any Google Maps business page

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions`
3. Enable **Developer mode** (top right toggle)
4. Click **Load unpacked** and select this folder
5. The extension icon will appear in your toolbar

## Usage

1. Open a business page on [Google Maps](https://www.google.com/maps)
2. Click the **Reviews** tab to open the reviews panel
3. Click the extension icon in Chrome's toolbar
4. Choose your export format and max review count
5. Click **Scrape Reviews** — the extension will auto-scroll to load reviews
6. Click **Export** to download the file

## Output Fields

| Field | Description |
|---|---|
| `reviewer` | Display name of the reviewer |
| `rating` | Star rating (1–5) |
| `date` | Relative date string (e.g. "2 months ago") |
| `review` | Full review text |
| `localGuide` | Whether the reviewer is a Local Guide |
| `ownerResponse` | Owner's response text (if any) |

## Notes

- The extension only activates on `google.com/maps` pages
- No data is sent to any server — everything runs locally in your browser
