import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScanFace, SlidersHorizontal, Upload, UserX, X } from "lucide-react";
import { post } from "@/hooks/http";
import { useToast } from "@/hooks/use-toast";
import { employeePhotoUrl } from "@/lib/employeePhoto";
import { cn } from "@/lib/utils";

interface FaceSearchDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    componyId: string | undefined;
    onSelectEmployee: (emp: any) => void;
}

const DEFAULT_THRESHOLD = 0.85;

export function FaceSearchDialog({ open, onOpenChange, componyId, onSelectEmployee }: FaceSearchDialogProps) {
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [imageBase64, setImageBase64] = useState<string | null>(null);
    const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD);
    const [searching, setSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Reset everything each time the dialog is opened fresh.
    useEffect(() => {
        if (open) {
            setPreviewUrl(null);
            setImageBase64(null);
            setThreshold(DEFAULT_THRESHOLD);
            setSearching(false);
            setHasSearched(false);
            setResults([]);
            setError(null);
            setIsDragging(false);
        }
    }, [open]);

    const loadFile = (file: File | undefined | null) => {
        if (!file) return;

        setHasSearched(false);
        setResults([]);
        setError(null);

        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = reader.result as string;
            setPreviewUrl(dataUrl);
            setImageBase64(dataUrl.split(",")[1] || null);
        };
        reader.readAsDataURL(file);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => loadFile(e.target.files?.[0]);

    const handleDrop = (e: React.DragEvent<HTMLButtonElement>) => {
        e.preventDefault();
        setIsDragging(false);
        loadFile(e.dataTransfer.files?.[0]);
    };

    const handleSearch = async () => {
        if (!imageBase64) return;
        setSearching(true);
        setError(null);
        setResults([]);
        try {
            const res = await post("/admin/search-face", {
                compony_code: componyId,
                image: imageBase64,
                threshold,
            });
            setResults(res.data?.results || []);
            if (res.data?.threshold !== undefined) {
                setThreshold(res.data.threshold);
            }
        } catch (err: any) {
            console.error("Error searching face:", err);
            const message = err?.response?.data?.message || "Face search failed";
            setError(message);
            toast({ title: "Search failed", description: message, variant: "destructive" });
        } finally {
            setSearching(false);
            setHasSearched(true);
        }
    };

    const handleClear = () => {
        setPreviewUrl(null);
        setImageBase64(null);
        setHasSearched(false);
        setResults([]);
        setError(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl h-[85vh] flex flex-col p-0">
                <style>{`
                    @keyframes facekit-scanline {
                        0%   { top: 2%;  opacity: 0; }
                        12%  { opacity: 1; }
                        88%  { opacity: 1; }
                        100% { top: 96%; opacity: 0; }
                    }
                    @keyframes facekit-scan-pulse {
                        0%, 100% { opacity: 0.35; }
                        50%      { opacity: 0.9; }
                    }
                    .facekit-scanline {
                        animation: facekit-scanline 1.8s ease-in-out infinite;
                    }
                    .facekit-scan-corner {
                        animation: facekit-scan-pulse 1.8s ease-in-out infinite;
                    }
                `}</style>
                <DialogHeader className="p-6 pb-4 border-b border-stone-100">
                    <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
                            <ScanFace className="h-5 w-5" />
                        </div>
                        <div className="pt-0.5">
                            <DialogTitle className="text-lg">Search by Photo</DialogTitle>
                            <p className="text-sm text-stone-500 mt-1">
                                Upload a photo to find a matching employee in this company. Uses the same face-recognition matching as live attendance punches.
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 min-h-0 overflow-y-auto p-6 custom-scrollbar space-y-6">
                    {/* Upload / preview area */}
                    <div className="flex flex-col items-center gap-4">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                        />

                        {previewUrl ? (
                            <div className="relative w-56 h-56 rounded-2xl overflow-hidden border-2 border-stone-200 shadow-md bg-stone-100">
                                <img src={previewUrl} alt="Uploaded face" className="w-full h-full object-cover" />

                                {searching && (
                                    <>
                                        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 via-transparent to-indigo-500/10" />
                                        <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-[0_0_14px_3px_rgba(99,102,241,0.85)] facekit-scanline" />
                                        <div className="absolute top-1.5 left-1.5 w-5 h-5 border-t-2 border-l-2 border-indigo-400 rounded-tl facekit-scan-corner" />
                                        <div className="absolute top-1.5 right-1.5 w-5 h-5 border-t-2 border-r-2 border-indigo-400 rounded-tr facekit-scan-corner" />
                                        <div className="absolute bottom-1.5 left-1.5 w-5 h-5 border-b-2 border-l-2 border-indigo-400 rounded-bl facekit-scan-corner" />
                                        <div className="absolute bottom-1.5 right-1.5 w-5 h-5 border-b-2 border-r-2 border-indigo-400 rounded-br facekit-scan-corner" />
                                    </>
                                )}

                                {!searching && (
                                    <button
                                        type="button"
                                        onClick={handleClear}
                                        className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors shadow-sm"
                                        title="Remove photo"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={handleDrop}
                                className={cn(
                                    "w-full max-w-xs h-56 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-3",
                                    isDragging
                                        ? "border-indigo-400 bg-indigo-50/70 scale-[1.02]"
                                        : "border-stone-300 hover:border-indigo-400 hover:bg-indigo-50/40"
                                )}
                            >
                                <div className={cn(
                                    "w-14 h-14 rounded-full flex items-center justify-center transition-colors",
                                    isDragging ? "bg-indigo-100 text-indigo-600" : "bg-stone-100 text-stone-400"
                                )}>
                                    <Upload className="h-6 w-6" />
                                </div>
                                <div className="text-center px-6">
                                    <span className="block text-sm font-semibold text-stone-700">Click to upload a photo</span>
                                    <span className="block text-xs text-stone-400 mt-1">or drag and drop — JPG or PNG</span>
                                </div>
                            </button>
                        )}

                        {searching && (
                            <div className="flex items-center justify-center gap-1 text-indigo-700 font-medium text-sm">
                                <span>Analyzing face</span>
                                <span className="flex gap-0.5 ml-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                                </span>
                            </div>
                        )}

                        {previewUrl && !searching && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                Choose a different photo
                            </Button>
                        )}
                    </div>

                    {/* Threshold control — only affects this search, never the fixed live-matching threshold */}
                    <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-5 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <SlidersHorizontal className="h-3.5 w-3.5 text-stone-400" />
                                <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Match Sensitivity</label>
                            </div>
                            <Badge className="bg-indigo-50 text-indigo-700 border-none font-mono text-xs">
                                {threshold.toFixed(2)}
                            </Badge>
                        </div>
                        <Slider
                            value={[threshold]}
                            onValueChange={([v]) => setThreshold(v)}
                            min={0.3}
                            max={1.2}
                            step={0.01}
                            disabled={searching}
                        />
                        <div className="flex justify-between text-[10px] font-semibold text-stone-400 uppercase tracking-wide px-0.5">
                            <span>Strict</span>
                            <span>Balanced</span>
                            <span>Loose</span>
                        </div>
                        <p className="text-[11px] text-stone-400 leading-relaxed pt-1 border-t border-stone-100">
                            Lower = stricter (only very close matches). Higher = looser (more, less confident matches). Only applies to this search — live attendance matching always stays fixed.
                        </p>
                    </div>

                    {/* Results */}
                    {error && (
                        <div className="flex flex-col items-center gap-2 text-center text-stone-500 text-sm py-6 bg-red-50/50 border border-red-100 rounded-2xl">
                            <UserX className="h-5 w-5 text-red-400" />
                            {error}
                        </div>
                    )}

                    {!error && hasSearched && !searching && (
                        results.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 text-center text-stone-400 text-sm py-10 bg-stone-50 border border-stone-100 rounded-2xl">
                                <UserX className="h-6 w-6 text-stone-300" />
                                No matching employee found within this threshold.
                                <span className="text-xs">Try loosening the sensitivity above, or upload a clearer photo.</span>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest">
                                    {results.length} match{results.length > 1 ? "es" : ""} found
                                </h4>
                                {results.map((emp: any, idx: number) => (
                                    <button
                                        key={emp.employee_code}
                                        type="button"
                                        onClick={() => onSelectEmployee(emp)}
                                        className="w-full flex items-center gap-4 p-3 rounded-xl border border-stone-200 hover:border-indigo-200 hover:shadow-md hover:bg-indigo-50/30 transition-all text-left group"
                                    >
                                        <div className="relative shrink-0">
                                            <Avatar className="w-12 h-12 ring-2 ring-white shadow-sm">
                                                <AvatarImage
                                                    src={employeePhotoUrl(emp.image)}
                                                    className="object-cover"
                                                />
                                                <AvatarFallback>
                                                    {emp.fullname?.split(' ').map((n: any) => n[0]).join('')?.substring(0, 2)}
                                                </AvatarFallback>
                                            </Avatar>
                                            {idx === 0 && (
                                                <span className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shadow ring-2 ring-white">
                                                    1
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-stone-900 truncate">{emp.fullname}</div>
                                            <div className="text-xs text-stone-500">{emp.employee_code}</div>
                                        </div>
                                        <Badge className="bg-green-50 text-green-700 border border-green-200 text-[10px] uppercase tracking-wide shrink-0 group-hover:bg-green-100 transition-colors">
                                            Distance {emp.distance.toFixed(3)}
                                        </Badge>
                                    </button>
                                ))}
                            </div>
                        )
                    )}
                </div>

                <DialogFooter className="p-4 border-t border-stone-100 gap-2">
                    <Button variant="secondary" onClick={() => onOpenChange(false)}>Close</Button>
                    <Button onClick={handleSearch} disabled={!imageBase64 || searching} className="gap-2">
                        <ScanFace className="h-4 w-4" />
                        {searching ? "Searching..." : "Search"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
