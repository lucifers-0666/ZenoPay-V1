# ZenoPay - Create Default Admin User
# Run this script to create a default admin user in your MongoDB database

Write-Host "`nCreating Default Admin User..." -ForegroundColor Cyan

# MongoDB connection string (update if different)
$mongoUri = "mongodb://127.0.0.1:27017/ZenoPay"

# Default admin credentials
$adminData = @{
    ZenoPayID = "ZP-ADMIN001"
    Password = "Admin@123"  # Change this after first login!
    FullName = "System Administrator"
    Email = "admin@zenopay.com"
    Phone = "+1234567890"
    Role = "admin"
    ProfilePicture = ""
    Balance = 0
    Status = "Active"
    CreatedAt = Get-Date -Format "o"
    UpdatedAt = Get-Date -Format "o"
}

Write-Host "`nAdmin Credentials:" -ForegroundColor Yellow
Write-Host "   ZenoPay ID: $($adminData.ZenoPayID)" -ForegroundColor Green
Write-Host "   Password:   $($adminData.Password)" -ForegroundColor Green
Write-Host "   Email:      $($adminData.Email)" -ForegroundColor Green
Write-Host "   Full Name:  $($adminData.FullName)`n" -ForegroundColor Green

# MongoDB command to insert admin user
$mongoCommand = @"
use ZenoPay
db.zenopaydetails.updateOne(
  { ZenoPayID: "$($adminData.ZenoPayID)" },
  {
    `$set: {
      Password: "$($adminData.Password)",
      FullName: "$($adminData.FullName)",
      Email: "$($adminData.Email)",
      Phone: "$($adminData.Phone)",
      Role: "$($adminData.Role)",
      ProfilePicture: "$($adminData.ProfilePicture)",
      Balance: $($adminData.Balance),
      Status: "$($adminData.Status)",
      CreatedAt: new Date("$($adminData.CreatedAt)"),
      UpdatedAt: new Date("$($adminData.UpdatedAt)")
    }
  },
  { upsert: true }
)
"@

# Save command to temp file
$tempFile = "temp_mongo_command.js"
$mongoCommand | Out-File -FilePath $tempFile -Encoding UTF8

Write-Host "Executing MongoDB command..." -ForegroundColor Yellow

# Execute MongoDB command
try {
    $result = & mongosh $mongoUri --quiet $tempFile 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`nAdmin user created successfully!" -ForegroundColor Green
        Write-Host "`nAccess admin panel at:" -ForegroundColor Cyan
        Write-Host "   http://localhost:3000/admin/login`n" -ForegroundColor White
        
        Write-Host "IMPORTANT SECURITY NOTES:" -ForegroundColor Yellow
        Write-Host "   1. Change the default password immediately after first login" -ForegroundColor White
        Write-Host "   2. Password is currently stored in plain text (implement bcrypt hashing)" -ForegroundColor White
        Write-Host "   3. This is for development only - DO NOT use in production`n" -ForegroundColor White
    } else {
        Write-Host "`nError creating admin user:" -ForegroundColor Red
        Write-Host $result -ForegroundColor Red
    }
} catch {
    Write-Host "`nError: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`nMake sure MongoDB is running and mongosh is installed" -ForegroundColor Yellow
} finally {
    # Clean up temp file
    if (Test-Path $tempFile) {
        Remove-Item $tempFile
    }
}

Write-Host "`nAlternative Method:" -ForegroundColor Cyan
Write-Host "   Run this command in MongoDB shell:" -ForegroundColor White
Write-Host @"
   
   use ZenoPay
   db.zenopaydetails.updateOne(
     { ZenoPayID: "$($adminData.ZenoPayID)" },
     { `$set: { Role: "admin", Password: "$($adminData.Password)", FullName: "$($adminData.FullName)", Email: "$($adminData.Email)" } },
     { upsert: true }
   )
   
"@ -ForegroundColor Gray

Write-Host "`nDone!`n" -ForegroundColor Green
