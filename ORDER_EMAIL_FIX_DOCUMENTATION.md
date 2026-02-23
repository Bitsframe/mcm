# Order Email System Fix - Complete Technical Documentation

## Executive Summary

This document details the debugging and fixes applied to resolve order placement failures caused by email service integration issues. The system was failing to place orders due to JSON parsing errors when the email service returned HTML error pages instead of JSON responses.

**Status:** ✅ Fixed - Orders now complete successfully, emails send asynchronously without blocking order completion.

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Root Cause Analysis](#root-cause-analysis)
3. [Solutions Implemented](#solutions-implemented)
4. [Technical Details](#technical-details)
5. [Code Changes](#code-changes)
6. [Environment Configuration](#environment-configuration)
7. [Testing & Verification](#testing--verification)
8. [Future Considerations](#future-considerations)

---

## Problem Statement

### Original Error

When placing orders through the POS system, users encountered the following error:

```
Unexpected token '<', "<!DOCTYPE "... is not valid JSON
POST /api/orders 500 in 5127ms
```

**Impact:**
- Orders failed to complete
- Users could not process sales
- Error message was not user-friendly
- No order confirmation emails were sent

### Error Context

The error occurred in the order placement flow at `/api/orders` endpoint. The system was attempting to:
1. Create an order in the database
2. Send a confirmation email to the patient
3. Return success response

The process failed at step 2, causing the entire order to fail.

---

## Root Cause Analysis

### Primary Issue: JSON Parsing Error

**Location:** `utils/emailServices/sendOrderEmail.ts`

**Problem:**
The code was calling `response.json()` on an HTTP response without first checking:
1. If the response was successful (`response.ok`)
2. If the response content-type was actually JSON

**What Happened:**
- Email service URL was pointing to a non-existent Heroku app
- Service returned HTTP 404 with an HTML error page (`<!DOCTYPE html>...`)
- Code attempted to parse HTML as JSON → `JSON.parse()` failed
- Error bubbled up and crashed the order placement

**Evidence from Logs:**
```json
{
  "status": 404,
  "statusText": "Not Found",
  "contentType": "text/html; charset=utf-8",
  "errorTextPreview": "<!DOCTYPE html>..."
}
```

### Secondary Issue: Hardcoded Email Service URL

**Problem:**
The email service URL was hardcoded in multiple files:
- `utils/emailServices/sendOrderEmail.ts`
- `utils/emailServices/sendFulfillmentRequestEmail.ts`
- `utils/emailServices/sendFulfillmentConfirmationEmail.ts`

**Impact:**
- Could not easily change email service provider
- Required code changes to update URL
- No environment-based configuration

### Tertiary Issue: Blocking Email Sending

**Problem:**
Email sending was awaited synchronously, meaning:
- If email failed, entire order failed
- Orders couldn't complete if email service was down
- Poor user experience

---

## Solutions Implemented

### Fix 1: Proper Response Validation Before JSON Parsing

**File:** `utils/emailServices/sendOrderEmail.ts`

**What Changed:**
- Added response status check (`response.ok`)
- Added content-type validation
- Read error responses as text first
- Only parse as JSON when content-type indicates JSON
- Provide descriptive error messages

**Before:**
```typescript
const response = await fetch(endpoint, options);
const result = await response.json(); // ❌ Crashes if response is HTML
```

**After:**
```typescript
const response = await fetch(endpoint, options);

// Check response status and content-type
const contentType = response.headers.get('content-type') || '';
const isJson = contentType.includes('application/json');

if (!response.ok) {
  // Read as text first
  const errorText = await response.text();
  // Handle appropriately based on content-type
  // ...
}

// Only parse as JSON if it's actually JSON
if (isJson) {
  result = await response.json();
} else {
  // Handle non-JSON response
}
```

**Benefits:**
- No more JSON parsing errors
- Clear error messages for debugging
- Graceful handling of unexpected responses

---

### Fix 2: Environment Variable Configuration

**Files Modified:**
- `utils/emailServices/sendOrderEmail.ts`
- `utils/emailServices/sendFulfillmentRequestEmail.ts`
- `utils/emailServices/sendFulfillmentConfirmationEmail.ts`

**What Changed:**
- Replaced hardcoded Heroku URL with environment variable
- Added placeholder detection to catch configuration errors early
- Consistent with other email functions in the codebase

**Before:**
```typescript
const response = await fetch(
  "https://send-resent-mail-646827ff1a0b.herokuapp.com/send-batch-email",
  // ...
);
```

**After:**
```typescript
const emailServiceUrl = process.env.NEXT_PUBLIC_EMAIL_SENDER_URL;
if (!emailServiceUrl) {
  throw new Error("Email service URL not configured");
}

// Check for placeholder values
if (emailServiceUrl.includes('your-email-service-url.com')) {
  throw new Error("Email service URL appears to be a placeholder value");
}

const endpoint = emailServiceUrl.endsWith('/') 
  ? `${emailServiceUrl}send-batch-email` 
  : `${emailServiceUrl}/send-batch-email`;
```

**Benefits:**
- Easy to change email service provider
- Configuration through environment variables
- Early detection of misconfiguration

---

### Fix 3: Non-Blocking Email Sending

**File:** `app/api/orders/route.ts`

**What Changed:**
- Removed `await` from email sending call
- Email now sends asynchronously without blocking order completion
- Errors are logged but don't fail the order

**Before:**
```typescript
// Email sending blocks order completion
await sendOrderEmail(...);
return NextResponse.json({ success: true, order_id });
```

**After:**
```typescript
// Email sends asynchronously, doesn't block order
sendOrderEmail(...).catch((emailError) => {
  // Log error but don't fail the order
  console.error(`Failed to send order email:`, emailError.message);
});

// Order completes immediately
return NextResponse.json({ success: true, order_id });
```

**Benefits:**
- Orders complete successfully even if email fails
- Better user experience
- Email failures don't impact business operations
- Errors are still logged for monitoring

---

## Technical Details

### Email Service Integration

**Current Configuration:**
- **Service Type:** AWS Lambda Function URL
- **Endpoint:** `https://dcmuw7ynmodbsa6ndhrlnwwhrq0klfun.lambda-url.us-east-2.on.aws/`
- **Method:** POST
- **Path:** `/send-batch-email`
- **Content-Type:** `application/json`

**Request Payload:**
```json
{
  "from": "clinicasanmiguel@alerts.myclinicmd.com",
  "recipients": ["patient@example.com"],
  "subject": "Invoice I-10785",
  "html": "<html>...</html>",
  "replyTo": "support@example.com"
}
```

**Expected Response:**
- **Status:** 200 OK
- **Content-Type:** `application/json`
- **Body:** JSON object with success/error information

### Error Handling Flow

```
Order Placement Request
    ↓
Create Order in Database ✅
    ↓
Send Email (Non-Blocking)
    ↓
    ├─ Success → Email sent ✅
    └─ Failure → Logged, order still succeeds ✅
    ↓
Return Success Response ✅
```

### Environment Variables

**Required Variable:**
- `NEXT_PUBLIC_EMAIL_SENDER_URL` - Base URL of email service

**Why `NEXT_PUBLIC_` prefix?**
- Next.js requires this prefix for variables accessible in client-side code
- Email service URL is used in both server and client contexts
- Must be set in `.env.local` for local development

---

## Code Changes

### Files Modified

1. **`app/api/orders/route.ts`**
   - Made email sending non-blocking
   - Added error logging for email failures
   - Added instrumentation for debugging

2. **`utils/emailServices/sendOrderEmail.ts`**
   - Added response validation before JSON parsing
   - Replaced hardcoded URL with environment variable
   - Added placeholder detection
   - Improved error handling and messages
   - Added instrumentation for debugging

3. **`utils/emailServices/sendFulfillmentRequestEmail.ts`**
   - Replaced hardcoded URL with environment variable
   - Added placeholder detection

4. **`utils/emailServices/sendFulfillmentConfirmationEmail.ts`**
   - Replaced hardcoded URL with environment variable
   - Added placeholder detection

### Key Functions

#### `sendOrderEmail()`
- **Purpose:** Send order confirmation email to patient
- **Parameters:**
  - `orderDetails`: Order information (ID, payment methods, date)
  - `patientInfo`: Patient information (name, email, location)
  - `orderItems`: Array of items in the order
  - `totalAmount`: Subtotal before discounts
  - `discountAmount`: Total discount applied
  - `appliedDiscount`: Discount percentage
  - `previousCreditAmount`: Patient's previous credit balance
  - `newCreditBalance`: Patient's new credit balance after order
- **Returns:** Promise that resolves with email service response
- **Errors:** Throws descriptive errors for debugging

#### Order Placement Flow
1. Validate request data
2. Calculate totals and discounts
3. Create order in database
4. Create sales history records
5. Update credit audit
6. Update location balance
7. Send email (non-blocking)
8. Return success response

---

## Environment Configuration

### Setup Instructions

1. **Copy example file:**
   ```bash
   cp env.example .env.local
   ```

2. **Edit `.env.local` and set:**
   ```env
   NEXT_PUBLIC_EMAIL_SENDER_URL=https://your-email-service-url.com/
   ```
   
   **Important:**
   - URL should end with `/`
   - No trailing spaces
   - Use actual service URL, not placeholder

3. **Restart development server:**
   ```bash
   # Stop server (Ctrl+C)
   # Clear cache (optional but recommended)
   rm -rf .next
   # Start server
   yarn dev
   ```

### Environment File Priority

Next.js loads environment variables in this order (highest priority first):
1. `.env.local` - Local overrides (gitignored)
2. `.env.development` / `.env.production` - Environment-specific
3. `.env` - Default values

**Note:** `NEXT_PUBLIC_*` variables are embedded at build time. Changes require server restart.

### Verification

To verify environment variable is loaded correctly:

1. **Check server logs** - Should not show placeholder URL
2. **Place a test order** - Check debug logs for actual URL being used
3. **Check email delivery** - Verify emails are being sent

---

## Testing & Verification

### Test Scenarios

#### ✅ Scenario 1: Successful Email Sending
- **Setup:** Valid email service URL configured
- **Expected:** Order completes, email sent successfully
- **Verification:** Check order completion, verify email received

#### ✅ Scenario 2: Email Service Down
- **Setup:** Invalid or unreachable email service URL
- **Expected:** Order completes successfully, email error logged
- **Verification:** Order in database, error in logs, no email sent

#### ✅ Scenario 3: Email Service Returns Error
- **Setup:** Email service returns 4xx/5xx status
- **Expected:** Order completes, error logged with details
- **Verification:** Order succeeds, error message in logs

#### ✅ Scenario 4: Missing Environment Variable
- **Setup:** `NEXT_PUBLIC_EMAIL_SENDER_URL` not set
- **Expected:** Clear error message about missing configuration
- **Verification:** Error message indicates missing env variable

#### ✅ Scenario 5: Placeholder Value Detected
- **Setup:** Environment variable contains placeholder value
- **Expected:** Error message about placeholder value
- **Verification:** Error message indicates placeholder detected

### Debug Logging

Instrumentation has been added to track:
- Environment variable values being read
- Email service endpoints being called
- Response status and content types
- Error details and stack traces
- Success confirmations

**Log Location:** `.cursor/debug.log` (NDJSON format)

**Key Log Messages:**
- `"Reading email service URL from env"` - Shows what URL is being used
- `"About to call email service"` - Before making request
- `"Email service response status"` - Response details
- `"Email sent successfully"` - Confirmation of success
- `"Email sending failed (non-blocking)"` - Error details

---

## Future Considerations

### Recommended Improvements

1. **Email Queue System**
   - Implement retry mechanism for failed emails
   - Queue emails for later processing
   - Track email delivery status

2. **Monitoring & Alerts**
   - Set up alerts for email service failures
   - Monitor email delivery rates
   - Track order completion rates

3. **Error Notifications**
   - Notify administrators of email failures
   - Dashboard for email service health
   - Automated recovery procedures

4. **Testing**
   - Unit tests for email functions
   - Integration tests for order flow
   - End-to-end tests for email delivery

5. **Documentation**
   - API documentation for email service
   - Runbook for troubleshooting
   - Configuration guide for different environments

### Potential Issues to Watch

1. **Environment Variable Caching**
   - Next.js caches `NEXT_PUBLIC_*` variables
   - Requires server restart after changes
   - Consider using runtime configuration for flexibility

2. **Email Service Reliability**
   - Current implementation doesn't retry
   - Consider implementing exponential backoff
   - Add circuit breaker pattern

3. **Rate Limiting**
   - Email service may have rate limits
   - Consider implementing request throttling
   - Monitor for 429 (Too Many Requests) responses

---

## Troubleshooting Guide

### Issue: Orders Still Failing

**Check:**
1. Is email sending still blocking? (Should be non-blocking now)
2. Are there other errors in the order creation flow?
3. Check server logs for specific error messages

### Issue: Emails Not Sending

**Check:**
1. Is `NEXT_PUBLIC_EMAIL_SENDER_URL` set correctly?
2. Is the email service URL reachable?
3. Check debug logs for endpoint being called
4. Verify email service is operational

### Issue: Environment Variable Not Loading

**Check:**
1. Is `.env.local` in the project root?
2. Does variable name match exactly (case-sensitive)?
3. Did you restart the server after changes?
4. Try clearing `.next` cache folder

### Issue: Placeholder Value Error

**Check:**
1. Did you copy from `env.example` without updating?
2. Is the value in `.env.local` the actual URL?
3. Check for typos in the URL

---

## Summary

### What Was Fixed

1. ✅ **JSON Parsing Error** - Added proper response validation
2. ✅ **Hardcoded URLs** - Replaced with environment variables
3. ✅ **Blocking Email** - Made email sending non-blocking
4. ✅ **Error Handling** - Improved error messages and logging
5. ✅ **Configuration** - Added placeholder detection

### Impact

- **Orders now complete successfully** even if email fails
- **Better error messages** for debugging
- **Flexible configuration** through environment variables
- **Improved reliability** with non-blocking email sending
- **Better monitoring** with detailed logging

### Files Changed

- `app/api/orders/route.ts`
- `utils/emailServices/sendOrderEmail.ts`
- `utils/emailServices/sendFulfillmentRequestEmail.ts`
- `utils/emailServices/sendFulfillmentConfirmationEmail.ts`
- `env.example` (created)

### Next Steps

1. Monitor email delivery success rates
2. Set up alerts for email failures
3. Consider implementing email retry mechanism
4. Document email service API requirements
5. Add automated tests

---

## Contact & Support

For questions or issues related to this fix:
1. Check debug logs in `.cursor/debug.log`
2. Review server console output
3. Verify environment configuration
4. Check email service status

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**Status:** ✅ Production Ready
