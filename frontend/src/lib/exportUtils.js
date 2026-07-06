/**
 * Converts an array of objects to a CSV string and triggers a browser download.
 * @param {Array<Object>} dataArray - The data to export.
 * @param {string} filename - The desired filename (without .csv).
 */
export function exportToCSV(dataArray, filename) {
  if (!dataArray || !dataArray.length) {
    console.warn("No data to export.");
    return;
  }

  // Extract headers
  const headers = Object.keys(dataArray[0]);
  
  // Format rows
  const csvRows = [];
  csvRows.push(headers.join(',')); // Add header row

  for (const row of dataArray) {
    const values = headers.map(header => {
      let val = row[header];
      if (val === null || val === undefined) {
        val = '';
      }
      // Escape quotes and wrap in quotes if it contains a comma, newline, or quote
      const stringVal = String(val);
      if (stringVal.includes(',') || stringVal.includes('\n') || stringVal.includes('"')) {
        return `"${stringVal.replace(/"/g, '""')}"`;
      }
      return stringVal;
    });
    csvRows.push(values.join(','));
  }

  // Create Blob and trigger download
  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
