# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Mobile Viewport Responsive Issues
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate responsive issues across mobile viewports
  - **Scoped PBT Approach**: Test specific viewport widths (320px, 375px, 390px, 428px) with concrete failing screens
  - Test that for viewport widths 320px-428px, the application displays without horizontal scroll, with proper text wrapping, minimum 44px touch targets, minimum 14px body text, and iOS safe area handling
  - Create automated test using browser DevTools device emulation or Playwright/Cypress with viewport testing
  - Test cases to include:
    - QR Scanner modal at 375px width (expect horizontal overflow on unfixed code)
    - Admin suggestion management filters at 320px width (expect grid overflow on unfixed code)
    - Suggestion detail with long title at 390px width (expect text overflow on unfixed code)
    - Touch target measurements across all screens (expect buttons below 44px on unfixed code)
    - Body text font size measurements (expect text below 14px on unfixed code)
    - iOS safe area handling on iPhone 14 Pro simulation (expect content obscured by notch on unfixed code)
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS with specific counterexamples (horizontal scroll detected, elements overflow viewport, touch targets too small, text too small, safe areas not handled)
  - Document counterexamples found to understand root cause (e.g., "QR Scanner modal width 400px exceeds 375px viewport", "Admin filter grid doesn't stack on mobile", "Buttons are 36px height")
  - Mark task complete when test is written, run, and failures are documented
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Desktop and Tablet Layout Preservation
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for desktop (1024px+) and tablet (768px-1023px) viewports
  - Document current layouts, spacing, grid columns, and visual presentation
  - Write property-based tests capturing observed behavior patterns:
    - Desktop multi-column grids remain unchanged (stats grid, filter grid)
    - Tablet responsive breakpoints continue to work correctly
    - Modal sizes on desktop remain unchanged
    - Sidebar navigation on desktop remains unchanged
    - Hover states on desktop continue to work
  - Property-based testing generates many viewport width test cases for stronger guarantees
  - Test viewport widths: 768px, 800px, 1024px, 1280px, 1440px, 1920px
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10_

- [x] 3. Implement global responsive foundation

  - [x] 3.1 Add/update viewport meta tag
    - Locate HTML head section (app/layout.tsx, pages/_document.tsx, or public/index.html)
    - Add or update viewport meta tag: `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover" />`
    - Ensure viewport-fit=cover for iOS safe area support
    - _Bug_Condition: isBugCondition(viewport) where viewport.width >= 320 AND viewport.width <= 428_
    - _Expected_Behavior: Proper mobile scaling enabled, iOS safe areas supported_
    - _Preservation: Desktop and tablet viewports (768px+) unaffected_
    - _Requirements: 2.1, 2.2, 2.11_

  - [x] 3.2 Create global mobile-first CSS
    - File: app/globals.css or styles/globals.css
    - Add base styles:
      - Box-sizing: border-box for all elements
      - Overflow-x: hidden on html and body
      - Max-width: 100vw on html and body
      - Font-size: 14px on body (minimum for mobile readability)
      - Line-height: 1.5 for readability
      - Responsive images: max-width 100%, height auto
    - Add iOS safe area support with @supports and env() variables
    - Add touch target minimum size rules (44px)
    - Add responsive typography scale for different breakpoints
    - Add scrollbar-hide utility class
    - Add responsive grid utilities
    - _Bug_Condition: Missing global constraints causing overflow and sizing issues_
    - _Expected_Behavior: Global foundation prevents horizontal scroll, ensures minimum sizes, handles safe areas_
    - _Preservation: Desktop styles remain unchanged with mobile-first approach_
    - _Requirements: 2.1, 2.2, 2.4, 2.5, 2.6, 2.11_

  - [x] 3.3 Update Tailwind config with responsive breakpoints
    - File: tailwind.config.js
    - Define breakpoints: xs (320px), sm (375px), md (768px), lg (1024px), xl (1280px)
    - Ensure mobile-first approach with min-width media queries
    - _Bug_Condition: Missing or inadequate breakpoint definitions_
    - _Expected_Behavior: Consistent responsive breakpoints across all components_
    - _Preservation: Existing md, lg, xl breakpoints remain unchanged_
    - _Requirements: 2.1, 2.2_

- [x] 4. Fix QR Scanner component responsive issues

  - [x] 4.1 Make QR Scanner modal responsive
    - File: components/qr-scanner.tsx
    - Modal container: Add safe area padding using env() variables
    - Result cards: Change maxWidth from 400 to 'min(400px, calc(100vw - 40px))'
    - Scanner frame: Change from fixed 250x250 to 'min(250px, 80vw)' for both width and height
    - Manual input container: Change maxWidth from 300 to '100%'
    - Toast notification: Change minWidth to 'min(280px, calc(100vw - 40px))' and maxWidth to 'min(400px, calc(100vw - 40px))'
    - Toast positioning: Add safe area inset to bottom, center horizontally on mobile
    - Button heights: Increase all buttons to minimum 44px height
    - _Bug_Condition: Fixed pixel widths exceed mobile viewport, causing horizontal overflow_
    - _Expected_Behavior: Modal and all child elements fit within viewport at all mobile widths (320px-428px)_
    - _Preservation: Desktop modal appearance unchanged_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.11_

- [x] 5. Fix Admin Suggestion Management responsive issues

  - [x] 5.1 Make filter grid responsive
    - File: components/admin/suggestion-management.tsx
    - Change filter grid from 'grid-cols-1 md:grid-cols-2 lg:grid-cols-6' to 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-6'
    - Each filter takes full width on mobile, stacked vertically
    - Adjust gap for mobile (reduce if needed)
    - _Bug_Condition: Filter grid doesn't stack properly on mobile, causing overflow_
    - _Expected_Behavior: Filters stack vertically on mobile, no horizontal overflow_
    - _Preservation: Desktop 6-column grid unchanged_
    - _Requirements: 2.1, 2.2, 2.7_

  - [x] 5.2 Make stats grid responsive
    - Change stats grid from 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5' to 'grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-5'
    - Reduce padding from p-5 to p-4 on mobile
    - _Bug_Condition: Stats cards too cramped on mobile_
    - _Expected_Behavior: Stats display properly on all mobile widths_
    - _Preservation: Desktop 5-column grid unchanged_
    - _Requirements: 2.1, 2.2, 2.8_

  - [x] 5.3 Make tab bar scrollable on mobile
    - Change from 'grid w-full grid-cols-4' to responsive: 'flex overflow-x-auto' on mobile, 'grid grid-cols-4' on tablet+
    - Add 'scrollbar-hide' class for clean appearance
    - _Bug_Condition: Tab bar with 4 tabs overflows on 320px width_
    - _Expected_Behavior: Tabs scroll horizontally on mobile without visible scrollbar_
    - _Preservation: Desktop 4-column tab grid unchanged_
    - _Requirements: 2.1, 2.2, 2.9_

  - [x] 5.4 Stack header elements on mobile
    - Add 'flex-col sm:flex-row' to header to stack title and buttons on mobile
    - Ensure proper spacing between stacked elements
    - _Bug_Condition: Header buttons may overlap on small screens_
    - _Expected_Behavior: Header elements stack vertically on mobile_
    - _Preservation: Desktop horizontal header layout unchanged_
    - _Requirements: 2.1, 2.2_

  - [x] 5.5 Improve suggestion cards mobile layout
    - Add responsive padding: 'p-4 sm:p-5'
    - Stack meta info: 'flex-col sm:flex-row' for badges and info
    - Adjust font sizes: Reduce title from 'text-lg' to 'text-base' on mobile
    - _Bug_Condition: Suggestion cards have inadequate mobile padding and cramped layout_
    - _Expected_Behavior: Cards display comfortably on mobile with proper spacing_
    - _Preservation: Desktop card layout unchanged_
    - _Requirements: 2.1, 2.2, 2.5, 2.8_

  - [x] 5.6 Constrain dialog content width
    - Add 'max-width: calc(100vw - 32px)' on mobile for dialogs
    - Ensure proper scrolling for long content
    - _Bug_Condition: Dialog content may overflow on small screens_
    - _Expected_Behavior: Dialogs fit within mobile viewport_
    - _Preservation: Desktop dialog sizes unchanged_
    - _Requirements: 2.1, 2.2_

- [x] 6. Fix Suggestion Detail responsive issues

  - [x] 6.1 Ensure title wrapping
    - File: components/suggestions/suggestion-detail.tsx
    - Add 'wordBreak: break-word' and 'overflowWrap: break-word' to title
    - _Bug_Condition: Long titles don't wrap properly, extending beyond viewport_
    - _Expected_Behavior: Titles wrap within viewport at all mobile widths_
    - _Preservation: Desktop title display unchanged_
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 6.2 Stack meta info row on mobile
    - Change meta info from horizontal flex to 'flexDirection: column, gap: 8' on mobile
    - Use 'flexDirection: row, gap: 20' on tablet+
    - Or use 'flexWrap: wrap' to allow wrapping
    - _Bug_Condition: Meta info row overflows on small screens_
    - _Expected_Behavior: Meta info stacks or wraps properly on mobile_
    - _Preservation: Desktop horizontal meta info unchanged_
    - _Requirements: 2.1, 2.2, 2.8_

  - [x] 6.3 Improve file attachments mobile layout
    - Add 'overflow: hidden', 'textOverflow: ellipsis', 'whiteSpace: nowrap' to filename
    - Ensure download button stays visible with 'flexShrink: 0'
    - _Bug_Condition: File attachment names overflow containers_
    - _Expected_Behavior: Filenames truncate with ellipsis, download button always visible_
    - _Preservation: Desktop file attachment display unchanged_
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 6.4 Adjust response cards padding
    - Change padding from 16 to 12 on mobile, keep 16 on tablet+
    - _Bug_Condition: Response cards have inadequate mobile padding_
    - _Expected_Behavior: Response cards display comfortably on mobile_
    - _Preservation: Desktop response card padding unchanged_
    - _Requirements: 2.1, 2.2, 2.8_

- [x] 7. Fix Suggestions Screen responsive issues

  - [x] 7.1 Improve header buttons mobile layout
    - File: components/screens/suggestions-screen.tsx
    - Reduce button padding on mobile or stack vertically on very small screens
    - Keep refresh button icon-only on mobile
    - _Bug_Condition: Header buttons may overlap on small screens_
    - _Expected_Behavior: Header buttons fit comfortably on mobile_
    - _Preservation: Desktop header buttons unchanged_
    - _Requirements: 2.1, 2.2, 2.4_

  - [x] 7.2 Adjust stats strip for small screens
    - Reduce font sizes on mobile (value: 20px, label: 10px)
    - Or stack vertically on 320px width if needed
    - _Bug_Condition: Stats strip may be too cramped on 320px_
    - _Expected_Behavior: Stats display clearly on all mobile widths_
    - _Preservation: Desktop stats strip unchanged_
    - _Requirements: 2.1, 2.2, 2.5, 2.8_

  - [x] 7.3 Ensure tab bar proper sizing
    - Ensure badges don't cause overflow, reduce padding if needed
    - Reduce font size from 12px to 11px on mobile if needed
    - _Bug_Condition: Tab bar badges may cause overflow_
    - _Expected_Behavior: Tab bar fits within viewport on all mobile widths_
    - _Preservation: Desktop tab bar unchanged_
    - _Requirements: 2.1, 2.2, 2.5, 2.9_

  - [x] 7.4 Add scroll indication to filter chips
    - Current overflowX: auto is good, add visual indication
    - Add gradient fade at edges or scroll hint text "← Vuốt để xem thêm →"
    - _Bug_Condition: Filter chips overflow without clear scrolling indication_
    - _Expected_Behavior: Users understand filter chips are scrollable_
    - _Preservation: Desktop filter chips unchanged_
    - _Requirements: 2.1, 2.2, 2.10_

  - [x] 7.5 Improve suggestion cards mobile spacing
    - Keep current padding (14px) but ensure proper gap between cards
    - Adjust badge wrapping with proper gap
    - _Bug_Condition: Suggestion cards have cramped spacing on mobile_
    - _Expected_Behavior: Cards display with comfortable spacing_
    - _Preservation: Desktop card spacing unchanged_
    - _Requirements: 2.1, 2.2, 2.8_

  - [x] 7.6 Ensure search bar proper sizing
    - Increase padding from '10px 14px' to '12px 14px' for 44px height touch target
    - _Bug_Condition: Search bar may be below 44px minimum touch target_
    - _Expected_Behavior: Search bar meets 44px minimum height_
    - _Preservation: Desktop search bar unchanged_
    - _Requirements: 2.1, 2.2, 2.4_

- [x] 8. Review and fix other mobile screens

  - [x] 8.1 Review activity-list-mobile.tsx
    - File: components/activities/activity-list-mobile.tsx
    - Apply same responsive patterns as suggestions-screen.tsx
    - Ensure touch targets are minimum 44px
    - Add safe area padding if missing
    - _Bug_Condition: Similar responsive issues may exist_
    - _Expected_Behavior: Activity list displays properly on all mobile widths_
    - _Preservation: Desktop activity list unchanged_
    - _Requirements: 2.1, 2.2, 2.4, 2.11_

  - [x] 8.2 Review books-screen-mobile.tsx
    - File: components/screens/books-screen-mobile.tsx
    - Apply same responsive patterns as suggestions-screen.tsx
    - Ensure touch targets are minimum 44px
    - Add safe area padding if missing
    - _Bug_Condition: Similar responsive issues may exist_
    - _Expected_Behavior: Books screen displays properly on all mobile widths_
    - _Preservation: Desktop books screen unchanged_
    - _Requirements: 2.1, 2.2, 2.4, 2.11_

- [x] 9. Verify bug condition exploration test now passes

  - [x] 9.1 Re-run bug condition exploration test
    - **Property 1: Expected Behavior** - Mobile Viewport Responsive Compliance
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - Test should now pass for all mobile viewport widths (320px-428px):
      - No horizontal scrolling on any screen
      - All elements fit within viewport
      - Text wraps properly
      - Touch targets are minimum 44px
      - Body text is minimum 14px
      - iOS safe areas are handled
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12_

- [ ] 10. Verify preservation tests still pass

  - [x] 10.1 Re-run preservation property tests
    - **Property 2: Preservation** - Desktop and Tablet Layout Preservation
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - Tests should still pass for desktop (1024px+) and tablet (768px-1023px) viewports:
      - Desktop multi-column grids unchanged
      - Tablet responsive breakpoints work correctly
      - Modal sizes on desktop unchanged
      - Sidebar navigation unchanged
      - Hover states work correctly
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10_

- [x] 11. Checkpoint - Ensure all tests pass and perform manual verification
  - Run all automated tests (bug condition test + preservation tests)
  - Perform manual testing on real devices:
    - iOS devices: iPhone SE, iPhone 12, iPhone 14 Pro (test safe areas)
    - Android devices: Galaxy S21, Pixel 5, Galaxy Fold (test extreme widths)
  - Test all screens at mobile widths: 320px, 375px, 390px, 428px
  - Test all screens at tablet widths: 768px, 800px, 1024px
  - Test all screens at desktop widths: 1280px, 1440px, 1920px
  - Verify no horizontal scrolling on mobile
  - Verify all text wraps properly
  - Verify all touch targets are minimum 44px
  - Verify body text is minimum 14px
  - Verify iOS safe areas handled correctly
  - Verify desktop/tablet layouts unchanged
  - Test cross-browser: Chrome, Safari, Firefox, Edge (mobile and desktop)
  - Ask user if any issues arise or if additional adjustments needed
