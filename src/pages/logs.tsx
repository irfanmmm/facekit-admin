import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, Trash2, TerminalSquare } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { get } from "@/hooks/http";
import { useToast } from "@/hooks/use-toast";

export default function Logs() {
    const [logs, setLogs] = useState<string[]>([]);
    const [isPaused, setIsPaused] = useState(false);
    const logsEndRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (isPaused) return;

        const token = localStorage.getItem('token');
        const eventSource = new EventSource(`http://localhost:5001/admin/live-logs?token=${token}`);

        eventSource.onmessage = function(event) {
            setLogs((prev) => [...prev, event.data]);
        };

        eventSource.onerror = function(error) {
            console.error("EventSource streaming error:", error);
        };

        return () => {
            eventSource.close();
        };
    }, [isPaused]);

    const clearLogs = () => {
        setLogs([]);
        toast({ title: "Terminal cleared" });
    };

    const togglePause = () => {
        setIsPaused(!isPaused);
    };

    useEffect(() => {
        if (!isPaused && logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [logs, isPaused]);

    return (
        <div className="h-full overflow-y-auto p-6 custom-scrollbar">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-stone-900">Live Backend Logs</h1>
                        <p className="text-sm text-stone-500">Real-time system output and application events</p>
                    </div>
                </div>

                <Card className="border-stone-200 shadow-sm overflow-hidden flex flex-col h-[70vh]">
                    <CardHeader className="bg-stone-50 border-b border-stone-200 py-3 flex flex-row items-center justify-between space-y-0">
                        <div className="flex items-center space-x-2 text-stone-700">
                            <TerminalSquare className="w-5 h-5" />
                            <CardTitle className="text-sm font-medium">server.log</CardTitle>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button 
                                variant={isPaused ? "default" : "secondary"} 
                                size="sm" 
                                className="h-8"
                                onClick={togglePause}
                            >
                                {isPaused ? <Play className="w-4 h-4 mr-1" /> : <Pause className="w-4 h-4 mr-1" />}
                                {isPaused ? "Resume" : "Pause"}
                            </Button>
                            <Button variant="outline" size="sm" className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={clearLogs}>
                                <Trash2 className="w-4 h-4 mr-1" />
                                Clear
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 bg-[#1e1e1e] overflow-hidden relative">
                        <div className="absolute inset-0 overflow-y-auto p-4 font-mono text-sm leading-relaxed custom-scrollbar text-stone-300">
                            {logs.length === 0 ? (
                                <div className="text-stone-500 italic">Waiting for incoming logs...</div>
                            ) : (
                                logs.map((log, index) => (
                                    <div key={index} className="break-words">
                                        <span className="text-green-500 mr-2">➜</span>
                                        {typeof log === 'object' ? JSON.stringify(log) : log}
                                    </div>
                                ))
                            )}
                            <div ref={logsEndRef} />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
