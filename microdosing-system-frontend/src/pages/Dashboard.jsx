import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut, Line, Radar } from 'react-chartjs-2';

import { Package, ClipboardList, Activity, CheckCircle } from 'lucide-react';
import { Card, CardContent, Typography, CircularProgress, Box } from '@mui/material';
import ThemeDropdown from '../components/ThemeDropdown';
import { useTheme } from '../context/ThemeContext';
import { generateShades, getContrastColor } from '../utils/colorUtils';
import { Filler, RadialLinearScale } from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,             // ✅ Needed for "fill" to work in Line charts
  RadialLinearScale   // ✅ Needed for Radar chart to work
);

const lightenColor = (color, percent) => {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return `#${(
    0x1000000 +
    (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 1 ? 0 : B) : 255)
  ).toString(16).slice(1)}`;
};

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ materials: 0, recipes: 0, activeOrders: 0, completedBatches: 0 });
  const [productChart, setProductChart] = useState({ labels: [], data: [] });
  const location = useLocation();
  const successMessage = location.state?.message;
  const barChartRef = useRef(null);
  const pieChartRef = useRef(null);
  const historicalChartRef = useRef(null);
  const { themeColor } = useTheme();
  const [isDarkMode, setIsDarkMode] = useState(document.body.classList.contains('dark-mode'));
  const [animatedPercentages, setAnimatedPercentages] = useState({ 'Materials': 0, 'Recipes': 0, 'Active Orders': 0, 'Completed Batches': 0 });
  const darkenColor = (color, percent) => {
    const num = parseInt(color.replace("#", ""), 16),
      amt = Math.round(2.55 * percent),
      R = (num >> 16) - amt,
      G = (num >> 8 & 0x00FF) - amt,
      B = (num & 0x0000FF) - amt;
    return "#" + (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    ).toString(16).slice(1);
  };

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.body.classList.contains('dark-mode'));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [materialRes, recipesRes] = await Promise.all([
          axios.get('http://127.0.0.1:5000/api/materials/all'),
          axios.get('http://127.0.0.1:5000/api/recipes/all')
        ]);
        const materials = materialRes.data;
        const recipes = recipesRes.data;

        setStats(prev => ({ ...prev, materials: materials.length, recipes: recipes.length }));

        const dynamicLabels = materials.map(m => m.title);
        const dynamicData = materials.map(m => m.current_quantity || 0);
        setProductChart({ labels: dynamicLabels, data: dynamicData });
      } catch (error) {
        console.error("Error fetching dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setAnimatedPercentages({ 'Materials': 75, 'Recipes': 60, 'Active Orders': 90, 'Completed Batches': 50 });
    }, 500);
    return () => clearTimeout(timeout);
  }, []);

  const barColors = generateShades(themeColor, 5);
  const pieColors = Array(productChart.data.length)
    .fill()
    .map((_, index) => lightenColor(themeColor, 40 - (index * (40 / productChart.data.length))));
  const kpiColors = generateShades(themeColor, 5);
  const cardTextColor = getContrastColor(themeColor);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 1500, easing: 'easeInOutBounce' },
    plugins: {
      legend: { position: 'bottom', labels: { color: isDarkMode ? '#e0f7ff' : '#374151' } }
    },
    scales: {
      y: { grid: { color: '#D1D5DB' }, ticks: { color: isDarkMode ? '#e0f7ff' : '#374151' } },
      x: { grid: { display: false }, ticks: { color: isDarkMode ? '#e0f7ff' : '#374151' } }
    }
  };

  if (loading) {
    return <Box className="flex items-center justify-center h-screen"><CircularProgress /></Box>;
  }

  return (
    <Box className={`p-6 mt-4 min-h-screen ${isDarkMode ? 'glow-container' : ''}`} style={{
      background: isDarkMode ? 'radial-gradient(circle at top left, #0a2a4f 0%, #0f1c2f 100%)' : '#f5f5f5',
      color: isDarkMode ? '#e0f7ff' : '#1e293b',
      transition: 'all 0.3s ease'
    }}>

      <Box className="flex justify-between items-center mb-6">
        <Typography variant="h4" className="font-semibold">Dashboards and KPIs</Typography>
        <ThemeDropdown />
      </Box>

      {successMessage && (
        <Box className="mb-4 p-3 bg-green-100 text-green-700 rounded border border-green-300">{successMessage}</Box>
      )}

      {/* KPI Cards */}
      <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {[
          { label: 'Materials', value: stats.materials, icon: <Package className="w-8 h-8" /> },
          { label: 'Recipes', value: stats.recipes, icon: <ClipboardList className="w-8 h-8" /> },
          { label: 'Microdosing', value: stats.activeOrders, icon: <Activity className="w-8 h-8" /> },
          { label: 'Completed Batches', value: stats.completedBatches, icon: <CheckCircle className="w-8 h-8" /> }
        ].map(({ label, value, icon }) => {
          const percentage = animatedPercentages[label] || 0;
          const lightColor = lightenColor(themeColor, 40);
          const darkColor = lightenColor(themeColor, -20);
          return (
            <Box
              key={label}
              className="rounded-2xl p-6 flex items-center justify-between gap-4 min-h-[140px] transition-transform duration-300 hover:-translate-y-2 hover:shadow-2xl"
              style={{
                background: `linear-gradient(to bottom right, ${lightenColor(themeColor, 20)}, ${darkenColor(themeColor, 10)})`,
                color: cardTextColor,
                boxShadow: `0 8px 20px ${themeColor}80`
              }}
            >

              <div className="flex flex-col items-start">
                <p className="text-sm opacity-80">{label}</p>
                <h3 className="text-2xl font-bold">{value}</h3>
                <Link to={label === 'Materials' ? '/material' : label === 'Active Orders' ? '/activeorders' : `/${label.toLowerCase().replace(' ', '-')}`} className="text-xs underline mt-1" style={{ color: cardTextColor }}>View All</Link>
              </div>
              <div className="relative flex items-center justify-center w-24 h-24 rounded-full" style={{
                background: `conic-gradient(${lightColor} 0% ${percentage}%, #e0e0e0 ${percentage}% 100%)`,
                border: `2px solid ${themeColor}`,
                boxShadow: `0 0 25px ${themeColor}80`,
                transition: 'background 2s ease, box-shadow 2s ease, border 1s ease'
              }}>
                <div className="flex items-center justify-center w-20 h-20 rounded-full absolute" style={{
                  backgroundColor: themeColor,
                  border: `2px solid ${themeColor}`,
                  boxShadow: `0 0 12px ${themeColor}80`,
                  transition: 'background 1s ease, box-shadow 1s ease, border 1s ease'
                }}>
                  <div className="text-2xl" style={{ color: cardTextColor }}>{icon}</div>
                </div>
              </div>
            </Box>
          );
        })}
      </Box>

      {/* Bar + Pie (Doughnut) Charts */}
      <Box className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Product Distribution (Bar Chart) */}
        <Card style={{ backgroundColor: isDarkMode ? '#1e293b' : '#fff', color: isDarkMode ? '#e0f7ff' : '#000' }}>
          <CardContent>
            <Typography variant="h6" className="mb-4">Material Distribution</Typography>
            <Box className="h-80 p-4">
              <Bar
                ref={barChartRef}
                options={{
                  ...chartOptions,
                  plugins: {
                    ...chartOptions.plugins,
                    legend: { display: true },
                  },
                  scales: {
                    ...chartOptions.scales,
                    x: { grid: { color: 'transparent' }, ticks: { color: isDarkMode ? '#e0f7ff' : '#374151' } },
                    y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: isDarkMode ? '#e0f7ff' : '#374151' } }
                  },
                  elements: {
                    bar: {
                      borderRadius: 8,
                      backgroundColor: (context) => {
                        const gradient = context.chart.ctx.createLinearGradient(0, 0, 0, 400);
                        gradient.addColorStop(0, themeColor);                      // Start with theme color
                        gradient.addColorStop(1, lightenColor(themeColor, 50));    // End with a lighter (but solid) theme color
                        return gradient;
                      },

                      borderSkipped: false,
                    }
                  }
                }}
                data={{
                  labels: productChart.labels,
                  datasets: [{
                    label: 'Material Usage',
                    data: productChart.data,
                    borderWidth: 2,
                    hoverBorderWidth: 3
                  }]
                }}
              />
            </Box>
          </CardContent>
        </Card>

        {/* By Product (Doughnut Chart) */}
        <Card style={{ backgroundColor: isDarkMode ? '#1e293b' : '#fff', color: isDarkMode ? '#e0f7ff' : '#000' }}>
          <CardContent>
            <Typography variant="h6" className="mb-4">By Material</Typography>
            <Box className="relative flex justify-center items-center" style={{ height: '250px', width: '250px', margin: '0 auto' }}>
              <Doughnut
                data={{
                  labels: productChart.labels,
                  datasets: [{
                    data: productChart.data,
                    backgroundColor: pieColors,
                    borderWidth: 6,
                    borderColor: isDarkMode ? '#1e293b' : '#f5f5f5',
                    hoverOffset: 12
                  }]
                }}
                options={{
                  responsive: true,
                  cutout: '60%',
                  plugins: {
                    legend: { display: false },
                    tooltip: { enabled: true },
                    // THIS is just data, no drawing here
                    doughnutCenterText: {
                      text: `Total Materials ${stats.materials}`,
                      color: getContrastColor(themeColor)
                    }
                  }
                }}
                plugins={[{
                  id: 'doughnutCenterText',
                  beforeDraw(chart) {
                    const { width, height, ctx } = chart;
                    ctx.restore();
                    const fontSize = Math.min(width, height) / 15;
                    ctx.font = `${fontSize}px sans-serif`;
                    ctx.textBaseline = 'middle';

                    const { text } = chart.options.plugins.doughnutCenterText;
                    const textX = Math.round((width - ctx.measureText(text).width) / 2);
                    const textY = height / 2;

                    // 👉 Dynamically detect theme and set text color
                    const themeIsDark = document.body.classList.contains('dark-mode');
                    ctx.fillStyle = themeIsDark ? '#ffffff' : '#000000';

                    ctx.fillText(text, textX, textY);
                    ctx.save();
                  }
                }]}

              />
            </Box>
            {/* Custom Legend */}
            <div className="grid grid-cols-2 gap-2 mt-6 text-sm">
              {productChart.labels.map((label, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: pieColors[index] }} />
                  <span className="truncate">{label}</span>
                </div>
              ))}
            </div>


          </CardContent>
        </Card>

      </Box>


      {/* Historical KPI + Statistics Line Charts */}
      <Box className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Tolerance Historical KPI */}
        <Card style={{ backgroundColor: isDarkMode ? '#1e293b' : '#fff', color: isDarkMode ? '#e0f7ff' : '#000' }}>
          <CardContent>
            <Typography variant="h6" className="mb-4">Tolerance Historical KPI</Typography>
            <Box className="h-80 p-4">
              <Bar ref={historicalChartRef} options={chartOptions} data={{ labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"], datasets: [{ label: "Tolerance %", data: [96, 89, 94, 90, 92], backgroundColor: kpiColors }] }} />
            </Box>
          </CardContent>
        </Card>

        {/* Statistics Line Chart */}
        <Card style={{ backgroundColor: isDarkMode ? '#1e293b' : '#fff', color: isDarkMode ? '#e0f7ff' : '#000' }}>
          <CardContent>
            <Typography variant="h6" className="mb-4">Statistics</Typography>
            <Box className="h-80 p-4">
              <Line options={{ ...chartOptions, elements: { line: { tension: 0.4 } } }} data={{
                labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
                datasets: [
                  { label: 'Batches', data: [12, 19, 3, 5, 2, 3, 9, 7, 11, 15, 8, 10], borderColor: '#7C3AED', backgroundColor: 'rgba(124, 58, 237, 0.2)', fill: true },
                  { label: 'Materials', data: [10, 15, 6, 8, 7, 5, 6, 8, 7, 10, 5, 8], borderColor: '#06B6D4', backgroundColor: 'rgba(6, 182, 212, 0.2)', fill: true }
                ]
              }} />
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* New four charts section */}
      <Box className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Performance Radar Chart */}
        <Card style={{ backgroundColor: isDarkMode ? '#1e293b' : '#fff', color: isDarkMode ? '#e0f7ff' : '#000' }}>
          <CardContent>
            <Typography variant="h6" className="mb-4">Performance</Typography>
            <Box className="h-80 p-4">
              <Radar options={{ ...chartOptions, scales: { r: { grid: { color: '#D1D5DB' }, pointLabels: { color: cardTextColor } } } }} data={{
                labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
                datasets: [
                  { label: 'Income', data: [65, 59, 90, 81, 56, 55], backgroundColor: 'rgba(124, 58, 237, 0.2)', borderColor: '#7C3AED' },
                  { label: 'Earnings', data: [28, 48, 40, 19, 96, 27], backgroundColor: 'rgba(6, 182, 212, 0.2)', borderColor: '#06B6D4' }
                ]
              }} />
            </Box>
          </CardContent>
        </Card>

        {/* Activity Line Chart */}
        <Card style={{ backgroundColor: isDarkMode ? '#1e293b' : '#fff', color: isDarkMode ? '#e0f7ff' : '#000' }}>
          <CardContent>
            <Typography variant="h6" className="mb-4">Activity (Last 3 Days)</Typography>
            <Box className="h-80 p-4">
              <Line options={{ ...chartOptions, elements: { line: { tension: 0.4 } } }} data={{
                labels: ["August", "September", "October"],
                datasets: [
                  { label: 'Activity', data: [609, 2390, 705], borderColor: '#3B82F6', backgroundColor: 'rgba(59, 130, 246, 0.2)', fill: true }
                ]
              }} />
            </Box>
          </CardContent>
        </Card>

        {/* Yearly Expense Bar Chart */}
        <Card className="col-span-2" style={{ backgroundColor: isDarkMode ? '#1e293b' : '#fff', color: isDarkMode ? '#e0f7ff' : '#000' }}>
          <CardContent>
            <Typography variant="h6" className="mb-4">Yearly Expense</Typography>
            <Box className="h-96 p-4">
              <Bar options={chartOptions} data={{
                labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
                datasets: [
                  { label: '2015', data: [40, 60, 30, 50, 60, 70], backgroundColor: '#7C3AED' },
                  { label: '2016', data: [30, 50, 25, 35, 45, 60], backgroundColor: '#06B6D4' },
                  { label: '2017', data: [20, 40, 20, 25, 35, 40], backgroundColor: '#10B981' }
                ]
              }} />
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default Dashboard;