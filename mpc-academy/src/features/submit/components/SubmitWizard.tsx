"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Toaster, toast } from "sonner";

import { WizardProgress } from "./WizardProgress";
import { WizardNav } from "./WizardNav";
import { StepType } from "./steps/StepType";
import { StepGoal } from "./steps/StepGoal";
import { StepUpload } from "./steps/StepUpload";
import { StepNotes } from "./steps/StepNotes";
import { StepReview } from "./steps/StepReview";
import { StepSuccess } from "./steps/StepSuccess";

import {
  EMPTY_WIZARD,
  STEP_COUNT,
  submissionSchema,
  type WizardData,
} from "../schema";
import { clearDraft, loadDraft, saveDraft } from "../storage";
import { uploadSubmission } from "../api";
import { CURRENT_MEMBER } from "@/lib/member";

/**
 * Submit Analysis — a six-screen wizard (five input steps + success).
 *
 * State lives in React Hook Form; the final payload is validated with Zod and
 * uploaded to the Google Apps Script Web App via the modular `uploadSubmission`
 * client (real upload progress). Progress is mirrored to localStorage so a
 * refresh resumes in place; step transitions are direction-aware.
 */
export function SubmitWizard() {
  const router = useRouter();
  const reduce = useReducedMotion();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [hydrated, setHydrated] = useState(false);

  // The live File is intentionally not persisted (it can't be) — only its
  // metadata is. A resumed draft therefore needs the clip re-attached to upload.
  const [liveFile, setLiveFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState(0);

  const { watch, setValue, getValues, reset } = useForm<WizardData>({
    defaultValues: EMPTY_WIZARD,
  });
  const data = watch();

  // A restored draft has metadata but no bytes → the member must re-attach.
  const needsReattach = data.fileMeta !== null && liveFile === null;

  // ---- Resume from a saved draft (client only) ----------------------------
  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      reset(draft.data);
      setStep(Math.min(Math.max(draft.step, 0), STEP_COUNT - 1));
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Persist draft on any change ----------------------------------------
  useEffect(() => {
    if (!hydrated || step >= STEP_COUNT) return;
    saveDraft({ step, data });
  }, [hydrated, step, data]);

  // ---- Field handlers ------------------------------------------------------
  const setType = (v: string) => setValue("analysisType", v);
  const setGoal = (v: string) => setValue("goal", v);
  const setNotes = (v: string) => setValue("notes", v);

  const onFileAccepted = useCallback(
    (file: File) => {
      setLiveFile(file);
      setValue("fileMeta", {
        name: file.name,
        size: file.size,
        type: file.type,
      });
    },
    [setValue],
  );

  const onRemoveFile = useCallback(() => {
    setLiveFile(null);
    setValue("fileMeta", null);
  }, [setValue]);

  // ---- Per-step gating -----------------------------------------------------
  const canProceed = (() => {
    switch (step) {
      case 0:
        return data.analysisType !== "";
      case 1:
        return data.goal !== "";
      case 2:
        return data.fileMeta !== null;
      default:
        return true;
    }
  })();

  // ---- Navigation ----------------------------------------------------------
  const goTo = (target: number) => {
    setDirection(target > step ? 1 : -1);
    setStep(target);
  };

  const goNext = () => {
    if (!canProceed) {
      toast.error("Make a selection to continue.");
      return;
    }
    goTo(step + 1);
  };

  const goBack = () => {
    if (step === 0) {
      router.push("/");
      return;
    }
    goTo(step - 1);
  };

  // ---- Submit --------------------------------------------------------------
  const handleSubmit = async () => {
    // 1. Validate the assembled answers with Zod.
    const result = submissionSchema.safeParse(getValues());
    if (!result.success) {
      const issue = result.error.issues[0];
      toast.error(issue.message);
      const field = issue.path[0];
      if (field === "analysisType") goTo(0);
      else if (field === "goal") goTo(1);
      else if (field === "fileMeta") goTo(2);
      return;
    }

    // 2. We need the actual bytes to upload (a resumed draft won't have them).
    if (!liveFile) {
      toast.error("Re-attach your video to upload it.");
      goTo(2);
      return;
    }

    // 3. Record the submission in Google Sheets (video bytes are Phase 2).
    setSubmitting(true);
    setSubmitProgress(0);
    try {
      const res = await uploadSubmission(
        {
          name: CURRENT_MEMBER.fullName,
          email: CURRENT_MEMBER.email,
          membershipId: CURRENT_MEMBER.membershipId,
          analysisType: data.analysisType,
          goal: data.goal,
          notes: data.notes,
          file: liveFile,
        },
        { onProgress: setSubmitProgress },
      );

      clearDraft();
      setDirection(1);
      setStep(STEP_COUNT); // success screen
      toast.success(res.message || "Submission received");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Upload failed. Please try again.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const restart = () => {
    reset(EMPTY_WIZARD);
    onRemoveFile();
    clearDraft();
    setSubmitProgress(0);
    setDirection(-1);
    setStep(0);
  };

  // ---- Render --------------------------------------------------------------
  const offset = reduce ? 0 : 20;
  const stepVariants = {
    enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? offset : -offset }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -offset : offset }),
  };

  const isSuccess = step >= STEP_COUNT;

  return (
    <div className="mx-auto w-full max-w-xl">
      <Toaster position="top-center" toastOptions={{ duration: 3200 }} />

      {isSuccess ? (
        <StepSuccess onRestart={restart} />
      ) : (
        <>
          <WizardProgress step={step} />

          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: [0.2, 0.7, 0.2, 1] }}
            >
              {step === 0 && (
                <StepType value={data.analysisType} onChange={setType} />
              )}
              {step === 1 && <StepGoal value={data.goal} onChange={setGoal} />}
              {step === 2 && (
                <StepUpload
                  fileMeta={data.fileMeta}
                  needsReattach={needsReattach}
                  onAccepted={onFileAccepted}
                  onRemove={onRemoveFile}
                />
              )}
              {step === 3 && <StepNotes value={data.notes} onChange={setNotes} />}
              {step === 4 && (
                <StepReview
                  data={data}
                  onEdit={goTo}
                  onSubmit={handleSubmit}
                  submitting={submitting}
                  progress={submitProgress}
                />
              )}
            </motion.div>
          </AnimatePresence>

          <WizardNav
            onBack={goBack}
            onNext={goNext}
            backLabel={step === 0 ? "Cancel" : "Back"}
            nextDisabled={!canProceed}
            hideNext={step === 4}
          />
        </>
      )}
    </div>
  );
}
