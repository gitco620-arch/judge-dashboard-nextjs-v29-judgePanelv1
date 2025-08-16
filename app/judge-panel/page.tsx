"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Loader2, ArrowLeft, Save, Star, Users, CheckCircle } from "lucide-react"
import Image from "next/image"

interface StudentProject {
  sno: string
  studentName: string
  grade: string
  projectTitle: string
  projectId: string
  theme?: string
}

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
  status?: string
  themeFit?: string
}

interface ProjectScores {
  creativity: number | null
  scientificThought: number | null
  technicalSkills: number | null
  presentation: number | null
  themeFit: string | null
}

interface StudentStatus {
  [studentName: string]: string // "Present" or "Absent"
}

export default function JudgePanel() {
  const [user, setUser] = useState<any>(null)
  const [students, setStudents] = useState<StudentProject[]>([])
  const [projectScores, setProjectScores] = useState<ProjectScores>({
    creativity: null,
    scientificThought: null,
    technicalSkills: null,
    presentation: null,
    themeFit: null,
  })
  const [studentStatuses, setStudentStatuses] = useState<StudentStatus>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()

  const className = searchParams.get("class") || ""
  const projectId = searchParams.get("project") || ""

  const [allProjects, setAllProjects] = useState<string[]>([])
  const [currentProjectIndex, setCurrentProjectIndex] = useState(0)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [scoresSaved, setScoresSaved] = useState(false)
  const [projectTheme, setProjectTheme] = useState("")

  const loadStudentsAndScores = useCallback(async () => {
    setLoading(true)
    setError("")
    setHasUnsavedChanges(false)

    try {
      // Load students for this project
      const studentsResponse = await fetch(
        `/api/students?class=${encodeURIComponent(className)}&project=${encodeURIComponent(projectId)}`,
      )
      const studentsData = await studentsResponse.json()

      if (studentsData.success) {
        setStudents(studentsData.students)
        if (studentsData.students.length > 0) {
          setProjectTheme(studentsData.students[0].theme || "")
        } else {
          setProjectTheme("")
        }

        // Initialize student statuses
        const initialStatuses: StudentStatus = {}
        studentsData.students.forEach((student: StudentProject) => {
          initialStatuses[student.studentName] = "Present"
        })

        // Load existing scores if any
        const scoresResponse = await fetch(
          `/api/judge-scores?class=${encodeURIComponent(className)}&judge=${encodeURIComponent(user?.username || "")}&project=${encodeURIComponent(projectId)}`,
        )
        const scoresData = await scoresResponse.json()

        if (scoresData.success && scoresData.scores.length > 0) {
          // Use the first score entry to populate project scores and all student statuses
          const firstScore = scoresData.scores[0]
          setProjectScores({
            creativity: firstScore.creativity,
            scientificThought: firstScore.scientificThought,
            technicalSkills: firstScore.technicalSkills,
            presentation: firstScore.presentation,
            themeFit: firstScore.themeFit || null,
          })

          // Update student statuses from existing scores
          scoresData.scores.forEach((score: JudgeScore) => {
            if (initialStatuses[score.studentName] !== undefined) {
              initialStatuses[score.studentName] = score.status || "Present"
            }
          })

          setScoresSaved(true)
        } else {
          setScoresSaved(false)
        }

        setStudentStatuses(initialStatuses)
      } else {
        setError(studentsData.error || "Failed to load students")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    }

    setLoading(false)
  }, [className, projectId, user?.username])

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      const parsedUser = JSON.parse(userData)
      if (parsedUser.role === "Judge") {
        setUser(parsedUser)
        if (className && projectId) {
          loadStudentsAndScores()
        }
      } else {
        router.push("/")
      }
    } else {
      router.push("/")
    }
    setInitialLoading(false)
  }, [router, className, projectId, loadStudentsAndScores])

  useEffect(() => {
    // Load all projects for this class to enable "Next Project"
    const loadAllProjects = async () => {
      if (className) {
        try {
          const response = await fetch(`/api/projects?class=${encodeURIComponent(className)}`)
          const data = await response.json()
          if (data.success) {
            setAllProjects(data.projects)
            const currentIndex = data.projects.indexOf(projectId)
            setCurrentProjectIndex(currentIndex >= 0 ? currentIndex : 0)
          }
        } catch (error) {
          console.error("Error loading all projects:", error)
        }
      }
    }
    loadAllProjects()
  }, [className, projectId])

  const handleScoreChange = (criterion: string, value: string) => {
    if (scoresSaved) return

    const numValue = value === "" ? null : Number.parseFloat(value)
    setProjectScores((prev) => ({
      ...prev,
      [criterion]: numValue,
    }))
    setHasUnsavedChanges(true)
  }

  const handleStatusChange = (studentName: string, newStatus: string) => {
    if (scoresSaved) return

    setStudentStatuses((prev) => ({
      ...prev,
      [studentName]: newStatus,
    }))
    setHasUnsavedChanges(true)
  }

  const handleThemeFitChange = (value: string) => {
    if (scoresSaved) return
    setProjectScores((prev) => ({
      ...prev,
      themeFit: value,
    }))
    setHasUnsavedChanges(true)
  }

  const handleSaveScores = async () => {
    // Show confirmation dialog
    const confirmed = confirm(
      `Are you sure you want to save scores for Project ${projectId}?\n\n` +
        `⚠️ WARNING: Once saved, you cannot modify these scores for this project.\n\n` +
        `This will permanently record your scores in the Judge_${user.username} sheet.`,
    )

    if (!confirmed) {
      return
    }

    setSaving(true)
    setError("")
    setSuccess("")

    try {
      // Construct scoresArray - each student gets the same project scores but their individual status
      const scoresArray: JudgeScore[] = students.map((student) => ({
        sno: student.sno,
        studentName: student.studentName,
        grade: student.grade,
        projectTitle: student.projectTitle,
        projectId: student.projectId,
        creativity: projectScores.creativity,
        scientificThought: projectScores.scientificThought,
        technicalSkills: projectScores.technicalSkills,
        presentation: projectScores.presentation,
        status: studentStatuses[student.studentName] || "Present",
        themeFit: projectScores.themeFit || undefined,
      }))

      const response = await fetch("/api/judge-scores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          class: className,
          judge: user.username,
          scores: scoresArray,
          append: true,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(`Scores saved permanently to Judge_${user.username} sheet! Total rows: ${data.totalRows || "N/A"}`)
        setHasUnsavedChanges(false)
        setScoresSaved(true)
        setTimeout(() => setSuccess(""), 5000)
      } else {
        setError(data.error || "Failed to save scores")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    }

    setSaving(false)
  }

  const isFormValid = () => {
    // Check if theme fit is selected
    if (!projectScores.themeFit) return false

    // Check if all 4 project criteria are filled
    return (
      projectScores.creativity !== null &&
      projectScores.scientificThought !== null &&
      projectScores.technicalSkills !== null &&
      projectScores.presentation !== null
    )
  }

  const handleNextProject = () => {
    if (hasUnsavedChanges) {
      if (!confirm("You have unsaved changes. Are you sure you want to move to the next project?")) {
        return
      }
    }

    setProjectScores({
    creativity: null,
    scientificThought: null,
    technicalSkills: null,
    presentation: null,
    themeFit: null,
  });
  
  setStudentStatuses({});
  setScoresSaved(false);
  setHasUnsavedChanges(false);
  setSuccess("");
  setError("");


    const nextIndex = currentProjectIndex + 1
    if (nextIndex < allProjects.length) {
      const nextProjectId = allProjects[nextIndex]
      router.push(`/judge-panel?class=${encodeURIComponent(className)}&project=${encodeURIComponent(nextProjectId)}`)
    }
  }

  const handlePreviousProject = () => {
    if (hasUnsavedChanges) {
      if (!confirm("You have unsaved changes. Are you sure you want to move to the previous project?")) {
        return
      }
    }

    const prevIndex = currentProjectIndex - 1
    if (prevIndex >= 0) {
      const prevProjectId = allProjects[prevIndex]
      router.push(`/judge-panel?class=${encodeURIComponent(className)}&project=${encodeURIComponent(prevProjectId)}`)
    }
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#9B5A44]" />
          <p className="text-[#9B5A44]">Loading judge panel...</p>
        </div>
      </div>
    )
  }

  if (!user || !className || !projectId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <p className="text-red-600 mb-4">Invalid access. Missing required parameters.</p>
            <Button
              onClick={() => router.push("/judge-dashboard")}
              className="bg-gradient-to-r from-[#9B5A44] to-[#D99058] hover:from-[#8B4A34] hover:to-[#C98048] text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b-4 border-[#F5BD3A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <Image
                src="/sf-logo.png"
                alt="Science Fest Logo"
                width={48}
                height={48}
                className="rounded-lg"
              />
               <Button
                variant="ghost"
                onClick={() => router.push("/judge-dashboard")}
                className="mr-4 text-[#9B5A44] hover:bg-[#9B5A44] hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-[#9B5A44]">Judge Panel</h1>
                <p className="text-sm text-[#D99058] font-medium">AURA V - The Way to Shine in KREA</p>
                <p className="text-xs text-[#9B5A44]/70">
                  {className} - Project {projectId} ({currentProjectIndex + 1} of {allProjects.length}) - Judge:{" "}
                  {user.username}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-[#9B5A44] border-[#9B5A44]">
                <Users className="mr-1 h-3 w-3" />
                {students.length} Students
              </Badge>
              {hasUnsavedChanges && (
                <Badge variant="outline" className="text-orange-600 border-orange-600">
                  Unsaved Changes
                </Badge>
              )}
              <Button
                variant="outline"
                onClick={handlePreviousProject}
                disabled={currentProjectIndex === 0}
                className="border-[#9B5A44] text-[#9B5A44] hover:bg-[#9B5A44] hover:text-white bg-transparent"
              >
                Previous Project
              </Button>
              <Button
                variant="outline"
                onClick={handleNextProject}
                disabled={currentProjectIndex >= allProjects.length - 1}
                className="border-[#9B5A44] text-[#9B5A44] hover:bg-[#9B5A44] hover:text-white bg-transparent"
              >
                Next Project
              </Button>
              
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Project Info */}
          <Card className="shadow-lg border-2 border-[#9B5A44]/20">
            <CardHeader className="bg-gradient-to-r from-[#9B5A44] to-[#D99058] text-white rounded-t-lg">
              <CardTitle className="flex items-center">
                <Star className="mr-2 h-5 w-5" />
                Project {projectId} - {className}
              </CardTitle>
              {projectTheme && (
                <CardDescription className="text-amber-100 font-medium">Theme: {projectTheme}</CardDescription>
              )}
              <CardDescription className="text-amber-100">
                Score this project on the 4 criteria below. Individual student attendance is tracked separately.
              </CardDescription>
            </CardHeader>
          </Card>

          {scoresSaved && (
            <Alert className="border-blue-200 bg-blue-50">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Scores Already Saved:</strong> You have already submitted scores for this project. Scores cannot
                be modified once saved to maintain judging integrity.
              </AlertDescription>
            </Alert>
          )}

          {/* Success/Error Messages */}
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Student List */}
          {loading ? (
            <Card className="shadow-lg border-2 border-[#9B5A44]/20">
              <CardContent className="flex items-center justify-center py-12 bg-white">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#9B5A44]" />
                  <p className="text-lg font-medium text-[#9B5A44] mb-2">Loading Students</p>
                  <p className="text-sm text-[#9B5A44]/70">Fetching student data from BaseSheet...</p>
                </div>
              </CardContent>
            </Card>
          ) : students.length > 0 ? (
            <>
              <Card className="shadow-lg border-2 border-[#9B5A44]/20">
                <CardHeader className="bg-gradient-to-r from-[#9B5A44] to-[#D99058] text-white rounded-t-lg">
                  <CardTitle>Student Attendance</CardTitle>
                  <CardDescription className="text-amber-100">
                    Mark individual student attendance for Project {projectId}.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 bg-white">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">S.No.</TableHead>
                          <TableHead className="min-w-[150px]">Student Name</TableHead>
                          <TableHead>Grade</TableHead>
                          <TableHead className="min-w-[150px]">Project Title</TableHead>
                          <TableHead className="w-24">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students.map((student) => (
                          <TableRow key={student.sno}>
                            <TableCell className="font-medium">{student.sno}</TableCell>
                            <TableCell className="font-medium">{student.studentName}</TableCell>
                            <TableCell>{student.grade}</TableCell>
                            <TableCell className="text-sm">{student.projectTitle}</TableCell>
                            <TableCell>
                              <Select
                                value={studentStatuses[student.studentName] || "Present"}
                                onValueChange={(value) => handleStatusChange(student.studentName, value)}
                                disabled={scoresSaved}
                              >
                                <SelectTrigger className="w-[100px] border-[#9B5A44]/30 focus:border-[#F5BD3A] focus:ring-[#F5BD3A]">
                                  <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Present">Present</SelectItem>
                                  <SelectItem value="Absent">Absent</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Theme Fit Card */}
              <Card className="shadow-lg border-2 border-[#9B5A44]/20">
                <CardHeader className="bg-gradient-to-r from-[#9B5A44] to-[#D99058] text-white rounded-t-lg">
                  <CardTitle>Theme Fit</CardTitle>
                  <CardDescription className="text-amber-100">How well does the project fit the theme?</CardDescription>
                </CardHeader>
                <CardContent className="p-6 bg-white">
                  <RadioGroup
                    value={projectScores.themeFit || ""}
                    onValueChange={handleThemeFitChange}
                    disabled={scoresSaved}
                    className="flex flex-col space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value="Strongly Fits"
                        id="theme-strong"
                        className="text-green-500 border-green-500"
                      />
                      <Label htmlFor="theme-strong" className="flex items-center">
                        <span className="mr-2 text-green-600">🟢</span> Strongly Fits
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value="Moderately Fits"
                        id="theme-moderate"
                        className="text-yellow-500 border-yellow-500"
                      />
                      <Label htmlFor="theme-moderate" className="flex items-center">
                        <span className="mr-2 text-yellow-600">🟡</span> Moderately Fits
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value="Slightly Fits"
                        id="theme-slight"
                        className="text-gray-500 border-gray-500"
                      />
                      <Label htmlFor="theme-slight" className="flex items-center">
                        <span className="mr-2 text-gray-600">⚪</span> Slightly Fits
                      </Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Project Scoring Criteria Card */}
              <Card className="shadow-lg border-2 border-[#9B5A44]/20">
                <CardHeader className="bg-gradient-to-r from-[#9B5A44] to-[#D99058] text-white rounded-t-lg">
                  <CardTitle>Project Scoring Criteria</CardTitle>
                  <CardDescription className="text-amber-100">
                    Enter scores (0-10) for the project on each criterion. These scores apply to the entire project.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="creativity" className="text-[#9B5A44] font-medium">
                        Creativity & Imagination
                      </Label>
                      <Input
                        id="creativity"
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={projectScores.creativity?.toString() || ""}
                        onChange={(e) => handleScoreChange("creativity", e.target.value)}
                        placeholder="0-10"
                        disabled={scoresSaved}
                        className="border-[#9B5A44]/30 focus:border-[#F5BD3A] focus:ring-[#F5BD3A]"
                      />
                      <p className="text-sm text-[#9B5A44]/70">Uniqueness of idea, originality, innovative approach.</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="scientificThought" className="text-[#9B5A44] font-medium">
                        Scientific Thought / Principle / Approach
                      </Label>
                      <Input
                        id="scientificThought"
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={projectScores.scientificThought?.toString() || ""}
                        onChange={(e) => handleScoreChange("scientificThought", e.target.value)}
                        placeholder="0-10"
                        disabled={scoresSaved}
                        className="border-[#9B5A44]/30 focus:border-[#F5BD3A] focus:ring-[#F5BD3A]"
                      />
                      <p className="text-sm text-[#9B5A44]/70">
                        Clarity of scientific method, logical reasoning, understanding of concepts.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="technicalSkills" className="text-[#9B5A44] font-medium">
                        Technical Skills / Workmanship / Craftsmanship
                      </Label>
                      <Input
                        id="technicalSkills"
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={projectScores.technicalSkills?.toString() || ""}
                        onChange={(e) => handleScoreChange("technicalSkills", e.target.value)}
                        placeholder="0-10"
                        disabled={scoresSaved}
                        className="border-[#9B5A44]/30 focus:border-[#F5BD3A] focus:ring-[#F5BD3A]"
                      />
                      <p className="text-sm text-[#9B5A44]/70">
                        Quality of construction, execution of experiments, data analysis skills.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="presentation" className="text-[#9B5A44] font-medium">
                        Presentation
                      </Label>
                      <Input
                        id="presentation"
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={projectScores.presentation?.toString() || ""}
                        onChange={(e) => handleScoreChange("presentation", e.target.value)}
                        placeholder="0-10"
                        disabled={scoresSaved}
                        className="border-[#9B5A44]/30 focus:border-[#F5BD3A] focus:ring-[#F5BD3A]"
                      />
                      <p className="text-sm text-[#9B5A44]/70">
                        Clarity of explanation, visual appeal of display, ability to answer questions.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-[#9B5A44]/70">
                  {scoresSaved ? (
                    <span className="text-blue-600 flex items-center">
                      <CheckCircle className="mr-1 h-4 w-4" />
                      Scores permanently saved for this project
                    </span>
                  ) : isFormValid() ? (
                    <span className="text-green-600 flex items-center">
                      <CheckCircle className="mr-1 h-4 w-4" />
                      All scores entered - ready to save
                    </span>
                  ) : (
                    <span className="text-orange-600">Please enter all scores and theme fit before saving</span>
                  )}
                </div>
                <Button
                  onClick={handleSaveScores}
                  disabled={saving || !isFormValid() || scoresSaved}
                  size="lg"
                  className="bg-gradient-to-r from-[#9B5A44] to-[#D99058] hover:from-[#8B4A34] hover:to-[#C98048] text-white"
                >
                  {scoresSaved ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Scores Saved ✓
                    </>
                  ) : saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving to Judge_{user.username}...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save All Scores
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <Card className="shadow-lg border-2 border-[#9B5A44]/20">
              <CardContent className="text-center py-12 bg-white">
                <Users className="h-16 w-16 mx-auto mb-4 text-[#9B5A44]/30" />
                <p className="text-lg font-medium mb-2 text-[#9B5A44]">No students found</p>
                <p className="text-sm text-[#9B5A44]/70">
                  No students found for Project {projectId} in {className}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
