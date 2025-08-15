"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Loader2,
  LogOut,
  Users,
  FileSpreadsheet,
  Database,
  Shield,
  Activity,
  ExternalLink,
  RefreshCw,
  Settings,
  CheckCircle,
  Trophy,
  PlusCircle,
  ListChecks,
  BarChart2,
} from "lucide-react"
import { AddSheetDialog } from "@/components/add-sheet-dialog"
import { ConfigureSheetDialog } from "@/components/configure-sheet-dialog"
import { useToast } from "@/hooks/use-toast"

interface SystemStats {
  totalUsers: number
  activeJudges: number
  connectedSheets: number
  lastSync: string
}

interface UserData {
  username: string
  role: string
  lastLogin: string
  status: string
}

interface SheetConfig {
  name: string
  id: string
  status: string
  lastAccessed: string
}

export interface TopProjectSummary {
  standard: string
  rank: number
  projectId: string
  projectTitle: string
  theme: string
  projectAvgScore: number
  studentNames: string
}

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [users, setUsers] = useState<UserData[]>([])
  const [sheets, setSheets] = useState<SheetConfig[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [processingScores, setProcessingScores] = useState(false)
  const [processMessage, setProcessMessage] = useState("")
  const [topProjectsSummary, setTopProjectsSummary] = useState<TopProjectSummary[]>([])
  const router = useRouter()
  const [isAddSheetDialogOpen, setIsAddSheetDialogOpen] = useState(false)
  const [isConfigureSheetDialogOpen, setIsConfigureSheetDialogOpen] = useState(false)
  const [currentConfiguringClass, setCurrentConfiguringClass] = useState("")
  const [currentConfiguringSheetId, setCurrentConfiguringSheetId] = useState("")
  const { toast } = useToast()

  const loadDashboardData = useCallback(async () => {
    setLoading(true)
    setError("")

    try {
      // Simulate loading admin data
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setStats({
        totalUsers: 5,
        activeJudges: 3,
        connectedSheets: 10,
        lastSync: new Date().toLocaleString(),
      })

      setUsers([
        { username: "admin1", role: "Admin", lastLogin: "2024-01-15 10:30 AM", status: "Active" },
        { username: "judge1", role: "Judge", lastLogin: "2024-01-15 09:15 AM", status: "Active" },
        { username: "judge2", role: "Judge", lastLogin: "2024-01-14 02:45 PM", status: "Active" },
        { username: "judge3", role: "Judge", lastLogin: "2024-01-13 11:20 AM", status: "Active" },
        { username: "testuser", role: "Judge", lastLogin: "2024-01-12 03:45 PM", status: "Inactive" },
      ])

      // Fetch class sheet IDs from the server
      const idsResponse = await fetch("/api/admin/class-sheet-ids")
      const idsData = await idsResponse.json()
      if (idsData.success) {
        const classSheets = Object.entries(idsData.ids).map(([className, sheetId]) => ({
          name: `${className} Projects`,
          id: sheetId as string,
          status: "Connected",
          lastAccessed: new Date().toLocaleString(), // You can fetch real lastAccessed if available
        }))
        setSheets([
          {
            name: "Login Credentials",
            id: "1snk-FZaxyZbSu_Ww-oPnam8JxZ2RLg3etI5TBkr-T1A",
            status: "Connected",
            lastAccessed: "2024-01-15 10:30 AM",
          },
          ...classSheets,
        ])
      } else {
        setError(idsData.error || "Failed to load class sheet IDs.")
      }

      // Fetch top projects summary
      const summaryResponse = await fetch("/api/admin/summary")
      const summaryData = await summaryResponse.json()
      if (summaryData.success) {
        setTopProjectsSummary(summaryData.summary)
      } else {
        console.error("Failed to fetch admin summary:", summaryData.error)
        setError(summaryData.error || "Failed to load top projects summary.")
      }
    } catch (error) {
      setError("Failed to load dashboard data")
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      const parsedUser = JSON.parse(userData)
      if (parsedUser.role === "Admin") {
        setUser(parsedUser)
        loadDashboardData()
      } else {
        router.push("/")
      }
    } else {
      router.push("/")
    }
    setInitialLoading(false)
  }, [router, loadDashboardData])

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/")
  }

  const handleRefreshData = () => {
    loadDashboardData()
  }

  const handleProcessAllScores = async () => {
    setProcessingScores(true)
    setProcessMessage("")
    setError("")
    try {
      const response = await fetch("/api/admin/process-scores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })
      const data = await response.json()
      if (data.success) {
        setProcessMessage(data.message)
        // Refresh dashboard data after processing to show updated summary
        loadDashboardData()
      } else {
        setError(data.error || "Failed to process scores.")
      }
    } catch (err) {
      setError("Network error or server issue while processing scores.")
    } finally {
      setProcessingScores(false)
      setTimeout(() => setProcessMessage(""), 5000) // Clear message after 5 seconds
    }
  }

  const handleAddSheet = (className: string, newSheetId: string) => {
    const newSheet = {
      name: `${className} Projects`,
      id: newSheetId,
      status: "Connected",
      lastAccessed: new Date().toLocaleString(),
    }
    setSheets((prevSheets) => [...prevSheets, newSheet])
    console.log(`Added new sheet: Class Name: ${className}, Sheet ID: ${newSheetId}`)
    // In a real application, you would send this to your backend to update SPREADSHEET_CONFIG
  }

  const handleConfigureSheetClick = (sheetName: string, sheetId: string) => {
    // Extract class name from sheetName (e.g., "Class 4 Projects" -> "Class 4")
    const classNameMatch = sheetName.match(/Class (\d+)/)
    const extractedClassName = classNameMatch ? `Class ${classNameMatch[1]}` : sheetName

    setCurrentConfiguringClass(extractedClassName)
    setCurrentConfiguringSheetId(sheetId)
    setIsConfigureSheetDialogOpen(true)
  }

  const handleConfigureSheetSave = async (className: string, newSheetId: string) => {
    try {
      const response = await fetch("/api/admin/configure-sheet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ className, newSheetId }),
      })
      const data = await response.json()
      if (data.success) {
        toast({
          title: "Sheet Linked Successfully",
          description: `The sheet for ${className} has been updated to ID: ${newSheetId}.`,
        })
        // Update the local state to reflect the change
        setSheets((prevSheets) =>
          prevSheets.map((sheet) =>
            sheet.name.includes(className)
              ? { ...sheet, id: newSheetId, lastAccessed: new Date().toLocaleString() }
              : sheet,
          ),
        )
      } else {
        setError(data.error || "Failed to update sheet configuration.")
      }
    } catch (err) {
      setError("Network error or server issue while configuring sheet.")
    }
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#9B5A44]" />
          <p className="text-[#9B5A44]">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b-4 border-[#F5BD3A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <Settings className="h-6 w-6 text-[#9B5A44] mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-[#9B5A44]">Admin Dashboard</h1>
                <p className="text-sm text-[#D99058] font-medium">AURA V - The Way to Shine in KREA</p>
                <p className="text-xs text-[#9B5A44]/70">Welcome, Admin {user.username}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={handleRefreshData}
                disabled={loading}
                className="border-[#9B5A44] text-[#9B5A44] hover:bg-[#9B5A44] hover:text-white bg-transparent"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="border-[#9B5A44] text-[#9B5A44] hover:bg-[#9B5A44] hover:text-white bg-transparent"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Process Message Display */}
          {processMessage && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{processMessage}</AlertDescription>
            </Alert>
          )}

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="shadow-lg border-2 border-[#9B5A44]/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.activeJudges} Judges, {stats.totalUsers - stats.activeJudges} Admin
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-2 border-[#9B5A44]/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Connected Sheets</CardTitle>
                  <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.connectedSheets}</div>
                  <p className="text-xs text-muted-foreground">All sheets operational</p>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-2 border-[#9B5A44]/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">System Status</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">Online</div>
                  <p className="text-xs text-muted-foreground">All systems operational</p>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-2 border-[#9B5A44]/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Last Sync</CardTitle>
                  <Database className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-bold">{stats.lastSync.split(" ")[1]}</div>
                  <p className="text-xs text-muted-foreground">{stats.lastSync.split(" ")[0]}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Admin Features */}
          <Card className="shadow-lg border-2 border-[#9B5A44]/20">
            <CardHeader>
              <CardTitle>Admin Actions</CardTitle>
              <CardDescription>Perform key administrative tasks for the science fair.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Button
                  variant="outline"
                  className="h-24 flex-col items-center justify-center text-lg bg-white hover:bg-[#9B5A44] hover:text-white border-[#9B5A44]/20"
                >
                  <Users className="h-8 w-8 mb-2 text-[#9B5A44]" />
                  User Management
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex-col items-center justify-center text-lg bg-white hover:bg-[#9B5A44] hover:text-white border-[#9B5A44]/20"
                  onClick={handleProcessAllScores}
                  disabled={processingScores}
                >
                  {processingScores ? (
                    <>
                      <Loader2 className="h-8 w-8 animate-spin mb-2 text-[#9B5A44]" />
                      <span className="text-[#9B5A44]">Processing Scores...</span>
                    </>
                  ) : (
                    <>
                      <ListChecks className="h-8 w-8 mb-2 text-[#9B5A44]" />
                      Process All Scores
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex-col items-center justify-center text-lg bg-white hover:bg-[#9B5A44] hover:text-white border-[#9B5A44]/20"
                >
                  <BarChart2 className="h-8 w-8 mb-2 text-blue-600" />
                  View Analytics
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Top Projects Summary */}
          <Card className="shadow-lg border-2 border-[#9B5A44]/20">
            <CardHeader className="bg-gradient-to-r from-[#9B5A44] to-[#D99058] text-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Trophy className="mr-2 h-5 w-5 text-white" />
                    Top Projects Summary
                  </CardTitle>
                  <CardDescription className="text-amber-100">
                    Ranked projects based on average judge scores across all criteria.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    // Assuming ADMIN_MASTER_SPREADSHEET_ID is available in SPREADSHEET_CONFIG
                    window.open(
                      `https://docs.google.com/spreadsheets/d/${process.env.ADMIN_MASTER_SPREADSHEET_ID}`,
                      "_blank",
                    )
                  }
                  className="border-[#9B5A44] text-[#9B5A44] hover:bg-[#9B5A44] hover:text-white"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open Master Sheet
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2 text-[#9B5A44]" />
                  <span>Loading top projects...</span>
                </div>
              ) : topProjectsSummary.length > 0 ? (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Standard</TableHead>
                        <TableHead>Rank</TableHead>
                        <TableHead>Project ID</TableHead>
                        <TableHead>Project Title</TableHead>
                        <TableHead>Theme</TableHead>
                        <TableHead className="text-right">Avg Score</TableHead>
                        <TableHead>Student Names</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topProjectsSummary.map((project, index) => (
                        <TableRow key={`${project.standard}-${project.projectId}-${index}`}>
                          <TableCell className="font-medium">{project.standard}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-lg font-bold bg-yellow-100 text-yellow-800">
                              {project.rank}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-blue-600">{project.projectId}</TableCell>
                          <TableCell>{project.projectTitle}</TableCell>
                          <TableCell>{project.theme}</TableCell>
                          <TableCell className="text-right font-bold text-green-700">
                            {project.projectAvgScore.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-sm text-gray-700">{project.studentNames}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Trophy className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">No top projects found</p>
                  <p className="text-sm">Click "Process All Scores" to generate the rankings.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="sheets" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="users">User Management</TabsTrigger>
              <TabsTrigger value="sheets">Google Sheets</TabsTrigger>
              <TabsTrigger value="settings">System Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-4">
              <Card className="shadow-lg border-2 border-[#9B5A44]/20">
                <CardHeader className="bg-gradient-to-r from-[#9B5A44] to-[#D99058] text-white rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center">
                        <Users className="mr-2 h-5 w-5 text-white" />
                        User Accounts
                      </CardTitle>
                      <CardDescription className="text-amber-100">
                        Manage user accounts and their access levels.
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-[#9B5A44] text-[#9B5A44] hover:bg-[#9B5A44] hover:text-white bg-transparent"
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add User
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mr-2 text-[#9B5A44]" />
                      <span>Loading users...</span>
                    </div>
                  ) : (
                    <div className="rounded-md border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Username</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Last Login</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {users.map((user) => (
                            <TableRow key={user.username}>
                              <TableCell className="font-medium">{user.username}</TableCell>
                              <TableCell>
                                <Badge variant={user.role === "Admin" ? "default" : "secondary"}>{user.role}</Badge>
                              </TableCell>
                              <TableCell>{user.lastLogin}</TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={user.status === "Active" ? "text-green-600" : "text-gray-500"}
                                >
                                  {user.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="sm">
                                  Edit
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sheets" className="space-y-4">
              <Card className="shadow-lg border-2 border-[#9B5A44]/20">
                <CardHeader className="bg-gradient-to-r from-[#9B5A44] to-[#D99058] text-white rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center">
                        <Database className="mr-2 h-5 w-5 text-white" />
                        Google Sheets Configuration
                      </CardTitle>
                      <CardDescription className="text-amber-100">
                        Manage connected Google Sheets and their configurations.
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddSheetDialogOpen(true)}
                      className="border-[#9B5A44] text-[#9B5A44] hover:bg-[#9B5A44] hover:text-white"
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Sheet
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mr-2 text-[#9B5A44]" />
                      <span>Loading sheets...</span>
                    </div>
                  ) : (
                    <div className="rounded-md border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Sheet Name</TableHead>
                            <TableHead>Spreadsheet ID</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Last Accessed</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sheets.map((sheet) => (
                            <TableRow key={sheet.id}>
                              <TableCell className="font-medium">{sheet.name}</TableCell>
                              <TableCell className="font-mono text-sm">{sheet.id}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-green-600">
                                  {sheet.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm">{sheet.lastAccessed}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      window.open(`https://docs.google.com/spreadsheets/d/${sheet.id}`, "_blank")
                                    }
                                    className="border-[#9B5A44] text-[#9B5A44] hover:bg-[#9B5A44] hover:text-white"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleConfigureSheetClick(sheet.name, sheet.id)}
                                    className="border-[#9B5A44] text-[#9B5A44] hover:bg-[#9B5A44] hover:text-white"
                                  >
                                    Configure
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Card className="shadow-lg border-2 border-[#9B5A44]/20">
                  <CardHeader className="bg-gradient-to-r from-[#9B5A44] to-[#D99058] text-white rounded-t-lg">
                    <CardTitle className="flex items-center">
                      <Database className="mr-2 h-5 w-5 text-white" />
                      Google Sheets API
                    </CardTitle>
                    <CardDescription className="text-amber-100">
                      Configure API settings and credentials.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium">Service Account</h4>
                        <p className="text-sm text-muted-foreground">Authentication status</p>
                      </div>
                      <Badge variant="outline" className="text-green-600">
                        Connected
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium">API Quota</h4>
                        <p className="text-sm text-muted-foreground">Daily usage limit</p>
                      </div>
                      <span className="text-sm">85% used</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full bg-white hover:bg-[#9B5A44] hover:text-white border-[#9B5A44]/20"
                    >
                      Configure API Settings
                    </Button>
                  </CardContent>
                </Card>

                <Card className="shadow-lg border-2 border-[#9B5A44]/20">
                  <CardHeader className="bg-gradient-to-r from-[#9B5A44] to-[#D99058] text-white rounded-t-lg">
                    <CardTitle className="flex items-center">
                      <Shield className="mr-2 h-5 w-5 text-white" />
                      Security Settings
                    </CardTitle>
                    <CardDescription className="text-amber-100">Manage security and access controls.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium">Session Timeout</h4>
                        <p className="text-sm text-muted-foreground">Auto logout after inactivity</p>
                      </div>
                      <span className="text-sm">30 minutes</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium">Two-Factor Auth</h4>
                        <p className="text-sm text-muted-foreground">Enhanced security</p>
                      </div>
                      <Badge variant="outline">Disabled</Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full bg-white hover:bg-[#9B5A44] hover:text-white border-[#9B5A44]/20"
                    >
                      Configure Security
                    </Button>
                  </CardContent>
                </Card>

                <Card className="shadow-lg border-2 border-[#9B5A44]/20">
                  <CardHeader className="bg-gradient-to-r from-[#9B5A44] to-[#D99058] text-white rounded-t-lg">
                    <CardTitle className="flex items-center">
                      <Activity className="mr-2 h-5 w-5 text-white" />
                      System Monitoring
                    </CardTitle>
                    <CardDescription className="text-amber-100">Monitor system performance and health.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium">Uptime</h4>
                        <p className="text-sm text-muted-foreground">System availability</p>
                      </div>
                      <span className="text-sm text-green-600">99.9%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium">Response Time</h4>
                        <p className="text-sm text-muted-foreground">Average API response</p>
                      </div>
                      <span className="text-sm">245ms</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full bg-white hover:bg-[#9B5A44] hover:text-white border-[#9B5A44]/20"
                    >
                      View Detailed Metrics
                    </Button>
                  </CardContent>
                </Card>

                <Card className="shadow-lg border-2 border-[#9B5A44]/20">
                  <CardHeader className="bg-gradient-to-r from-[#9B5A44] to-[#D99058] text-white rounded-t-lg">
                    <CardTitle className="flex items-center">
                      <FileSpreadsheet className="mr-2 h-5 w-5 text-white" />
                      Data Management
                    </CardTitle>
                    <CardDescription className="text-amber-100">Backup and export options.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium">Last Backup</h4>
                        <p className="text-sm text-muted-foreground">Automatic daily backup</p>
                      </div>
                      <span className="text-sm">Today 2:00 AM</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium">Export Format</h4>
                        <p className="text-sm text-muted-foreground">Data export options</p>
                      </div>
                      <span className="text-sm">CSV, JSON</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full bg-white hover:bg-[#9B5A44] hover:text-white border-[#9B5A44]/20"
                    >
                      Configure Backups
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        <AddSheetDialog
          isOpen={isAddSheetDialogOpen}
          onClose={() => setIsAddSheetDialogOpen(false)}
          onAddSheet={handleAddSheet}
        />
        <ConfigureSheetDialog
          isOpen={isConfigureSheetDialogOpen}
          onClose={() => setIsConfigureSheetDialogOpen(false)}
          className={currentConfiguringClass}
          currentSheetId={currentConfiguringSheetId}
          onSave={handleConfigureSheetSave}
        />
      </main>
    </div>
  )
}
