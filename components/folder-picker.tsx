import React from "react";

interface FolderPickerProps {
  onSelect: (files: FileList) => void;
}

const FolderPicker: React.FC<FolderPickerProps> = ({ onSelect }) => {
  return (
    <div>
      <label htmlFor="folder-picker">Sélectionner un dossier :</label>
      <input
        id="folder-picker"
        type="file"
        // @ts-ignore
        webkitdirectory
        multiple
        onChange={e => {
          if (e.target.files) {
            onSelect(e.target.files);
          }
        }}
        style={{ display: "block", margin: "1em 0" }}
      />
    </div>
  );
};

export default FolderPicker;
