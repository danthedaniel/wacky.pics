export function UploadPage() {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>wacky.pics</title>
        <link rel="stylesheet" href="/assets/css/main.css" />
      </head>
      <body>
        <main>
          <h1>wacky.pics</h1>
          <div id="drop-area">
            <p>Drop images here or click to select</p>
            <input type="file" id="file-input" accept="image/*" multiple hidden />
          </div>
          <div id="uploads"></div>
        </main>
        <script type="module" src="/assets/js/upload.mjs"></script>
      </body>
    </html>
  );
}
