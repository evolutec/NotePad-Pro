# Script pour creer un fichier ICO a partir du PNG
Add-Type -AssemblyName System.Drawing

$pngPath = "$PSScriptRoot\..\public\icon-512.png"
$icoPath = "$PSScriptRoot\..\public\icon.ico"

Write-Host "Creation de l'icone ICO a partir de $pngPath..."

try {
    # Charger l'image PNG
    $bitmap = [System.Drawing.Bitmap]::new($pngPath)
    
    # Creer l'icone
    $icon = [System.Drawing.Icon]::FromHandle($bitmap.GetHicon())
    
    # Sauvegarder l'icone
    $fileStream = [System.IO.File]::Create($icoPath)
    $icon.Save($fileStream)
    $fileStream.Close()
    
    # Nettoyer
    $bitmap.Dispose()
    
    Write-Host "OK - Icone ICO creee avec succes: $icoPath" -ForegroundColor Green
} catch {
    Write-Host "ERREUR - Impossible de creer l'icone: $_" -ForegroundColor Red
    exit 1
}
