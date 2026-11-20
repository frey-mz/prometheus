import assert from "node:assert/strict";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const text = (html) => html.replace(/<[^>]*>/g, " ").replace(/&nbsp;|&#160;/g, " ").replace(/\s+/g, " ").trim();

// Parse the rendered history table independently of the chart API response.
export function parseHistoryPage(html) {
  for (const [table] of html.matchAll(/<table\b[^>]*>[\s\S]*?<\/table>/gi)) {
    const headers = [...table.matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/gi)].map((match) => text(match[1]));
    const columns = ["Date", "High", "Low", "Volume"].map((name) => headers.indexOf(name));
    if (columns.some((column) => column < 0)) continue;
    const body = table.match(/<tbody\b[^>]*>([\s\S]*?)<\/tbody>/i);
    assert.ok(body, "Yahoo history table has no body");
    const rows = [];
    for (const [row] of body[1].matchAll(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi)) {
      // Dividend/split rows span columns and are not daily price bars.
      if (/colspan\s*=/i.test(row)) continue;
      const cells = [...row.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((match) => text(match[1]));
      assert.equal(cells.length, headers.length, "Unexpected Yahoo history row shape");
      const [dateColumn, highColumn, lowColumn, volumeColumn] = columns;
      const date = cells[dateColumn].match(/^([A-Z][a-z]{2}) (\d{1,2}), (\d{4})$/);
      assert.ok(date && months.includes(date[1]), `Unrecognized history date: ${cells[dateColumn]}`);
      const day = `${date[3]}-${String(months.indexOf(date[1]) + 1).padStart(2, "0")}-${date[2].padStart(2, "0")}`;
      const number = (column) => {
        const value = cells[column].replace(/,/g, "");
        assert.match(value, /^\d+(?:\.\d+)?$/, `Invalid history number: ${cells[column]}`);
        return Number(value);
      };
      const volume = number(volumeColumn);
      assert.ok(Number.isSafeInteger(volume), "Invalid history volume");
      rows.push({ day, lowAverage: number(lowColumn), highAverage: number(highColumn), volume });
    }
    assert.ok(rows.length > 0, "Yahoo history table has no price rows");
    assert.equal(new Set(rows.map((row) => row.day)).size, rows.length, "Duplicate history dates");
    return rows;
  }
  throw new Error("Yahoo history table not found (page may be blocked or its markup changed)");
}

export function assertHistoryMatchesPage(result, html) {
  assert.ok(Array.isArray(result), `Server action failed: ${JSON.stringify(result)}`);
  const expected = parseHistoryPage(html);
  // Yahoo displays cents; compare at that precision, with exact dates/volumes.
  const actual = result.map((row) => ({
    ...row,
    lowAverage: Number(row.lowAverage.toFixed(2)),
    highAverage: Number(row.highAverage.toFixed(2)),
  }));
  const byDay = (a, b) => a.day.localeCompare(b.day);
  assert.deepEqual(actual.sort(byDay), expected.sort(byDay));
}
