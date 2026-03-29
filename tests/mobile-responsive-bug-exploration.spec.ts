/**
 * Bug Condition Exploration Test for Mobile Responsive Issues
 * 
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12**
 * 
 * This test MUST FAIL on unfixed code to demonstrate the bug exists.
 * When this test passes after fixes, it confirms the expected behavior is satisfied.
 * 
 * Test Strategy:
 * - Test specific viewport widths: 320px, 375px, 390px, 428px (mobile range)
 * - Check for horizontal scrolling
 * - Check elements overflow viewport
 * - Check touch targets below 44px minimum
 * - Check body text below 14px minimum
 * - Check iOS safe area handling
 */

import { test, expect, Page } from '@playwright/test';

// Mobile viewport configurations
const MOBILE_VIEWPORTS = [
  { name: 'Small Mobile (320px)', width: 320, height: 568 },
  { name: 'iPhone SE (375px)', width: 375, height: 667 },
  { name: 'iPhone 12 (390px)', width: 390, height: 844 },
  { name: 'iPhone 14 Pro Max (428px)', width: 428, height: 926 },
];

// Helper function to check for horizontal scrolling
async function hasHorizontalScroll(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
}

// Helper function to check if elements overflow viewport
async function getOverflowingElements(page: Page): Promise<string[]> {
  return await page.evaluate(() => {
    const viewportWidth = window.innerWidth;
    const elements = document.querySelectorAll('*');
    const overflowing: string[] = [];
    
    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.right > viewportWidth) {
        const selector = el.tagName.toLowerCase() + 
          (el.id ? `#${el.id}` : '') + 
          (el.className ? `.${Array.from(el.classList).join('.')}` : '');
        overflowing.push(`${selector} (width: ${rect.width}px, right: ${rect.right}px)`);
      }
    });
    
    return overflowing.slice(0, 10); // Limit to first 10 for readability
  });
}

// Helper function to check touch target sizes
async function getSmallTouchTargets(page: Page): Promise<string[]> {
  return await page.evaluate(() => {
    const MIN_TOUCH_TARGET = 44;
    const interactiveElements = document.querySelectorAll('button, a, input, select, textarea, [role="button"]');
    const smallTargets: string[] = [];
    
    interactiveElements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0 && (rect.width < MIN_TOUCH_TARGET || rect.height < MIN_TOUCH_TARGET)) {
        const selector = el.tagName.toLowerCase() + 
          (el.id ? `#${el.id}` : '') + 
          (el.className ? `.${Array.from(el.classList).slice(0, 2).join('.')}` : '');
        smallTargets.push(`${selector} (${Math.round(rect.width)}x${Math.round(rect.height)}px)`);
      }
    });
    
    return smallTargets.slice(0, 10); // Limit to first 10
  });
}

// Helper function to check body text font sizes
async function getSmallTextElements(page: Page): Promise<string[]> {
  return await page.evaluate(() => {
    const MIN_FONT_SIZE = 14;
    const textElements = document.querySelectorAll('p, span, div, li, td, th');
    const smallText: string[] = [];
    
    textElements.forEach((el) => {
      const style = window.getComputedStyle(el);
      const fontSize = parseFloat(style.fontSize);
      const text = el.textContent?.trim();
      
      if (text && text.length > 10 && fontSize < MIN_FONT_SIZE) {
        const selector = el.tagName.toLowerCase() + 
          (el.id ? `#${el.id}` : '') + 
          (el.className ? `.${Array.from(el.classList).slice(0, 2).join('.')}` : '');
        smallText.push(`${selector} (${fontSize.toFixed(1)}px)`);
      }
    });
    
    return smallText.slice(0, 10); // Limit to first 10
  });
}

test.describe('Mobile Responsive Bug Exploration', () => {
  
  test.describe('Property 1: Bug Condition - Mobile Viewport Responsive Issues', () => {
    
    for (const viewport of MOBILE_VIEWPORTS) {
      test(`${viewport.name} - QR Scanner Modal Overflow`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        
        // Navigate to a page with QR scanner (assuming home page has access)
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        
        // Try to open QR scanner if button exists
        const qrButton = page.locator('button:has-text("QR")').or(page.locator('[aria-label*="QR"]')).first();
        if (await qrButton.count() > 0) {
          await qrButton.click();
          await page.waitForTimeout(500);
          
          // Check for horizontal scroll
          const hasScroll = await hasHorizontalScroll(page);
          const overflowing = await getOverflowingElements(page);
          
          // EXPECTED TO FAIL: Modal should overflow on unfixed code
          expect(hasScroll, `QR Scanner modal causes horizontal scroll at ${viewport.width}px. Overflowing elements: ${overflowing.join(', ')}`).toBe(false);
          expect(overflowing.length, `QR Scanner has ${overflowing.length} overflowing elements: ${overflowing.join(', ')}`).toBe(0);
        }
      });
      
      test(`${viewport.name} - Admin Suggestion Management Filters Overflow`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        
        // Navigate to admin suggestions page
        await page.goto('/admin/suggestions');
        await page.waitForLoadState('networkidle');
        
        // Check for horizontal scroll
        const hasScroll = await hasHorizontalScroll(page);
        const overflowing = await getOverflowingElements(page);
        
        // EXPECTED TO FAIL: Filter grid should overflow on unfixed code
        expect(hasScroll, `Admin suggestion filters cause horizontal scroll at ${viewport.width}px`).toBe(false);
        expect(overflowing.length, `Admin page has ${overflowing.length} overflowing elements: ${overflowing.join(', ')}`).toBe(0);
      });
      
      test(`${viewport.name} - Suggestion Detail Text Wrapping`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        
        // Navigate to suggestions page
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        
        // Try to find and click a suggestion
        const suggestionLink = page.locator('a[href*="suggestion"], button:has-text("Kiến nghị")').first();
        if (await suggestionLink.count() > 0) {
          await suggestionLink.click();
          await page.waitForTimeout(500);
          
          // Check for horizontal scroll
          const hasScroll = await hasHorizontalScroll(page);
          const overflowing = await getOverflowingElements(page);
          
          // EXPECTED TO FAIL: Long titles should overflow on unfixed code
          expect(hasScroll, `Suggestion detail causes horizontal scroll at ${viewport.width}px`).toBe(false);
          expect(overflowing.length, `Suggestion detail has ${overflowing.length} overflowing elements: ${overflowing.join(', ')}`).toBe(0);
        }
      });
      
      test(`${viewport.name} - Touch Target Measurements`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        
        // Check touch target sizes
        const smallTargets = await getSmallTouchTargets(page);
        
        // EXPECTED TO FAIL: Many buttons should be below 44px on unfixed code
        expect(smallTargets.length, `Found ${smallTargets.length} touch targets below 44px: ${smallTargets.join(', ')}`).toBe(0);
      });
      
      test(`${viewport.name} - Body Text Font Size`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        
        // Check text font sizes
        const smallText = await getSmallTextElements(page);
        
        // EXPECTED TO FAIL: Body text should be below 14px on unfixed code
        expect(smallText.length, `Found ${smallText.length} text elements below 14px: ${smallText.join(', ')}`).toBe(0);
      });
    }
    
    test('iPhone 14 Pro - iOS Safe Area Handling', async ({ page }) => {
      // Simulate iPhone 14 Pro with notch
      await page.setViewportSize({ width: 393, height: 852 });
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Check if safe area insets are applied
      const hasSafeAreaSupport = await page.evaluate(() => {
        const body = document.body;
        const style = window.getComputedStyle(body);
        const paddingTop = style.paddingTop;
        
        // Check if env(safe-area-inset-*) is used in CSS
        const hasEnvSupport = document.documentElement.innerHTML.includes('safe-area-inset') ||
          Array.from(document.styleSheets).some(sheet => {
            try {
              return Array.from(sheet.cssRules).some(rule => 
                rule.cssText.includes('safe-area-inset')
              );
            } catch {
              return false;
            }
          });
        
        return hasEnvSupport;
      });
      
      // EXPECTED TO FAIL: Safe area insets should not be handled on unfixed code
      expect(hasSafeAreaSupport, 'iOS safe area insets are not properly handled').toBe(true);
    });
    
    test('Comprehensive Mobile Viewport Test - All Issues', async ({ page }) => {
      // Test at 375px (most common mobile width)
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Collect all issues
      const issues: string[] = [];
      
      // Check horizontal scroll
      const hasScroll = await hasHorizontalScroll(page);
      if (hasScroll) {
        issues.push('❌ Horizontal scrolling detected');
      }
      
      // Check overflowing elements
      const overflowing = await getOverflowingElements(page);
      if (overflowing.length > 0) {
        issues.push(`❌ ${overflowing.length} elements overflow viewport: ${overflowing.slice(0, 3).join(', ')}`);
      }
      
      // Check touch targets
      const smallTargets = await getSmallTouchTargets(page);
      if (smallTargets.length > 0) {
        issues.push(`❌ ${smallTargets.length} touch targets below 44px: ${smallTargets.slice(0, 3).join(', ')}`);
      }
      
      // Check text sizes
      const smallText = await getSmallTextElements(page);
      if (smallText.length > 0) {
        issues.push(`❌ ${smallText.length} text elements below 14px: ${smallText.slice(0, 3).join(', ')}`);
      }
      
      // Log all issues found
      if (issues.length > 0) {
        console.log('\n🐛 Mobile Responsive Issues Found:');
        issues.forEach(issue => console.log(issue));
      }
      
      // EXPECTED TO FAIL: Multiple responsive issues should exist on unfixed code
      expect(issues.length, `Found ${issues.length} responsive issues:\n${issues.join('\n')}`).toBe(0);
    });
  });
});
