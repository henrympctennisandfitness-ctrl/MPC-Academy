"use client";

import { StepHeader } from "../StepHeader";
import { UploadDropzone } from "../UploadDropzone";
import type { FileMeta } from "../../schema";

interface StepUploadProps {
  fileMeta: FileMeta | null;
  /** True when a draft restored the file's details but not its bytes. */
  needsReattach: boolean;
  onAccepted: (file: File) => void;
  onRemove: () => void;
}

/** Step 3 — upload the video. */
export function StepUpload(props: StepUploadProps) {
  return (
    <div>
      <StepHeader
        title="Upload your video"
        subtitle="Drop a clip in, or tap to choose one. Landscape footage works best."
      />
      <UploadDropzone {...props} />
    </div>
  );
}
