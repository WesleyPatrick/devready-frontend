export const SUBMISSION_POLL_MS = 1000

let override: number | undefined

export function submissionPollMs() {
  return override ?? SUBMISSION_POLL_MS
}

export function setSubmissionPollForTests(ms: number | undefined) {
  override = ms
}
