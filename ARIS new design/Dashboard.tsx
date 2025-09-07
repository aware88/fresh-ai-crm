import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  TrendingUp, 
  Users, 
  Mail, 
  Target, 
  ArrowUpRight, 
  ArrowDownRight,
  Brain,
  Clock,
  MessageSquare
} from "lucide-react"

export default function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your sales performance overview.</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,547</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
              12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24.5%</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
              5.2% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15,234</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
              2% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$52,340</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
              18% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Training Progress */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Training Progress
            </CardTitle>
            <CardDescription>
              Your ARIS AI is learning from your sales patterns
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Voice Pattern Analysis</span>
                <span>85%</span>
              </div>
              <Progress value={85} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Email Sequence Learning</span>
                <span>92%</span>
              </div>
              <Progress value={92} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Prospect Behavior Modeling</span>
                <span>67%</span>
              </div>
              <Progress value={67} className="h-2" />
            </div>
            <Button className="w-full mt-4">
              <Brain className="h-4 w-4 mr-2" />
              Enhance AI Training
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates from your campaigns</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div className="space-y-1">
                <p className="text-sm font-medium">New lead converted</p>
                <p className="text-xs text-muted-foreground">Sarah Chen from TechCorp</p>
                <p className="text-xs text-muted-foreground">2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Email sequence completed</p>
                <p className="text-xs text-muted-foreground">Q4 Outreach Campaign</p>
                <p className="text-xs text-muted-foreground">1 hour ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Follow-up scheduled</p>
                <p className="text-xs text-muted-foreground">Mike Johnson - Demo call</p>
                <p className="text-xs text-muted-foreground">3 hours ago</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle>Active Campaigns</CardTitle>
          <CardDescription>Monitor your ongoing sales campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-4">
                <MessageSquare className="h-8 w-8 text-blue-500" />
                <div>
                  <h4 className="font-medium">Q4 Enterprise Outreach</h4>
                  <p className="text-sm text-muted-foreground">Targeting Fortune 500 companies</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant="secondary">Active</Badge>
                <div className="text-right">
                  <p className="text-sm font-medium">156 emails sent</p>
                  <p className="text-xs text-muted-foreground">23% open rate</p>
                </div>
                <Button variant="outline" size="sm">View</Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-4">
                <Clock className="h-8 w-8 text-orange-500" />
                <div>
                  <h4 className="font-medium">SaaS Startup Follow-up</h4>
                  <p className="text-sm text-muted-foreground">Re-engaging warm leads</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant="outline">Scheduled</Badge>
                <div className="text-right">
                  <p className="text-sm font-medium">Starts tomorrow</p>
                  <p className="text-xs text-muted-foreground">89 prospects</p>
                </div>
                <Button variant="outline" size="sm">Edit</Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-4">
                <Target className="h-8 w-8 text-green-500" />
                <div>
                  <h4 className="font-medium">Product Demo Series</h4>
                  <p className="text-sm text-muted-foreground">Converting trial users</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant="secondary">Active</Badge>
                <div className="text-right">
                  <p className="text-sm font-medium">12 demos booked</p>
                  <p className="text-xs text-muted-foreground">67% attendance</p>
                </div>
                <Button variant="outline" size="sm">View</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}