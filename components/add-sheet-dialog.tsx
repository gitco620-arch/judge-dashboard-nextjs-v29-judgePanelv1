"use client"
import { useState } from "react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AddSheetDialogProps {
  isOpen: boolean
  onClose: () => void
  onAddSheet: (className: string, sheetId: string) => void
}

export function AddSheetDialog({ isOpen, onClose, onAddSheet }: AddSheetDialogProps) {
  const [className, setClassName] = useState("")
  const [sheetId, setSheetId] = useState("")
  const [error, setError] = useState("")

  const classes = ["Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"]

  const handleAdd = () => {
    if (!className || !sheetId) {
      setError("Both Class Name and Google Sheet ID are required.")
      return
    }
    setError("")
    onAddSheet(className, sheetId)
    setClassName("")
    setSheetId("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Google Sheet</DialogTitle>
          <DialogDescription>
            Enter the class name and the Google Sheet ID for the new class project sheet.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="className" className="text-right">
              Class Name
            </Label>
            <Select value={className} onValueChange={setClassName}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="sheetId" className="text-right">
              Sheet ID
            </Label>
            <Input
              id="sheetId"
              placeholder="e.g., 1ABC123_class4_spreadsheet_id"
              className="col-span-3"
              value={sheetId}
              onChange={(e) => setSheetId(e.target.value)}
            />
          </div>
          {error && <p className="col-span-4 text-center text-sm text-red-500">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAdd}>Add Sheet</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
