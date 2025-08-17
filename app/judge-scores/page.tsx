"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ArrowLeft, FileSpreadsheet, RefreshCw, Database, Clock } from "lucide-react"

interface JudgeScore {
  sno: string
  studentName: string
  grade: string
  projectTitle: string
  projectId: string
  creativity: number | null
  scientificThought: number | null
  technicalSkills: number | null
  presentation: number | null
  status?: string // Added status field
  themeFit?: string // Added themeFit field
}

export default function JudgeScoresPage() {
  const [user, setUser] = useState<any>(null)
  const [selectedClass, setSelectedClass] = useState("")
  const [scores, setScores] = useState<JudgeScore[]>([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState("")
  const [lastUpdated, setLastUpdated] = useState<string>("")
  const router = useRouter()

  const classes = ["Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10"]

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

  const fetchJudgeScores = async (className: string, judgeName: string) => {
    setLoading(true)
    setError("")
    setScores([])

    try {
      const response = await fetch(
        `/api/judge-scores?class=${encodeURIComponent(className)}&judge=${encodeURIComponent(judgeName)}&project=all`, // Pass 'all' to get all scores
      )
      const data = await response.json()

      if (data.success) {
        setScores(data.scores)
        setLastUpdated(new Date().toLocaleString())
      } else {
        setError(data.error || "Failed to fetch your scores from Google Sheets")
      }
    } catch (error) {
      setError("Network error. Please check your connection.")
    }

    setLoading(false)
  }

  const handleClassChange = (className: string) => {
    setSelectedClass(className)
    if (user?.username) {
      fetchJudgeScores(className, user.username)
    }
  }

  const handleRefresh = () => {
    if (selectedClass && user?.username) {
      fetchJudgeScores(selectedClass, user.username)
    }
  }

  const exportToCsv = () => {
    if (scores.length === 0) {
      alert("No scores to export.")
      return
    }

    const headers = [
      "S.No.",
      "Name of the Student",
      "Grade",
      "Project Title",
      "Project ID",
      "Creativity & Imagination",
      "Scientific Thought",
      "Technical Skills",
      "Presentation",
      "Status",
      "Theme Fit", // Added Theme Fit to header
    ]
    const rows = scores.map((score) => [
      score.sno,
      score.studentName,
      score.grade,
      score.projectTitle,
      score.projectId,
      score.creativity,
      score.scientificThought,
      score.technicalSkills,
      score.presentation,
      score.status,
      score.themeFit, // Added Theme Fit to row
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((field) => (typeof field === "string" && field.includes(",") ? `"${field}"` : field)).join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `judge_${user.username}_scores_${selectedClass}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your scores...</p>
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
              <Button
                variant="ghost"
                onClick={() => router.push("/judge-dashboard")}
                className="mr-4 text-[#9B5A44] hover:bg-[#9B5A44] hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-[#9B5A44]">My Submitted Scores</h1>
                <p className="text-sm text-[#D99058] font-medium">AURA V - The Way to Shine in KREA</p>
                <p className="text-xs text-[#9B5A44]/70">Viewing scores for Judge: {user.username}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={exportToCsv}
                disabled={scores.length === 0}
                className="border-[#9B5A44] text-[#9B5A44] hover:bg-[#9B5A44] hover:text-white bg-transparent"
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Export to CSV
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Class Selection */}
          <Card className="shadow-lg border-2 border-[#9B5A44]/20">
            <CardHeader className="bg-gradient-to-r from-[#9B5A44] to-[#D99058] text-white rounded-t-lg">
              <CardTitle className="flex items-center">
                <Database className="mr-2 h-5 w-5" />
                Select Class to View Scores
              </CardTitle>
              <CardDescription className="text-amber-100">
                Choose a class to see all scores you have submitted for it.
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
                      className="w-full border-[#9B5A44] text-[#9B5A44] hover:bg-[#9B5A44] hover:text-white bg-transparent"
                    >
                      <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                      Refresh Scores
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Scores Display */}
          {selectedClass && (
            <Card className="shadow-lg border-2 border-[#9B5A44]/20">
              <CardHeader className="bg-gradient-to-r from-[#9B5A44] to-[#D99058] text-white rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <FileSpreadsheet className="mr-2 h-5 w-5" />
                      Your Scores for {selectedClass}
                    </CardTitle>
                    <CardDescription className="flex items-center mt-1 text-amber-100">
                      {loading ? (
                        <>
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          Loading your scores...
                        </>
                      ) : (
                        <>
                          <Clock className="mr-1 h-3 w-3" />
                          {scores.length} entries found in your Judge_{user.username} sheet
                          {lastUpdated && ` • Last updated: ${lastUpdated}`}
                        </>
                      )}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">{selectedClass}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                      <p className="text-lg font-medium text-gray-700 mb-2">Loading Scores</p>
                      <p className="text-sm text-gray-500">Fetching your submitted scores...</p>
                    </div>
                  </div>
                ) : scores.length > 0 ? (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">S.No.</TableHead>
                          <TableHead className="min-w-[150px]">Student Name</TableHead>
                          <TableHead>Grade</TableHead>
                          <TableHead className="min-w-[150px]">Project Title</TableHead>
                          <TableHead>Project ID</TableHead>
                          <TableHead>Creativity</TableHead>
                          <TableHead>Scientific</TableHead>
                          <TableHead>Technical</TableHead>
                          <TableHead>Presentation</TableHead>
                          <TableHead>Status</TableHead> {/* New Status column */}
                          <TableHead>Theme Fit</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {scores.map((score, index) => (
                          <TableRow key={`${score.projectId}-${score.sno}-${index}`}>
                            <TableCell className="font-medium">{score.sno}</TableCell>
                            <TableCell>{score.studentName}</TableCell>
                            <TableCell>{score.grade}</TableCell>
                            <TableCell className="text-sm">{score.projectTitle}</TableCell>
                            <TableCell className="font-mono text-blue-600">{score.projectId}</TableCell>
                            <TableCell>{score.creativity !== null ? score.creativity : "-"}</TableCell>
                            <TableCell>{score.scientificThought !== null ? score.scientificThought : "-"}</TableCell>
                            <TableCell>{score.technicalSkills !== null ? score.technicalSkills : "-"}</TableCell>
                            <TableCell>{score.presentation !== null ? score.presentation : "-"}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={score.status === "Absent" ? "text-red-600" : "text-green-600"}
                              >
                                {score.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{score.themeFit || "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : !error ? (
                  <div className="text-center py-12 text-gray-500">
                    <FileSpreadsheet className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">No scores found</p>
                    <p className="text-sm">You have not submitted any scores for {selectedClass} yet.</p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )}

          {!selectedClass && (
            <Card className="shadow-lg border-2 border-[#9B5A44]/20">
              <CardContent className="text-center py-16">
                <div className="text-gray-500">
                  <FileSpreadsheet className="h-20 w-20 mx-auto mb-6 text-gray-300" />
                  <p className="text-xl font-medium mb-3">View Your Judging History</p>
                  <p className="text-sm mb-6">Select a class to see all the projects you have judged.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
