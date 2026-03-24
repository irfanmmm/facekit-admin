import { StatsGrid } from "@/components/dashboard/stats-grid";
import { ProjectsTable } from "@/components/dashboard/projects-table";
import { ChartsShowcase } from "@/components/dashboard/charts-showcase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import peopleBackground from "/images/material-persons.jpg";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { useEffect, useState } from "react";
import { get } from "@/hooks/http";

const faceMatchingConfig = {
  success: {
    label: "Success",
    color: "#22c55e",
  },
  failures: {
    label: "Failures",
    color: "#ef4444",
  },
};

export default function Dashboard() {
  const [stats, setStats] = useState<{ chartData: any[]; totalRequests: number } | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await get("/admin/dashboard-stats");
        const data = res.data; 
        
        if (data && Array.isArray(data.dates)) {
          const formattedData = data.dates.map((date: string, index: number) => ({
            date: date,
            success: data.success?.[index] || 0,
            failures: data.failures?.[index] || 0,
          }));
          
          setStats({
            chartData: formattedData,
            totalRequests: data.total_requests || 0
          });
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      }
    };
    
    fetchStats();
  }, []);

  return (
    <div className="h-full overflow-y-auto p-6 custom-scrollbar">
      {/* Hero Card with Background Image */}
      <Card className="relative mb-8 border border-stone-200 bg-white overflow-hidden">
        <div
          className="relative h-64 bg-cover bg-top bg-no-repeat"
          style={{ backgroundImage: `url(${peopleBackground})` }}
        >
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0"></div>

          {/* Content */}
          <div className="relative z-10 p-8 flex items-center h-full">
            <div className="max-w-lg">
              <h2 className="text-3xl font-bold text-white mb-4">
                Build Amazing Teams
              </h2>
              <p className="text-stone-200 text-lg mb-6 leading-relaxed">
                Connect with diverse talent and create inclusive workspaces that
                drive innovation. Discover how our platform helps you build
                stronger teams.
              </p>  
              <Button
                size="lg"
                className="px-6 py-3 shadow-sm hover:shadow-md bg-stone-800 hover:bg-stone-700 relative bg-gradient-to-b from-stone-700 to-stone-800 border border-stone-900 text-stone-50 hover:bg-gradient-to-b hover:from-stone-800 hover:to-stone-800 hover:border-stone-900 after:absolute after:inset-0 after:rounded-[inherit] after:box-shadow after:shadow-[inset_0_1px_0px_rgba(255,255,255,0.25),inset_0_-2px_0px_rgba(0,0,0,0.35)] after:pointer-events-none duration-300 ease-in align-middle select-none font-sans text-center antialiased"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Face Matching Stats Chart */}
      <Card className="mb-8 border-stone-200 bg-white">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-stone-900">Face Matching Activity</CardTitle>
          <p className="text-sm text-stone-500">
            Success and failure rates across dates (Total Requests: {stats ? stats.totalRequests : '...'})
          </p>
        </CardHeader>
        <CardContent>
          <ChartContainer config={faceMatchingConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.chartData || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-stone-200" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  className="text-xs text-stone-600"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  className="text-xs text-stone-600"
                  axisLine={false}
                  tickLine={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} cursor={{fill: 'rgba(0,0,0,0.05)'}} />
                <Bar
                  dataKey="success"
                  fill="#22c55e"
                  radius={[4, 4, 0, 0]}
                  name="Success"
                />
                <Bar
                  dataKey="failures"
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                  name="Failures"
                />
                <ChartLegend content={<ChartLegendContent />} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
{/* 
      <StatsGrid />
      <ProjectsTable />
      <ChartsShowcase /> */}
    </div>
  );
}
