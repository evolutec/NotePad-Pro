"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code,
  Link,
  ImageIcon,
  Save,
  FileText,
  Calendar,
  Tag,
  Type,
  Palette,
  Eye,
  Edit3,
} from "lucide-react"

interface NoteEditorProps {
  selectedNote: string | null
  selectedFolder: string | null
}

interface Note {
  id: string
  title: string
  content: string
  tags: string[]
  createdAt: Date
  lastModified: Date
  folderId?: string
  wordCount: number
  readingTime: number
}

const FONT_SIZES = [
  { label: "Petit", value: "text-sm" },
  { label: "Normal", value: "text-base" },
  { label: "Grand", value: "text-lg" },
  { label: "Très grand", value: "text-xl" },
]

const TEXT_COLORS = [
  { label: "Noir", value: "text-foreground" },
  { label: "Gris", value: "text-muted-foreground" },
  { label: "Rouge", value: "text-red-600" },
  { label: "Bleu", value: "text-blue-600" },
  { label: "Vert", value: "text-green-600" },
  { label: "Violet", value: "text-purple-600" },
]

export function NoteEditor({ selectedNote, selectedFolder }: NoteEditorProps) {
  const [currentNote, setCurrentNote] = useState<Note>({
    id: selectedNote || "new",
    title: "Nouvelle note",
    content: "",
    tags: [],
    createdAt: new Date(),
    lastModified: new Date(),
    folderId: selectedFolder || undefined,
    wordCount: 0,
    readingTime: 0,
  })

  const [isEditing, setIsEditing] = useState(true)
  const [currentTag, setCurrentTag] = useState("")
  const [fontSize, setFontSize] = useState("text-base")
  const [textColor, setTextColor] = useState("text-foreground")
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)

  // Calculate word count and reading time
  useEffect(() => {
    const words = currentNote.content
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0)
    const wordCount = words.length
    const readingTime = Math.ceil(wordCount / 200) // Average reading speed: 200 words per minute

    setCurrentNote((prev) => ({
      ...prev,
      wordCount,
      readingTime: readingTime || 1,
      lastModified: new Date(),
    }))
  }, [currentNote.content])

  const insertFormatting = (before: string, after = "") => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = textarea.value.substring(start, end)
    const newText = before + selectedText + after

    const newContent = textarea.value.substring(0, start) + newText + textarea.value.substring(end)

    setCurrentNote((prev) => ({ ...prev, content: newContent }))

    // Restore cursor position
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length)
    }, 0)
  }

  const addTag = () => {
    if (currentTag.trim() && !currentNote.tags.includes(currentTag.trim())) {
      setCurrentNote((prev) => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()],
      }))
      setCurrentTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setCurrentNote((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addTag()
    }
  }

  const saveNote = async () => {
    setIsSaving(true)

    // Simulate save delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setLastSaved(new Date())
    setIsSaving(false)
  }

  const insertLink = () => {
    const url = prompt("Entrez l'URL du lien:")
    if (url) {
      const text = prompt("Texte du lien (optionnel):") || url
      insertFormatting(`[${text}](${url})`)
    }
  }

  const insertImage = () => {
    const url = prompt("Entrez l'URL de l'image:")
    if (url) {
      const alt = prompt("Texte alternatif (optionnel):") || "Image"
      insertFormatting(`![${alt}](${url})`)
    }
  }

  // Auto-save functionality
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (currentNote.content.trim() || currentNote.title.trim() !== "Nouvelle note") {
        saveNote()
      }
    }, 30000) // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval)
  }, [currentNote])

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <Input
                ref={titleRef}
                value={currentNote.title}
                onChange={(e) => setCurrentNote((prev) => ({ ...prev, title: e.target.value }))}
                className="text-lg font-semibold border-none bg-transparent p-0 h-auto focus-visible:ring-0"
                placeholder="Titre de la note..."
              />
            </div>

            {selectedFolder && <Badge variant="outline">Dossier {selectedFolder}</Badge>}
          </div>

          <div className="flex items-center gap-2">
            <Button variant={isEditing ? "default" : "outline"} size="sm" onClick={() => setIsEditing(!isEditing)}>
              {isEditing ? <Edit3 className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {isEditing ? "Édition" : "Aperçu"}
            </Button>

            <Button onClick={saveNote} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Sauvegarde..." : "Sauvegarder"}
            </Button>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Créé le {currentNote.createdAt.toLocaleDateString("fr-FR")}
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Modifié le {currentNote.lastModified.toLocaleDateString("fr-FR")} à{" "}
            {currentNote.lastModified.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
          </div>
          {lastSaved && (
            <div className="text-green-600">
              Sauvegardé à {lastSaved.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="flex items-center gap-2 mb-4">
          <Tag className="h-4 w-4 text-muted-foreground" />
          <div className="flex flex-wrap gap-1">
            {currentNote.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => removeTag(tag)}
              >
                {tag} ×
              </Badge>
            ))}
          </div>
          <Input
            placeholder="Ajouter une étiquette..."
            value={currentTag}
            onChange={(e) => setCurrentTag(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-40 h-6 text-xs"
          />
          <Button onClick={addTag} size="sm" variant="outline" className="h-6 px-2 text-xs bg-transparent">
            Ajouter
          </Button>
        </div>

        {/* Toolbar */}
        {isEditing && (
          <div className="flex items-center gap-2 flex-wrap">
            {/* Text Formatting */}
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={() => insertFormatting("**", "**")} title="Gras">
                <Bold className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => insertFormatting("*", "*")} title="Italique">
                <Italic className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => insertFormatting("~~", "~~")} title="Barré">
                <Strikethrough className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => insertFormatting("`", "`")} title="Code">
                <Code className="h-4 w-4" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Lists and Quotes */}
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={() => insertFormatting("- ", "")} title="Liste à puces">
                <List className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => insertFormatting("1. ", "")} title="Liste numérotée">
                <ListOrdered className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => insertFormatting("> ", "")} title="Citation">
                <Quote className="h-4 w-4" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Links and Images */}
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={insertLink} title="Insérer un lien">
                <Link className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={insertImage} title="Insérer une image">
                <ImageIcon className="h-4 w-4" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Font Size */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Type className="h-4 w-4 mr-2" />
                  Taille
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {FONT_SIZES.map((size) => (
                  <DropdownMenuItem key={size.value} onClick={() => setFontSize(size.value)}>
                    {size.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Text Color */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Palette className="h-4 w-4 mr-2" />
                  Couleur
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {TEXT_COLORS.map((color) => (
                  <DropdownMenuItem key={color.value} onClick={() => setTextColor(color.value)}>
                    <div className={`w-4 h-4 rounded mr-2 ${color.value} bg-current`} />
                    {color.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 flex">
        {/* Editor */}
        <div className="flex-1 p-6">
          {isEditing ? (
            <Textarea
              ref={textareaRef}
              value={currentNote.content}
              onChange={(e) => setCurrentNote((prev) => ({ ...prev, content: e.target.value }))}
              placeholder="Commencez à écrire votre note..."
              className={`w-full h-full resize-none border-none bg-transparent focus-visible:ring-0 ${fontSize} ${textColor}`}
              style={{ minHeight: "calc(100vh - 300px)" }}
            />
          ) : (
            <ScrollArea className="h-full">
              <div className={`prose prose-sm max-w-none ${fontSize} ${textColor}`}>
                {currentNote.content ? (
                  <div className="whitespace-pre-wrap">{currentNote.content}</div>
                ) : (
                  <div className="text-muted-foreground italic">
                    Aucun contenu à afficher. Passez en mode édition pour commencer à écrire.
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Sidebar with Stats */}
        <div className="w-64 border-l border-border bg-card p-4">
          <h3 className="font-semibold mb-4">Statistiques</h3>

          <div className="space-y-4">
            <Card className="p-3">
              <div className="text-2xl font-bold text-primary">{currentNote.wordCount}</div>
              <div className="text-sm text-muted-foreground">Mots</div>
            </Card>

            <Card className="p-3">
              <div className="text-2xl font-bold text-secondary">{currentNote.readingTime}</div>
              <div className="text-sm text-muted-foreground">Min de lecture</div>
            </Card>

            <Card className="p-3">
              <div className="text-2xl font-bold text-accent">{currentNote.content.length}</div>
              <div className="text-sm text-muted-foreground">Caractères</div>
            </Card>

            <Card className="p-3">
              <div className="text-2xl font-bold text-muted-foreground">{currentNote.tags.length}</div>
              <div className="text-sm text-muted-foreground">Étiquettes</div>
            </Card>
          </div>

          <Separator className="my-4" />

          <div className="space-y-2">
            <h4 className="font-medium text-sm">Actions rapides</h4>
            <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
              <FileText className="h-4 w-4 mr-2" />
              Exporter en PDF
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
              <FileText className="h-4 w-4 mr-2" />
              Exporter en Markdown
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
              <Link className="h-4 w-4 mr-2" />
              Partager
            </Button>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="h-8 bg-muted border-t border-border flex items-center justify-between px-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>Mode: {isEditing ? "Édition" : "Aperçu"}</span>
          <span>Ligne 1, Colonne 1</span>
        </div>
        <div className="flex items-center gap-4">
          <span>{currentNote.wordCount} mots</span>
          <span>{currentNote.content.length} caractères</span>
          <span>Sauvegarde automatique activée</span>
        </div>
      </div>
    </div>
  )
}
