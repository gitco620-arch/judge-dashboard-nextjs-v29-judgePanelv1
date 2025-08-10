"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, LogOut, RefreshCw, ExternalLink, Database, Clock, Star, FileSpreadsheet, CheckCircle } from 'lucide-react'

export default function JudgeDashboard() {
  const [user, setUser] = useState<any>(null)
  const [selectedClass, setSelectedClass] = useState("")
  const [projects, setProjects] = useState<string[]>([])
  const [selectedProject, setSelectedProject] = useState("")
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState("")
  const [lastUpdated, setLastUpdated] = useState<string>("")
  const [apiInfo, setApiInfo] = useState<any>(null)
  const router = useRouter()
  const [checkingProjectStatus, setCheckingProjectStatus] = useState<string | null>(null);
  const [judgedProjects, setJudgedProjects] = useState<Set<string>>(new Set());

  const classes = ["Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"]

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      const parsedUser = JSON.parse(userData)
      if (parsedUser.role === "Judge") {
        setUser(parsedUser)
      } else {
        router.push("/")
      }
    } else {
      router.push("/")
    }
    setInitialLoading(false)
  }, [router])

  useEffect(() => {
    if (selectedClass && user?.username) {
      fetchProjectsAndJudgedStatus(selectedClass, user.username);
    }
  }, [selectedClass, user]);

  const fetchProjectsAndJudgedStatus = async (className: string, judgeName: string) => {
    setLoading(true)
    setError("")
    setSelectedProject("")
    setJudgedProjects(new Set());
    try {
      const projectsResponse = await fetch(`/api/projects?class=${encodeURIComponent(className)}`)
      const projectsData = await projectsResponse.json()
      if (projectsData.success) {
        setProjects(projectsData.projects)
        setApiInfo(projectsData)
        const judgeScoresResponse = await fetch(
          `/api/judge-scores?class=${encodeURIComponent(className)}&judge=${encodeURIComponent(judgeName)}&project=all`,
        )
        const judgeScoresData = await judgeScoresResponse.json()
        if (judgeScoresData.success) {
          const scoredProjectIds = new Set<string>();
          judgeScoresData.scores.forEach((score: any) => {
            scoredProjectIds.add(score.projectId);
          });
          setJudgedProjects(scoredProjectIds);
        } else {
          console.error("Failed to fetch judge's scores:", judgeScoresData.error);
          setError(judgeScoresData.error || "Failed to load your judging history.");
        }
        setLastUpdated(new Date().toLocaleString())
      } else {
        setError(projectsData.error || "Failed to fetch projects from Google Sheets")
        setProjects([])
      }
    } catch (error) {
      setError("Network error. Please check your connection.")
      setProjects([])
    } finally {
      setLoading(false)
    }
  }

  const handleClassChange = (className: string) => {
    setSelectedClass(className)
    setSelectedProject("")
    // The useEffect above will trigger fetchProjectsAndJudgedStatus
  }

  const handleProjectSelect = async (projectId: string) => {
    if (judgedProjects.has(projectId)) {
      setError(`You have already submitted scores for Project ${projectId}. Scores cannot be modified once saved.`)
      return;
    }
    setCheckingProjectStatus(projectId);
    setError("");
    try {
      const response = await fetch(
        `/api/judge-scores?class=${encodeURIComponent(selectedClass)}&judge=${encodeURIComponent(user.username)}&project=${encodeURIComponent(projectId)}`,
      )
      const data = await response.json()
      if (data.success && data.scores.length > 0) {
        setError(`You have already submitted scores for Project ${projectId}. Scores cannot be modified once saved.`)
        setJudgedProjects(prev => new Set(prev).add(projectId));
        setCheckingProjectStatus(null);
        return;
      }
    } catch (checkError) {
      console.error("Error checking existing scores:", checkError)
      setError("Failed to check existing scores. Please try again.")
      setCheckingProjectStatus(null);
      return;
    }
    router.push(`/judge-panel?class=${encodeURIComponent(selectedClass)}&project=${encodeURIComponent(projectId)}`)
    setCheckingProjectStatus(null);
  }

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/")
  }

  const handleRefresh = () => {
    if (selectedClass) {
      fetchProjectsAndJudgedStatus(selectedClass, user.username)
    }
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Star className="h-6 w-6 text-blue-600 mr-3" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Judge Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome, Judge {user.username}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-green-600">
                <Database className="mr-1 h-3 w-3" />
                BaseSheet Connected
              </Badge>
              <Button variant="outline" onClick={() => router.push("/judge-scores")}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                View My Scores
              </Button>
              <Button variant="outline" onClick={handleLogout}>
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
          {/* Class Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="mr-2 h-5 w-5" />
                Select Class & Project
              </CardTitle>
              <CardDescription>
                Choose a class to view available projects from BaseSheet, then select a project to start judging
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Class</label>
                  <Select value={selectedClass} onValueChange={handleClassChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((className) => (
                        <SelectItem key={className} value={className}>
                          {className}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  {selectedClass && (
                    <Button
                      variant="outline"
                      onClick={handleRefresh}
                      disabled={loading}
                      className="w-full bg-transparent"
                    >
                      <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                      Refresh Projects
                    </Button>
                  )}
                </div>
              </div>

              {apiInfo && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-800">Connected to BaseSheet</p>
                      <p className="text-xs text-blue-600 font-mono">{apiInfo.spreadsheetId}</p>
                      <p className="text-xs text-blue-600">Range: {apiInfo.range}</p>
                      <p className="text-xs text-blue-500">Judge sheets will be created automatically</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        window.open(`https://docs.google.com/spreadsheets/d/${apiInfo.spreadsheetId}`, "_blank")
                      }
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Projects Display */}
          {selectedClass && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <Star className="mr-2 h-5 w-5" />
                      Available Projects - {selectedClass}
                    </CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      {loading ? (
                        <>
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          Loading projects from BaseSheet...
                        </>
                      ) : (
                        <>
                          <Clock className="mr-1 h-3 w-3" />
                          {projects.length} projects available for judging
                          {lastUpdated && ` • Last updated: ${lastUpdated}`}
                        </>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">{selectedClass}</Badge>
                    {!loading && projects.length > 0 && (
                      <Badge variant="outline" className="text-green-600">
                        Ready to Judge
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                      <p className="text-lg font-medium text-gray-700 mb-2">Loading Projects</p>
                      <p className="text-sm text-gray-500">Fetching unique Project IDs from BaseSheet...</p>
                    </div>
                  </div>
                ) : projects.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">#</TableHead>
                          <TableHead>Project ID</TableHead>
                          <TableHead>Class</TableHead>
                          <TableHead>Source</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {projects.map((projectId, index) => {
                          const isJudged = judgedProjects.has(projectId);
                          const isChecking = checkingProjectStatus === projectId;
                          return (
                            <TableRow key={projectId} className="hover:bg-gray-50">
                              <TableCell className="font-medium">{index + 1}</TableCell>
                              <TableCell className="font-mono text-lg font-bold text-blue-600">{projectId}</TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="text-xs">
                                  {selectedClass}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  <Database className="mr-1 h-3 w-3" />
                                  BaseSheet
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={isJudged ? "text-purple-600 text-xs" : "text-green-600 text-xs"}>
                                  {isJudged ? "Judged" : "Ready to Judge"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  onClick={() => handleProjectSelect(projectId)}
                                  className={isJudged ? "bg-gray-400 hover:bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}
                                  disabled={isJudged || loading || isChecking}
                                >
                                  {isJudged ? (
                                    <>
                                      <CheckCircle className="mr-1 h-4 w-4" />
                                      Scored
                                    </>
                                  ) : isChecking ? (
                                    <>
                                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                                      Checking...
                                    </>
                                  ) : (
                                    <>
                                      <Star className="mr-1 h-4 w-4" />
                                      Start Judging
                                    </>
                                  )}
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : !error ? (
                  <div className="text-center py-12 text-gray-500">
                    <Database className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">No projects found</p>
                    <p className="text-sm">The BaseSheet for {selectedClass} appears to be empty</p>
                    <Button
                      variant="outline"
                      className="mt-4 bg-transparent"
                      onClick={() =>
                        window.open(`https://docs.google.com/spreadsheets/d/${apiInfo?.spreadsheetId}`, "_blank")
                      }
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open BaseSheet
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )}

          {!selectedClass && (
            <Card>
              <CardContent className="text-center py-16">
                <div className="text-gray-500">
                  <Star className="h-20 w-20 mx-auto mb-6 text-gray-300" />
                  <p className="text-xl font-medium mb-3">Welcome to Judge Panel</p>
                  <p className="text-sm mb-6">Select a class to view available projects and start judging</p>
                  <div className="bg-blue-50 p-4 rounded-lg max-w-md mx-auto">
                    <p className="text-sm text-blue-800 font-medium mb-2">🎯 How it works:</p>
                    <div className="text-xs text-blue-600 space-y-1 text-left">
                      <p>1. Select a class to load projects from BaseSheet</p>
                      <p>2. Choose a Project ID to view all students</p>
                      <p>3. Enter scores for each judging criteria</p>
                      <p>4. Scores are saved to your personal Judge sheet</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
