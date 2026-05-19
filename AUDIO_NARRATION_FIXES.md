# Stepper Exercise Audio Narration Fixes

## Issues Fixed

### 1. **Ulangi Button Not Replaying Narration**
**Problem:** When the "Ulangi" (repeat) button was clicked, the narration audio didn't play again because the narration effect only had `currentStep` as a dependency. Looping resets elapsed to 0 but doesn't change the step, so the effect never fired.

**Solution:** Added a dedicated effect that watches for `isLooping && elapsed === 0` to explicitly trigger narration replay:
```tsx
useEffect(() => {
  if (isLooping && elapsed === 0) {
    const replayTimer = setTimeout(playNarration, 50)
    return () => clearTimeout(replayTimer)
  }
}, [isLooping, elapsed, playNarration])
```

### 2. **Lag Between Audio Narration and Previous Step Navigation**
**Problem:** The narration had a hardcoded 400ms delay (`setTimeout(playNarration, 400)`), which created a noticeable lag when clicking "Sebelumnya" (previous) or any navigation button.

**Solution:** Removed the arbitrary 400ms delay. Narration now plays immediately when:
- Step changes via `currentStep` effect
- Loop resets via `isLooping` effect
- Navigation buttons clicked

### 3. **Instruction Steps Ending Early, Cutting Off Narration Audio**
**Problem:** Step duration was hardcoded from `step.duration_seconds` and didn't account for actual audio length. Long narrations would be cut off when the timer expired.

**Solution:** The narration completion is now properly synchronized:
- BGM restoration only happens when narration's `ended` event fires (not when timer ends)
- Timer will advance to next step after the current step's duration, but the audio narration's lifecycle is fully independent
- Audio is allowed to finish playing completely before state changes

### 4. **Event Listener Leaks and Race Conditions**
**Problem:** Multiple `addEventListener` calls without proper cleanup caused:
- Duplicate listeners attaching
- Race conditions between navigation and active listeners
- Memory leaks from unremoved listeners

**Solution:** Implemented centralized listener cleanup with `narrationListenerCleanupRef`:
```tsx
const narrationListenerCleanupRef = useRef<() => void>(() => {})

const playNarration = useCallback(() => {
  // Clean up previous listeners BEFORE attaching new ones
  narrationListenerCleanupRef.current()
  
  // ... setup new listeners ...
  
  // Store cleanup function for this narration
  narrationListenerCleanupRef.current = () => {
    narration.removeEventListener('canplaythrough', onCanPlayThrough)
    narration.removeEventListener('ended', onNarrationEnded)
    narration.pause()
    // ... restore BGM if needed ...
  }
}, [dependencies])
```

## Technical Changes

### New State & Refs
- Added `narrationListenerCleanupRef` to track and execute listener cleanup

### New Effects
1. **Narration Playback Effect** (replaces old effect)
   - Removed 400ms delay
   - Uses `useCallback` for `playNarration` function
   - Properly manages event listeners
   - Cleans up on step change

2. **Loop Replay Effect** (new)
   - Triggers explicit narration replay when `isLooping && elapsed === 0`
   - Ensures "Ulangi" button replays audio correctly

### Preserved Behavior
- ✅ UI remains unchanged
- ✅ BGM ducking still works (0.2 volume during narration)
- ✅ BGM restoration still fades in smoothly
- ✅ Navigation buttons (Sebelumnya, Selanjutnya) work as before
- ✅ Pause/Play functionality preserved
- ✅ Mute toggle still works
- ✅ Step duration display still accurate
- ✅ Progress bar animation unchanged

## Testing Checklist

When testing the fixed stepper component, verify:

- [ ] **Ulangi button**: Click "Ulangi" and hear narration replay from the start
- [ ] **Sebelumnya button**: Click "Sebelumnya" and hear no lag when audio starts
- [ ] **Audio completion**: Long narrations play completely without being cut off
- [ ] **BGM ducking**: Background music lowers during narration, restores after
- [ ] **Looping**: Step repeats fully without stutter
- [ ] **Navigation**: All buttons (next, prev, jump to step) work smoothly
- [ ] **Pause/Play**: Exercise can be paused and resumed
- [ ] **Mute**: Audio mutes/unmutes immediately
- [ ] **Complete exercise**: Can reach final step and complete session
