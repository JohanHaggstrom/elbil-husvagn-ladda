Add-Type -AssemblyName System.Drawing

$width = 8000
$height = 8000
$filename = "large_test_image.png"
$path = Join-Path (Get-Location) $filename

Write-Host "Generating image $width x $height at $path ..."

$bmp = New-Object System.Drawing.Bitmap $width, $height
$g = [System.Drawing.Graphics]::FromImage($bmp)

# Fill background
$g.Clear([System.Drawing.Color]::White)

$rand = New-Object System.Random

# Draw random ellipses/rects to create chaos (harder to compress)
for ($i=0; $i -lt 20000; $i++) {
    $x = $rand.Next(0, $width)
    $y = $rand.Next(0, $height)
    $w = $rand.Next(50, 600)
    $h = $rand.Next(50, 600)

    $r = $rand.Next(0, 256)
    $g_col = $rand.Next(0, 256)
    $b = $rand.Next(0, 256)
    $a = $rand.Next(50, 255)

    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb($a, $r, $g_col, $b))

    if ($i % 2 -eq 0) {
        $g.FillEllipse($brush, $x, $y, $w, $h)
    } else {
        $g.FillRectangle($brush, $x, $y, $w, $h)
    }
}

$bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()

$item = Get-Item $path
$sizeMb = $item.Length / 1MB
Write-Host "Created image. Size: $("{0:N2}" -f $sizeMb) MB"
