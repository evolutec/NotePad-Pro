"use client"

import * as React from "react"
import { forwardRef, useCallback, useMemo, useState, useImperativeHandle } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { X, FolderOpen, Plus, Upload, Camera, Image, Mic, AlertCircle, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  FileType,
  FileColorTheme,
  getFileTypeConfig,
  getModalGradient,
  getModalIcon
} from "@/lib/file-types"

export type ModalColorTheme =
  | 'yellow'  // Folder
  | 'blue'    // Note
  | 'purple'  // Draw/Video
  | 'red'     // Document
  | 'green'   // Image
  | 'pink'    // Audio
  | 'orange'  // Code
  | 'gray'    // Archive
  | 'black'   // Custom

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

export interface ModalButton {
  label: string
  variant: 'default' | 'outline' | 'ghost' | 'destructive'
  onClick: () => void
  disabled?: boolean
  loading?: boolean
  icon?: React.ReactNode
  className?: string
}

export interface ModalTab {
  id: string
  label: string
  icon?: React.ReactNode
  content: React.ReactNode
}

export interface ModalField {
  id: string
  label: string
  type: 'text' | 'file' | 'select' | 'textarea' | 'tags' | 'custom'
  placeholder?: string
  required?: boolean
  options?: { label: string; value: string }[]
  accept?: string
  multiple?: boolean
  content?: React.ReactNode
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
}

export interface GenericModalRef {
  reset: () => void
  validate: () => boolean
  getFormData: () => Record<string, any>
}

export interface GenericModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void

  // Basic modal properties
  title: string
  icon?: React.ReactNode
  description?: string
  colorTheme?: ModalColorTheme
  fileType?: FileType
  size?: ModalSize

  // Content configuration
  tabs?: ModalTab[]
  fields?: ModalField[]
  children?: React.ReactNode

  // Button configuration
  buttons?: ModalButton[]
  showCancelButton?: boolean
  cancelLabel?: string
  onCancel?: () => void

  // Validation
  validationRules?: { [key: string]: (value: any) => string | null }

  // Styling
  className?: string
  contentClassName?: string

  // Close button
  showCloseButton?: boolean
  closeButtonPosition?: 'top-right' | 'top-left' | 'header-right'

  // Additional features
  showFooter?: boolean
  loading?: boolean
  error?: string | null
  success?: string | null
}

// Modern color themes with enhanced gradients
const colorThemes = {
  yellow: {
    primary: 'bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white shadow-lg',
    accent: 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white shadow-lg',
    border: 'border-yellow-200 dark:border-yellow-800',
    gradient: 'from-yellow-400 via-yellow-500 to-yellow-600',
    line: 'bg-gradient-to-r from-yellow-400 to-yellow-600',
    background: 'from-yellow-50/30 via-yellow-100/20 to-yellow-50/30 dark:from-yellow-900/10 dark:via-yellow-800/5 dark:to-yellow-900/10',
    tabActive: 'data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-100 data-[state=active]:to-yellow-200 data-[state=active]:text-yellow-800 data-[state=active]:shadow-lg data-[state=active]:border-yellow-300 dark:data-[state=active]:from-yellow-900/50 dark:data-[state=active]:to-yellow-800/50 dark:data-[state=active]:text-yellow-200 dark:data-[state=active]:border-yellow-600'
  },
  blue: {
    primary: 'bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white shadow-lg',
    accent: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg',
    border: 'border-blue-200 dark:border-blue-800',
    gradient: 'from-blue-400 via-blue-500 to-blue-600',
    line: 'bg-gradient-to-r from-blue-400 to-blue-600',
    background: 'from-blue-50/30 via-blue-100/20 to-blue-50/30 dark:from-blue-900/10 dark:via-blue-800/5 dark:to-blue-900/10',
    tabActive: 'data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-100 data-[state=active]:to-blue-200 data-[state=active]:text-blue-800 data-[state=active]:shadow-lg data-[state=active]:border-blue-300 dark:data-[state=active]:from-blue-900/50 dark:data-[state=active]:to-blue-800/50 dark:data-[state=active]:text-blue-200 dark:data-[state=active]:border-blue-600'
  },
  purple: {
    primary: 'bg-gradient-to-r from-purple-400 to-purple-600 hover:from-purple-500 hover:to-purple-700 text-white shadow-lg',
    accent: 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg',
    border: 'border-purple-200 dark:border-purple-800',
    gradient: 'from-purple-400 via-purple-500 to-purple-600',
    line: 'bg-gradient-to-r from-purple-400 to-purple-600',
    background: 'from-purple-50/30 via-purple-100/20 to-purple-50/30 dark:from-purple-900/10 dark:via-purple-800/5 dark:to-purple-900/10',
    tabActive: 'data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-100 data-[state=active]:to-purple-200 data-[state=active]:text-purple-800 data-[state=active]:shadow-lg data-[state=active]:border-purple-300 dark:data-[state=active]:from-purple-900/50 dark:data-[state=active]:to-purple-800/50 dark:data-[state=active]:text-purple-200 dark:data-[state=active]:border-purple-600'
  },
  red: {
    primary: 'bg-gradient-to-r from-red-400 to-red-600 hover:from-red-500 hover:to-red-700 text-white shadow-lg',
    accent: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg',
    border: 'border-red-200 dark:border-red-800',
    gradient: 'from-red-400 via-red-500 to-red-600',
    line: 'bg-gradient-to-r from-red-400 to-red-600',
    background: 'from-red-50/30 via-red-100/20 to-red-50/30 dark:from-red-900/10 dark:via-red-800/5 dark:to-red-900/10',
    tabActive: 'data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-100 data-[state=active]:to-red-200 data-[state=active]:text-red-800 data-[state=active]:shadow-lg data-[state=active]:border-red-300 dark:data-[state=active]:from-red-900/50 dark:data-[state=active]:to-red-800/50 dark:data-[state=active]:text-red-200 dark:data-[state=active]:border-red-600'
  },
  green: {
    primary: 'bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white shadow-lg',
    accent: 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg',
    border: 'border-green-200 dark:border-green-800',
    gradient: 'from-green-400 via-green-500 to-green-600',
    line: 'bg-gradient-to-r from-green-400 to-green-600',
    background: 'from-green-50/30 via-green-100/20 to-green-50/30 dark:from-green-900/10 dark:via-green-800/5 dark:to-green-900/10',
    tabActive: 'data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-100 data-[state=active]:to-green-200 data-[state=active]:text-green-800 data-[state=active]:shadow-lg data-[state=active]:border-green-300 dark:data-[state=active]:from-green-900/50 dark:data-[state=active]:to-green-800/50 dark:data-[state=active]:text-green-200 dark:data-[state=active]:border-green-600'
  },
  pink: {
    primary: 'bg-gradient-to-r from-pink-400 to-pink-600 hover:from-pink-500 hover:to-pink-700 text-white shadow-lg',
    accent: 'bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white shadow-lg',
    border: 'border-pink-200 dark:border-pink-800',
    gradient: 'from-pink-400 via-pink-500 to-pink-600',
    line: 'bg-gradient-to-r from-pink-400 to-pink-600',
    background: 'from-pink-50/30 via-pink-100/20 to-pink-50/30 dark:from-pink-900/10 dark:via-pink-800/5 dark:to-pink-900/10',
    tabActive: 'data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-100 data-[state=active]:to-pink-200 data-[state=active]:text-pink-800 data-[state=active]:shadow-lg data-[state=active]:border-pink-300 dark:data-[state=active]:from-pink-900/50 dark:data-[state=active]:to-pink-800/50 dark:data-[state=active]:text-pink-200 dark:data-[state=active]:border-pink-600'
  },
  orange: {
    primary: 'bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white shadow-lg',
    accent: 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg',
    border: 'border-orange-200 dark:border-orange-800',
    gradient: 'from-orange-400 via-orange-500 to-orange-600',
    line: 'bg-gradient-to-r from-orange-400 to-orange-600',
    background: 'from-orange-50/30 via-orange-100/20 to-orange-50/30 dark:from-orange-900/10 dark:via-orange-800/5 dark:to-orange-900/10',
    tabActive: 'data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-100 data-[state=active]:to-orange-200 data-[state=active]:text-orange-800 data-[state=active]:shadow-lg data-[state=active]:border-orange-300 dark:data-[state=active]:from-orange-900/50 dark:data-[state=active]:to-orange-800/50 dark:data-[state=active]:text-orange-200 dark:data-[state=active]:border-orange-600'
  },
  gray: {
    primary: 'bg-gradient-to-r from-gray-400 to-gray-600 hover:from-gray-500 hover:to-gray-700 text-white shadow-lg',
    accent: 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white shadow-lg',
    border: 'border-gray-200 dark:border-gray-800',
    gradient: 'from-gray-400 via-gray-500 to-gray-600',
    line: 'bg-gradient-to-r from-gray-400 to-gray-600',
    background: 'from-gray-50/30 via-gray-100/20 to-gray-50/30 dark:from-gray-900/10 dark:via-gray-800/5 dark:to-gray-900/10',
    tabActive: 'data-[state=active]:bg-gradient-to-r data-[state=active]:from-gray-100 data-[state=active]:to-gray-200 data-[state=active]:text-gray-800 data-[state=active]:shadow-lg data-[state=active]:border-gray-300 dark:data-[state=active]:from-gray-900/50 dark:data-[state=active]:to-gray-800/50 dark:data-[state=active]:text-gray-200 dark:data-[state=active]:border-gray-600'
  },
  black: {
    primary: 'bg-gradient-to-r from-gray-800 to-black hover:from-gray-700 hover:to-gray-900 text-white shadow-lg',
    accent: 'bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-black text-white shadow-lg',
    border: 'border-gray-800',
    gradient: 'from-gray-800 via-gray-900 to-black',
    line: 'bg-gradient-to-r from-gray-800 to-black',
    background: 'from-gray-900 via-black to-gray-900',
    tabActive: 'data-[state=active]:bg-gradient-to-r data-[state=active]:from-gray-800 data-[state=active]:to-gray-700 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:border-gray-600'
  }
}

const sizeClasses = {
  sm: 'sm:max-w-md max-w-[95vw]',
  md: 'sm:max-w-lg max-w-[95vw]',
  lg: 'sm:max-w-2xl max-w-[95vw]',
  xl: 'sm:max-w-4xl max-w-[95vw]',
  full: 'sm:max-w-[95vw] max-w-[98vw]'
}

export const GenericModal = forwardRef<GenericModalRef, GenericModalProps>(({
  open,
  onOpenChange,
  title,
  icon,
  description,
  colorTheme = 'blue',
  fileType,
  size = 'lg',
  tabs,
  fields,
  children,
  buttons,
  showCancelButton = true,
  cancelLabel = 'Annuler',
  onCancel,
  validationRules,
  className,
  contentClassName,
  showCloseButton = true,
  closeButtonPosition = 'top-right',
  showFooter = true,
  loading = false,
  error,
  success
}, ref) => {
  // Create a ref for the Dialog content
  const dialogRef = React.useRef<HTMLDivElement>(null)
  // Use file type configuration if provided, otherwise use color theme
  const fileTypeConfig = useMemo(() => fileType ? getFileTypeConfig(fileType) : null, [fileType])
  const effectiveColorTheme = useMemo(() => fileType ? fileTypeConfig?.colorTheme || 'blue' : colorTheme, [fileType, fileTypeConfig, colorTheme])
  const theme = useMemo(() => colorThemes[effectiveColorTheme], [effectiveColorTheme])
  const sizeClass = useMemo(() => sizeClasses[size], [size])

  // Use file type icon if no custom icon provided
  const effectiveIcon = useMemo(() => {
    if (icon) return icon;
    if (fileType) {
      const IconComponent = getModalIcon(fileType);
      return IconComponent ? React.createElement(IconComponent) : null;
    }
    return null;
  }, [icon, fileType])

  // Form state management
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (open) {
      setFormData({})
      setFormErrors({})
    }
  }, [open])

  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel()
    } else {
      onOpenChange(false)
    }
  }, [onCancel, onOpenChange])

  const handleClose = useCallback(() => {
    onOpenChange(false)
  }, [onOpenChange])

  const updateFormData = useCallback((fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }))
    // Clear error when user starts typing
    if (formErrors[fieldId]) {
      setFormErrors(prev => ({ ...prev, [fieldId]: '' }))
    }
  }, [formErrors])

  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {}
    
    fields?.forEach(field => {
      const value = formData[field.id]
      if (field.required && (!value || value === '')) {
        errors[field.id] = `${field.label} est requis`
      }
      if (validationRules?.[field.id]) {
        const customError = validationRules[field.id](value)
        if (customError) {
          errors[field.id] = customError
        }
      }
    })
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }, [fields, formData, validationRules])

  const getFormData = useCallback(() => formData, [formData])

  const reset = useCallback(() => {
    setFormData({})
    setFormErrors({})
  }, [])

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    reset,
    validate: validateForm,
    getFormData
  }), [reset, validateForm, getFormData])

  const renderField = useCallback((field: ModalField) => {
    const [localValue, setLocalValue] = useState('')
    const [tags, setTags] = useState<string[]>([])
    const [currentTag, setCurrentTag] = useState('')

    const addTag = useCallback(() => {
      if (currentTag.trim() && !tags.includes(currentTag.trim())) {
        const newTags = [...tags, currentTag.trim()]
        setTags(newTags)
        updateFormData(field.id, newTags)
        setCurrentTag('')
      }
    }, [currentTag, tags, field.id, updateFormData])

    const removeTag = useCallback((tagToRemove: string) => {
      const newTags = tags.filter(tag => tag !== tagToRemove)
      setTags(newTags)
      updateFormData(field.id, newTags)
    }, [tags, field.id, updateFormData])

    const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        addTag()
      }
    }, [addTag])

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = e.target.value
      setLocalValue(value)
      updateFormData(field.id, value)
      // Also call the field's onChange if provided
      if (field.onChange) {
        field.onChange(e)
      }
    }, [field.id, updateFormData, field.onChange])

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      updateFormData(field.id, files ? (field.multiple ? Array.from(files) : files[0]) : null)
      // Also call the field's onChange if provided
      if (field.onChange) {
        field.onChange(e)
      }
    }, [field.id, field.multiple, updateFormData, field.onChange])

    switch (field.type) {
      case 'text':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              type="text"
              placeholder={field.placeholder}
              value={field.value !== undefined ? field.value : localValue}
              onChange={handleInputChange}
              required={field.required}
              className={cn(
                "transition-all duration-200 focus:ring-2 focus:ring-opacity-50",
                formErrors[field.id] && "border-red-500 focus:ring-red-500"
              )}
            />
            {formErrors[field.id] && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {formErrors[field.id]}
              </p>
            )}
          </div>
        )

      case 'file':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              type="file"
              accept={field.accept}
              multiple={field.multiple}
              required={field.required}
              onChange={handleFileChange}
              className={cn(
                "transition-all duration-200 focus:ring-2 focus:ring-opacity-50",
                formErrors[field.id] && "border-red-500 focus:ring-red-500"
              )}
            />
            {formErrors[field.id] && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {formErrors[field.id]}
              </p>
            )}
          </div>
        )

      case 'select':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <select
              id={field.id}
              value={localValue}
              onChange={handleInputChange}
              required={field.required}
              className={cn(
                "w-full border rounded-md px-3 py-2 bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200",
                formErrors[field.id] && "border-red-500 focus:ring-red-500"
              )}
            >
              <option value="">Sélectionner...</option>
              {field.options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {formErrors[field.id] && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {formErrors[field.id]}
              </p>
            )}
          </div>
        )

      case 'textarea':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={field.id}
              placeholder={field.placeholder}
              value={localValue}
              onChange={handleInputChange}
              required={field.required}
              rows={4}
              className={cn(
                "resize-none transition-all duration-200 focus:ring-2 focus:ring-opacity-50",
                formErrors[field.id] && "border-red-500 focus:ring-red-500"
              )}
            />
            {formErrors[field.id] && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {formErrors[field.id]}
              </p>
            )}
          </div>
        )

      case 'tags':
        return (
          <div key={field.id} className="space-y-2">
            <Label className="text-sm font-medium">{field.label}</Label>
            <div className="flex gap-2">
              <Input
                placeholder={field.placeholder || "Ajouter une étiquette..."}
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button type="button" onClick={addTag} size="sm" variant="outline" className="px-3">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 px-2 py-1 rounded-md text-xs cursor-pointer hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-500 transition-all duration-200 flex items-center gap-1"
                  onClick={() => removeTag(tag)}
                >
                  {tag} ×
                </span>
              ))}
            </div>
          </div>
        )

      case 'custom':
        return (
          <div key={field.id} className="space-y-2">
            {field.label && (
              <Label className="text-sm font-medium">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
            )}
            <div className="min-h-[40px]">
              {field.content}
            </div>
            {formErrors[field.id] && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {formErrors[field.id]}
              </p>
            )}
          </div>
        )

      default:
        return null
    }
  }, [formData, formErrors, updateFormData])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          sizeClass,
          "max-h-[95vh] overflow-hidden flex flex-col",
          `bg-gradient-to-br ${theme.background}`,
          "border-0 shadow-2xl",
          className
        )}
      >
        {/* Close Button */}
        {showCloseButton && (
          <button
            className={cn(
              "absolute z-50 flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 shadow-lg hover:scale-110",
              "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/50",
              "top-4 right-4 text-gray-500 hover:bg-white/10 focus:ring-white/50",
              closeButtonPosition === 'top-right' && "top-4 right-4",
              closeButtonPosition === 'top-left' && "top-4 left-4",
              closeButtonPosition === 'header-right' && "top-4 right-4"
            )}
            onClick={handleClose}
            title="Fermer"
            aria-label="Fermer la modal"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        <DialogHeader className="pb-6 pt-2">
          <DialogTitle className="flex items-center gap-4 text-2xl font-bold">
            {effectiveIcon && (
              <div className={cn(
                "p-3 rounded-xl shadow-lg",
                theme.primary
              )}>
                {effectiveIcon}
              </div>
            )}
            <span className="text-gray-800 dark:text-gray-100">
              {title}
            </span>
          </DialogTitle>
          {description && (
            <p className="text-gray-600 dark:text-gray-300 mt-3 text-sm leading-relaxed">
              {description}
            </p>
          )}
          <div className={cn(
            "h-1 w-full rounded-full mt-4 shadow-sm",
            theme.line
          )} />
        </DialogHeader>

        <div className={cn("flex-1 overflow-y-auto space-y-6 px-1", contentClassName)}>
          {/* Error/Success Messages */}
          {error && (
            <div className={cn(
              "text-sm p-4 rounded-xl border shadow-sm animate-in slide-in-from-top-2",
              "text-red-700 bg-red-50 border-red-200 dark:text-red-300 dark:bg-red-900/20 dark:border-red-800",
              "flex items-center gap-2"
            )}>
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className={cn(
              "text-sm p-4 rounded-xl border shadow-sm animate-in slide-in-from-top-2",
              "text-green-700 bg-green-50 border-green-200 dark:text-green-300 dark:bg-green-900/20 dark:border-green-800",
              "flex items-center gap-2"
            )}>
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              {success}
            </div>
          )}

          {/* Tabs */}
          {tabs && tabs.length > 0 && (
            <Tabs defaultValue={tabs[0].id} className="w-full">
              <TabsList className={cn(
                "flex w-full h-14 p-1 rounded-xl shadow-inner bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm",
                "border border-gray-200 dark:border-gray-700"
              )}>
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className={cn(
                      "flex items-center gap-3 px-6 py-3 rounded-lg font-medium transition-all duration-300",
                      "data-[state=active]:shadow-lg data-[state=active]:border-2",
                      theme.tabActive
                    )}
                  >
                    {tab.icon && (
                      <div className="p-2 rounded-full bg-white/50 dark:bg-gray-700/50">
                        {tab.icon}
                      </div>
                    )}
                    <div className="text-left">
                      <div className="font-semibold">{tab.label}</div>
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>

              {tabs.map((tab) => (
                <TabsContent key={tab.id} value={tab.id} className="space-y-4 mt-6">
                  {tab.content}
                </TabsContent>
              ))}
            </Tabs>
          )}

          {/* Fields */}
          {fields && fields.length > 0 && (
            <div className="space-y-5">
              {fields.map(renderField)}
            </div>
          )}

          {/* Custom Content */}
          {children}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-300">Chargement...</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {showFooter && (
          <div className={cn(
            "flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-700",
            "bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-b-lg"
          )}>
            {showCancelButton && (
              <Button
                variant="outline"
                onClick={handleCancel}
                className={cn(
                  "flex-1 h-12 text-base font-semibold transition-all duration-200 hover:scale-105",
                  "border-2 hover:border-gray-300 dark:hover:border-gray-600"
                )}
                disabled={loading}
              >
                {cancelLabel}
              </Button>
            )}

            {buttons && buttons.map((button, index) => (
              <Button
                key={index}
                variant={button.variant}
                onClick={button.onClick}
                disabled={button.disabled || loading}
                className={cn(
                  "flex-1 h-12 text-base font-semibold transition-all duration-200 hover:scale-105",
                  button.variant === 'default' && theme.accent,
                  button.className
                )}
              >
                {button.loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : button.icon ? (
                  <span className="mr-2">{button.icon}</span>
                ) : null}
                {button.label}
              </Button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
})

GenericModal.displayName = 'GenericModal'

export default GenericModal
