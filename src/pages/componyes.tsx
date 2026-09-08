import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { MoreVertical, Plus, Settings as SettingsIcon, KeyRound } from "lucide-react";
import { authorsData, projectsData } from "@/lib/data";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { get, post } from "@/hooks/http";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { AIEvolutionDialog } from "@/components/AIEvolutionDialog";
import { Sparkles } from "lucide-react";

export default function Tables() {
  const [componys, setComponys] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    compony_name: "",
    name: "",
    email: "",
    password: "",
    mobile_no: "",
    emp_count: "0",
  });
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [settings, setSettings] = useState<{ setting_name: string; value: boolean }[]>([]);
  const [isEvolutionOpen, setIsEvolutionOpen] = useState(false);
  const [isCredentialsOpen, setIsCredentialsOpen] = useState(false);
  const [credentialsCompany, setCredentialsCompany] = useState<any>(null);
  const [credentialsForm, setCredentialsForm] = useState({ admin_username: "", admin_password: "" });
  const [savingCredentials, setSavingCredentials] = useState(false);




  const getComponys = () => {
    get("/admin/componys").then((res) => {
      console.log(res.data);
      if (res.data.componys.length > 0) {
        setComponys(res.data.componys);
      }
    })
  }

  useEffect(() => {
    getComponys();
  }, []);

  const updateStatus = async (id: string, status: "active" | "rejected") => {
    const { data } = await post(`/admin/update-client-status`, { compony_code: id, status });

    if (data.message === 'success') {
      getComponys();
      toast({ title: `Compony ${status === 'active' ? 'approved' : 'rejected'} successfully` });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {

    //   compony_name = data.get("compony_name")
    // _name = data.get("name")
    // email = data.get("email")
    // password = data.get("password")
    // mobile_no = data.get("mobile_no")
    // emp_count = data.get("emp_count")
    // client = data.get("client")
      const { data } = await post("/admin/register", formData);
      toast({ title: "Company registered successfully" });
      setIsDialogOpen(false);
      setFormData({ name: "", compony_name: "", email: "", password: "", mobile_no: "", emp_count: "0" });
      getComponys();
    } catch (error) {
      toast({ title: "Failed to register company", variant: "destructive" });
    }
  };

  const toggleSetting = async (id: string, value: boolean) => {
    const { data } = await post(`/admin/update-settings`, { compony_code: id, value, settings: "settings_enabled" });
    if (data.message === 'success') {
      getComponys();
      toast({ title: `Setting ${value ? 'enabled' : 'disabled'} successfully` });
    }
  };

  const openCredentials = (company: any) => {
    setCredentialsCompany(company);
    setCredentialsForm({ admin_username: "", admin_password: "" });
    setIsCredentialsOpen(true);
  };

  const handleSaveCredentials = async () => {
    if (!credentialsForm.admin_username || !credentialsForm.admin_password) {
      toast({ title: "Username and password are required", variant: "destructive" });
      return;
    }
    setSavingCredentials(true);
    try {
      const { data } = await post("/admin/set-portal-credentials", {
        compony_code: credentialsCompany.compony_code,
        admin_username: credentialsForm.admin_username,
        admin_password: credentialsForm.admin_password,
      });
      if (data.message === "success") {
        toast({ title: "Portal credentials saved", description: `${credentialsCompany.compony_name} can now sign in with these credentials.` });
        setIsCredentialsOpen(false);
      } else {
        toast({ title: data.message || "Failed to save credentials", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: error?.response?.data?.message || "Failed to save credentials", variant: "destructive" });
    } finally {
      setSavingCredentials(false);
    }
  };

  const fetchSettings = async (company: any) => {
    setSelectedCompany(company);
    setIsSettingsOpen(true);
    const { data } = await post("/admin/list-settings", { compony_code: company.compony_code });
    if (data.settings) {
      setSettings(data.settings);
    }
  };

  const handleToggleSetting = async (settingName: string, newValue: boolean) => {
    // Optimistic update
    setSettings(prev => prev.map(s => s.setting_name === settingName ? { ...s, value: newValue } : s));

    try {
      const { data } = await post(`/admin/update-settings`, {
        compony_code: selectedCompany.compony_code,
        settings: settingName,
        value: newValue
      });

      if (data.message === 'success') {
        toast({ title: `${settingName} ${newValue ? 'enabled' : 'disabled'} successfully` });
      } else {
        // Revert on failure
        setSettings(prev => prev.map(s => s.setting_name === settingName ? { ...s, value: !newValue } : s));
        toast({ title: "Failed to update setting", variant: "destructive" });
      }
    } catch (error) {
      setSettings(prev => prev.map(s => s.setting_name === settingName ? { ...s, value: !newValue } : s));
      toast({ title: "Error updating setting", variant: "destructive" });
    }
  };







  return (
    <div className="h-full overflow-y-auto p-6 custom-scrollbar">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-stone-900">Companies</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-stone-900 hover:bg-stone-800 text-white">
              <Plus className="mr-2 h-4 w-4" /> Register New Company
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Register New Company</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleRegister} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                <Input id="name" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter full name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="compony_name" className="text-sm font-medium">Company Name</Label>
                <Input id="compony_name" required value={formData.compony_name} onChange={(e) => setFormData({ ...formData, compony_name: e.target.value })} placeholder="Enter company name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email ID</Label>
                <Input id="email" type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <Input id="password" type="password" required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="••••••••" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mobile_no" className="text-sm font-medium">Mobile No</Label>
                  <Input id="mobile_no" type="number" required value={formData.mobile_no} onChange={(e) => setFormData({ ...formData, mobile_no: e.target.value })} placeholder="Mobile number" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emp_count" className="text-sm font-medium">Employee Count</Label>
                  <Input id="emp_count" type="number" required value={formData.emp_count} onChange={(e) => setFormData({ ...formData, emp_count: e.target.value })} placeholder="Count" />
                </div>
              </div>
              <Button type="submit" className="w-full bg-stone-900 hover:bg-stone-800 text-white mt-4">Register Company</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        <Card className="border-stone-200 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-stone-50/50 border-b border-stone-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-stone-400 uppercase tracking-widest">Company Lead</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-stone-400 uppercase tracking-widest">Business Info</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-stone-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-stone-400 uppercase tracking-widest">Staff Count</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-stone-400 uppercase tracking-widest text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {componys.map((author: any, index) => (
                    <tr 
                      key={index} 
                      className="group hover:bg-stone-50/80 cursor-pointer transition-colors" 
                      onClick={() => navigate(`/employees/${author.compony_code}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border border-stone-200 shadow-sm">
                            <AvatarImage src={author.avatar} />
                            <AvatarFallback className="bg-stone-100 text-stone-600 font-bold">
                              {author.name ? author.name.split(' ').map((n: any) => n[0]).join('') : 'C'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-sm font-bold text-stone-900">{author?.name}</div>
                            <div className="text-xs text-stone-500">{author?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-stone-800">{author.compony_name}</div>
                        <div className="text-xs text-stone-500 font-medium">Code: {author.compony_code}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border-none",
                          author.status === 'active' ? "bg-green-100 text-green-700" :
                            author.status === 'pending' ? "bg-amber-100 text-amber-700" :
                              "bg-rose-100 text-rose-700"
                        )}>
                          {author.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-stone-700">{author.emp_count || 0}</span>
                          <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Members</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => {
                              setSelectedCompany(author);
                              setIsEvolutionOpen(true);
                            }}
                            className="h-8 w-8 text-indigo-400 hover:text-indigo-900 hover:bg-indigo-50 transition-all"
                            title="AI Evolution"
                          >
                            <Sparkles className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => fetchSettings(author)}
                            className="h-8 w-8 text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-all"
                            title="Settings"
                          >
                            <SettingsIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openCredentials(author)}
                            className="h-8 w-8 text-amber-500 hover:text-amber-700 hover:bg-amber-50 transition-all"
                            title="Portal Login Credentials"
                          >
                            <KeyRound className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b border-stone-100">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-stone-50 flex items-center justify-center border border-stone-100">
                <SettingsIcon className="h-5 w-5 text-stone-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-stone-900">Platform Configuration</DialogTitle>
                <p className="text-xs text-stone-500 font-medium">{selectedCompany?.compony_name}</p>
              </div>
            </div>
            <Button 
              onClick={() => {
                setIsSettingsOpen(false);
                setIsEvolutionOpen(true);
              }}
              variant="outline" 
              className="mt-4 w-full border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 text-indigo-700 font-bold py-5"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Add New Feature with AI
            </Button>
          </DialogHeader>
          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {settings.length > 0 ? (
              settings.map((setting, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-xl border border-stone-100 bg-stone-50/30 hover:bg-stone-50 transition-colors">
                  <div className="space-y-1">
                    <Label className="text-sm font-bold text-stone-800 capitalize">{setting.setting_name.replace(/_/g, ' ')}</Label>
                    <p className="text-[11px] text-stone-500 leading-tight">Control visibility and access for this feature.</p>
                  </div>
                  <Switch
                    checked={setting.value}
                    onCheckedChange={(checked) => handleToggleSetting(setting.setting_name, checked)}
                    className="data-[state=checked]:bg-stone-900"
                  />
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-stone-400">
                <div className="relative w-10 h-10 mb-4">
                  <div className="absolute inset-0 rounded-full border-2 border-stone-100"></div>
                  <div className="absolute inset-0 rounded-full border-2 border-stone-900 border-t-transparent animate-spin"></div>
                </div>
                <p className="text-xs font-bold uppercase tracking-widest">Syncing Settings...</p>
              </div>
            )}
          </div>
          <div className="p-4 bg-stone-50 border-t border-stone-100 flex justify-end">
            <Button variant="secondary" onClick={() => setIsSettingsOpen(false)} className="text-xs font-bold uppercase tracking-widest">Close</Button>
          </div>
        </DialogContent>
      </Dialog>
      <AIEvolutionDialog
        isOpen={isEvolutionOpen}
        onOpenChange={setIsEvolutionOpen}
        company={selectedCompany}
      />

      <Dialog open={isCredentialsOpen} onOpenChange={setIsCredentialsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Admin Portal Login</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-stone-500">
              Set a dedicated username and password for <span className="font-semibold text-stone-800">{credentialsCompany?.compony_name}</span> to sign in to this admin portal.
              They will only be able to see and manage employees for <span className="font-semibold text-stone-800">{credentialsCompany?.compony_code}</span>.
            </p>
            <div className="space-y-2">
              <Label htmlFor="admin_username" className="text-sm font-medium">Username</Label>
              <Input
                id="admin_username"
                value={credentialsForm.admin_username}
                onChange={(e) => setCredentialsForm({ ...credentialsForm, admin_username: e.target.value })}
                placeholder="e.g. a100-admin"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin_password" className="text-sm font-medium">Password</Label>
              <Input
                id="admin_password"
                type="text"
                value={credentialsForm.admin_password}
                onChange={(e) => setCredentialsForm({ ...credentialsForm, admin_password: e.target.value })}
                placeholder="Set a password"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsCredentialsOpen(false)} disabled={savingCredentials}>Cancel</Button>
            <Button onClick={handleSaveCredentials} disabled={savingCredentials}>
              {savingCredentials ? "Saving..." : "Save Credentials"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

}
