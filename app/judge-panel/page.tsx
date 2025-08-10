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
import { Loader2, ArrowLeft, Save, Star, Users, CheckCircle } from 'lucide-react'

interface StudentProject {
  sno: string
  studentName: string
  grade: string
  projectTitle: string
  projectId: string
  theme?: string // Added theme field
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
  status?: string // Added status field (e.g., "Present", "Absent")
  themeFit?: string // Added themeFit field
}

export default function JudgePanel() {
  const [user, setUser] = useState<any>(null)
  const [students, setStudents] = useState<StudentProject[]>([])
  const [projectCriteriaScores, setProjectCriteriaScores] = useState<{
    creativity: number | null
    scientificThought: number | null
    technicalSkills: number | null
    presentation: number | null
    status: string
    themeFit: string | null
  } | null>(null)
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
  const [scoresSaved, setScoresSaved] = useState(false) // New state to track if scores are saved for this project
  const [projectTheme, setProjectTheme] = useState(""); // New state for project theme
  const [attendance, setAttendance] = useState<{ [studentId: string]: "Present" | "Absent" }>({});

  const loadStudentsAndScores = useCallback(async () => {
    setLoading(true)
    setError("")
    setHasUnsavedChanges(false) // Reset unsaved changes on new project load

    try {
      // Load students for this project
      const studentsResponse = await fetch(
        `/api/students?class=${encodeURIComponent(className)}&project=${encodeURIComponent(projectId)}`,
      )
      const studentsData = await studentsResponse.json()

      if (studentsData.success) {
        setStudents(studentsData.students)
        if (studentsData.students.length > 0) {
          setProjectTheme(studentsData.students[0].theme || ""); // Set project theme from the first student
        } else {
          setProjectTheme("");
        }

        // Load existing scores if any
        const scoresResponse = await fetch(
          `/api/judge-scores?class=${encodeURIComponent(className)}&judge=${encodeURIComponent(user?.username || "")}&project=${encodeURIComponent(projectId)}`,
        )
        const scoresData = await scoresResponse.json()

        if (scoresData.success && scoresData.scores.length > 0) {
          // Assuming project-level scores, take the first one to populate the form
          const existingScore = scoresData.scores[0]
          setProjectCriteriaScores({
            creativity: existingScore.creativity,
            scientificThought: existingScore.scientificThought,
            technicalSkills: existingScore.technicalSkills,
            presentation: existingScore.presentation,
            status: existingScore.status || "Present",
            themeFit: existingScore.themeFit || null,
          })
          setScoresSaved(true) // Mark as saved if scores exist for this project
        } else {
          // Initialize empty scores for the project if no existing scores
          setProjectCriteriaScores({
            creativity: null,
            scientificThought: null,
            technicalSkills: null,
            presentation: null,
            status: "Present", // Default status to Present
            themeFit: null,
          })
          setScoresSaved(false) // Mark as not saved for new scoring
        }
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
    if (scoresSaved || projectCriteriaScores?.status === "Absent") return

    const numValue = value === "" ? null : Number.parseFloat(value)
    setProjectCriteriaScores((prev) => ({
      ...prev!,
      [criterion]: numValue,
    }))
    setHasUnsavedChanges(true)
  }

  const handleStatusChange = (newStatus: string) => {
    if (scoresSaved) return // Prevent changes if scores are already saved

    setProjectCriteriaScores((prev) => {
      const updatedScores = { ...prev!, status: newStatus };
      if (newStatus === "Absent") {
        updatedScores.creativity = 0;
        updatedScores.scientificThought = 0;
        updatedScores.technicalSkills = 0;
        updatedScores.presentation = 0;
      } else {
        // When changing from Absent to Present, clear scores to null for re-entry
        updatedScores.creativity = null;
        updatedScores.scientificThought = null;
        updatedScores.technicalSkills = null;
        updatedScores.presentation = null;
      }
      return updatedScores;
    });
    setHasUnsavedChanges(true);
  };

  const handleThemeFitChange = (value: string) => {
    if (scoresSaved) return;
    setProjectCriteriaScores((prev) => ({
      ...prev!,
      themeFit: value,
    }));
    setHasUnsavedChanges(true);
  };

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
      // Construct scoresArray by applying project-level scores to each student
      const scoresArray: JudgeScore[] = students.map(student => ({
        sno: student.sno,
        studentName: student.studentName,
        grade: student.grade,
        projectTitle: student.projectTitle,
        projectId: student.projectId,
        creativity: projectCriteriaScores?.creativity ?? null,
        scientificThought: projectCriteriaScores?.scientificThought ?? null,
        technicalSkills: projectCriteriaScores?.technicalSkills ?? null,
        presentation: projectCriteriaScores?.presentation ?? null,
        status: attendance[student.sno] || projectCriteriaScores?.status || "Present",
        themeFit: projectCriteriaScores?.themeFit ?? undefined, // <-- fix here
      }));

      const response = await fetch("/api/judge-scores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          class: className,
          judge: user.username,
          scores: scoresArray,
          append: true, // Flag to indicate append mode
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(`Scores saved permanently to Judge_${user.username} sheet! Total rows: ${data.totalRows || "N/A"}`)
        setHasUnsavedChanges(false)
        setScoresSaved(true) // Mark as saved after successful submission
        setTimeout(() => setSuccess(""), 5000) // Clear success message after 5 seconds
      } else {
        setError(data.error || "Failed to save scores")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    }

    setSaving(false)
  }

  const isFormValid = () => {
    if (!projectCriteriaScores) return false;
    if (!projectCriteriaScores.themeFit) return false; // Theme Fit is required

    if (projectCriteriaScores.status === "Absent") {
      return true; // If absent, scores are auto-zeroed, so it's valid
    }

    // If present, all 4 criteria must be filled
    return (
      projectCriteriaScores.creativity !== null &&
      projectCriteriaScores.scientificThought !== null &&
      projectCriteriaScores.technicalSkills !== null &&
      projectCriteriaScores.presentation !== null
    );
  }

  const handleNextProject = () => {
    if (hasUnsavedChanges) {
      if (!confirm("You have unsaved changes. Are you sure you want to move to the next project?")) {
        return
      }
    }

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

  const handleAttendanceChange = (studentId: string, status: "Present" | "Absent") => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status,
    }));
    setHasUnsavedChanges(true);
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading judge panel...</p>
        </div>
      </div>
    )
  }

  if (!user || !className || !projectId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <p className="text-red-600 mb-4">Invalid access. Missing required parameters.</p>
            <Button onClick={() => router.push("/judge-dashboard")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isAbsent = projectCriteriaScores?.status === "Absent";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button variant="ghost" onClick={() => router.push("/judge-dashboard")} className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Judge Panel</h1>
                <p className="text-sm text-gray-600">
                  {className} - Project {projectId} ({currentProjectIndex + 1} of {allProjects.length}) - Judge:{" "}
                  {user.username}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-blue-600">
                <Users className="mr-1 h-3 w-3" />
                {students.length} Students
              </Badge>
              {hasUnsavedChanges && (
                <Badge variant="outline" className="text-orange-600">
                  Unsaved Changes
                </Badge>
              )}
              <Button variant="outline" onClick={handlePreviousProject} disabled={currentProjectIndex === 0}>
                Previous Project
              </Button>
              <Button
                variant="outline"
                onClick={handleNextProject}
                disabled={currentProjectIndex >= allProjects.length - 1}
              >
                Next Project
              </Button>
              <Button
                onClick={handleSaveScores}
                disabled={saving || !isFormValid() || scoresSaved} // Disable if already saved
                className="bg-green-600 hover:bg-green-700"
              >
                {scoresSaved ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Scores Saved ✓
                  </>
                ) : saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Appending...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Append Scores
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Project Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Star className="mr-2 h-5 w-5" />
                Project {projectId} - {className}
              </CardTitle>
              {projectTheme && (
                <CardDescription className="text-md font-medium text-gray-700 mt-1">
                  Theme: {projectTheme}
                </CardDescription>
              )}
              <CardDescription>
                Enter scores for the project on the judging criteria. Scores will be saved to your personal Judge_
                {user.username} sheet.
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
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                  <p className="text-lg font-medium text-gray-700 mb-2">Loading Students</p>
                  <p className="text-sm text-gray-500">Fetching student data from BaseSheet...</p>
                </div>
              </CardContent>
            </Card>
          ) : students.length > 0 ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Student List</CardTitle>
                  <CardDescription>These are the students associated with Project {projectId}.</CardDescription>
                </CardHeader>
                <CardContent>
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
                                value={attendance[student.sno] || projectCriteriaScores?.status || "Present"}
                                onValueChange={value => handleAttendanceChange(student.sno, value as "Present" | "Absent")}
                                disabled={scoresSaved}
                              >
                                <SelectTrigger className="w-[100px]">
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
              <Card>
                <CardHeader>
                  <CardTitle>Theme Fit</CardTitle>
                  <CardDescription>How well does the project fit the theme?</CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={projectCriteriaScores?.themeFit || ""}
                    onValueChange={handleThemeFitChange}
                    disabled={scoresSaved}
                    className="flex flex-col space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Strongly Fits" id="theme-strong" className="text-green-500 border-green-500" />
                      <Label htmlFor="theme-strong" className="flex items-center">
                        <span className="mr-2 text-green-600">🟢</span> Strongly Fits
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Moderately Fits" id="theme-moderate" className="text-yellow-500 border-yellow-500" />
                      <Label htmlFor="theme-moderate" className="flex items-center">
                        <span className="mr-2 text-yellow-600">🟡</span> Moderately Fits
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Slightly Fits" id="theme-slight" className="text-gray-500 border-gray-500" />
                      <Label htmlFor="theme-slight" className="flex items-center">
                        <span className="mr-2 text-gray-600">⚪</span> Slightly Fits
                      </Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Project Scoring Criteria Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Project Scoring Criteria</CardTitle>
                  <CardDescription>Enter scores (0-10) for each criterion. All fields are required unless the project is marked absent.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="creativity">Creativity & Imagination</Label>
                      <Input
                        id="creativity"
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={isAbsent ? "0" : (projectCriteriaScores?.creativity?.toString() || "")}
                        onChange={(e) => handleScoreChange("creativity", e.target.value)}
                        placeholder="0-10"
                        disabled={scoresSaved || isAbsent}
                      />
                      <p className="text-sm text-muted-foreground">Uniqueness of idea, originality, innovative approach.</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="scientificThought">Scientific Thought / Principle / Approach</Label>
                      <Input
                        id="scientificThought"
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={isAbsent ? "0" : (projectCriteriaScores?.scientificThought?.toString() || "")}
                        onChange={(e) => handleScoreChange("scientificThought", e.target.value)}
                        placeholder="0-10"
                        disabled={scoresSaved || isAbsent}
                      />
                      <p className="text-sm text-muted-foreground">Clarity of scientific method, logical reasoning, understanding of concepts.</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="technicalSkills">Technical Skills / Workmanship / Craftsmanship</Label>
                      <Input
                        id="technicalSkills"
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={isAbsent ? "0" : (projectCriteriaScores?.technicalSkills?.toString() || "")}
                        onChange={(e) => handleScoreChange("technicalSkills", e.target.value)}
                        placeholder="0-10"
                        disabled={scoresSaved || isAbsent}
                      />
                      <p className="text-sm text-muted-foreground">Quality of construction, execution of experiments, data analysis skills.</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="presentation">Presentation</Label>
                      <Input
                        id="presentation"
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={isAbsent ? "0" : (projectCriteriaScores?.presentation?.toString() || "")}
                        onChange={(e) => handleScoreChange("presentation", e.target.value)}
                        placeholder="0-10"
                        disabled={scoresSaved || isAbsent}
                      />
                      <p className="text-sm text-muted-foreground">Clarity of explanation, visual appeal of display, ability to answer questions.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-600">
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
                  disabled={saving || !isFormValid() || scoresSaved} // Disable if already saved
                  size="lg"
                  className="bg-green-600 hover:bg-green-700"
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
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">No students found</p>
                <p className="text-sm text-gray-500">
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
