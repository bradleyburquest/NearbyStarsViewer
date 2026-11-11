# Apache deployment

The application is a static Vite build. Point the `nearbystars.local` virtual host `DocumentRoot` at the repository's `dist` directory and run `npm run build` after source changes.

Recommended virtual-host directives (requires `mod_headers` and `mod_expires`):

```apache
<Directory "C:/Users/burqu/OneDrive/Documents/Programming/Astro/NearbyStarsViewer/dist">
    Require all granted
    Options -Indexes
    AllowOverride None

    <IfModule mod_headers.c>
        Header always set X-Content-Type-Options "nosniff"
        Header always set Referrer-Policy "no-referrer"
        Header always set Permissions-Policy "camera=(), microphone=(), geolocation=()"
        Header always set Cross-Origin-Opener-Policy "same-origin"
    </IfModule>

    <Files "index.html">
        Header set Cache-Control "no-cache"
    </Files>
    <FilesMatch "\.(css|js)$">
        Header set Cache-Control "public, max-age=31536000, immutable"
    </FilesMatch>
</Directory>
```

Restart Apache after changing its configuration. Verify the deployed index and hashed assets with:

```powershell
npm run verify:apache
```

Set `NSV_BASE_URL` before the command to verify another deployment URL.
