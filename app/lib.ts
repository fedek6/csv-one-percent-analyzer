import { readdir } from "fs/promises";
import { extname, join, parse } from "path";
import csv from "csvtojson";

export const readCsvDir = async <T>(csvPath: string) => {
  const files = await readdir(csvPath);
  const csvs = files.filter((file) => extname(file) === ".csv").sort();
  const names = csvs.map((file) => parse(file).name);

  const promises = csvs.map((file) => csv().fromFile(join(csvPath, file)));
  const data = await Promise.all<T[]>(promises);

  return {
    data,
    names,
  };
};
