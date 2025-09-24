"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { X, FolderOpen, Plus, Upload, Camera, Image, Mic } from "lucide-react"
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
  type: 'text' | 'file' | 'select' | 'textarea' | 'tags'
  placeholder?: string
  required?: boolean
  options?: { label: string; value: string }[]
  accept?: string
  multiple?: boolean
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

const colorThemes = {
  yellow: {
    primary: 'bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900 dark:hover:bg-yellow-800 text-yellow-600 dark:text-yellow-400',
    accent: 'bg-yellow-500 hover:bg-yellow-600 text-white',
    border: 'border-yellow-200 dark:border-yellow-800',
    gradient: 'from-yellow-500 to-yellow-600',
    line: 'bg-yellow-500'
  },
  blue: {
    primary: 'bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-600 dark:text-blue-400',
    accent: 'bg-blue-500 hover:bg-blue-600 text-white',
    border: 'border-blue-200 dark:border-blue-800',
    gradient: 'from-blue-500 to-blue-600',
    line: 'bg-blue-500'
  },
  purple: {
    primary: 'bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 dark:hover:bg-purple-800 text-purple-600 dark:text-purple-400',
    accent: 'bg-purple-500 hover:bg-purple-600 text-white',
    border: 'border-purple-200 dark:border-purple-800',
    gradient: 'from-purple-500 to-purple-600',
    line: 'bg-purple-500'
  },
  red: {
    primary: 'bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-600 dark:text-red-400',
    accent: 'bg-red-500 hover:bg-red-600 text-white',
    border: 'border-red-200 dark:border-red-800',
    gradient: 'from-red-500 to-red-600',
    line: 'bg-red-500'
  },
  green: {
    primary: 'bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 text-green-600 dark:text-green-400',
    accent: 'bg-green-500 hover:bg-green-600 text-white',
    border: 'border-green-200 dark:border-green-800',
    gradient: 'from-green-500 to-green-600',
    line: 'bg-green-500'
  },
  pink: {
    primary: 'bg-pink-100 hover:bg-pink-200 dark:bg-pink-900 dark:hover:bg-pink-800 text-pink-600 dark:text-pink-400',
    accent: 'bg-pink-500 hover:bg-pink-600 text-white',
    border: 'border-pink-200 dark:border-pink-800',
    gradient: 'from-pink-500 to-pink-600',
    line: 'bg-pink-500'
  },
  orange: {
    primary: 'bg-orange-100 hover:bg-orange-200 dark:bg-orange-900 dark:hover:bg-orange-800 text-orange-600 dark:text-orange-400',
    accent: 'bg-orange-500 hover:bg-orange-600 text-white',
    border: 'border-orange-200 dark:border-orange-800',
    gradient: 'from-orange-500 to-orange-600',
    line: 'bg-orange-500'
  },
  gray: {
    primary: 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-900 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400',
    accent: 'bg-gray-500 hover:bg-gray-600 text-white',
    border: 'border-gray-200 dark:border-gray-800',
    gradient: 'from-gray-500 to-gray-600',
    line: 'bg-gray-500'
  },
  black: {
    primary: 'bg-black hover:bg-gray-800 text-white',
    accent: 'bg-black hover:bg-gray-800 text-white',
    border: 'border-gray-800',
    gradient: 'from-black to-gray-800',
    line: 'bg-black'
  }
}

const sizeClasses = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
  full: 'sm:max-w-[95vw]'
}

export function GenericModal({
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
}: GenericModalProps) {

  // Use file type configuration if provided, otherwise use color theme
  const fileTypeConfig = fileType ? getFileTypeConfig(fileType) : null
  const effectiveColorTheme = fileType ? fileTypeConfig?.colorTheme || 'blue' : colorTheme
  const theme = colorThemes[effectiveColorTheme]
  const sizeClass = sizeClasses[size]

  // Use file type icon if no custom icon provided
  const effectiveIcon = icon || (fileType ? getModalIcon(fileType) : null)

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      onOpenChange(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  const renderField = (field: ModalField) => {
    const [value, setValue] = React.useState('')
    const [tags, setTags] = React.useState<string[]>([])
    const [currentTag, setCurrentTag] = React.useState('')

    const addTag = () => {
      if (currentTag.trim() && !tags.includes(currentTag.trim())) {
        setTags([...tags, currentTag.trim()])
        setCurrentTag('')
      }
    }

    const removeTag = (tagToRemove: string) => {
      setTags(tags.filter(tag => tag !== tagToRemove))
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        addTag()
      }
    }

    switch (field.type) {
      case 'text':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              type="text"
              placeholder={field.placeholder}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required={field.required}
            />
          </div>
        )

      case 'file':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              type="file"
              accept={field.accept}
              multiple={field.multiple}
              required={field.required}
            />
          </div>
        )

      case 'select':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <select
              id={field.id}
              className="w-full border rounded p-2 bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              required={field.required}
            >
              <option value="">Sélectionner...</option>
              {field.options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )

      case 'tags':
        return (
          <div key={field.id} className="space-y-2">
            <Label>{field.label}</Label>
            <div className="flex gap-2">
              <Input
                placeholder={field.placeholder || "Ajouter une étiquette..."}
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button type="button" onClick={addTag} size="sm" variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-muted px-2 py-1 rounded text-xs cursor-pointer hover:bg-muted/80"
                  onClick={() => removeTag(tag)}
                >
                  {tag} ×
                </span>
              ))}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          sizeClass,
          "max-h-[95vh] overflow-y-auto",
          colorTheme === 'black' ? 'bg-black text-white' : 'bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800',
          className
        )}
      >
        {/* Close Button */}
        {showCloseButton && (
          <button
            className={cn(
              "absolute z-50 flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-offset-2",
              colorTheme === 'black'
                ? 'top-4 right-4 text-white hover:bg-white/10 focus:ring-white/50'
                : 'top-4 right-4 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 focus:ring-gray-500',
              closeButtonPosition === 'top-right' && "top-4 right-4",
              closeButtonPosition === 'top-left' && "top-4 left-4",
              closeButtonPosition === 'header-right' && "top-4 right-4"
            )}
            onClick={handleClose}
            title="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        <DialogHeader className="pb-6">
          <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
            {icon && (
              <div className={cn(
                "p-2 rounded-full",
                colorTheme === 'black'
                  ? 'bg-white/10 text-white'
                  : `${theme.primary} border ${theme.border}`
              )}>
                {icon}
              </div>
            )}
            <span className={colorTheme === 'black' ? 'text-white' : ''}>
              {title}
            </span>
          </DialogTitle>
          {description && (
            <p className={cn(
              "text-muted-foreground mt-2",
              colorTheme === 'black' && 'text-gray-300'
            )}>
              {description}
            </p>
          )}
          <div className={cn(
            "h-1 w-full rounded-full mt-3",
            colorTheme === 'black' ? 'bg-white/20' : `bg-gradient-to-r ${theme.gradient}`
          )} />
        </DialogHeader>

        <div className={cn("space-y-6", contentClassName)}>
          {/* Error/Success Messages */}
          {error && (
            <div className={cn(
              "text-sm p-3 rounded-lg border",
              colorTheme === 'black'
                ? 'text-red-300 bg-red-900/20 border-red-800'
                : 'text-red-600 bg-red-50 border-red-200'
            )}>
              {error}
            </div>
          )}

          {success && (
            <div className={cn(
              "text-sm p-3 rounded-lg border",
              colorTheme === 'black'
                ? 'text-green-300 bg-green-900/20 border-green-800'
                : 'text-green-600 bg-green-50 border-green-200'
            )}>
              {success}
            </div>
          )}

          {/* Tabs */}
          {tabs && tabs.length > 0 && (
            <Tabs defaultValue={tabs[0].id} className="w-full">
              <TabsList className={cn(
                "grid w-full grid-cols-2 h-14 p-1 rounded-xl shadow-inner",
                colorTheme === 'black'
                  ? 'bg-gray-800 border-gray-700'
                  : 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700'
              )}>
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className={cn(
                      "flex items-center gap-3 px-6 py-3 rounded-lg font-medium transition-all duration-200",
                      colorTheme === 'black'
                        ? 'data-[state=active]:bg-gray-700 data-[state=active]:text-white data-[state=active]:border-gray-600'
                        : 'data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:border-2 data-[state=active]:border-gray-200 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:border-gray-600'
                    )}
                  >
                    {tab.icon && (
                      <div className={cn(
                        "p-2 rounded-full",
                        colorTheme === 'black'
                          ? 'bg-gray-700'
                          : 'bg-gray-100 dark:bg-gray-800'
                      )}>
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
            <div className="space-y-4">
              {fields.map(renderField)}
            </div>
          )}

          {/* Custom Content */}
          {children}

          {/* Loading State */}
          {loading && (
            <div className={cn(
              "flex items-center justify-center py-8",
              colorTheme === 'black' ? 'text-white' : ''
            )}>
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p>Chargement...</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {showFooter && (
          <div className={cn(
            "flex gap-2 pt-4 border-t",
            colorTheme === 'black' ? 'border-gray-800' : 'border-gray-200 dark:border-gray-700'
          )}>
            {showCancelButton && (
              <Button
                variant="outline"
                onClick={handleCancel}
                className={cn(
                  "flex-1",
                  colorTheme === 'black' && 'border-gray-600 text-white hover:bg-gray-800'
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
                  button.variant === 'default' && `flex-1 bg-gradient-to-r ${theme.gradient} hover:opacity-90`,
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
}

export default GenericModal
