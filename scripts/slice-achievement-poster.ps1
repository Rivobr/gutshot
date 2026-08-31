<#
  Нарезка постера достижений на individual PNG-значки с круговой альфа-маской.

  Постер: сетка золотых медальонов (5 рядов + «Легенда Gutshot» внизу).
  Круги выровнены по верхнему краю ряда; подписи — ниже кругов.
  Скрипт находит круги сам и сохраняет public/achievements/<id>.png
  в трёх приложениях.

  Запуск: pwsh scripts/slice-achievement-poster.ps1 -Source <путь к постеру>
#>

param(
  [Parameter(Mandatory = $true)]
  [string]$Source
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$repoRoot = Split-Path -Parent $PSScriptRoot
$targets = @(
  (Join-Path $repoRoot 'apps/mini-app/public/achievements'),
  (Join-Path $repoRoot 'apps/web/public/achievements'),
  (Join-Path $repoRoot 'apps/admin/public/achievements')
)

# Порядок значков на постере: слева направо, сверху вниз.
$MAP = @(
  @('win_1', 'win_3', 'win_5', 'win_10', 'win_15', 'ft_1', 'ft_5', 'ft_10', 'ft_20', 'ft_30', 'ft_50'),
  @('tp_1', 'tp_5', 'tp_10', 'tp_15', 'tp_25', 'tp_35', 'tp_50', 'tp_60', 'tp_75', 'tp_100', 'aw_3'),
  @('aw_5', 'aw_10', 'aw_15', 'aw_20', 'aw_25', 'ko_1', 'ko_5', 'ko_10', 'ko_25', 'ko_50', 'ko_100'),
  @('fk_1', 'fk_3', 'fk_5', 'fk_10', 'fk_20', 'sf_1', 'sf_2', 'sf_3', 'sf_5', 'rf_1', 'rf_2', 'rf_3'),
  @('sp_tutorial', 'sp_referral', 'sp_win_no_reentry', 'sp_short_stack', 'sp_ft_streak_3', 'sp_top10_streak_5', 'sp_win_streak_2', 'sp_win_streak_3', 'mf_entry_1', 'mf_top10_1', 'mf_top3_1', 'mf_win_1', 'mf_win_5')
)

$bmp = New-Object System.Drawing.Bitmap($Source)
$w = $bmp.Width
$h = $bmp.Height
$rect = New-Object System.Drawing.Rectangle(0, 0, $w, $h)
$data = $bmp.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadOnly, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
$stride = $data.Stride
$bytes = New-Object byte[] ($stride * $h)
[System.Runtime.InteropServices.Marshal]::Copy($data.Scan0, $bytes, 0, $bytes.Length)
$bmp.UnlockBits($data)

function Test-Gold([byte]$r, [byte]$g, [byte]$b) {
  # Золото на тёмном фоне: тёплый пиксель, красный заметно больше синего.
  ($r -gt 100) -and ($g -gt 55) -and ($r - $b) -gt 30
}

function Get-Gold([int]$x, [int]$y) {
  # Format24bppRgb в памяти хранится как B, G, R.
  $i = $y * $stride + $x * 3
  (Test-Gold $bytes[$i + 2] $bytes[$i + 1] $bytes[$i])
}

# Максимальная горизонтальная хорда «золота» через точку (cx, y) — диаметр круга.
function Get-ChordWidth([int]$cx, [int]$y) {
  $l = $cx; $gap = 0
  while ($l -gt 0) {
    if (Get-Gold ($l - 1) $y) { $l--; $gap = 0 } else { $gap++; if ($gap -gt 4) { break } }
  }
  $r = $cx; $gap = 0
  while ($r -lt $w - 1) {
    if (Get-Gold ($r + 1) $y) { $r++; $gap = 0 } else { $gap++; if ($gap -gt 4) { break } }
  }
  return ($r - $l + 1)
}

# --- 1. Ряды: количество золотых пикселей в строке (круги дают 400+, фон/подписи — меньше).
$rowGold = New-Object int[] $h
for ($y = 0; $y -lt $h; $y++) {
  $count = 0
  $rowBase = $y * $stride
  for ($x = 0; $x -lt $w; $x++) {
    $i = $rowBase + $x * 3
    if (Test-Gold $bytes[$i + 2] $bytes[$i + 1] $bytes[$i]) { $count++ }
  }
  $rowGold[$y] = $count
}

$bands = @()
$bandStart = -1
$lastActive = -10
for ($y = 0; $y -lt $h; $y++) {
  if ($rowGold[$y] -ge 150) {
    if ($bandStart -lt 0) { $bandStart = $y }
    $lastActive = $y
  } elseif ($bandStart -ge 0 -and ($y - $lastActive) -gt 8) {
    if ($lastActive - $bandStart -gt 40) { $bands += , @($bandStart, $lastActive) }
    $bandStart = -1
  }
}
if ($bandStart -ge 0 -and ($lastActive - $bandStart) -gt 40) { $bands += , @($bandStart, $lastActive) }

Write-Host "Найдено рядов: $($bands.Count) (ожидалось $($MAP.Count))"
if ($bands.Count -ne $MAP.Count) {
  throw "Ряды не совпали с каталогом."
}

# --- 2. Круги в каждом ряду.
# Зонная плотность: столбцы круга имеют золото по всей высоте зоны [top, top+126],
# подписи начинаются ниже зоны — они не мешают.
$results = New-Object 'System.Collections.Generic.List[object]'
for ($b = 0; $b -lt $bands.Count; $b++) {
  $band = $bands[$b]
  $top = $band[0]
  $zoneBottom = [Math]::Min($h - 1, $top + 126)
  $need = 30

  $density = New-Object int[] $w
  for ($x = 0; $x -lt $w; $x++) {
    $count = 0
    for ($y = $top; $y -le $zoneBottom; $y++) {
      if (Get-Gold $x $y) { $count++ }
    }
    $density[$x] = $count
  }

  # Интервалы плотных столбцов; тёмные детали круга дают разрывы — схлопываем до ожидаемого числа.
  $rawRuns = New-Object 'System.Collections.Generic.List[object]'
  $runStart = -1
  $lastDense = -10
  for ($x = 0; $x -lt $w; $x++) {
    if ($density[$x] -ge $need) {
      if ($runStart -lt 0) { $runStart = $x }
      $lastDense = $x
    } elseif ($runStart -ge 0 -and ($x - $lastDense) -gt 6) {
      $rawRuns.Add(@($runStart, $lastDense))
      $runStart = -1
    }
  }
  if ($runStart -ge 0) { $rawRuns.Add(@($runStart, $lastDense)) }
  $runs = New-Object 'System.Collections.Generic.List[object]'
  $runs.AddRange(@($rawRuns | Where-Object { $_[1] - $_[0] -ge 40 }))

  $expected = $MAP[$b].Count
  while ($runs.Count -gt $expected) {
    $bestGap = [int]::MaxValue
    $bestIdx = -1
    for ($i = 0; $i -lt $runs.Count - 1; $i++) {
      $gap = $runs[$i + 1][0] - $runs[$i][1]
      if ($gap -lt $bestGap) { $bestGap = $gap; $bestIdx = $i }
    }
    if ($bestIdx -lt 0 -or $bestGap -gt 45) { break }
    $merged = @($runs[$bestIdx][0], $runs[$bestIdx + 1][1])
    $newRuns = New-Object 'System.Collections.Generic.List[object]'
    for ($i = 0; $i -lt $runs.Count; $i++) {
      if ($i -eq $bestIdx) { $newRuns.Add($merged); $i++ }
      elseif ($i -eq ($bestIdx + 1)) { continue }
      else { $newRuns.Add($runs[$i]) }
    }
    $runs = $newRuns
  }

  if ($runs.Count -ne $expected) {
    throw ("Ряд {0}: ожидалось {1} кругов, найдено {2}." -f ($b + 1), $expected, $runs.Count)
  }

  # Диаметр = медиана ширины интервалов; центр по вертикали = top + радиус.
  $widths = @()
  $centers = @()
  foreach ($run in $runs) {
    $widths += ($run[1] - $run[0] + 1)
    $centers += [int](($run[0] + $run[1]) / 2)
  }
  $sorted = $widths | Sort-Object
  $medianWidth = $sorted[[int]($sorted.Count / 2)]
  $radius = [int]([Math]::Round($medianWidth / 2.0))
  $cy = $top + $radius

  Write-Host ("Ряд {0} (top={1}): диаметр≈{2}, r={3}, cy={4}" -f ($b + 1), $top, $medianWidth, $radius, $cy)
  for ($r = 0; $r -lt $runs.Count; $r++) {
    $results.Add(@{ Id = $MAP[$b][$r]; Cx = $centers[$r]; Cy = $cy; Radius = $radius })
  }
}

# --- 3. «Легенда Gutshot»: одиночный круг в нижней зоне (подпись справа, не снизу).
$legRegionTop = 780
$legRegionBottom = $h - 1
$legRuns = New-Object 'System.Collections.Generic.List[object]'
$legRunStart = -1
$legLastDense = -10
for ($x = 150; $x -lt 900; $x++) {
  $count = 0
  for ($y = $legRegionTop; $y -le $legRegionBottom; $y++) {
    if (Get-Gold $x $y) { $count++ }
  }
  if ($count -ge 12) {
    if ($legRunStart -lt 0) { $legRunStart = $x }
    $legLastDense = $x
  } elseif ($legRunStart -ge 0 -and ($x - $legLastDense) -gt 6) {
    $legRuns.Add(@($legRunStart, $legLastDense))
    $legRunStart = -1
  }
}
if ($legRunStart -ge 0) { $legRuns.Add(@($legRunStart, $legLastDense)) }
$legRuns = @($legRuns | Where-Object { $_[1] - $_[0] -ge 50 })
if ($legRuns.Count -ne 1) {
  throw "Легенда: ожидался 1 круг, найдено $($legRuns.Count)."
}
$legCx = [int](($legRuns[0][0] + $legRuns[0][1]) / 2)
$legTop = -1
$legLastGold = -10
for ($y = $legRegionTop; $y -lt $h; $y++) {
  $has = $false
  for ($x = [Math]::Max(0, $legCx - 6); $x -le [Math]::Min($w - 1, $legCx + 6); $x++) {
    if (Get-Gold $x $y) { $has = $true; break }
  }
  if ($has) {
    if ($legTop -lt 0) { $legTop = $y }
    $legLastGold = $y
  } elseif ($legTop -ge 0 -and ($y - $legLastGold) -gt 14) {
    break
  }
}
$legRadius = [int]([Math]::Round(($legLastGold - $legTop + 1) / 2.0))
$legCy = $legTop + $legRadius
Write-Host ("Легенда: cx={0}, top={1}, r={2}, cy={3}" -f $legCx, $legTop, $legRadius, $legCy)
$results.Add(@{ Id = 'legend_gutshot'; Cx = $legCx; Cy = $legCy; Radius = $legRadius })

# --- 4. Вырезание с круговой альфа-маской.
$exported = @()
foreach ($item in $results) {
  $id = $item.Id
  $cx = $item.Cx
  $cy = $item.Cy
  $rad = $item.Radius
  $pad = 3
  $size = 2 * ($rad + $pad)
  $x0 = [Math]::Max(0, $cx - $rad - $pad)
  $y0 = [Math]::Max(0, $cy - $rad - $pad)
  $maskR = $rad + 1.0
  $center = ($size - 1) / 2.0

  $out = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $outRect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
  $outData = $out.LockBits($outRect, [System.Drawing.Imaging.ImageLockMode]::WriteOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $outStride = $outData.Stride
  $outBytes = New-Object byte[] ($outStride * $size)

  for ($py = 0; $py -lt $size; $py++) {
    $sy = $y0 + $py
    if ($sy -ge $h) { break }
    for ($px = 0; $px -lt $size; $px++) {
      $sx = $x0 + $px
      if ($sx -ge $w) { break }
      $dist = [Math]::Sqrt(($px - $center) * ($px - $center) + ($py - $center) * ($py - $center))
      $alpha = [Math]::Min(1.0, [Math]::Max(0.0, ($maskR - $dist) / 1.5))
      if ($alpha -le 0) { continue }
      $si = $sy * $stride + $sx * 3
      $oi = $py * $outStride + $px * 4
      $outBytes[$oi] = $bytes[$si]         # B
      $outBytes[$oi + 1] = $bytes[$si + 1] # G
      $outBytes[$oi + 2] = $bytes[$si + 2] # R
      $outBytes[$oi + 3] = [byte][Math]::Round($alpha * 255)
    }
  }

  [System.Runtime.InteropServices.Marshal]::Copy($outBytes, 0, $outData.Scan0, $outBytes.Length)
  $out.UnlockBits($outData)

  foreach ($dir in $targets) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
    $out.Save((Join-Path $dir "$id.png"), [System.Drawing.Imaging.ImageFormat]::Png)
  }
  $out.Dispose()
  $exported += $id
}

$bmp.Dispose()

# --- 5. Дубликаты для отсутствующих на постере достижений.
$reuse = @{
  'ko_150'   = 'ko_100'
  'ko_250'   = 'ko_100'
  'mf_win_3' = 'mf_win_1'
}
foreach ($id in $reuse.Keys) {
  $from = Join-Path $targets[0] "$($reuse[$id]).png"
  foreach ($dir in $targets) {
    Copy-Item $from (Join-Path $dir "$id.png") -Force
  }
  $exported += $id
}

Write-Host "Экспортировано $($exported.Count) значков:"
Write-Host ($exported -join ', ')
