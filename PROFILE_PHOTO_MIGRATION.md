# Profile Photo Migration from UploadThing to MongoDB

## Overview
Successfully migrated profile photo uploads from UploadThing to MongoDB with base64 storage.

## Changes Made

### 1. New Image Processing Library
- **File**: `lib/image-processing.ts`
- **Features**:
  - Resizes images to 500x500px
  - Converts to JPEG format with 85% quality
  - Converts to base64 string with data URI
  - Validates file type and size (max 4MB)

### 2. New Upload API Route
- **File**: `app/api/profile/upload-photo/route.ts`
- **Endpoint**: `POST /api/profile/upload-photo`
- **Functionality**:
  - Accepts multipart form data with image file
  - Processes image using sharp library
  - Stores base64 string directly in MongoDB Users collection
  - Returns processed avatar URL

### 3. Updated Profile Photo Component
- **File**: `app/[locale]/(routes)/profile/components/ProfilePhotoForm.tsx`
- **Changes**:
  - Removed UploadThing dependencies
  - Added native file input with validation
  - Direct upload to new API endpoint
  - Improved error handling and user feedback

### 4. Removed Files
- `app/api/uploadthing/` - Old UploadThing API routes
- `lib/uploadthing.ts` - UploadThing client configuration
- `lib/server/uploadthings.ts` - UploadThing server utilities

### 5. Updated Configuration Files
- **package.json**: Removed `@uploadthing/react` and `uploadthing` dependencies
- **next.config.js**: Removed UploadThing domains from image configuration

## Database Schema
No changes required - the existing `Users.avatar` field (String?) already supports base64 storage.

## Dependencies
The `sharp` library is already included in package.json (v0.33.5) for image processing.

## Next Steps

### 1. Install Dependencies
```bash
cd nextcrm-app
pnpm install
```
This will remove the old uploadthing packages.

### 2. Test the Implementation
1. Start the development server
2. Navigate to profile settings
3. Upload a profile photo
4. Verify:
   - Image is resized to 500x500px
   - Upload completes successfully
   - Avatar displays correctly
   - Base64 data is stored in MongoDB

### 3. Migration for Existing Users (Optional)
If you have existing users with UploadThing URLs in their avatar field, you may want to:
- Keep existing URLs (they will continue to work if UploadThing keys are valid)
- Or migrate them to base64 format using a migration script

## Benefits
- ✅ No external dependencies for profile photos
- ✅ Reduced file size (500x500px optimized JPEG)
- ✅ Direct storage in Azure Cosmos DB
- ✅ Faster load times (no external API calls)
- ✅ Better control over image processing
- ✅ No storage costs from third-party services

## Technical Details
- **Image Format**: JPEG with 85% quality
- **Image Size**: 500x500px (aspect ratio maintained with cover fit)
- **Storage Format**: Base64 data URI (`data:image/jpeg;base64,...)
- **Max Upload Size**: 4MB
- **Supported Formats**: JPEG, PNG, WebP, GIF
