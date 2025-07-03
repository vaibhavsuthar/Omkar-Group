"use client";

import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";
import * as XLSX from "xlsx";

Chart.register(...registerables);

const DATA_FOLDER = "/data/pramukhkar/";
const CSV_FILES = [
  "file1.csv",
  "file2.csv",
  "file3.csv",
  "file4.csv",
  "file5.csv",
]; // अपने फाइल नाम यहाँ डालें

function parseCSV(csvText: string) {
  const workbook = XLSX.read(csvText, { type: "string" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(sheet);
}

export default function RealEstateDashboard() {
  const chartRefs = useRef<Array<Chart | null>>([]);

  useEffect(() => {
    const lastGoodData: Array<Array<Record<string, string | number>>> = [];
    let firstLoad = true;
    async function fetchAndDraw(isFirst = false) {
      for (let idx = 0; idx < CSV_FILES.length; idx++) {
        const file = CSV_FILES[idx];
        try {
          const res = await fetch(DATA_FOLDER + file);
          const text = await res.text();
          const data = parseCSV(text);
          if (data.length) {
            lastGoodData[idx] = data as Array<Record<string, string | number>>;
          }
          const chartId = `myChart${idx}`;
          const ctx = document.getElementById(chartId) as HTMLCanvasElement;
          if (!ctx) continue;
          if (chartRefs.current[idx]) chartRefs.current[idx]?.destroy();
          const typedData = (data.length ? data : lastGoodData[idx] || []) as Array<Record<string, string | number>>;
          if (!typedData.length) continue;
          const labelKey = Object.keys(typedData[0])[0];
          const valueKey = Object.keys(typedData[0])[1];
          const labels = typedData.map((row) => String(row[labelKey]));
          const values = typedData.map((row) => {
            const val = row[valueKey];
            return typeof val === 'number' ? val : Number(val);
          });
          chartRefs.current[idx] = new Chart(ctx, {
            type: "bar",
            data: {
              labels,
              datasets: [
                {
                  label: file,
                  data: values,
                  backgroundColor: "rgba(54, 162, 235, 0.5)",
                  borderColor: "rgba(54, 162, 235, 1)",
                  borderWidth: 1,
                },
              ],
            },
            options: {
              responsive: true,
            },
          });
        } catch {
          // fallback to last good data
          const chartId = `myChart${idx}`;
          const ctx = document.getElementById(chartId) as HTMLCanvasElement;
          if (!ctx) continue;
          if (chartRefs.current[idx]) chartRefs.current[idx]?.destroy();
          const typedData = lastGoodData[idx] || [];
          if (!typedData.length) continue;
          const labelKey = Object.keys(typedData[0])[0];
          const valueKey = Object.keys(typedData[0])[1];
          const labels = typedData.map((row) => String(row[labelKey]));
          const values = typedData.map((row) => {
            const val = row[valueKey];
            return typeof val === 'number' ? val : Number(val);
          });
          chartRefs.current[idx] = new Chart(ctx, {
            type: "bar",
            data: {
              labels,
              datasets: [
                {
                  label: file,
                  data: values,
                  backgroundColor: "rgba(54, 162, 235, 0.5)",
                  borderColor: "rgba(54, 162, 235, 1)",
                  borderWidth: 1,
                },
              ],
            },
            options: {
              responsive: true,
            },
          });
        }
      }
      if (isFirst) firstLoad = false;
    }
    fetchAndDraw(true);
    const interval = setInterval(() => fetchAndDraw(false), 30000); // 30 seconds
    const chartsForCleanup = [...chartRefs.current];
    return () => {
      clearInterval(interval);
      chartsForCleanup.forEach((chart) => chart?.destroy());
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">रियल एस्टेट मल्टी-फाइल डैशबोर्ड</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {CSV_FILES.map((file, idx) => (
          <div key={file} className="bg-white rounded shadow p-4">
            <h2 className="font-semibold mb-2">{file}</h2>
            <canvas id={`myChart${idx}`} width={400} height={300}></canvas>
          </div>
        ))}
      </div>
      <p className="mt-4 text-gray-500">CSV डेटा बदलते ही चार्ट्स अपने-आप अपडेट होंगे।</p>
    </div>
  );
}
