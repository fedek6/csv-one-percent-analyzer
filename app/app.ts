import path from "path";
import { readCsvDir } from "./lib";
import { Md5 } from "ts-md5";
import { parse } from "json2csv";
import fs from "fs";

interface Row {
  lp: number;
  "Imię podatnika": string;
  "Nazwisko podatnika": string;
  "Adres zamieszkania podatnika": string;
  "Kwota przekazana na rzecz organizacji": string;
}

interface OutputRow {
  "Imię podatnika": string;
  "Nazwisko podatnika": string;
  "Adres zamieszkania podatnika": string;
  md5: string;
  [key: string]: string | number;
}

interface Output {
  [key: string]: Array<OutputRow>;
}

const dir = path.join(process.cwd(), "csv");
// console.log(file);

(async () => {
  const { data, names } = await readCsvDir<Row>(dir);
  let i = 0;
  const outputByYears = {} as Output;
  const outputAll = [] as Array<OutputRow>;
  const outputPath = path.join(process.cwd(), "output.csv");

  data.forEach((year) => {
    const tmpRow: Array<Row & OutputRow> = [];
    const key = names[i++];

    // Only non empty name & surname
    const filtered = year.filter(
      (row) => row["Imię podatnika"] !== "" && row["Nazwisko podatnika"] !== ""
    );

    // Add md5
    filtered.forEach((row) => {
      const fixed = {
        ...row,
        md5: Md5.hashStr(
          `${row["Imię podatnika"].toLowerCase()} ${row[
            "Adres zamieszkania podatnika"
          ].toLowerCase()}`
        ),
      };

      if (!outputAll.some((e) => e.md5 === fixed.md5)) {
        outputAll.push({
          "Imię podatnika": fixed["Imię podatnika"],
          "Nazwisko podatnika": fixed["Nazwisko podatnika"],
          "Adres zamieszkania podatnika": fixed["Adres zamieszkania podatnika"],
          md5: fixed["md5"],
        });
      }

      tmpRow.push(fixed);

      outputByYears[key] = tmpRow;
    });
  });

  outputAll.forEach((row) => {
    const { md5 } = row;
    let count = 0;

    names.forEach(async (name) => {
      const found = outputByYears[name].find((row) => row.md5 === md5);

      if (found) {
        row[name] = Number(
          found["Kwota przekazana na rzecz organizacji"] as string
        );
        ++count;
      } else {
        row[name] = 0;
      }
    });

    row.count = count;
  });

  outputAll.sort((a, b) =>
    a["Nazwisko podatnika"] > b["Nazwisko podatnika"]
      ? 1
      : b["Nazwisko podatnika"] > a["Nazwisko podatnika"]
      ? -1
      : 0
  );

  fs.writeFileSync(outputPath, parse(outputAll));
  console.log("🫡 done");
})();
