import { useState } from "react";
import { MediaFile } from "../types";

type Props = {
  file: MediaFile;
  onSave: (tags: string[]) => void;
  onClose: () => void;
};

export default function TagEditor({ file, onSave, onClose }: Props) {
  const [tags, setTags] = useState(file.tags.join(", "));

  return (
    <div style={{ border: "1px solid gray", padding: "10px", marginTop: "10px" }}>
      <h3>{file.path}</h3>
      <input
        type="text"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
      />
      <button onClick={() => onSave(tags.split(",").map(t => t.trim()))}>
        Сохранить
      </button>
      <button onClick={onClose}>Закрыть</button>
    </div>
  );
}
