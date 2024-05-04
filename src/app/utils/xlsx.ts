import * as XLSX from 'xlsx';
import * as _ from 'lodash';
export const exportFileOrder = ({
  sheetName = 'sheet1',
  headerName = [],
  headerValue = [],
  rows = [],
}: {
  sheetName?: string;
  headerName: string[];
  headerValue: string[];
  rows: any;
}) => {
  const ws = XLSX.utils.aoa_to_sheet([headerName]);
  const wscols = [];
  for (var i = 0; i < headerName.length; i++) {
    // columns length added
    wscols.push({wch: headerName[i].length + 5});
  }

  ws['!cols'] = wscols;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  rows.forEach((row: any, index: number) => {
    XLSX.utils.sheet_add_json(ws, [row], {
      origin: 'A' + (index + 2),
      skipHeader: true,
      header: headerValue,
    });
  });
  /* generate buffer */
  const buf = XLSX.write(wb, {bookType: 'xlsx', type: 'array'});
  return buf;
};

export const readFile = ({
  file,
  headers = [],
}: {
  file: any;
  headers: string[];
}) => {
  const res: any = {isSuccess: false, data: [], valid: false, message: ''};
  try {
    // XLSX.read
    const workbook = XLSX.read(file, {type: 'binary'});
    const sheets = workbook.SheetNames;
    if (sheets.length) {
      const ws = workbook.Sheets[sheets[0]];
      const dataJson = XLSX.utils.sheet_to_json(ws, {defval: null});
      // valid
      if (!dataJson || !dataJson.length) {
        res.message = 'File chưa có dữ liệu';
        return res;
      }
      // replace Tên header hiển trong excel sang field thực tế
      let data = dataJson;
      if (headers.length && dataJson.length) {
        // check header excel có cái nào trùng với headers mẫu ko, ko có cái nào => lỗi
        const firstRow: any = dataJson[0];
        if (firstRow) {
          const invalidHeader = Object.keys(firstRow)?.some((field) =>
            headers.includes(field?.toString().trim() || ''),
          );
          if (!invalidHeader) {
            res.message = `Tên tiêu đề cần có ít nhất 1 trong các cột: ${headers.join(
              ', ',
            )}`;
            return res;
          }
          data = dataJson.map((row: any) => {
            const obj = {};
            headers.forEach((headerName, index) => {
              if (row.hasOwnProperty(headerName)) {
                _.set(obj, headerName, row[headerName] || '');
              }
            });
            return obj;
          });
        }
      }
      res.valid = true;
      res.isSuccess = true;
      res.data = data;
    }
  } catch (err) {
    console.log('UPLOAD ERROR', err);
  }
  // remove file vừa Upload
  return res;
};

// export const csvToJson = (str) => {
//   const data = [];
//   const csvLines = CSVToArray(str, ',');

//   for (let i = 0; i < csvLines.length; i++) {
//     // var line = csvLines[i];
//     let header = [];
//     if (i === 0) {
//       header = csvLines[i];
//     } else {
//       const obj = {};
//       for (let k = 0; k < header.length; k++) {
//         if (k < csvLines[i].length) {
//           obj[header[k]] = csvLines[i][k];
//         }
//       }
//       data.push(obj);
//     }
//   }
//   return data;
// };

// this code was found here
// http://www.bennadel.com/blog/1504-Ask-Ben-Parsing-CSV-Strings-With-Javascript-Exec-Regular-Expression-Command.htm
// This will parse a delimited string into an array of
// arrays. The default delimiter is the comma, but this
// can be overriden in the second argument.
// function CSVToArray(strData, strDelimiter: string) {
//   // Check to see if the delimiter is defined. If not,
//   // then default to comma.
//   strDelimiter = strDelimiter || ',';

//   // Create a regular expression to parse the CSV values.
//   const objPattern = new RegExp(
//     // Delimiters.
//     '(\\' +
//     strDelimiter +
//     '|\\r?\\n|\\r|^)' +
//     // Quoted fields.
//     '(?:"([^"]*(?:""[^"]*)*)"|' +
//     // Standard fields.
//     '([^"\\' +
//     strDelimiter +
//     '\\r\\n]*))',
//     'gi'
//   );

//   // Create an array to hold our data. Give the array
//   // a default empty first row.
//   const arrData = [[]];

//   // Create an array to hold our individual pattern
//   // matching groups.
//   let arrMatches = null;
//   let strMatchedValue = null;
//   // Keep looping over the regular expression matches
//   // until we can no longer find a match.
//   // tslint:disable-next-line:no-conditional-assignment
//   while ((arrMatches = objPattern.exec(strData))) {
//     // Get the delimiter that was found.
//     const strMatchedDelimiter = arrMatches[1];

//     // Check to see if the given delimiter has a length
//     // (is not the start of string) and if it matches
//     // field delimiter. If id does not, then we know
//     // that this delimiter is a row delimiter.
//     if (strMatchedDelimiter.length && strMatchedDelimiter !== strDelimiter) {
//       // Since we have reached a new row of data,
//       // add an empty row to our data array.
//       arrData.push([]);
//     }

//     // Now that we have our delimiter out of the way,
//     // let's check to see which kind of value we
//     // captured (quoted or unquoted).
//     if (arrMatches[2]) {
//       // We found a quoted value. When we capture
//       // this value, unescape any double quotes.
//       strMatchedValue = arrMatches[2].replace(new RegExp('""', 'g'), '"');
//     } else {
//       // We found a non-quoted value.
//       strMatchedValue = arrMatches[3];
//     }

//     // Now that we have our value string, let's add
//     // it to the data array.
//     arrData[arrData.length - 1].push(strMatchedValue);
//   }

//   // Return the parsed data.
//   return arrData;
// }
