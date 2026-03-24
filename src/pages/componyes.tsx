import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { MoreVertical } from "lucide-react";
import { authorsData, projectsData } from "@/lib/data";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { get, post } from "@/hooks/http";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export default function Tables() {
  const [componys, setComponys] = useState([]);
  const { toast } = useToast();
  const navigate = useNavigate();



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






  return (
    <div className="h-full overflow-y-auto p-6 custom-scrollbar">
      <div className="space-y-6">
        {/* Authors Table */}
        <Card className="border-stone-200">

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-stone-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">
                      AUTHOR
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">
                      FUNCTION
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">
                      STATUS
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">
                      EMPLOYED
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">
                      ACTION
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-stone-200">
                  {componys.map((author: any, index) => (
                    <tr key={index} className="hover:bg-stone-50" onClick={() => navigate(`/employees/${author.compony_code}`)} >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={author.avatar} alt={author.name} />
                            <AvatarFallback>
                              {author.name.split(' ').map((n: any) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="ml-4">
                            <div className="text-sm font-normal text-stone-900">{author?.name}</div>
                            <div className="text-sm text-stone-500">{author?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {/* <div className="text-sm text-stone-900">{author.role}</div>
                        <div className="text-sm text-stone-500">{author.department}</div> */}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant={author.status === 'pending' ? 'default' : 'secondary'}
                          className={cn(
                            author.status === 'pending'
                              ? 'bg-green-100 text-green-800 hover:bg-green-100'
                              : 'bg-stone-100 text-stone-800 hover:bg-stone-100'
                          )}
                        >
                          {author.status === 'active' ? 'Active' : 'pending'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500">
                        {author.employed}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-normal">
                        {author.status === 'pending' && <div className="flex gap-2">
                          <Button variant="default" size="sm" onClick={() => updateStatus(author.compony_code, 'active')} >
                            Approve
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => updateStatus(author.compony_code, 'rejected')}>
                            Reject
                          </Button></div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>


      </div>
    </div>
  );
}
