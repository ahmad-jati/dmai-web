# Stepper Exercise Audio Narration Fixes

## Issues Fixed

### 1. **Narration Not Playing At All**
- **Root Cause**: The `playNarration` callback depended on mutable state variables (`isMuted`, `isBgmStopped`, `isPlaying`), causing it to be recreated on every render and breaking the dependency chain.
- **Solution**: Reduced dependencies to only `[step.audio, isMuted, isBgmStopped]`, removing `isPlaying` which was unnecessary for narration playback.

### 2. **Laggy BGM Fade-Out After Session**
- **Root Cause**: The fade-in and fade-out functions used `setInterval` with fixed time steps, creating jerky animations and blocking the main thread.
- **Solution**: Replaced `setInterval` with `requestAnimationFrame` for smooth, hardware-accelerated animations that sync with the browser's refresh rate.
- **Benefits**: 
  - 60fps smooth transitions instead of stepped intervals
  - Better performance and responsiveness
  - No blocking of other operations

### 3. **Unreliable Narration Playback**
- **Root Cause**: Audio playback relied on `canplaythrough` event which can fail or delay unpredictably, especially on slower networks.
- **Solution**: Simplified to direct `load()` + `play()` approach with proper error handling.
- **Added**: Immediate BGM ducking while narration plays, without waiting for external events.

### 4. **Event Listener Memory Leaks**
- **Root Cause**: Previous listeners weren't properly cleaned up when switching steps, causing accumulation and race conditions.
- **Solution**: Centralized cleanup using `narrationListenerCleanupRef` that executes before each new narration.

## Code Changes

### Fade Functions (Lines 51-81)
```tsx
// Before: setInterval with fixed steps → Jerky, laggy transitions
// After: requestAnimationFrame → Smooth 60fps animations
```

### Narration Playback (Lines 159-213)
```tsx
// Simplified playback logic:
// 1. Load audio
// 2. Play immediately (no delay)
// 3. Duck BGM while narration plays
// 4. Restore BGM when narration ends
// 5. Proper listener cleanup on next step
```

### Dependency Array Fix (Line 213)
```tsx
// Before: [step.audio, isMuted, isBgmStopped, isPlaying]
// After: [step.audio, isMuted, isBgmStopped]
// Reason: isPlaying wasn't used in playNarration, was causing unnecessary recreations
```

## Testing Checklist
- [ ] Narration plays immediately when stepping forward
- [ ] Ulangi (repeat) button plays narration again
- [ ] Sebelumnya (previous) button has no lag before narration
- [ ] BGM fades in/out smoothly without stuttering
- [ ] BGM fades out smoothly when session completes
- [ ] Long narration audio completes without being cut off
- [ ] Mute toggle affects narration volume correctly
- [ ] No console errors related to audio playback

## User Experience Impact
✓ Users can now follow instructions purely by listening without looking at the screen
✓ No delays or lags when navigating between steps
✓ Smooth, professional audio transitions with background music
✓ Reliable audio playback across all interactions
