import * as React from "react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, X, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { FolderPlus, BookOpen, Calendar, Tag, Archive, FileText } from "lucide-react";

export interface IconOption {
  name: string;
  Comp: React.ComponentType<any>;
}

export interface IconSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  icons: IconOption[];
  selectedIcon?: string;
  onIconSelect: (iconName: string) => void;
  title?: string;
  description?: string;
}

export function IconSelectionModal({
  open,
  onOpenChange,
  icons,
  selectedIcon,
  onIconSelect,
  title = "Sélectionner une icône",
  description = "Choisissez une icône pour votre dossier"
}: IconSelectionModalProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredIcons = React.useMemo(() => {
    if (!searchTerm) return icons;
    return icons.filter(icon =>
      icon.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [icons, searchTerm]);

  const handleIconSelect = (iconName: string) => {
    onIconSelect(iconName);
    onOpenChange(false);
  };

  const handleNoIcon = () => {
    onIconSelect("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
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
          <Label htmlFor="icon-search" className="text-sm font-medium">
            Rechercher une icône
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              id="icon-search"
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

        {/* Icon Grid */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="space-y-4">
            {/* No Icon Option */}
            <Button
              variant="outline"
              className={cn(
                "h-16 w-full flex items-center justify-center gap-3 p-4 transition-all duration-200",
                "hover:scale-105 hover:shadow-lg",
                !selectedIcon
                  ? "ring-2 ring-primary ring-offset-2 bg-primary/5"
                  : "hover:bg-accent"
              )}
              onClick={handleNoIcon}
            >
              <div className="w-8 h-8 rounded-lg border-2 border-dashed border-muted-foreground flex items-center justify-center">
                <X className="w-4 h-4 text-muted-foreground" />
              </div>
              <span className="font-medium">Aucune icône</span>
            </Button>

            {/* Icons Grid */}
            <div className="grid grid-cols-4 gap-3">
              {filteredIcons.map((icon) => {
                const IconComponent = icon.Comp;
                return (
                  <Button
                    key={icon.name}
                    variant="outline"
                    className={cn(
                      "h-16 w-full flex flex-col items-center justify-center gap-2 p-2 transition-all duration-200",
                      "hover:scale-105 hover:shadow-lg",
                      selectedIcon === icon.name
                        ? "ring-2 ring-primary ring-offset-2 bg-primary/5"
                        : "hover:bg-accent"
                    )}
                    onClick={() => handleIconSelect(icon.name)}
                  >
                    <div className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-medium text-center capitalize">
                      {icon.name.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </Button>
                );
              })}
            </div>

            {filteredIcons.length === 0 && searchTerm && (
              <div className="text-center py-8 text-muted-foreground">
                <Star className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Aucune icône trouvée pour "{searchTerm}"</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Icône sélectionnée: <span className="font-medium text-foreground">
              {selectedIcon ? selectedIcon.replace(/([A-Z])/g, ' $1').trim() : "Aucune"}
            </span>
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

export default IconSelectionModal;
