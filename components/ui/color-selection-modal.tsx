import * as React from "react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Palette, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ColorOption {
  name: string;
  value: string;
  border: string;
}

export interface ColorSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  colors: ColorOption[];
  selectedColor?: ColorOption;
  onColorSelect: (color: ColorOption) => void;
  title?: string;
  description?: string;
}

export function ColorSelectionModal({
  open,
  onOpenChange,
  colors,
  selectedColor,
  onColorSelect,
  title = "Sélectionner une couleur",
  description = "Choisissez la couleur de votre dossier"
}: ColorSelectionModalProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredColors = React.useMemo(() => {
    if (!searchTerm) return colors;
    return colors.filter(color =>
      color.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [colors, searchTerm]);

  const handleColorSelect = (color: ColorOption) => {
    onColorSelect(color);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-purple-500" />
            {title}
          </DialogTitle>
          {description && (
            <p className="text-sm text-muted-foreground mt-2">
              {description}
            </p>
          )}
        </DialogHeader>

        {/* Search */}
        <div className="space-y-2 pb-4">
          <Label htmlFor="color-search" className="text-sm font-medium">
            Rechercher une couleur
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              id="color-search"
              placeholder="Tapez pour rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => setSearchTerm("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Color Grid */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="grid grid-cols-4 gap-3">
            {filteredColors.map((color) => (
              <Button
                key={color.value}
                variant="outline"
                className={cn(
                  "h-16 w-full flex flex-col items-center justify-center gap-2 p-2 transition-all duration-200",
                  "hover:scale-105 hover:shadow-lg",
                  selectedColor?.value === color.value
                    ? "ring-2 ring-primary ring-offset-2 bg-primary/5"
                    : "hover:bg-accent"
                )}
                onClick={() => handleColorSelect(color)}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg border-2 shadow-sm",
                    color.value,
                    color.border
                  )}
                />
                <span className="text-xs font-medium text-center">
                  {color.name}
                </span>
              </Button>
            ))}
          </div>

          {filteredColors.length === 0 && searchTerm && (
            <div className="text-center py-8 text-muted-foreground">
              <Palette className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Aucune couleur trouvée pour "{searchTerm}"</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Couleur sélectionnée: <span className="font-medium text-foreground">{selectedColor?.name || "Aucune"}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button onClick={() => onOpenChange(false)}>
              Confirmer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ColorSelectionModal;
