# PowerShell script to deploy all SMARA workers

$Workers = @(
    "audio_to_text",
    "image_to_text",
    "queue_consumer",
    "search",
    "text_to_embedding",
    "video_to_text"
)

Write-Host "Deploying SMARA Workers..." -ForegroundColor Yellow
Write-Host "==============================" -ForegroundColor Yellow
Write-Host ""

$Succeeded = @()
$Failed = @()

foreach ($worker in $Workers) {
    Write-Host "Deploying $worker..." -ForegroundColor Blue
    
    Push-Location "workers/$worker"
    
    try {
        npx wrangler deploy
        if ($LASTEXITCODE -eq 0) {
            $Succeeded += $worker
            Write-Host "[SUCCESS] $worker deployed successfully" -ForegroundColor Green
        } else {
            $Failed += $worker
            Write-Host "[FAILED] $worker deployment failed" -ForegroundColor Red
        }
    }
    catch {
        $Failed += $worker
        Write-Host "[FAILED] $worker deployment failed: $_" -ForegroundColor Red
    }
    finally {
        Pop-Location
    }
    
    Write-Host ""
}

Write-Host "==============================" -ForegroundColor Yellow
Write-Host "Deployment Summary" -ForegroundColor Yellow
Write-Host "==============================" -ForegroundColor Yellow
Write-Host "Succeeded ($($Succeeded.Count)): $($Succeeded -join ', ')" -ForegroundColor Green

if ($Failed.Count -gt 0) {
    Write-Host "Failed ($($Failed.Count)): $($Failed -join ', ')" -ForegroundColor Red
    exit 1
} else {
    Write-Host "All workers deployed successfully!" -ForegroundColor Green
}