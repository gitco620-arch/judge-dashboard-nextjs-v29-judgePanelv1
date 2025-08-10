"use client"
import { useState, useEffect } from "react"
import type React from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info } from "lucide-react"

interface ConfigureSheetDialogProps {
  isOpen: boolean
  onClose: () => void
  className: string
  currentSheetId: string
  onSave: (className: string, newSheetId: string) => void
}

export function ConfigureSheetDialog({
  isOpen,
  onClose,
  className,
  currentSheetId,
  onSave,
}: ConfigureSheetDialogProps) {
  const [sheetUrl, setSheetUrl] = useState("")
  const [extractedId, setExtractedId] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (isOpen) {
      setSheetUrl("")
      setExtractedId("")
      setError("")
    }
  }, [isOpen])

  const extractSheetId = (url: string) => {
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)\/edit/)
    if (match && match[1]) {
      return match[1]
    }
    return null
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setSheetUrl(url)
    setError("")
    const id = extractSheetId(url)
    if (id) {
      setExtractedId(id)
    } else {
      setExtractedId("")
      if (url.length > 0) {
        setError("Invalid Google Sheet URL. Please ensure it contains '/d/SHEET_ID/edit'.")
      }
    }
  }

  const handleSave = () => {
    if (!extractedId) {
      setError("Please enter a valid Google Sheet URL to extract the ID.")
      return
    }
    onSave(className, extractedId)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Configure Sheet for {className}</DialogTitle>
          <DialogDescription>
            Paste the full Google Sheet URL for {className}. The Sheet ID will be automatically extracted.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="sheetUrl">Google Sheet URL</Label>
            <Input
              id="sheetUrl"
              placeholder="e.g., https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit#gid=0"
              value={sheetUrl}
              onChange={handleUrlChange}
            />
            {error && (
              <Alert variant="destructive">
                <AlertDescription className="flex items-center">
                  <Info className="mr-2 h-4 w-4" />
                  {error}
                </AlertDescription>
              </Alert>
            )}
          </div>
          {extractedId && (
            <div className="space-y-2">
              <Label>Extracted Sheet ID</Label>
              <Input value={extractedId} readOnly className="font-mono bg-gray-100" />
            </div>
          )}
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              Current Sheet ID: <span className="font-mono">{currentSheetId}</span>
            </p>
            <p>The Sheet ID is the string between `/d/` and `/edit` in the URL.</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!extractedId}>
            Save Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
