let delay = 300

export function searchDelay() {
  return delay
}

export function setSearchDelayForTests(ms: number) {
  delay = ms
}
