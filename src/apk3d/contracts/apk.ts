/**
 * Exact copies of the Advantage Play Kit (APK) and game-contracts pieces the 3D kit needs.
 *
 * This repo does not depend on the monorepo, so each block below is copied verbatim (comments
 * and all) and marked with its source path and the monorepo commit it was copied from. At port
 * time the copies are replaced by imports from `@reading-advantage/game-contracts` and
 * `@reading-advantage/advantage-play-kit`; nothing in this file may drift from those sources.
 *
 * Monorepo: ../reading-advantage-monorepo at commit fe6aedc2b.
 */
import { z } from 'zod';

// ---------------------------------------------------------------------------------------------
// Source: packages/game-contracts/src/educational-io.ts (fe6aedc2b)
// ---------------------------------------------------------------------------------------------

/** Strict schema for one canonical learning-content item. */
export const vocabularyItemSchema = z
  .object({
    term: z.string(),
    translation: z.string(),
  })
  .strict();

/** Strict cartridge-facing vocabulary-array schema. */
export const vocabularyInputSchema = z.array(vocabularyItemSchema);

/** Strict cartridge-facing sentence-array schema. */
export const sentenceInputSchema = z.array(vocabularyItemSchema);

/** Strict schema for the established five-field cartridge result. */
export const gameResultsSchema = z
  .object({
    accuracy: z.number().min(0).max(1),
    xp: z.number().int().min(0),
    score: z.number().int().min(0),
    correctAnswers: z.number().int().min(0),
    totalAttempts: z.number().int().min(0),
  })
  .strict();

/** A canonical vocabulary item accepted by every APK cartridge. */
export type VocabularyItem = z.infer<typeof vocabularyItemSchema>;

/** The established vocabulary array calling convention. */
export type VocabularyInput = z.infer<typeof vocabularyInputSchema>;

/** The sentence-mode array calling convention, semantically distinct from vocabulary. */
export type SentenceInput = z.infer<typeof sentenceInputSchema>;

/** The established result emitted by an APK cartridge. */
export type GameResults = z.infer<typeof gameResultsSchema>;

// ---------------------------------------------------------------------------------------------
// Source: packages/advantage-play-kit/src/runtime/cartridge-manifest.ts (fe6aedc2b)
// `semanticAssetKeySchema` and `capabilityIdSchema` are module-private there; the kit exports
// them because `cartridge3DManifestSchema` reuses them (section 2.1 of docs/apk3d-cartridge.md).
// ---------------------------------------------------------------------------------------------

/** Rejects a physical file path where a semantic asset key is required. */
export const semanticAssetKeySchema = z
  .string()
  .min(1)
  .refine((value) => !value.startsWith("/") && !/\.(png|jpe?g|webp|gif|svg|json|atlas|mp3|ogg|wav)$/iu.test(value), {
    message: "Asset bindings must be semantic keys, not physical file paths",
  });

/** Rejects a capability id that does not use the capability namespace. */
export const capabilityIdSchema = z.string().regex(/^capability:[a-z0-9]+(?:-[a-z0-9]+)*$/u, {
  message: "Capability ids must use the capability: namespace and kebab-case",
});

/** Zod schema for the manifest that every mounted cartridge must supply. */
export const runtimeCartridgeManifestSchema = z
  .object({
    id: z.string().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u, {
      message: "Cartridge id must be lowercase kebab-case",
    }),
    title: z.string().min(1),
    description: z.string().min(1),
    runtimeApiVersion: z.string().min(1),
    inputMode: z.enum(["vocabulary", "sentence"]),
    requiredAssetBindings: z.array(semanticAssetKeySchema),
    capabilities: z.array(capabilityIdSchema).min(1),
  })
  .strict();

/**
 * Validates the manifest of a cartridge that the runtime is about to mount.
 * @param manifest Untrusted manifest supplied by a cartridge module.
 * @returns The validated manifest.
 * @throws When a field is missing, an asset binding is a physical path, or a capability id is malformed.
 */
export function validateRuntimeCartridgeManifest(
  manifest: unknown,
): z.infer<typeof runtimeCartridgeManifestSchema> {
  const parsed = runtimeCartridgeManifestSchema.safeParse(manifest);
  if (!parsed.success) {
    throw new Error(
      `Cartridge manifest validation failed: ${parsed.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ")}`,
    );
  }
  return parsed.data;
}

// ---------------------------------------------------------------------------------------------
// Source: packages/advantage-play-kit/src/runtime/types.ts (fe6aedc2b)
// ---------------------------------------------------------------------------------------------

/** Current browser runtime contract understood by the APK package. */
export const APK_RUNTIME_API_VERSION = "1.0.0";

/** Terminal presentation outcome supplied with an authoritative game result. */
export type GameTerminalOutcome = "victory" | "defeat" | "complete";

/** Canonical learning content accepted by a cartridge launch. */
export type GameInput = VocabularyInput | SentenceInput;

/** Provenance attached to every edition asset. */
export interface AssetProvenance {
  /** Original source or generation workflow. */
  source: string;
  /** SPDX identifier or documented project license label. */
  license: string;
  /** Optional original creator or vendor. */
  creator?: string;
  /** Optional upstream source URL. */
  sourceUrl?: string;
}

/** Browser-safe cartridge metadata used by hosts and diagnostics. */
export interface RuntimeCartridgeManifest {
  /** Stable cartridge identifier. */
  id: string;
  /** Human-readable cartridge title. */
  title: string;
  /** Short catalog description of the mechanic. */
  description: string;
  /** APK runtime API version required by the cartridge. */
  runtimeApiVersion: string;
  /** Educational input mode. */
  inputMode: "vocabulary" | "sentence";
  /** Semantic bindings that every edition must provide. */
  requiredAssetBindings: readonly string[];
  /** Phaser capability families exercised by the cartridge. */
  capabilities: readonly string[];
}

/** Diagnostic input accepted before the runtime assigns a timestamp. */
export type APKDiagnosticInput = Omit<APKDiagnosticEvent, "timestamp"> & {
  /** Optional deterministic timestamp supplied by tests or replay tooling. */
  timestamp?: number;
};

/** Runtime authority assigned to one mounted cartridge session. */
export type APKSessionMode = "playing" | "tutorial" | "demo";

/** Structured runtime event rendered by QC hosts and telemetry adapters. */
export interface APKDiagnosticEvent {
  /** Event severity. */
  level: "debug" | "info" | "warning" | "error";
  /** Stable event code. */
  code: string;
  /** Human-readable description. */
  message: string;
  /** Millisecond timestamp. */
  timestamp: number;
  /** Optional structured event context. */
  details?: Readonly<Record<string, unknown>>;
}

// ---------------------------------------------------------------------------------------------
// Source: packages/advantage-play-kit/src/systems/bounded-frame-loop.ts (fe6aedc2b)
// ---------------------------------------------------------------------------------------------

/** The exact frame-delta ceiling accepted from babel-architect, in milliseconds. */
export const BOUNDED_FRAME_DELTA_CEILING_MS = 50;

// ---------------------------------------------------------------------------------------------
// Source: packages/advantage-play-kit/src/systems/capability-manifest.ts and the cartridges that
// list them (fe6aedc2b). The ids a 3D cartridge lists; the kit implements the same behaviors.
// ---------------------------------------------------------------------------------------------

/** The APK capability ids the 3D kit implements for every cartridge (section 2.1). */
export const APK3D_CAPABILITIES = [
  'capability:bounded-frame-delta',
  'capability:single-completion-emission',
  'capability:result-accounting',
  'capability:nonempty-content-precondition',
  'capability:input-action-normalization',
  'capability:time-and-frame-loop',
] as const;

// ---------------------------------------------------------------------------------------------
// Source: packages/advantage-play-kit/src/responsive/responsive-composition.ts (fe6aedc2b)
// ---------------------------------------------------------------------------------------------

/** Rectangle in host-container coordinates. */
export interface LayoutRect {
  /** Horizontal offset from the container origin. */
  readonly x: number;
  /** Vertical offset from the container origin. */
  readonly y: number;
  /** Rectangle width. */
  readonly width: number;
  /** Rectangle height. */
  readonly height: number;
}

/** Insets removed from the host container before composition. */
export interface SafeAreaInsets {
  /** Top obstruction. */
  readonly top: number;
  /** Right obstruction. */
  readonly right: number;
  /** Bottom obstruction. */
  readonly bottom: number;
  /** Left obstruction. */
  readonly left: number;
}

/** Supported spatial composition profile. */
export type LayoutProfile = "compact" | "wide";

/** Input capability mode resolved independently from spatial composition. */
export type ResponsiveInputMode = "touch" | "pointer-keyboard" | "hybrid";

/** Standard APK region identifiers. */
export type StandardRegionId =
  | "gameplay"
  | "primary-prompt"
  | "primary-status"
  | "secondary-status"
  | "controls"
  | "feedback"
  | "navigation"
  | "modal";

/** Complete standard-region plan for a supported composition. */
export type StandardRegionPlan = Readonly<Record<StandardRegionId, LayoutRect>>;

/** World-adaptation strategy selected by a cartridge profile. */
export type WorldAdaptationStrategy = "reveal" | "follow" | "reflow" | "stage" | "panel" | "fixed-mechanic";

/** One structured responsive diagnostic. */
export interface ResponsiveDiagnostic {
  /** Stable diagnostic code. */
  readonly code: string;
  /** Diagnostic severity. */
  readonly severity: "info" | "warning" | "error";
  /** Human-readable actionable description. */
  readonly message: string;
  /** Optional diagnostic context. */
  readonly details?: Readonly<Record<string, unknown>>;
}

/** Successful responsive composition. */
export interface SupportedResponsiveComposition {
  /** Discriminator for a usable composition. */
  readonly supported: true;
  /** Selected spatial profile. */
  readonly profile: LayoutProfile;
  /** Independently selected interaction mode. */
  readonly inputMode: ResponsiveInputMode;
  /** Usable host rectangle after safe-area insets. */
  readonly safeRect: LayoutRect;
  /** Standard reserved, transient, modal, and gameplay regions. */
  readonly regions: StandardRegionPlan;
  /** Product-approved world adaptation strategy. */
  readonly strategy: WorldAdaptationStrategy;
  /** Minimum accessible touch target for this composition. */
  readonly minimumTouchTargetPx: number;
  /** Structured resolution diagnostics. */
  readonly diagnostics: readonly ResponsiveDiagnostic[];
}
