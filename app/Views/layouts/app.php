<?php
// app/Views/layouts/app.php
// Layout base: controller akan memanggil render($view, $data) yang meng-include layout ini.
// Template ini menerima variabel: $pageTitle (opsional) dan $content (HTML string atau include view).
?>
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title><?php echo htmlspecialchars($pageTitle ?? 'Burgerlicious'); ?></title>

  <link rel="stylesheet" href="./public/frontend/css/output.css">
  <link rel="stylesheet" href="./public/frontend/css/loading.css">

  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">

  <link rel="preload" href="./assets/icon/wired-lineal-1927-food-truck-hover-pinch.gif" as="image">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Baloo+Bhaijaan+2&display=swap" rel="stylesheet">
</head>
<body class="bg-white font-sans">

<?php if (!empty($headerHtml)) echo $headerHtml; ?>

<main>
  <?php if (isset($viewContentFile)) {
    include $viewContentFile;
  } else {
    echo $content ?? '';
  } ?>
</main>

<?php if (!empty($footerHtml)) echo $footerHtml; ?>

<script src="https://kit.fontawesome.com/a076d05399.js" crossorigin="anonymous"></script>

<?php
// page-level JS biasanya di-include oleh view
if (!empty($pageScripts)) {
  foreach ($pageScripts as $src) {
    echo "\n<script src='" . htmlspecialchars($src, ENT_QUOTES, 'UTF-8') . "'></script>";
  }
}
?>
</body>
</html>

