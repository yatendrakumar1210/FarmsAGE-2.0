$apiDeclaration = @"
const API = import.meta.env.MODE === "development" ? "http://localhost:3000" : "https://farmsage-2-0-2.onrender.com";
"@

$files = @(
    "src\services\locationServices.js",
    "src\Pages\MyOrders.jsx",
    "src\Pages\Login.jsx",
    "src\Pages\CompleteProfile.jsx",
    "src\Pages\Checkout.jsx",
    "src\Pages\Admin\ManageUsers.jsx",
    "src\Pages\Admin\ManageProducts.jsx",
    "src\Pages\Admin\ManageOrders.jsx",
    "src\Pages\Admin\Dashboard.jsx"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw 
        if ($content -notmatch 'const API =') {
            # Find the last import statment
            $lines = Get-Content $file
            $lastImportLine = -1
            for ($i = 0; $i -lt $lines.Length; $i++) {
                if ($lines[$i] -match '^import ') {
                    $lastImportLine = $i
                }
            }
            
            $newContent = @()
            for ($i = 0; $i -lt $lines.Length; $i++) {
                $newContent += $lines[$i]
                if ($i -eq $lastImportLine) {
                    $newContent += ""
                    $newContent += $apiDeclaration
                    $newContent += ""
                }
            }
            if ($lastImportLine -eq -1) {
                $newContent = @($apiDeclaration, "") + $lines
            }
            $contentWithDeclaration = $newContent -join "`r`n"
            
            # replace "https://farmsage-2-0-2.onrender.com... with `${API}...
            $replaced = [regex]::Replace($contentWithDeclaration, '["'']https://farmsage-2-0-2.onrender.com([^"'']*)["'']', '`${API}$1`')
            
            Set-Content -Path $file -Value $replaced -Encoding UTF8
        }
    }
}
