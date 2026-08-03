// Screenshot filenames come in two conventions:
//   - old (lowercase): "_entry.png" / "_exit.png"
//   - new (capitalized, wider images): "_Entry.png" / "_Close.png"
// Matching is exact-case per convention so we can also tell which one
// produced a given screenshot (used to pick the trade-detail layout).
export function isEntryScreenshot(url: string): boolean {
  return url.endsWith('_entry.png') || url.endsWith('_Entry.png');
}

export function isExitScreenshot(url: string): boolean {
  return url.endsWith('_exit.png') || url.endsWith('_Close.png');
}

export function isTradeLogScreenshot(url: string): boolean {
  return url.endsWith('_TradeLog.png') || url.endsWith('_tradelog.png');
}

// True when the screenshot came from the newer capture pipeline
// ("_Entry.png" / "_Close.png"), which produces much wider images that
// need a stacked (not side-by-side) layout.
export function isNewScreenshotFormat(url: string): boolean {
  return url.endsWith('_Entry.png') || url.endsWith('_Close.png');
}
