"use client";
import { useEffect, useState } from "react";
import { Bar, Pie, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

import PhotoSlider from "./PhotoSlider";
import * as XLSX from "xlsx";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

// Google Sheet publish-to-web CSV URLs for each sheet
const SHEET_CSV_URLS = [
  // employees
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vT2UvQasbGDng0fR9N0P_34FBjrmywVUj-bjDe6OtdWFHvYsU7sTYmhQYlnMYvvavebOI9DOVnOw8nH/pub?gid=0&single=true&output=csv",
  // leads
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vT2UvQasbGDng0fR9N0P_34FBjrmywVUj-bjDe6OtdWFHvYsU7sTYmhQYlnMYvvavebOI9DOVnOw8nH/pub?gid=266059651&single=true&output=csv",
  // projects
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vT2UvQasbGDng0fR9N0P_34FBjrmywVUj-bjDe6OtdWFHvYsU7sTYmhQYlnMYvvavebOI9DOVnOw8nH/pub?gid=1329523328&single=true&output=csv",
  // sales
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vT2UvQasbGDng0fR9N0P_34FBjrmywVUj-bjDe6OtdWFHvYsU7sTYmhQYlnMYvvavebOI9DOVnOw8nH/pub?gid=548012966&single=true&output=csv"
];



// Improved CSV parser for Google Sheets CSV (handles commas in values)
function parseCSV(csvText: string) {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') inQuotes = !inQuotes;
      else if (char === ',' && !inQuotes) { values.push(current); current = ''; }
      else current += char;
    }
    values.push(current);
    const obj: any = {};
    headers.forEach((h, i) => { obj[h] = (values[i] || '').trim(); });
    return obj;
  });
}

export default function MasterDashboard() {
  type Employee = { joining_date?: string; monthly_salary?: string | number; name?: string; id?: string | number };
  type Lead = { status?: string; lead_source?: string; name?: string; id?: string | number };
  type Project = { start_date?: string; expected_completion_date?: string; status?: string; project_id?: string | number; location?: string; name?: string; id?: string | number };
  type Sale = { sale_date?: string; sale_price?: string | number; project_id?: string | number; name?: string; id?: string | number };
  const [allData, setAllData] = useState<[Employee[], Lead[], Project[], Sale[]]>([[], [], [], []]);
  const [showStory, setShowStory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastGoodData, setLastGoodData] = useState<[Employee[], Lead[], Project[], Sale[]]>([[], [], [], []]);
  const [firstLoad, setFirstLoad] = useState(true);

  // Helper: get file data by index
  const getFileData = <T,>(idx: number) => (allData[idx] as T[]) || [];
  const employees = getFileData<Employee>(0);
  const leads = getFileData<Lead>(1);
  const projects = getFileData<Project>(2);
  const sales = getFileData<Sale>(3);

  // Custom Insights
  const totalUnits = sales.length;
  const totalProjectValue = sales.reduce((sum, r) => sum + (Number(r.sale_price) || 0), 0);
  const totalSalary = employees.reduce((sum, e) => sum + (Number(e.monthly_salary) || 0), 0);
  const inactiveProjects = projects.filter(p => !(p.status && p.status.toLowerCase().includes('under construction'))).length;
  const lowestSale = sales.length > 0 ? Math.min(...sales.map(r => Number(r.sale_price) || Infinity)) : 0;
  // Lowest Lead Source
  let lowLeadSource = "-";
  if (leads.length > 0) {
    const counts: Record<string, number> = {};
    leads.forEach(l => {
      if (l.lead_source && l.lead_source !== "INVALID_SOURCE") counts[l.lead_source] = (counts[l.lead_source] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => a[1] - b[1]);
    lowLeadSource = sorted[0]?.[0] || "-";
  }

  // Profit/Loss Bar Chart (monthly)
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const profitByMonth: { [key: string]: number } = {};
  const lossByMonth: { [key: string]: number } = {};
  sales.forEach((row) => {
    if (row.sale_date && row.sale_price) {
      const d = new Date(row.sale_date.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1'));
      if (!isNaN(d.getTime())) {
        const m = months[d.getMonth()];
        profitByMonth[m] = (profitByMonth[m] || 0) + parseFloat(row.sale_price as string);
      }
    }
  });
  employees.forEach((row) => {
    if (row.joining_date && row.monthly_salary) {
      const d = new Date(row.joining_date.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1'));
      if (!isNaN(d.getTime())) {
        const m = months[d.getMonth()];
        lossByMonth[m] = (lossByMonth[m] || 0) + parseFloat(row.monthly_salary as string);
      }
    }
  });
  const barLabels = months.filter(m => profitByMonth[m] || lossByMonth[m]);
  const barData = barLabels.length > 0 ? {
    labels: barLabels,
    datasets: [
      {
        label: "Profit (Sales)",
        data: barLabels.map(m => profitByMonth[m] || 0),
        backgroundColor: "#6366f1",
      },
      {
        label: "Loss (Salary)",
        data: barLabels.map(m => lossByMonth[m] || 0),
        backgroundColor: "#f87171",
      },
    ],
  } : {
    labels: ["Jan", "Feb", "Mar", "Apr"],
    datasets: [
      { label: "Profit (Sales)", data: [5, 7, 6, 8], backgroundColor: "#6366f1" },
      { label: "Loss (Salary)", data: [2, 3, 2, 4], backgroundColor: "#f87171" },
    ],
  };

  // Workflow Pie Chart (lead status)
  const statusCount: { [key: string]: number } = {};
  leads.forEach((row) => {
    if (row.status && row.status !== "NULL" && row.status !== "UNKNOWN") statusCount[row.status] = (statusCount[row.status] || 0) + 1;
  });
  const pieLabels = Object.keys(statusCount);
  const pieData = pieLabels.length > 0 ? {
    labels: pieLabels,
    datasets: [
      {
        data: pieLabels.map(l => statusCount[l]),
        backgroundColor: ["#22d3ee", "#fbbf24", "#a3e635", "#f87171", "#6366f1"],
      },
    ],
  } : {
    labels: ["Converted", "Open", "Pending"],
    datasets: [
      { data: [10, 5, 3], backgroundColor: ["#22d3ee", "#fbbf24", "#a3e635"] },
    ],
  };

  // Time Utilization Gauge (project duration)
  let totalDays = 0, usedDays = 0, validProjects = 0;
projects.forEach((row) => {
  if (row.start_date && row.expected_completion_date && row.status && row.status.toLowerCase().includes('under construction')) {
    // Support both DD/MM/YYYY and YYYY-MM-DD
    const start = new Date(row.start_date.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1'));
    const end = new Date(row.expected_completion_date.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1'));
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      const now = new Date();
      const total = (end.getTime() - start.getTime()) / (1000 * 3600 * 24);
      const used = (now.getTime() - start.getTime()) / (1000 * 3600 * 24);
      if (total > 0) {
        totalDays += total;
        usedDays += Math.min(used, total);
        validProjects++;
      }
    }
  }
});
const doughnutData = (validProjects > 0) ? {
  labels: ["Time Used (days)", "Time Left (days)"],
  datasets: [
    {
      data: [Math.round(usedDays), Math.max(Math.round(totalDays - usedDays), 0)],
      backgroundColor: ["#34d399", "#f87171"],
    },
  ],
} : {
  labels: ["Time Used (days)", "Time Left (days)"],
  datasets: [
    { data: [0, 0], backgroundColor: ["#34d399", "#f87171"] },
  ],
};

  // Location-wise Sales Map (location + sales)
const salesByLocation: { [key: string]: number } = {};
sales.forEach((row) => {
  if (row.sale_price && row.project_id) {
    const proj = projects.find((p) => String(p.project_id).trim() === String(row.project_id).trim());
    let loc = proj?.location || "Unknown";
    if (loc && loc.toLowerCase() !== 'null' && loc.trim() !== '' && loc !== 'Unknown') {
      // Extract area/city name (first part before comma), and normalize for matching
      let area = loc.split(",")[0].trim().toLowerCase();
      // Handle common spelling/alias issues (add more as needed)
      const aliasMap: Record<string, string> = {
        'bodakdev': 'bodakdev',
        'kudasan': 'kudasan',
        'maninagar': 'maninagar',
        'alkapuri': 'alkapuri',
        'vesu': 'vesu',
        'isanpur': 'isanpur',
        'vejalpur': 'vejalpur',
      };
      if (aliasMap[area]) area = aliasMap[area];
      salesByLocation[area] = (salesByLocation[area] || 0) + parseFloat(row.sale_price as string);
    }
  }
});
const mapLocations = Object.entries(salesByLocation).map(([label, value]) => ({ label, value }));

  useEffect(() => {
    async function fetchAllSheets(isFirst = false) {
      if (isFirst) setLoading(true);
      const results: [Employee[], Lead[], Project[], Sale[]] = [[], [], [], []];
      let allOk = true;
      for (let i = 0; i < SHEET_CSV_URLS.length; i++) {
        const url = SHEET_CSV_URLS[i];
        try {
          const res = await fetch(url);
          const text = await res.text();
          const data = parseCSV(text);
          results[i] = data as any[];
        } catch {
          results[i] = lastGoodData[i] || [];
          allOk = false;
        }
      }
      setAllData(results);
      if (allOk && results.flat().length > 0) setLastGoodData(results);
      if (isFirst) {
        setLoading(false);
        setFirstLoad(false);
      }
    }
    fetchAllSheets(true);
    const interval = setInterval(() => fetchAllSheets(false), 30000); // 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 p-6">
      {/* User 3D Image and Name - Top Right Corner */}
      <div className="fixed top-6 right-8 z-50 flex flex-col items-center">
        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-400 to-cyan-400 shadow-lg flex items-center justify-center overflow-hidden border-4 border-white animate-fade-in avatar-3d-spin">
          {/* 3D spinning avatar from /public/avatar.jpg */}
          <img
            src="/avatar.jpg"
            alt="vaibhav suthar"
            className="w-full h-full object-cover select-none pointer-events-none"
            draggable="false"
            style={{ userSelect: 'none' }}
            onError={e => {
              const el = e.currentTarget;
              el.style.display = 'none';
              const name = document.getElementById('avatar-fallback-name');
              if (name) name.style.display = 'block';
            }}
          />
        </div>
        <span
          id="avatar-fallback-name"
          style={{ display: 'none', marginTop: '8px', color: '#2563eb', fontWeight: 'bold', fontSize: '0.9rem', fontFamily: 'cursive, Brush Script MT, sans-serif' }}
        >
          vaibhav suthar
        </span>
        <span
          style={{ marginTop: '8px', color: '#2563eb', fontWeight: 'bold', fontSize: '1.1rem', fontFamily: 'cursive, Brush Script MT, sans-serif', textShadow: '1px 1px 2px #fff' }}
        >
          vaibhav suthar
        </span>
      </div>
      {/* 3D spin animation for avatar */}
      <style jsx>{`
        .avatar-3d-spin {
          animation: avatar-spin 3s linear infinite;
        }
        @keyframes avatar-spin {
          0% { transform: rotateY(0deg); }
          100% { transform: rotateY(360deg); }
        }
      `}</style>
      {/* Dashboard Story Modal */}
      {showStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-8 relative animate-fade-in">
            <button onClick={() => setShowStory(false)} className="absolute top-2 right-2 text-gray-500 hover:text-indigo-600 text-2xl font-bold">&times;</button>
            <h2 className="text-2xl font-bold text-indigo-700 mb-4 text-center">Dashboard Story</h2>
            <div className="text-gray-800 text-base leading-relaxed max-h-[60vh] overflow-y-auto">
              <p>
                यह डैशबोर्ड <b>Pramukh Omkar Rivanta 2</b> प्रोजेक्ट के लिए बनाया गया है, जिसमें रियल एस्टेट बिज़नेस के सभी जरूरी डेटा और एनालिटिक्स एक ही जगह पर दिखते हैं।
              </p>
              <ul className="list-disc ml-6 my-2">
                <li><b>Profit/Loss (Bar Chart):</b> हर महीने की बिक्री (Profit) और कर्मचारियों की सैलरी (Loss) को ग्राफ में दिखाया गया है, जिससे महीनेवार मुनाफा और खर्च तुरंत समझ में आ जाए।</li>
                <li><b>Lead Status (Pie Chart):</b> सभी लीड्स की स्थिति (जैसे Converted, Open, Pending) का प्रतिशत दिखता है, जिससे पता चलता है कि कितनी लीड्स आगे बढ़ रही हैं।</li>
                <li><b>Time Utilization (Gauge):</b> प्रोजेक्ट्स के लिए कुल समय और अब तक उपयोग हुआ समय (दिनों में) दिखता है, जिससे प्रोजेक्ट की प्रगति का अंदाजा मिलता है।</li>
                <li><b>Project Gallery:</b> प्रोजेक्ट की असली और डेमो फोटो स्लाइडर में देख सकते हैं, जिससे विज़ुअल प्रेजेंटेशन मिलता है।</li>
                <li><b>Key Insights:</b> कुल बिक्री, कुल यूनिट्स, कर्मचारियों की संख्या, कुल सैलरी, एक्टिव/इनएक्टिव प्रोजेक्ट्स जैसी मुख्य बातें एक नज़र में दिखती हैं।</li>
                <li><b>Data Summary:</b> टॉप लोकेशन, सबसे बड़ी और सबसे छोटी बिक्री, सबसे आम और सबसे कम लीड सोर्स जैसी जानकारी मिलती है।</li>
              </ul>
              <p>
                यह डैशबोर्ड <b>Google Sheet</b> से लाइव डेटा लेता है, इसलिए जैसे ही डेटा बदलता है, डैशबोर्ड अपने-आप अपडेट हो जाता है। इसका मकसद है कि कोई भी टीम मेंबर या मालिक बिना एक्सेल खोले, एक क्लिक में पूरे बिज़नेस की स्थिति समझ सके।
              </p>
              <p className="mt-2 text-indigo-700 font-semibold">यह डैशबोर्ड हर किसी के लिए आसान, साफ और तुरंत समझ में आने वाला है।</p>
            </div>
          </div>
        </div>
      )}
      {firstLoad && loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-60 z-50">
          <div className="text-xl font-bold text-indigo-700 animate-pulse">Loading live data...</div>
        </div>
      )}
      {/* Animated SVG background */}
      <div className="absolute inset-0 -z-10 w-full h-full overflow-hidden pointer-events-none">
        <svg viewBox="0 0 1440 320" className="w-full h-64 opacity-30 animate-pulse">
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
          <path fill="url(#grad1)" fillOpacity="1" d="M0,160L60,170C120,180,240,200,360,197.3C480,195,600,169,720,154.7C840,140,960,148,1080,154.7C1200,160,1320,160,1380,160L1440,160L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"></path>
        </svg>
      </div>
      <div className="text-center mb-8">
        <button
          onClick={() => setShowStory(true)}
          className="inline-block bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-semibold px-6 py-2 rounded shadow hover:scale-105 hover:from-indigo-700 hover:to-cyan-600 transition-all duration-200 mb-4"
        >
          डैशबोर्ड की कहानी देखें
        </button>
        <h1 className="text-4xl font-extrabold text-indigo-700 tracking-wide mb-2 drop-shadow-lg">Pramukh Omkar Rivanta 2</h1>
        <h2 className="text-xl font-semibold text-gray-700 mb-1">Omkar Group</h2>
        <span className="inline-block bg-indigo-200 text-indigo-800 rounded px-3 py-1 text-sm font-bold">Master Dashboard</span>
        <div className="mt-4">
          <a
            href="https://docs.google.com/spreadsheets/d/1z41GT7smxgyoiiZ3VIAKQs6juXN8cF2hU9pyVdrBFFg/edit?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-gradient-to-r from-indigo-500 to-cyan-400 text-white font-semibold px-5 py-2 rounded shadow hover:scale-105 hover:from-indigo-600 hover:to-cyan-500 transition-all duration-200"
          >
            Edit Master Data (Google Sheet)
          </a>
        </div>
      </div>
      {/* Custom Count Example: Total Projects with Sales > 1 Crore */}
      <div className="mb-6 text-center">
        <span className="inline-block bg-gradient-to-r from-green-400 to-blue-400 text-white font-semibold px-4 py-2 rounded shadow">
          Projects with Sales {'>'} 1 Crore: <b>{projects.filter(proj => {
            const sold = sales.filter(s => String(s.project_id).trim() === String(proj.project_id).trim())
              .reduce((sum, s) => sum + (Number(s.sale_price) || 0), 0);
            return sold > 10000000;
          }).length}</b>
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center">
          <h3 className="text-lg font-bold mb-2 text-blue-700">Profit/Loss (Bar Chart)</h3>
          <Bar data={barData} options={{ responsive: true, plugins: { legend: { position: "bottom" } } }} />
          {barLabels.length === 0 && (
            <div className="mt-2 text-sm text-gray-500">No sales or salary data for any month. Please check your data.</div>
          )}
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center">
          <h3 className="text-lg font-bold mb-2 text-emerald-700">Lead Status (Pie Chart)</h3>
          <Pie data={pieData} options={{ responsive: true, plugins: { legend: { position: "bottom" } } }} />
          {pieLabels.length === 0 && (
            <div className="mt-2 text-sm text-gray-500">No lead status data found.</div>
          )}
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center">
          <h3 className="text-lg font-bold mb-2 text-pink-700">Time Utilization (Gauge)</h3>
          <Doughnut data={doughnutData} options={{ cutout: "80%", plugins: { legend: { position: "bottom" } } }} />
          <div className="mt-2 text-sm text-gray-700">
            {totalDays > 0 ? (
              <>
                Time Used: <b>{Math.round(usedDays)}</b> days &nbsp;|&nbsp; Time Left: <b>{Math.max(Math.round(totalDays - usedDays), 0)}</b> days
              </>
            ) : (
              <span>No active project data (check start/end dates and status in your sheet)</span>
            )}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center col-span-1 md:col-span-2 lg:col-span-3">
          <h3 className="text-lg font-bold mb-2 text-indigo-700">Project Gallery</h3>
          <PhotoSlider />
        </div>
      </div>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h4 className="font-bold text-indigo-700 mb-2">Key Insights</h4>
          <ul className="list-disc ml-6 text-gray-700">
            <li>Total Sales: <b>{totalProjectValue.toLocaleString()}</b></li>
            <li>Total Units Sold: <b>{totalUnits}</b></li>
            <li>Total Employees: <b>{employees.length > 0 ? employees.length : '-'}</b></li>
            <li>Total Employees Salary: <b>{employees.length > 0 ? totalSalary.toLocaleString() : '-'}</b></li>
            <li>Active Projects: <b>{projects.length > 0 ? projects.filter((p) => p.status && p.status.toLowerCase().includes("under construction")).length : '-'}</b></li>
            <li>Inactive Projects: <b>{projects.length > 0 ? inactiveProjects : '-'}</b></li>
          </ul>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h4 className="font-bold text-indigo-700 mb-2">Data Summary</h4>
          <ul className="list-disc ml-6 text-gray-700">
            <li>Top Location by Sales: <b>{mapLocations.length > 0 ? mapLocations.sort((a, b) => b.value - a.value)[0]?.label : "Ahmedabad"}</b></li>
            <li>Highest Sale: <b>{sales.length > 0 ? Math.max(...sales.map((r) => Number(r.sale_price) || 0)).toLocaleString() : "7,50,000"}</b></li>
            <li>Lowest Sale: <b>{lowestSale !== Infinity && lowestSale !== 0 ? lowestSale.toLocaleString() : "-"}</b></li>
            <li>Most Common Lead Source: <b>{leads.length > 0 ? (() => { const counts: Record<string, number> = {}; leads.forEach((l) => { if (l.lead_source && l.lead_source !== "INVALID_SOURCE") counts[l.lead_source] = (counts[l.lead_source] || 0) + 1; }); return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "-"; })() : "Website"}</b></li>
            <li>Lowest Lead Source: <b>{lowLeadSource}</b></li>
          </ul>
          <div className="mt-4">
            {/* Project-wise Value & Sales table removed as per user request */}
          </div>
        </div>
      </div>
      <p className="mt-8 text-center text-gray-500">CSV डेटा बदलते ही डैशबोर्ड अपने-आप अपडेट होगा।</p>
      <div className="mt-4 text-center text-xs text-gray-400 font-semibold tracking-wide">vaibhav suthar</div>
    </div>
  );
}
