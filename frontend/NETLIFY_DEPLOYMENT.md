# Netlify Deployment Guide

## Issue: Form URLs showing "Page Not Found"

The application is showing Netlify's default 404 page instead of the React application when accessing form URLs like:
- `formbuilder-io.netlify.app/form/8fc59906-386d-405d-ae7a-1b7b5c44b45b`

## Solution

### 1. Netlify Configuration Files

The following files have been added to fix the routing issue:

#### `public/_redirects`
```
# API redirects
/api/*  https://formbuilder-io.onrender.com/api/:splat  200

# Handle client-side routing for React Router
/*    /index.html   200
```

#### `netlify.toml`
```toml
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[redirects]]
  from = "/api/*"
  to = "https://formbuilder-io.onrender.com/api/:splat"
  status = 200
```

### 2. Deployment Steps

1. **Commit and push all changes** to your repository
2. **Redeploy on Netlify**:
   - Go to your Netlify dashboard
   - Select your site
   - Go to "Deploys" tab
   - Click "Trigger deploy" → "Deploy site"

3. **Verify the configuration**:
   - After deployment, test the URL: `your-site.netlify.app/test/hello`
   - This should show the test page instead of a 404

### 3. Testing

Test these URLs after deployment:
- `your-site.netlify.app/test/hello` - Should show test page
- `your-site.netlify.app/form/any-share-id` - Should show form or proper 404
- `your-site.netlify.app/form/id/any-form-id` - Should show form or proper 404

### 4. Troubleshooting

If the issue persists:

1. **Check Netlify logs**:
   - Go to "Deploys" → Click on latest deploy → "Functions" tab
   - Look for any build errors

2. **Verify redirects are active**:
   - Go to "Site settings" → "Redirects"
   - Ensure the redirects are listed and active

3. **Clear cache**:
   - Go to "Deploys" → "Trigger deploy" → "Clear cache and deploy site"

### 5. Alternative Solution

If the above doesn't work, you can also configure redirects directly in Netlify dashboard:

1. Go to "Site settings" → "Redirects"
2. Add these rules:
   - From: `/*` → To: `/index.html` → Status: `200`
   - From: `/api/*` → To: `https://formbuilder-io.onrender.com/api/:splat` → Status: `200`

## Expected Behavior

After proper configuration:
- Form URLs should load the React application
- If a form doesn't exist, users should see the custom 404 page
- API calls should be properly redirected to the backend
- Client-side routing should work for all routes
