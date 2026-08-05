# Habla lesson cleanup patch

Copy the two files into the Habla repository:

- `js/lesson-content-fixes.js`
- `css/lesson-final-polish.css`

Then edit `index.html`:

1. Add this after `css/header.css`:

```html
<link rel="stylesheet" href="css/lesson-final-polish.css">
```

2. Add this immediately before the module app script:

```html
<script src="./js/lesson-content-fixes.js"></script>
<script type="module" src="./js/app.js"></script>
```

Replace the existing single `app.js` script line with those two lines.

Finally, bump the service-worker cache name so mobile Safari does not keep the old files:

```js
const CACHE_NAME = "habla-v18-lesson-layout-cleanup";
```

Add these files to the service-worker `cache.addAll` array:

```js
"./css/lesson-final-polish.css",
"./js/lesson-content-fixes.js",
```

Commit to `fix/lesson-layout-cleanup`, then open a PR into `develop`.
