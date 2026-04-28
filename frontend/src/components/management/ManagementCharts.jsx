import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

export default function ManagementCharts({ stats }) {
  const soaData = {
    labels: ['Clear Balance', 'Debt Recovery'],
    datasets: [{
      data: [stats?.positive || 0, stats?.negative || 0],
      backgroundColor: ['#22c55e', '#ef4444'],
      borderWidth: 0,
      borderRadius: 10,
    }],
  };

  const deptLabels = Object.keys(stats?.departmentDistribution || {});
  const deptValues = Object.values(stats?.departmentDistribution || {});

  const deptData = {
    labels: deptLabels.map(d => d.toUpperCase()),
    datasets: [{
      label: 'Units',
      data: deptValues,
      backgroundColor: '#7f6421',
      borderRadius: 8,
    }],
  };

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    // Disable Chart.js animation so it doesn't "pop" after the page loads
    animation: { duration: 0 }, 
    plugins: {
      legend: { display: false }
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-8">
      {/* Chart 1: SOA Composition */}
      <div className="bg-[#7f6421]/[0.04] p-6 rounded-[32px] border border-[#7f6421]/10 flex flex-col items-center h-[350px]">
        <h3 className="text-[10px] font-black text-[#7f6421]/60 uppercase tracking-widest mb-6">SOA Portfolio Health</h3>
        <div className="flex-1 w-full">
          <Doughnut data={soaData} options={{ ...commonOptions, cutout: '70%', plugins: { legend: { display: true, position: 'bottom' } } }} />
        </div>
      </div>

      {/* Chart 2: Department Load */}
      <div className="bg-[#7f6421]/[0.04] p-6 rounded-[32px] border border-[#7f6421]/10 h-[350px]">
        <h3 className="text-[10px] font-black text-[#7f6421]/60 uppercase tracking-widest mb-6">Unit Workload Distribution</h3>
        <div className="flex-1 w-full">
          <Bar 
            data={deptData} 
            options={{ 
              ...commonOptions, 
              scales: { 
                y: { beginAtZero: true, grid: { display: false } },
                x: { grid: { display: false } }
              } 
            }} 
          />
        </div>
      </div>
    </div>
  );
}