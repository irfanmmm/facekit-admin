import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Code, CheckCircle2, Loader2, ArrowRight, History, Terminal, FileCode, Check, AlertCircle } from "lucide-react";
import { post } from "@/hooks/http";
import { useToast } from "@/hooks/use-toast";

const AlignedCodeView = ({ lines, variant }: { lines: any[]; variant: 'original' | 'modified' }) => {
  return (
    <div className="flex font-mono text-[11px] leading-5 min-w-full">
      <div className="w-10 select-none text-right pr-2 text-stone-600 border-r border-stone-800/50 bg-stone-900/20 py-2 shrink-0">
        {lines.map((line, i) => (
          <div key={i} className="h-5">{line.type !== 'empty' ? i + 1 : ''}</div>
        ))}
      </div>
      <div className="flex-1 overflow-x-auto bg-stone-950 py-2">
        {lines.map((line, i) => (
          <div 
            key={i} 
            className={`px-3 h-5 whitespace-pre min-w-max ${
              line.type === 'removed' ? 'bg-rose-950/40 text-rose-300' : 
              line.type === 'added' ? 'bg-emerald-950/40 text-emerald-300' :
              line.type === 'empty' ? 'bg-stone-900/10' : 'text-stone-400'
            }`}
          >
            {line.type === 'removed' ? '- ' : line.type === 'added' ? '+ ' : '  '}
            {line.text}
          </div>
        ))}
      </div>
    </div>
  );
};

export function AIEvolutionDialog({ isOpen, onOpenChange, company }: any) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [suggestion, setSuggestion] = useState<any>(null);
  const [sandboxResult, setSandboxResult] = useState<any>(null);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const { toast } = useToast();

  const handleSuggest = async () => {
    if (!prompt) return;
    setLoading(true);
    setSuggestion(null);
    try {
      const { data } = await post("/admin/evolution/suggest-change", { prompt });
      if (data.status.startsWith("success")) {
        setSuggestion(data.suggestion);
        setSandboxResult(data.sandbox_result);
        setActiveFileIndex(0);
        toast({ title: "Evolution Generated", description: `Analyzed ${data.suggestion.file_evolutions.length} files.` });
      } else {
        toast({ title: "Failed", description: data.message, variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const currentFile = suggestion?.file_evolutions[activeFileIndex];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[98vw] w-full h-[95vh] flex flex-col p-0 border-stone-200 overflow-hidden shadow-2xl bg-white">
        <DialogHeader className="p-4 border-b bg-white shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-indigo-600" />
              <div>
                <DialogTitle className="text-lg font-black uppercase tracking-tight">Evolve {company?.compony_name}</DialogTitle>
                <DialogDescription className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Autonomous Multi-File Evolution Engine</DialogDescription>
              </div>
            </div>
            {suggestion && (
              <Badge variant="outline" className={`h-7 px-4 font-black text-[10px] uppercase ${sandboxResult?.success ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}>
                Sandbox: {sandboxResult?.success ? "Passed" : "Failed"}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col bg-stone-50 overflow-hidden">
          <div className="p-4 shrink-0">
            <div className="bg-white rounded-xl border p-3 shadow-sm flex gap-3">
              <Textarea 
                placeholder="Describe changes..." 
                value={prompt} 
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[50px] resize-none border-none bg-stone-50 focus-visible:ring-0 text-sm font-bold"
              />
              <Button onClick={handleSuggest} disabled={loading || !prompt} className="bg-indigo-600 px-8 rounded-lg">
                {loading ? <Loader2 className="animate-spin" /> : <ArrowRight />}
              </Button>
            </div>
          </div>

          {suggestion ? (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="px-4 flex gap-2 mb-2 overflow-x-auto shrink-0">
                {suggestion.file_evolutions.map((fe: any, i: number) => (
                  <button
                    key={i}
                    onClick={() => setActiveFileIndex(i)}
                    className={`px-4 py-2 rounded-t-lg text-[10px] font-black uppercase tracking-widest border-t border-x transition-all ${
                      activeFileIndex === i ? "bg-white border-stone-200 text-indigo-600" : "bg-stone-100 border-transparent text-stone-400 hover:bg-stone-200"
                    }`}
                  >
                    <FileCode className="h-3 w-3 inline mr-2" />
                    {fe.file_path.split('/').pop()}
                  </button>
                ))}
              </div>

              <div className="flex-1 flex flex-col bg-white border-t mx-4 mb-4 rounded-b-xl shadow-sm overflow-hidden border-stone-200">
                <Tabs defaultValue="diff" className="flex-1 flex flex-col">
                  <div className="px-4 border-b flex items-center justify-between shrink-0">
                    <TabsList className="bg-transparent h-10 gap-6">
                      <TabsTrigger value="diff" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 font-bold text-[10px] uppercase">Comparison</TabsTrigger>
                      <TabsTrigger value="strategy" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 font-bold text-[10px] uppercase">Strategy</TabsTrigger>
                    </TabsList>
                    <span className="text-[10px] font-mono text-stone-400">{currentFile?.file_path}</span>
                  </div>

                  <TabsContent value="diff" className="flex-1 m-0 p-0 relative">
                    <div className="grid grid-cols-2 h-full divide-x divide-stone-800 bg-stone-950">
                      <div className="flex flex-col min-h-0">
                        <div className="px-3 py-1 bg-stone-900 text-[9px] font-black text-stone-500 border-b border-stone-800 flex items-center gap-2"><History className="h-3 w-3" /> ORIGINAL</div>
                        <ScrollArea className="flex-1"><AlignedCodeView lines={currentFile.original_aligned} variant="original" /></ScrollArea>
                      </div>
                      <div className="flex flex-col min-h-0">
                        <div className="px-3 py-1 bg-indigo-950/30 text-[9px] font-black text-indigo-400 border-b border-indigo-900/30 flex items-center gap-2"><Sparkles className="h-3 w-3" /> EVOLVED</div>
                        <ScrollArea className="flex-1"><AlignedCodeView lines={currentFile.modified_aligned} variant="modified" /></ScrollArea>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="strategy" className="flex-1 p-6 overflow-y-auto space-y-6">
                    <div className="p-6 rounded-2xl bg-indigo-50/30 border border-indigo-100">
                      <h4 className="text-xs font-black text-indigo-900 uppercase mb-3">AI Explanation</h4>
                      <p className="text-sm font-bold text-indigo-800 leading-relaxed">{suggestion.explanation}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {suggestion.test_cases.map((t: string, i: number) => (
                        <div key={i} className="p-4 rounded-xl border bg-stone-50/50 flex items-start gap-3">
                          <Check className="h-4 w-4 text-emerald-600 mt-0.5" />
                          <p className="text-xs font-bold text-stone-600">{t}</p>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center opacity-30">
              <Terminal className="h-12 w-12 mb-4" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Awaiting Input</span>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 border-t bg-white shrink-0">
          <div className="flex items-center justify-between w-full">
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-[10px] font-black uppercase text-stone-400">Cancel</Button>
            {suggestion && (
              <Button disabled={!sandboxResult?.success || applying} onClick={() => onOpenChange(false)} className="bg-indigo-600 h-10 px-10 rounded-xl font-black text-xs transition-all active:scale-95">
                {applying ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 className="mr-2" />}
                APPROVE & DEPLOY
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
