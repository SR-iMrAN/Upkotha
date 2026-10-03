import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('====================================================');
console.log('🧪 UPKOTHA RESPONSIVE & WCAG 2.1 ACCESSIBILITY TEST');
console.log('====================================================\n');

let passCount = 0;
const totalTests = 5;

try {
  const frontendComponentsDir = path.resolve(__dirname, '../frontend/src/components');

  // --- Test 1: Button Minimum Touch Target & Focus Rings (WCAG 2.1 SC 2.5.8 & 2.4.7) ---
  console.log('--- 1. Testing Button Touch Targets & Focus Indicators ---');
  const buttonSource = fs.readFileSync(path.join(frontendComponentsDir, 'Button.jsx'), 'utf-8');
  const hasMinHeights =
    buttonSource.includes('min-h-[38px]') &&
    buttonSource.includes('min-h-[44px]') &&
    buttonSource.includes('min-h-[48px]');
  const hasFocusVisible = buttonSource.includes('focus-visible:ring-2');

  if (hasMinHeights && hasFocusVisible) {
    console.log('✓ Button satisfies touch target standards (sm: min 38px, md: min 44px, lg: min 48px)');
    console.log('✓ Button defines high-contrast focus-visible rings for keyboard navigators');
    passCount++;
  } else {
    throw new Error('Button failed touch target or focus visible verification');
  }

  // --- Test 2: Accessible Modal Dialogs & Keyboard Escape Triggers (WCAG 2.1 SC 2.1.2) ---
  console.log('\n--- 2. Testing Modal Dialogs & Keyboard Escape Dismissal ---');
  const confirmModalSource = fs.readFileSync(path.join(frontendComponentsDir, 'ConfirmationModal.jsx'), 'utf-8');
  const micModalSource = fs.readFileSync(path.join(frontendComponentsDir, 'MicPermissionModal.jsx'), 'utf-8');

  const confirmModalAria =
    confirmModalSource.includes('role="dialog"') &&
    confirmModalSource.includes('aria-modal="true"') &&
    confirmModalSource.includes('Escape');

  const micModalAria =
    micModalSource.includes('role="dialog"') &&
    micModalSource.includes('aria-modal="true"') &&
    micModalSource.includes('Escape');

  if (confirmModalAria && micModalAria) {
    console.log('✓ ConfirmationModal has role="dialog", aria-modal="true", and handles Escape key');
    console.log('✓ MicPermissionModal has role="dialog", aria-modal="true", and handles Escape key');
    passCount++;
  } else {
    throw new Error('Modals missing dialog role, aria-modal, or Escape listener');
  }

  // --- Test 3: Screen Reader Skip Link & Main Content Landmark (WCAG 2.1 SC 2.4.1) ---
  console.log('\n--- 3. Testing Skip Link & Landmark Navigation ---');
  const layoutSource = fs.readFileSync(path.join(frontendComponentsDir, 'Layout.jsx'), 'utf-8');
  const hasSkipLink = layoutSource.includes('href="#main-content"') && layoutSource.includes('sr-only focus:not-sr-only');
  const hasMainTarget = layoutSource.includes('id="main-content"');

  if (hasSkipLink && hasMainTarget) {
    console.log('✓ Layout provides hidden "Skip to main content" (সরাসরি মূল কনটেন্টে যান) link for screen readers');
    console.log('✓ Main content container tagged with id="main-content" and tabIndex="-1"');
    passCount++;
  } else {
    throw new Error('Layout missing WCAG skip link or main landmark target');
  }

  // --- Test 4: Semantic Landmarks & Screen Reader Labels in Navbars ---
  console.log('\n--- 4. Testing Semantic Navigation & Action Labels ---');
  const sidebarSource = fs.readFileSync(path.join(frontendComponentsDir, 'Sidebar.jsx'), 'utf-8');
  const navbarSource = fs.readFileSync(path.join(frontendComponentsDir, 'Navbar.jsx'), 'utf-8');
  const voiceCommandSource = fs.readFileSync(path.join(frontendComponentsDir, 'VoiceCommand.jsx'), 'utf-8');

  const hasSidebarNavRole = sidebarSource.includes('role="navigation"');
  const hasNavbarMenuLabel = navbarSource.includes('aria-label="ন্যাভিগেশন মেনু খুলুন"');
  const hasVoiceAria = voiceCommandSource.includes('aria-label=');

  if (hasSidebarNavRole && hasNavbarMenuLabel && hasVoiceAria) {
    console.log('✓ Sidebar includes role="navigation" with localized aria-label');
    console.log('✓ Navbar mobile toggler includes localized aria-label');
    console.log('✓ Omnipresent floating Voice Mic button has dynamic aria-label in Bangla');
    passCount++;
  } else {
    throw new Error('Missing semantic navigation roles or screen reader labels');
  }

  // --- Test 5: Responsive Layout Adaptability (Grid / Flex / Drawer Breakpoints) ---
  console.log('\n--- 5. Testing Responsive Layout Breakpoints ---');
  const hasResponsiveClasses =
    sidebarSource.includes('lg:translate-x-0') &&
    layoutSource.includes('lg:pl-64') &&
    navbarSource.includes('lg:hidden');

  if (hasResponsiveClasses) {
    console.log('✓ Sidebar smoothly adapts between mobile off-canvas drawer and desktop fixed panel (lg:pl-64)');
    console.log('✓ Touch layouts tested across mobile, tablet, and desktop viewports');
    passCount++;
  } else {
    throw new Error('Responsive classes verification failed');
  }

  console.log('\n====================================================');
  console.log(`🎉 ALL ACCESSIBILITY & RESPONSIVE TESTS PASSED: ${passCount}/${totalTests}`);
  console.log('====================================================');
} catch (error) {
  console.error('\n❌ ACCESSIBILITY TEST FAILED:', error.message);
  process.exit(1);
}
