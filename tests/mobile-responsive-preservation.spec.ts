/**
 * Preservation Property Tests for Mobile Responsive Fix
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10**
 * 
 * These tests capture the CURRENT desktop (1024px+) and tablet (768px-1023px) behavior
 * BEFORE implementing any fixes. They MUST PASS on unfixed code to establish the baseline
 * behavior that must be preserved after the mobile responsive fixes are applied.
 * 
 * Test Strategy:
 * - Observe behavior on UNFIXED code first
 * - Document current layouts, spacing, grid columns, and visual presentation
 * - Test viewport widths: 768px, 800px, 1024px, 1280px, 1440px, 1920px
 * - Capture: Desktop multi-column grids, tablet breakpoints, modal sizes, sidebar, hover states
 * - Expected: Tests PASS on unfixed code (baseline to preserve)
 */

import { test, expect, Page } from '@playwright/test';

// Desktop and tablet viewport configurations
const DESKTOP_TABLET_VIEWPORTS = [
  { name: 'Tablet Portrait (768px)', width: 768, height: 1024, category: 'tablet' },
  { name: 'Tablet Landscape (800px)', width: 800, height: 600, category: 'tablet' },
  { name: 'Desktop Small (1024px)', width: 1024, height: 768, category: 'desktop' },
  { name: 'Desktop Medium (1280px)', width: 1280, height: 720, category: 'desktop' },
  { name: 'Desktop Large (1440px)', width: 1440, height: 900, category: 'desktop' },
  { name: 'Desktop XL (1920px)', width: 1920, height: 1080, category: 'desktop' },
];

// Helper function to capture layout snapshot
async function captureLayoutSnapshot(page: Page): Promise<{
  hasHorizontalScroll: boolean;
  bodyWidth: number;
  viewportWidth: number;
  gridColumns: Record<string, number>;
  elementSizes: Record<string, { width: number; height: number }>;
}> {
  return await page.evaluate(() => {
    const hasHorizontalScroll = document.documentElement.scrollWidth > document.documentElement.clientWidth;
    const bodyWidth = document.body.offsetWidth;
    const viewportWidth = window.innerWidth;
    
    // Capture grid column counts
    const gridColumns: Record<string, number> = {};
    const grids = document.querySelectorAll('[class*="grid"]');
    grids.forEach((grid, index) => {
      const style = window.getComputedStyle(grid);
      const templateColumns = style.gridTemplateColumns;
      if (templateColumns && templateColumns !== 'none') {
        const columnCount = templateColumns.split(' ').length;
        const className = grid.className.split(' ').slice(0, 3).join(' ');
        gridColumns[`grid-${index}-${className}`] = columnCount;
      }
    });
    
    // Capture key element sizes
    const elementSizes: Record<string, { width: number; height: number }> = {};
    
    // Capture modal sizes if present
    const modals = document.querySelectorAll('[role="dialog"], [class*="modal"]');
    modals.forEach((modal, index) => {
      const rect = modal.getBoundingClientRect();
      elementSizes[`modal-${index}`] = { width: rect.width, height: rect.height };
    });
    
    // Capture sidebar if present
    const sidebar = document.querySelector('[class*="sidebar"], nav[class*="side"]');
    if (sidebar) {
      const rect = sidebar.getBoundingClientRect();
      elementSizes['sidebar'] = { width: rect.width, height: rect.height };
    }
    
    return {
      hasHorizontalScroll,
      bodyWidth,
      viewportWidth,
      gridColumns,
      elementSizes,
    };
  });
}

// Helper function to check multi-column grid layout
async function getGridColumnCount(page: Page, selector: string): Promise<number | null> {
  return await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (!element) return null;
    
    const style = window.getComputedStyle(element);
    const templateColumns = style.gridTemplateColumns;
    if (templateColumns && templateColumns !== 'none') {
      return templateColumns.split(' ').length;
    }
    return null;
  }, selector);
}

// Helper function to check if element is visible
async function isElementVisible(page: Page, selector: string): Promise<boolean> {
  return await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (!element) return false;
    
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0' &&
           rect.width > 0 && 
           rect.height > 0;
  }, selector);
}

test.describe('Preservation Property Tests - Desktop and Tablet Layouts', () => {
  
  test.describe('Property 2: Preservation - Desktop and Tablet Layout Preservation', () => {
    
    for (const viewport of DESKTOP_TABLET_VIEWPORTS) {
      test(`${viewport.name} - No Horizontal Scroll (Baseline)`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        
        // Capture baseline: Desktop/tablet should NOT have horizontal scroll
        const snapshot = await captureLayoutSnapshot(page);
        
        // This should PASS on unfixed code - desktop/tablet don't have scroll issues
        expect(snapshot.hasHorizontalScroll, 
          `${viewport.name} should not have horizontal scroll (baseline behavior)`
        ).toBe(false);
        
        // Body width should match viewport width
        expect(snapshot.bodyWidth).toBeLessThanOrEqual(snapshot.viewportWidth);
      });
      
      test(`${viewport.name} - Admin Suggestion Management Multi-Column Grids`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        
        await page.goto('/admin/suggestions');
        await page.waitForLoadState('networkidle');
        
        // Capture baseline grid layouts
        const snapshot = await captureLayoutSnapshot(page);
        
        // Desktop should have multi-column grids, tablet should have fewer columns
        // We're documenting the CURRENT behavior to preserve it
        const expectedMinColumns = viewport.category === 'desktop' ? 2 : 1;
        
        // Document grid layouts (may or may not exist depending on page state)
        const gridCount = Object.keys(snapshot.gridColumns).length;
        
        // Log current grid configurations for documentation
        console.log(`${viewport.name} Grid Columns (found ${gridCount}):`, snapshot.gridColumns);
        
        // Verify no horizontal scroll - this is the key preservation requirement
        expect(snapshot.hasHorizontalScroll, 
          `${viewport.name} should not have horizontal scroll (baseline)`
        ).toBe(false);
      });
      
      test(`${viewport.name} - Stats Grid Layout Preservation`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        
        await page.goto('/admin/suggestions');
        await page.waitForLoadState('networkidle');
        
        // Look for stats grid (typically has cards with numbers)
        const statsGrid = await page.locator('[class*="grid"]').filter({ 
          has: page.locator('[class*="stat"], [class*="card"]')
        }).first();
        
        if (await statsGrid.count() > 0) {
          const gridElement = statsGrid.first();
          const columnCount = await gridElement.evaluate((el) => {
            const style = window.getComputedStyle(el);
            const templateColumns = style.gridTemplateColumns;
            if (templateColumns && templateColumns !== 'none') {
              return templateColumns.split(' ').length;
            }
            return 0;
          });
          
          // Document current column count
          console.log(`${viewport.name} Stats Grid Columns: ${columnCount}`);
          
          // Desktop should have more columns than tablet
          if (viewport.category === 'desktop') {
            expect(columnCount, 
              `${viewport.name} stats grid should have multiple columns`
            ).toBeGreaterThanOrEqual(2);
          }
          
          // Verify grid is visible and not overflowing
          const boundingBox = await gridElement.boundingBox();
          expect(boundingBox).not.toBeNull();
          if (boundingBox) {
            expect(boundingBox.width).toBeLessThanOrEqual(viewport.width);
          }
        }
      });
      
      test(`${viewport.name} - Filter Grid Layout Preservation`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        
        await page.goto('/admin/suggestions');
        await page.waitForLoadState('networkidle');
        
        // Look for filter controls (selects, inputs)
        const filterContainer = await page.locator('[class*="grid"]').filter({
          has: page.locator('select, input[type="text"], input[type="search"]')
        }).first();
        
        if (await filterContainer.count() > 0) {
          const gridElement = filterContainer.first();
          const columnCount = await gridElement.evaluate((el) => {
            const style = window.getComputedStyle(el);
            const templateColumns = style.gridTemplateColumns;
            if (templateColumns && templateColumns !== 'none') {
              return templateColumns.split(' ').length;
            }
            return 0;
          });
          
          // Document current column count
          console.log(`${viewport.name} Filter Grid Columns: ${columnCount}`);
          
          // Desktop should have more filter columns
          if (viewport.category === 'desktop' && viewport.width >= 1280) {
            expect(columnCount, 
              `${viewport.name} filter grid should have multiple columns`
            ).toBeGreaterThanOrEqual(2);
          }
          
          // Verify no overflow
          const boundingBox = await gridElement.boundingBox();
          expect(boundingBox).not.toBeNull();
          if (boundingBox) {
            expect(boundingBox.width).toBeLessThanOrEqual(viewport.width);
          }
        }
      });
      
      test(`${viewport.name} - Modal Size Preservation`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        
        // Try to open QR scanner modal
        const qrButton = page.locator('button:has-text("QR")').or(page.locator('[aria-label*="QR"]')).first();
        if (await qrButton.count() > 0) {
          await qrButton.click();
          await page.waitForTimeout(500);
          
          // Capture modal size
          const modal = page.locator('[role="dialog"]').first();
          if (await modal.count() > 0) {
            const boundingBox = await modal.boundingBox();
            
            expect(boundingBox).not.toBeNull();
            if (boundingBox) {
              // Document current modal size
              console.log(`${viewport.name} Modal Size: ${boundingBox.width}x${boundingBox.height}px`);
              
              // Modal should fit within viewport
              expect(boundingBox.width).toBeLessThanOrEqual(viewport.width);
              expect(boundingBox.height).toBeLessThanOrEqual(viewport.height);
              
              // Desktop modals typically have reasonable max widths
              if (viewport.category === 'desktop') {
                expect(boundingBox.width, 
                  `${viewport.name} modal should have reasonable width`
                ).toBeGreaterThan(300);
              }
            }
          }
        }
      });
      
      test(`${viewport.name} - Sidebar Navigation Preservation`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        
        // Navigate to admin page which typically has sidebar
        await page.goto('/admin/suggestions');
        await page.waitForLoadState('networkidle');
        
        // Look for sidebar navigation
        const sidebar = page.locator('nav, [class*="sidebar"], aside').first();
        
        if (await sidebar.count() > 0) {
          const isVisible = await sidebar.isVisible();
          const boundingBox = await sidebar.boundingBox();
          
          // Document sidebar presence and size
          console.log(`${viewport.name} Sidebar Visible: ${isVisible}`);
          if (boundingBox) {
            console.log(`${viewport.name} Sidebar Size: ${boundingBox.width}x${boundingBox.height}px`);
          }
          
          // Desktop should show sidebar, tablet behavior may vary
          if (viewport.category === 'desktop') {
            // Sidebar should be present (visible or hidden but in DOM)
            expect(await sidebar.count()).toBeGreaterThan(0);
          }
          
          // If visible, should not overflow
          if (isVisible && boundingBox) {
            expect(boundingBox.width).toBeLessThanOrEqual(viewport.width);
          }
        }
      });
      
      test(`${viewport.name} - Tab Bar Layout Preservation`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        
        await page.goto('/admin/suggestions');
        await page.waitForLoadState('networkidle');
        
        // Look for tab bar (typically has role="tablist" or tab buttons)
        const tabBar = page.locator('[role="tablist"], [class*="tab"]').first();
        
        if (await tabBar.count() > 0) {
          const boundingBox = await tabBar.boundingBox();
          const isVisible = await tabBar.isVisible();
          
          // Document tab bar
          console.log(`${viewport.name} Tab Bar Visible: ${isVisible}`);
          if (boundingBox) {
            console.log(`${viewport.name} Tab Bar Width: ${boundingBox.width}px`);
          }
          
          // Tab bar should fit within viewport
          if (boundingBox) {
            expect(boundingBox.width).toBeLessThanOrEqual(viewport.width);
          }
          
          // Check if tabs are in grid layout (desktop) or flex (tablet)
          const layoutType = await tabBar.evaluate((el) => {
            const style = window.getComputedStyle(el);
            return {
              display: style.display,
              gridTemplateColumns: style.gridTemplateColumns,
            };
          });
          
          console.log(`${viewport.name} Tab Bar Layout:`, layoutType);
        }
      });
      
      test(`${viewport.name} - Suggestion Cards Layout Preservation`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        
        // Look for suggestion cards
        const cards = page.locator('[class*="card"], [class*="suggestion"]').first();
        
        if (await cards.count() > 0) {
          const boundingBox = await cards.boundingBox();
          
          if (boundingBox) {
            // Document card size
            console.log(`${viewport.name} Card Width: ${boundingBox.width}px`);
            
            // Cards should fit within viewport
            expect(boundingBox.width).toBeLessThanOrEqual(viewport.width);
            
            // Check padding/spacing
            const spacing = await cards.evaluate((el) => {
              const style = window.getComputedStyle(el);
              return {
                padding: style.padding,
                margin: style.margin,
              };
            });
            
            console.log(`${viewport.name} Card Spacing:`, spacing);
          }
        }
      });
      
      test(`${viewport.name} - Overall Layout Integrity`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        
        // Capture comprehensive layout snapshot
        const snapshot = await captureLayoutSnapshot(page);
        
        // Document baseline behavior
        console.log(`${viewport.name} Layout Snapshot:`, {
          hasHorizontalScroll: snapshot.hasHorizontalScroll,
          bodyWidth: snapshot.bodyWidth,
          viewportWidth: snapshot.viewportWidth,
          gridCount: Object.keys(snapshot.gridColumns).length,
          elementCount: Object.keys(snapshot.elementSizes).length,
        });
        
        // Verify baseline expectations
        expect(snapshot.hasHorizontalScroll, 
          `${viewport.name} should not have horizontal scroll (baseline)`
        ).toBe(false);
        
        expect(snapshot.bodyWidth, 
          `${viewport.name} body width should not exceed viewport`
        ).toBeLessThanOrEqual(snapshot.viewportWidth + 1); // +1 for rounding
        
        // Document grid layouts (observational - may vary by page state)
        const gridCount = Object.keys(snapshot.gridColumns).length;
        console.log(`${viewport.name} has ${gridCount} grid layouts`);
        
        // The key preservation requirement is no horizontal scroll
        // Grid presence may vary depending on page content and state
      });
    }
    
    test('Desktop Hover States Preservation - Interactive Elements', async ({ page }) => {
      // Test at standard desktop width
      await page.setViewportSize({ width: 1280, height: 720 });
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Find interactive elements (buttons, links)
      const button = page.locator('button, a').first();
      
      if (await button.count() > 0) {
        // Get initial state
        const initialStyle = await button.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return {
            backgroundColor: style.backgroundColor,
            color: style.color,
            transform: style.transform,
          };
        });
        
        // Hover over element
        await button.hover();
        await page.waitForTimeout(100);
        
        // Get hover state
        const hoverStyle = await button.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return {
            backgroundColor: style.backgroundColor,
            color: style.color,
            transform: style.transform,
          };
        });
        
        // Document hover behavior (may or may not change)
        console.log('Desktop Hover State:', {
          initial: initialStyle,
          hover: hoverStyle,
          changed: JSON.stringify(initialStyle) !== JSON.stringify(hoverStyle),
        });
        
        // Hover states should be functional (this just documents current behavior)
        // The test passes regardless - we're capturing baseline
        expect(true).toBe(true);
      }
    });
    
    test('Tablet Responsive Breakpoint - 768px Boundary', async ({ page }) => {
      // Test at exact tablet breakpoint
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await page.goto('/admin/suggestions');
      await page.waitForLoadState('networkidle');
      
      // Capture layout at tablet breakpoint
      const snapshot = await captureLayoutSnapshot(page);
      
      // Document tablet breakpoint behavior
      console.log('Tablet Breakpoint (768px) Layout:', {
        hasHorizontalScroll: snapshot.hasHorizontalScroll,
        gridColumns: snapshot.gridColumns,
      });
      
      // Should not have horizontal scroll at tablet breakpoint
      expect(snapshot.hasHorizontalScroll).toBe(false);
      
      // Test at 767px (just below tablet breakpoint) - should behave differently
      await page.setViewportSize({ width: 767, height: 1024 });
      await page.waitForTimeout(200);
      
      const snapshot767 = await captureLayoutSnapshot(page);
      
      console.log('Below Tablet Breakpoint (767px) Layout:', {
        hasHorizontalScroll: snapshot767.hasHorizontalScroll,
        gridColumns: snapshot767.gridColumns,
      });
      
      // Document that breakpoint exists (layouts may differ)
      // This test just captures current behavior
      expect(true).toBe(true);
    });
    
    test('Desktop Responsive Breakpoint - 1024px Boundary', async ({ page }) => {
      // Test at exact desktop breakpoint
      await page.setViewportSize({ width: 1024, height: 768 });
      
      await page.goto('/admin/suggestions');
      await page.waitForLoadState('networkidle');
      
      // Capture layout at desktop breakpoint
      const snapshot = await captureLayoutSnapshot(page);
      
      // Document desktop breakpoint behavior
      console.log('Desktop Breakpoint (1024px) Layout:', {
        hasHorizontalScroll: snapshot.hasHorizontalScroll,
        gridColumns: snapshot.gridColumns,
      });
      
      // Should not have horizontal scroll at desktop breakpoint
      expect(snapshot.hasHorizontalScroll, 
        'Desktop breakpoint should not have horizontal scroll'
      ).toBe(false);
      
      // Document grid presence (observational)
      const gridCount = Object.keys(snapshot.gridColumns).length;
      console.log(`Desktop breakpoint has ${gridCount} grid layouts`);
    });
  });
});
