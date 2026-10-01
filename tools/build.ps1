# Monta o site final a partir de src/ e vendor/.
#   src/index.html  +  src/tractia.css  +  src/tractia.js  +  vendor/*.js   ->   index.html  +  assets/app.min.js
# Rodar depois de QUALQUER mudanca em src/ ou vendor/:   powershell -File tools\build.ps1
# Por que: o CSS vai dentro do HTML (1 requisicao a menos no caminho critico) e todo o JS (GSAP, ScrollTrigger,
# SplitText, Lenis e o nosso) vai num arquivo so, hospedado aqui (sem CDN de terceiros). O ?v= e um hash do
# conteudo, entao o navegador so baixa de novo quando algo muda de verdade.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
$utf8 = New-Object System.Text.UTF8Encoding($false)

function Read-Text($p) { [System.IO.File]::ReadAllText((Join-Path $root $p), $utf8) }

# ---- CSS: tira comentarios e espacos (conservador: nao mexe em ":" nem dentro de calc()) ----
$css = Read-Text 'src\tractia.css'
$css = [regex]::Replace($css, '/\*.*?\*/', '', 'Singleline')
$css = [regex]::Replace($css, '\s+', ' ')
$css = [regex]::Replace($css, '\s*([{};,>])\s*', '$1')
$css = $css.Replace(';}', '}').Trim()
$css = $css.Replace("url('fonts/", "url('assets/fonts/")

# ---- JS: bibliotecas (ja minificadas) + codigo do site sem comentarios de linha inteira ----
$mine = Read-Text 'src\tractia.js'
$mine = [regex]::Replace($mine, '(?m)^\s*/\*[\s\S]*?\*/[ \t]*\r?\n', '')
$mine = [regex]::Replace($mine, '(?m)^\s*//.*\r?\n', '')
$mine = [regex]::Replace($mine, '(?m)^[ \t]+', '')
$mine = [regex]::Replace($mine, '(\r?\n){2,}', "`n")
$parts = @('gsap.min.js', 'ScrollTrigger.min.js', 'SplitText.min.js', 'lenis.min.js') | ForEach-Object { (Read-Text "vendor\$_").TrimEnd() }
$js = ($parts -join ";`n") + ";`n" + $mine
[System.IO.File]::WriteAllText((Join-Path $root 'assets\app.min.js'), $js, $utf8)

# ---- HTML ----
$sha = [System.Security.Cryptography.SHA1]::Create()
$hash = ([BitConverter]::ToString($sha.ComputeHash($utf8.GetBytes($css + $js))) -replace '-', '').Substring(0, 8).ToLower()
$html = Read-Text 'src\index.html'
$html = $html.Replace('<!--@CSS-->', "<style>$css</style>")
$html = $html.Replace('<!--@JS-->', "<script defer src=`"assets/app.min.js?v=$hash`"></script>")
[System.IO.File]::WriteAllText((Join-Path $root 'index.html'), $html, $utf8)

$sz = { param($p) '{0:N1} KB' -f ((Get-Item (Join-Path $root $p)).Length / 1KB) }
Write-Host "ok  v=$hash   index.html $(& $sz 'index.html')   app.min.js $(& $sz 'assets\app.min.js')"
